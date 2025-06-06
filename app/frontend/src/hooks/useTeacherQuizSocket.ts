import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { UI_CONFIG } from '@/config/gameConfig';
import { createSocketConfig } from '@/utils';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { STORAGE_KEYS } from '@/constants/auth';

// Import unified timer system
import { useTeacherTimer } from './useGameTimer';

// Import core types instead of scattered imports
import type {
    Question,
    BaseAnswer,
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerActionPayload
} from '@shared/types/core';

// Import shared types
import type {
    QuestionData,
    ErrorPayload,
    TimerActionPayload as SharedTimerActionPayload
} from '@shared/types/socketEvents';
// Import type guards and teacher-specific types
import {
    isQuestionData,
    isErrorPayload,
    isTimerUpdatePayload,
    isGameTimerUpdatePayload,
    isTeacherQuizState,
    isTeacherTimerUpdatePayload,
    isGameErrorDetails,
    isLobbyErrorPayload,
    isConnectedCountPayload,
    isDashboardQuestionChangedPayload,
    isDashboardAnswersLockChangedPayload,
    isDashboardGameStatusChangedPayload,
    migrateTeacherTimerUpdate,
    validateEventPayload,
    createSafeEventHandler,
    type SetQuestionPayload,
    type TeacherTimerActionPayload,
    type GameErrorDetails,
    type LobbyErrorPayload,
    type ConnectedCountPayload,
    type DashboardQuestionChangedPayload,
    type DashboardAnswersLockChangedPayload,
    type DashboardGameStatusChangedPayload,
    type TeacherQuizState,
    type TeacherTimerUpdatePayload
} from '@/types/socketTypeGuards';

const logger = createLogger('useTeacherQuizSocket');

// --- Types (Consider moving to a shared types file if used elsewhere) ---
// Use shared types for questions in QuizState
// Remove custom Question interface and use QuestionData from shared types
// Note: QuestionData fields: uid, text, answerOptions, correctAnswers, questionType, timeLimit, etc.
export interface QuizState {
    currentQuestionIdx: number | null;
    questions: QuestionData[];
    chrono: { timeLeft: number | null; running: boolean };
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
    profSocketId?: string | null;
    timerStatus?: 'play' | 'pause' | 'stop' | null;
    timerQuestionId?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number;
    questionStates?: Record<string, boolean>;
}

