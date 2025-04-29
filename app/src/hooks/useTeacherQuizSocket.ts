import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';

const logger = createLogger('useTeacherQuizSocket');

// --- Types (Consider moving to a shared types file if used elsewhere) ---
interface Response {
    texte: string;
    correct: boolean;
}
export interface Question {
    uid: string;
    question: string;
    reponses: Response[];
    temps?: number;
    type?: string;
    explication?: string;
}
export interface QuizState {
    currentQuestionIdx: number | null;
    questions: Question[];
    chrono: { timeLeft: number | null; running: boolean };
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
    profSocketId?: string | null;
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionId?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number;
}

export function useTeacherQuizSocket(quizId: string | null, tournamentCode: string | null) {
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [timerStatus, setTimerStatus] = useState<'play' | 'pause' | 'stop'>('stop');
    const [timerQuestionId, setTimerQuestionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(1); // 1 = prof connecté par défaut
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Socket Connection ---
    useEffect(() => {
        if (!quizId) return;

        logger.info(`Initializing socket connection for quiz: ${quizId}`);
        const s = io({ path: "/api/socket/io", transports: ["websocket"] });
        setQuizSocket(s);

        // Récupère l'id enseignant depuis le localStorage
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;

        logger.info(`[DEBUG][CLIENT] Emitting join_quiz for quizId=${quizId}, teacherId=${teacherId}`);
        s.emit("join_quiz", { quizId, role: "teacher", teacherId });

        s.on("connect", () => {
            logger.info(`Socket connected: ${s.id}`);
            // Request current state immediately after connecting
            s.emit("get_quiz_state", { quizId });
        });

        s.on("disconnect", (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            setQuizState(null); // Reset state on disconnect
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

        // Log all socket events for debugging
        s.onAny((event, ...args) => {
            logger.debug(`Socket event received: ${event}`, args);
        });

        return () => {
            logger.info(`Disconnecting socket for quiz: ${quizId}`);
            s.disconnect();
            setQuizSocket(null);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId]);

    // --- State Synchronization ---
    useEffect(() => {
        if (!quizSocket) return;

        const handleQuizState = (state: QuizState) => {
            logger.debug('Processing quiz_state', state);
            setQuizState(state);

            // Sync timer state from the comprehensive quizState
            if (state.timerQuestionId) {
                setTimerQuestionId(state.timerQuestionId);
                setTimerStatus(state.timerStatus || 'stop');
                if (state.timerTimeLeft !== undefined && state.timerTimeLeft !== null) {
                    setTimeLeft(state.timerTimeLeft);
                    setLocalTimeLeft(state.timerTimeLeft); // Sync local timer immediately
                } else {
                    // If timerTimeLeft is null/undefined in state, ensure local timer reflects this
                    setTimeLeft(0);
                    setLocalTimeLeft(null);
                }
            } else if (state.currentQuestionIdx !== null && typeof state.currentQuestionIdx === 'number' && state.questions[state.currentQuestionIdx]) {
                const currentQuestion = state.questions[state.currentQuestionIdx];
                setTimerQuestionId(currentQuestion.uid);
                if (state.chrono && state.chrono.timeLeft !== null) {
                    setTimeLeft(state.chrono.timeLeft);
                    setLocalTimeLeft(state.chrono.timeLeft); // Sync local timer
                    setTimerStatus(state.chrono.running ? 'play' : 'pause');
                } else {
                    setTimeLeft(0);
                    setLocalTimeLeft(null);
                    setTimerStatus('stop');
                }
            } else {
                // No active question or timer info in quizState
                setTimerQuestionId(null);
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
            setLocalTimeLeft(data.timeLeft); // Sync local timer
        };

        quizSocket.on("quiz_state", handleQuizState);
        quizSocket.on("quiz_timer_update", handleTimerUpdate);
        quizSocket.on("quiz_connected_count", (data: { count: number }) => {
            logger.debug('Received quiz_connected_count', data);
            setConnectedCount(data.count);
        });

        // Request state again if socket reconnects (e.g., after server restart)
        quizSocket.on("connect", () => {
            logger.info("Reconnected, requesting quiz state again.");
            quizSocket.emit("get_quiz_state", { quizId });
        });


        return () => {
            quizSocket.off("quiz_state", handleQuizState);
            quizSocket.off("quiz_timer_update", handleTimerUpdate);
            quizSocket.off("quiz_connected_count");
            quizSocket.off("connect"); // Clean up reconnect listener
        };
    }, [quizSocket, quizId]);

    // --- Local Timer Countdown ---
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current); // Clear previous interval

        if (timerStatus === 'play' && localTimeLeft !== null && localTimeLeft > 0) {
            timerRef.current = setInterval(() => {
                setLocalTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timerRef.current!);
                        // Optionally emit a stop event or let server handle timeout?
                        // For now, just stop locally. Server should handle actual expiry.
                        // setTimerStatus('stop'); // Avoid changing status based on local timer
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerStatus, localTimeLeft]); // Rerun effect when status or initial localTimeLeft changes


    // --- Emitter Functions ---
    const getTeacherId = () => (typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null);

    const emitSetQuestion = useCallback((idx: number, chrono?: number) => {
        const code = tournamentCode;
        const teacherId = getTeacherId();
        logger.info('Emitting quiz_set_question', { quizId, questionIdx: idx, chrono, code, teacherId });
        quizSocket?.emit("quiz_set_question", { quizId, questionIdx: idx, chrono, code, teacherId });
    }, [quizSocket, quizId, tournamentCode]);

    const emitEndQuiz = useCallback(() => {
        const teacherId = getTeacherId();
        logger.info('Emitting quiz_end', { quizId, teacherId });
        quizSocket?.emit("quiz_end", { quizId, teacherId });
    }, [quizSocket, quizId]);

    const emitPauseQuiz = useCallback(() => {
        const teacherId = getTeacherId();
        logger.info('Emitting quiz_pause', { quizId, teacherId });
        quizSocket?.emit("quiz_pause", { quizId, teacherId });
    }, [quizSocket, quizId]);

    const emitResumeQuiz = useCallback(() => {
        const teacherId = getTeacherId();
        logger.info('Emitting quiz_resume', { quizId, teacherId });
        quizSocket?.emit("quiz_resume", { quizId, teacherId });
    }, [quizSocket, quizId]);

    const emitSetTimer = useCallback((newTime: number) => {
        const teacherId = getTeacherId();
        logger.info('Emitting quiz_set_timer', { quizId, timeLeft: newTime, teacherId });
        quizSocket?.emit("quiz_set_timer", { quizId, timeLeft: newTime, teacherId });
    }, [quizSocket, quizId]);

    const emitTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
        const teacherId = getTeacherId();
        logger.info('Emitting quiz_timer_action', { ...action, quizId, teacherId });
        quizSocket?.emit("quiz_timer_action", { ...action, quizId, teacherId });
    }, [quizSocket, quizId]);

    const emitUpdateTournamentCode = useCallback((newCode: string) => {
        const teacherId = getTeacherId();
        logger.info('Emitting update_tournament_code', { quizId, tournamentCode: newCode, teacherId });
        quizSocket?.emit("update_tournament_code", { quizId, tournamentCode: newCode, teacherId });
    }, [quizSocket, quizId]);


    return {
        quizSocket, // Expose socket if direct access is needed (use with caution)
        quizState,
        timerStatus,
        timerQuestionId,
        timeLeft, // The 'official' time from the server/state
        localTimeLeft, // The local countdown value for display
        connectedCount, // Ajout du nombre de connectés
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
    };
}
