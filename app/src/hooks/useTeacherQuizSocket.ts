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

    // Références pour le timer basé sur l'horloge système
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const initialDurationRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // --- Socket Connection ---
    useEffect(() => {
        if (!quizId) return;

        logger.info(`Initializing socket connection for quiz: ${quizId}`);
        const s = io({ path: "/api/socket/io", transports: ["websocket"] });
        setQuizSocket(s);

        // Always get both teacherId and cookie_id from localStorage
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info(`[DEBUG][CLIENT] Emitting join_quiz for quizId=${quizId}, teacherId=${teacherId}, cookie_id=${cookie_id}`);
        s.emit("join_quiz", { quizId, teacherId, role: 'teacher', cookie_id });

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
        logger.info('Socket info', {
            id: quizSocket.id,
        });
        quizSocket.on("joined_room", ({ room, socketId }) => {
            logger.info('joined_room', { room, socketId });
        });

        // Log all socket events for debugging
        quizSocket.onAny((event, ...args) => {
            logger.debug(`[SOCKET EVENT RECEIVED]`, event, args);
        });

        const handleQuizState = (state: QuizState) => {
            logger.debug('Processing quiz_state', state);
            setQuizState(state);

            // --- PATCH: If timer is stopped, always set localTimeLeft to 0 ---
            if (
                state.timerStatus === 'stop' ||
                (state.chrono && state.chrono.timeLeft === 0 && state.chrono.running === false)
            ) {
                setTimerStatus('stop');
                setLocalTimeLeft(0);
                setTimeLeft(0);
                return;
            }

            // ...existing logic for play/pause...
            if (state.timerQuestionId) {
                setTimerQuestionId(state.timerQuestionId);
                setTimerStatus(state.timerStatus || 'stop');
                if (state.timerTimeLeft !== undefined && state.timerTimeLeft !== null) {
                    setTimeLeft(state.timerTimeLeft);
                    setLocalTimeLeft(state.timerTimeLeft); // Sync local timer immediately
                } else {
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
            // Always sync localTimeLeft to 0 if stopped
            if (data.status === 'stop' && data.timeLeft === 0) {
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
            quizSocket.offAny();
        };
    }, [quizSocket, quizId]);

    // --- Local Timer Countdown basé sur l'horloge système ---
    useEffect(() => {
        // Nettoyage des références et intervalles précédents
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        if (timerStatus === 'play' && timeLeft !== null && timeLeft > 0) {
            // Initialisation du timer avec valeurs serveur
            startTimeRef.current = Date.now();
            initialDurationRef.current = timeLeft;
            setLocalTimeLeft(timeLeft);

            // Fonction de tick qui utilise l'horloge système
            const tick = () => {
                if (startTimeRef.current === null || initialDurationRef.current === null) return;

                const now = Date.now();
                const elapsed = (now - startTimeRef.current) / 1000; // en secondes
                const remaining = Math.max(initialDurationRef.current - elapsed, 0);

                // Arrondi à 1 décimale pour stabiliser l'affichage
                const roundedRemaining = Math.ceil(remaining);
                setLocalTimeLeft(roundedRemaining);

                if (remaining <= 0) {
                    // Timer terminé
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                } else {
                    // Continuer la boucle d'animation
                    animationFrameRef.current = requestAnimationFrame(tick);
                }
            };

            // Démarrer la boucle d'animation
            animationFrameRef.current = requestAnimationFrame(tick);
        } else if (timerStatus === 'pause') {
            // En pause, conserver la dernière valeur
            initialDurationRef.current = localTimeLeft;
            startTimeRef.current = null;
        } else {
            // Arrêt ou autre état
            startTimeRef.current = null;
            initialDurationRef.current = null;
        }

        // Nettoyage au démontage ou changement d'état
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [timerStatus, timeLeft]);

    // --- Emitter Functions ---
    const getTeacherId = () => (typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null);

    // PATCH: Utilise l'UID pour set la question active
    const emitSetQuestion = useCallback((questionUid: string, chrono?: number) => {
        const code = tournamentCode;
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_set_question', { quizId, questionUid, chrono, code, teacherId, cookie_id });
        quizSocket?.emit("quiz_set_question", { quizId, questionUid, chrono, code, teacherId, cookie_id });
        // Optimistic local timer update for immediate UI feedback
        setTimerQuestionId(questionUid);
        setTimerStatus('play');
        if (typeof chrono === 'number') {
            setTimeLeft(chrono);
            setLocalTimeLeft(chrono);
        }
    }, [quizSocket, quizId, tournamentCode]);

    const emitEndQuiz = useCallback(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_end', { quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_end", { quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitPauseQuiz = useCallback(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_pause', { quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_pause", { quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitResumeQuiz = useCallback(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_resume', { quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_resume", { quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitSetTimer = useCallback((newTime: number) => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_set_timer', { quizId, timeLeft: newTime, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_set_timer", { quizId, timeLeft: newTime, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_timer_action', { ...action, quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_timer_action", { ...action, quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitUpdateTournamentCode = useCallback((newCode: string) => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting update_tournament_code', { quizId, tournamentCode: newCode, teacherId, cookie_id });
        quizSocket?.emit("update_tournament_code", { quizId, tournamentCode: newCode, teacherId, cookie_id });
    }, [quizSocket, quizId]);


    return {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        timeLeft,
        localTimeLeft,
        connectedCount,
        emitSetQuestion, // PATCH: renvoie la version UID
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
    };
}
