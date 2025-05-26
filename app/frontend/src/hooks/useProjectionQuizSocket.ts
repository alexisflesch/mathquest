import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import type { QuizState, Question } from './useTeacherQuizSocket';
import { SOCKET_CONFIG } from '@/config';

const logger = createLogger('useProjectionQuizSocket');

export function useProjectionQuizSocket(gameId: string | null, tournamentCode: string | null) {
    const [gameSocket, setGameSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<QuizState | null>(null);
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
        if (!gameId) return;
        logger.info(`Initializing socket connection for projection: ${gameId} to ${SOCKET_CONFIG.url}`);
        // Connect to backend using complete centralized configuration
        const s = io(SOCKET_CONFIG.url, SOCKET_CONFIG);
        setGameSocket(s);
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info(`[DEBUG][CLIENT] Emitting join_projector for gameId=${gameId}, teacherId=${teacherId}, cookie_id=${cookie_id}`);
        s.emit("join_projector", gameId);
        s.on("connect", () => {
            logger.info(`Socket connected: ${s.id}`);
            // Note: The initial state is sent automatically upon joining the projector room
        });
        s.on("disconnect", (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            setGameState(null);
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
            logger.info(`Disconnecting socket for projection: ${gameId}`);
            s.disconnect();
            setGameSocket(null);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameId]);

    useEffect(() => {
        if (!gameSocket) return;
        logger.info('Socket info', { id: gameSocket.id });
        gameSocket.on("joined_room", ({ room, socketId }) => {
            logger.info('joined_room', { room, socketId });
        });
        gameSocket.onAny((event, ...args) => {
            logger.debug(`[SOCKET EVENT RECEIVED]`, event, args);
        });
        const handleGameState = (state: QuizState) => {
            logger.debug('Processing projector_state', state);
            setGameState(state);
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
        const handleTimerUpdate = (data: { timer?: { startedAt: number, duration: number, isPaused: boolean } }) => {
            logger.debug('Received projection_timer_updated', data);

            if (data.timer) {
                const { startedAt, duration, isPaused } = data.timer;

                if (isPaused) {
                    setTimerStatus('pause');
                    // Calculate remaining time at pause
                    const elapsed = Date.now() - startedAt;
                    const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
                    setTimeLeft(remaining);
                    setLocalTimeLeft(remaining);
                } else {
                    setTimerStatus('play');
                    // Calculate current remaining time
                    const elapsed = Date.now() - startedAt;
                    const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
                    setTimeLeft(remaining);
                    setLocalTimeLeft(remaining);
                }
            } else {
                // Timer stopped/cleared
                setTimerStatus('stop');
                setTimeLeft(0);
                setLocalTimeLeft(0);
            }
        };
        gameSocket.on("projector_state", handleGameState);
        gameSocket.on("projection_timer_updated", handleTimerUpdate);
        gameSocket.on("projector_connected_count", (data: { count: number }) => {
            logger.debug('Received projector_connected_count', data);
            setConnectedCount(data.count);
        });
        gameSocket.on("connect", () => {
            logger.info("Reconnected, projector state will be sent automatically.");
        });
        return () => {
            gameSocket.off("projector_state", handleGameState);
            gameSocket.off("projection_timer_updated", handleTimerUpdate);
            gameSocket.off("projector_connected_count");
            gameSocket.off("connect");
            gameSocket.offAny();
        };
    }, [gameSocket, gameId]);

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
        gameSocket,
        gameState,
        timerStatus,
        timerQuestionId,
        timeLeft,
        localTimeLeft,
        setLocalTimeLeft, // <-- Expose setter
        connectedCount,
    };
}