export function useTeacherQuizSocket(accessCode: string | null, token: string | null, quizId?: string | null) {
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(1);

    // Use unified timer system for teacher control
    const gameTimer = useTeacherTimer(quizSocket, {
        autoStart: false,
        smoothCountdown: false,
        showMilliseconds: false,
        enableLocalAnimation: false
    });

    // Unified timer state only
    const timerStatus = gameTimer.timerState.status;
    const timerQuestionId = gameTimer.timerState.questionId || null;
    const timeLeft = gameTimer.timerState.timeLeft;
    const localTimeLeft = gameTimer.timerState.localTimeLeft;

    useEffect(() => {
        if (!quizId || !token) return;
        logger.info(`Initializing socket connection for quiz: ${quizId} to ${SOCKET_CONFIG.url}`);
        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const s = io(SOCKET_CONFIG.url, socketConfig);
        s.connect();
        setQuizSocket(s);
        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Socket connected: ${s.id}`);
            s.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: quizId });
        });
        s.on('connect', () => {
            logger.info(`Socket connected: ${s.id}`);
            s.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: quizId });
        });
        s.on('disconnect', (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            setQuizState(null);
            gameTimer.stop();
        });
        s.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error("Socket connection error:", err);
        });
        s.on(SOCKET_EVENTS.TEACHER.DASHBOARD_JOINED, ({ room, socketId }) => {
            logger.debug("Server confirms dashboard join", { room, socketId });
        });
        return () => {
            logger.info(`Disconnecting socket for quiz: ${quizId}`);
            s.disconnect();
            setQuizSocket(null);
        };
    }, [quizId, token, gameTimer]);

    useEffect(() => {
        if (!quizSocket) return;
        const handleGameControlState = createSafeEventHandler(
            (state: TeacherQuizState) => {
                logger.debug('Processing game_control_state', state);
                setQuizState({ ...state, questions: state.questions as QuestionData[] });
                if (state && state.timerStatus && state.timerQuestionId) {
                    if (state.timerStatus === 'play') {
                        gameTimer.start(state.timerQuestionId, state.timerTimeLeft ?? 0);
                    } else if (state.timerStatus === 'pause') {
                        gameTimer.start(state.timerQuestionId, state.timerTimeLeft ?? 0);
                        gameTimer.pause();
                    } else if (state.timerStatus === 'stop') {
                        const timerPayload: TimerUpdatePayload = {
                            running: false,
                            status: 'stop',
                            timeLeft: state.timerTimeLeft ?? 0, // always ms
                            questionId: state.timerQuestionId
                        };
                        gameTimer.syncWithBackend(timerPayload);
                    } else {
                        gameTimer.stop();
                    }
                }
            },
            isTeacherQuizState,
            'game_control_state'
        );
        const handleTimerUpdate = (data: unknown) => {
            const sharedTimer = validateEventPayload(data, isTimerUpdatePayload, 'timer_update_shared');
            if (sharedTimer) {
                // Always pass timeLeft as-is (milliseconds)
                gameTimer.syncWithBackend(sharedTimer);
                return;
            }
            logger.warn('Received timer update in unknown format:', data);
        };
        const handleErrorDashboard = createSafeEventHandler(
            (error: ErrorPayload) => {
                logger.error('Dashboard error received:', error);
                if (error.code === 'TIMER_ERROR') {
                    logger.error(`Timer error: ${error.message}`);
                    gameTimer.stop();
                }
            },
            isErrorPayload,
            'error_dashboard'
        );
        const handleGameError = createSafeEventHandler(
            (error: GameErrorDetails) => {
                logger.error('Game error received:', error);
            },
            isGameErrorDetails,
            'game_error'
        );
        const handleLobbyError = createSafeEventHandler(
            (error: LobbyErrorPayload) => {
                logger.error('Lobby error received:', error);
            },
            isLobbyErrorPayload,
            'lobby_error'
        );
        const handleConnectError = (error: Error) => {
            logger.error('Socket connection error:', error);
            setQuizState(null);
            gameTimer.stop();
        };
        const handleDisconnect = (reason: string) => {
            logger.warn('Socket disconnected:', reason);
            setQuizState(null);
            gameTimer.stop();
        };
        const handleConnectCount = createSafeEventHandler(
            (payload: ConnectedCountPayload) => {
                logger.info('Received quiz_connected_count:', payload);
                if (typeof payload.count === 'number') {
                    setConnectedCount(payload.count);
                }
            },
            isConnectedCountPayload,
            'quiz_connected_count'
        );
        quizSocket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, handleGameControlState);
        quizSocket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED, handleTimerUpdate);
        quizSocket.on(SOCKET_EVENTS.TEACHER.TIMER_UPDATE, handleTimerUpdate);
        quizSocket.on(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, handleErrorDashboard);
        quizSocket.on(SOCKET_EVENTS.GAME.GAME_ERROR, handleGameError);
        quizSocket.on(SOCKET_EVENTS.LOBBY.LOBBY_ERROR, handleLobbyError);
        quizSocket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
        quizSocket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
        quizSocket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info("Reconnected, rejoining dashboard with gameId.");
            quizSocket.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: quizId });
        });
        quizSocket.on(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT, handleConnectCount);
        return () => {
            quizSocket.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, handleGameControlState);
            quizSocket.off(SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED, handleTimerUpdate);
            quizSocket.off(SOCKET_EVENTS.TEACHER.TIMER_UPDATE, handleTimerUpdate);
            quizSocket.off(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, handleErrorDashboard);
            quizSocket.off(SOCKET_EVENTS.GAME.GAME_ERROR, handleGameError);
            quizSocket.off(SOCKET_EVENTS.LOBBY.LOBBY_ERROR, handleLobbyError);
            quizSocket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
            quizSocket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
            quizSocket.off(SOCKET_EVENTS.CONNECT);
            quizSocket.off(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT, handleConnectCount);
        };
    }, [quizSocket, quizId, gameTimer]);

    // --- Emitter Functions ---
    const emitSetQuestion = useCallback((payload: SetQuestionPayload) => {
        logger.info(`Emitting set_question`, payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.SET_QUESTION, payload);
        logger.info(`Waiting for backend confirmation of question ${payload.questionUid}`);
    }, [quizSocket]);

    const emitEndQuiz = useCallback((payload: { gameId: string; accessCode?: string }) => {
        logger.info('Emitting end_game', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.END_GAME, payload);
    }, [quizSocket]);

    const emitPauseQuiz = useCallback((payload: TimerActionPayload) => {
        logger.info('Emitting quiz_timer_action with action=pause', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket]);

    const emitResumeQuiz = useCallback((payload: TimerActionPayload) => {
        logger.info('Emitting quiz_timer_action with action=resume', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket]);

    const emitSetTimer = useCallback((payload: TimerActionPayload) => {
        logger.info('Emitting quiz_timer_action with action=set_duration', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket]);

    const emitTimerAction = useCallback((payload: TimerActionPayload) => {
        logger.info('Emitting quiz_timer_action', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket]);

    const emitLockAnswers = useCallback((payload: { gameId: string; lock: boolean; accessCode?: string }) => {
        logger.info(`Emitting lock_answers`, payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.LOCK_ANSWERS, payload);
    }, [quizSocket]);

    return {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        timeLeft,
        localTimeLeft,
        connectedCount,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitLockAnswers,
        _debug: { timerStatus, timerQuestionId, timeLeft, localTimeLeft }
    };
}
