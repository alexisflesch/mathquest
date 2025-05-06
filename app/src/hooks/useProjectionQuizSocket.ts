import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import type { QuizState, Question } from './useTeacherQuizSocket';

const logger = createLogger('useProjectionQuizSocket');

export function useProjectionQuizSocket(quizId: string | null, tournamentCode: string | null) {
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [timerStatus, setTimerStatus] = useState<'play' | 'pause' | 'stop'>('stop');
    const [timerQuestionId, setTimerQuestionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(1);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const initialDurationRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!quizId) return;
        logger.info(`Initializing socket connection for projection: ${quizId}`);
        const s = io({ path: "/api/socket/io", transports: ["websocket"] });
        setQuizSocket(s);
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info(`[DEBUG][CLIENT] Emitting join_projection for quizId=${quizId}, teacherId=${teacherId}, cookie_id=${cookie_id}`);
        s.emit("join_projection", { quizId, teacherId, cookie_id });
        s.on("connect", () => {
            logger.info(`Socket connected: ${s.id}`);
            s.emit("get_quiz_state", { quizId });
        });
        s.on("disconnect", (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            setQuizState(null);
            setTimerStatus('stop');
            setTimerQuestionId(null);
            setTimeLeft(0);
            setLocalTimeLeft(null);
            if (timerRef.current) clearInterval(timerRef.current);
        });
        s.on("connect_error", (err) => {
            logger.error("Socket connection error:", err);
        });
        s.on("joined_room", ({ room, socketId }) => {
            logger.debug("Server confirms join", { room, socketId });
        });
        s.onAny((event, ...args) => {
            logger.debug(`Socket event received: ${event}`, args);
        });
        return () => {
            logger.info(`Disconnecting socket for projection: ${quizId}`);
            s.disconnect();
            setQuizSocket(null);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId]);

    useEffect(() => {
        if (!quizSocket) return;
        logger.info('Socket info', { id: quizSocket.id });
        quizSocket.on("joined_room", ({ room, socketId }) => {
            logger.info('joined_room', { room, socketId });
        });
        quizSocket.onAny((event, ...args) => {
            logger.debug(`[SOCKET EVENT RECEIVED]`, event, args);
        });
        const handleQuizState = (state: QuizState) => {
            logger.debug('Processing quiz_state', state);
            setQuizState(state);
            // Always set timerQuestionId from state if present
            if (state.timerQuestionId) {
                setTimerQuestionId(state.timerQuestionId);
            } else if (state.currentQuestionIdx !== null && typeof state.currentQuestionIdx === 'number' && state.questions[state.currentQuestionIdx]) {
                const currentQuestion = state.questions[state.currentQuestionIdx];
                setTimerQuestionId(currentQuestion.uid);
            } else {
                setTimerQuestionId(null);
            }
            // Now handle timer status and time left
            if (
                state.timerStatus === 'stop' ||
                (state.chrono && state.chrono.timeLeft === 0 && state.chrono.running === false)
            ) {
                setTimerStatus('stop');
                setLocalTimeLeft(0);
                setTimeLeft(0);
                return; // Ensure no further state updates after stop
            }
            if (state.timerQuestionId) {
                setTimerStatus(state.timerStatus || 'stop');
                if (state.timerTimeLeft !== undefined && state.timerTimeLeft !== null) {
                    setTimeLeft(state.timerTimeLeft);
                    setLocalTimeLeft(state.timerTimeLeft);
                } else {
                    setTimeLeft(0);
                    setLocalTimeLeft(null);
                }
            } else if (state.currentQuestionIdx !== null && typeof state.currentQuestionIdx === 'number' && state.questions[state.currentQuestionIdx]) {
                if (state.chrono && state.chrono.timeLeft !== null) {
                    setTimeLeft(state.chrono.timeLeft);
                    setLocalTimeLeft(state.chrono.timeLeft);
                    setTimerStatus(state.chrono.running ? 'play' : 'pause');
                } else {
                    setTimeLeft(0);
                    setLocalTimeLeft(null);
                    setTimerStatus('stop');
                }
            } else {
                setTimerStatus('stop');
                setTimeLeft(0);
                setLocalTimeLeft(null);
            }
        };
        const handleTimerUpdate = (data: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
            logger.debug('Received quiz_timer_update', data);
            setTimerStatus(data.status);
            setTimerQuestionId(data.questionId);
            setTimeLeft(data.timeLeft);
            // Defensive: never set localTimeLeft to non-zero if stopped
            if (data.status === 'stop') {
                setLocalTimeLeft(0);
            } else {
                setLocalTimeLeft(data.timeLeft);
            }
        };
        quizSocket.on("quiz_state", handleQuizState);
        quizSocket.on("quiz_timer_update", handleTimerUpdate);
        quizSocket.on("quiz_connected_count", (data: { count: number }) => {
            logger.debug('Received quiz_connected_count', data);
            setConnectedCount(data.count);
        });
        quizSocket.on("connect", () => {
            logger.info("Reconnected, requesting quiz state again.");
            quizSocket.emit("get_quiz_state", { quizId });
        });
        return () => {
            quizSocket.off("quiz_state", handleQuizState);
            quizSocket.off("quiz_timer_update", handleTimerUpdate);
            quizSocket.off("quiz_connected_count");
            quizSocket.off("connect");
            quizSocket.offAny();
        };
    }, [quizSocket, quizId]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (timerStatus === 'stop') {
            setLocalTimeLeft(0); // Defensive: always force to 0 and do nothing else
            return;
        }
        if (timerStatus === 'play' && timeLeft !== null && timeLeft > 0) {
            startTimeRef.current = Date.now();
            initialDurationRef.current = timeLeft;
            setLocalTimeLeft(timeLeft);
            const tick = () => {
                if (startTimeRef.current === null || initialDurationRef.current === null) return;
                const now = Date.now();
                const elapsed = (now - startTimeRef.current) / 1000;
                const remaining = Math.max(initialDurationRef.current - elapsed, 0);
                const roundedRemaining = Math.ceil(remaining);
                setLocalTimeLeft(roundedRemaining);
                if (remaining <= 0) {
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                } else {
                    animationFrameRef.current = requestAnimationFrame(tick);
                }
            };
            animationFrameRef.current = requestAnimationFrame(tick);
        } else if (timerStatus === 'pause') {
            initialDurationRef.current = localTimeLeft;
            startTimeRef.current = null;
        } else {
            startTimeRef.current = null;
            initialDurationRef.current = null;
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [timerStatus, timeLeft]);

    return {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        timeLeft,
        localTimeLeft,
        setLocalTimeLeft, // <-- Expose setter
        connectedCount,
    };
}
