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

// Import shared types - use quiz Question type that has all needed fields
import type {
    Question as QuizQuestion,
    BaseAnswer,
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerActionPayload,
    TimerStatus
} from '@shared/types';

// Import shared types
import type {
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
    isGameErrorDetails,
    isLobbyErrorPayload,
    isConnectedCountPayload,
    isDashboardQuestionChangedPayload,
    isDashboardAnswersLockChangedPayload,
    isDashboardGameStatusChangedPayload,
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
    type TeacherQuizState
} from '@/types/socketTypeGuards';

const logger = createLogger('useTeacherQuizSocket');

// --- Types (Consider moving to a shared types file if used elsewhere) ---
// Use shared types for questions in QuizState
// Remove custom Question interface and use QuestionData from shared types
// Note: QuestionData fields: uid, text, answerOptions, correctAnswers, questionType, timeLimit, etc.

// Use shared ExtendedQuizState as local QuizState 
import type { ExtendedQuizState as SharedQuizState } from '@shared/types';
export type QuizState = SharedQuizState;

export function useTeacherQuizSocket(accessCode: string | null, token: string | null, gameId?: string | null) {
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
    const timerQuestionUid = gameTimer.timerState.questionUid || null;
    const timeLeftMs = gameTimer.timerState.timeLeftMs;
    const localTimeLeftMs = gameTimer.timerState.localTimeLeftMs;

    useEffect(() => {
        if (!gameId || !token) return;
        logger.info(`Initializing socket connection for quiz: ${gameId} to ${SOCKET_CONFIG.url}`);
        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const s = io(SOCKET_CONFIG.url, socketConfig);
        s.connect();
        setQuizSocket(s);
        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Socket connected: ${s.id}`);
            s.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: gameId });
        });
        s.on('connect', () => {
            logger.info(`Socket connected: ${s.id}`);
            s.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: gameId });
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
            logger.info(`Disconnecting socket for quiz: ${gameId}`);
            s.disconnect();
            setQuizSocket(null);
        };
    }, [gameId, token, gameTimer]);

    useEffect(() => {
        if (!quizSocket) return;
        const handleGameControlState = createSafeEventHandler(
            (state: TeacherQuizState) => {
                logger.debug('Processing game_control_state', state);
                setQuizState({
                    ...state,
                    currentQuestionidx: state.currentQuestionIdx, // Map from TeacherQuizState to ExtendedQuizState
                    currentQuestionUid: state.timerQuestionUid || null, // Map timerQuestionUid to currentQuestionUid
                    timerStatus: state.timerStatus || undefined, // Convert null to undefined for ExtendedQuizState compatibility
                    questions: state.questions as any, // Temporary type cast to resolve import conflicts
                    chrono: {
                        timeLeftMs: state.chrono.timeLeftMs,
                        running: state.chrono.running,
                        status: state.chrono.running ? 'play' : 'stop'
                    }
                });
                if (state && state.timerStatus && state.timerQuestionUid) {
                    // Convert timer values from seconds to milliseconds for unified timer system
                    const timerTimeInMs = (state.timerTimeLeft ?? 0) * 1000;

                    if (state.timerStatus === 'play') {
                        gameTimer.start(state.timerQuestionUid, timerTimeInMs);
                    } else if (state.timerStatus === 'pause') {
                        gameTimer.start(state.timerQuestionUid, timerTimeInMs);
                        gameTimer.pause();
                    } else if (state.timerStatus === 'stop') {
                        const timerPayload: TimerUpdatePayload = {
                            running: false,
                            status: 'stop',
                            timeLeftMs: timerTimeInMs, // converted to ms
                            questionUid: state.timerQuestionUid
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
                // Always pass timeLeftMs as-is (milliseconds)
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
            quizSocket.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: gameId });
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
    }, [quizSocket, gameId, gameTimer]);

    // --- Emitter Functions ---
    const emitSetQuestion = useCallback((questionUid: string, startTime?: number) => {
        if (!gameId) {
            logger.warn('Cannot emit set question: no gameId available');
            return;
        }
        const payload: SetQuestionPayload = {
            gameId: gameId,
            questionUid,
            questionIndex: 0 // Backend expects this field but we're using UIDs primarily
        };
        logger.info(`Emitting set_question`, payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.SET_QUESTION, payload);
        logger.info(`Waiting for backend confirmation of question ${questionUid}`);
    }, [quizSocket, gameId]);

    const emitEndQuiz = useCallback(() => {
        if (!gameId) {
            logger.warn('Cannot emit end game: no gameId available');
            return;
        }
        const payload = { gameId: gameId };
        logger.info('Emitting end_game', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.END_GAME, payload);
    }, [quizSocket, gameId]);

    const emitPauseQuiz = useCallback(() => {
        if (!gameId) {
            logger.warn('Cannot emit pause: no gameId available');
            return;
        }
        const payload: TimerActionPayload = {
            gameId: gameId,
            action: 'pause'
        };
        logger.info('Emitting quiz_timer_action with action=pause', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket, gameId]);

    const emitResumeQuiz = useCallback(() => {
        if (!gameId) {
            logger.warn('Cannot emit resume: no gameId available');
            return;
        }
        const payload: TimerActionPayload = {
            gameId: gameId,
            action: 'resume'
        };
        logger.info('Emitting quiz_timer_action with action=resume', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket, gameId]);

    const emitSetTimer = useCallback((duration: number, questionUid?: string) => {
        if (!gameId) {
            logger.warn('Cannot emit set timer: no gameId available');
            return;
        }
        const payload: TimerActionPayload = {
            gameId: gameId,
            action: 'set_duration',
            durationMs: duration
        };
        logger.info('Emitting quiz_timer_action with action=set_duration', payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket, gameId]);

    const emitTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionUid: string, timeLeftMs?: number }) => {
        logger.info('[EMIT] emitTimerAction called with:', {
            action,
            availableAccessCode: accessCode,
            availableGameId: gameId,
            'typeof accessCode': typeof accessCode,
            'typeof gameId': typeof gameId,
            'gameId is database UUID': true
        });

        if (!gameId) {
            logger.warn('Cannot emit timer action: no gameId available', { accessCode, gameId });
            return;
        }

        // CRITICAL DEBUG: Log the exact question ID being sent
        logger.debug('emitTimerAction questionUid check', {
            'action.questionUid': action.questionUid,
            'action.questionUid type': typeof action.questionUid,
            'action.questionUid length': action.questionUid ? action.questionUid.length : 'null/undefined',
            'full action object': action,
            'JSON.stringify(action)': JSON.stringify(action)
        });

        // Convert status to action format expected by backend
        let backendAction: 'start' | 'pause' | 'resume' | 'stop';
        switch (action.status) {
            case 'play':
                backendAction = 'start';
                break;
            case 'pause':
                backendAction = 'pause';
                break;
            case 'stop':
                backendAction = 'stop';
                break;
            default:
                backendAction = 'stop';
        }

        const payload: TimerActionPayload = {
            gameId: gameId, // gameId IS the database UUID 
            action: backendAction,
            questionUid: action.questionUid // Add question UID to payload
        };

        // Add duration if provided
        if (action.timeLeftMs !== undefined) {
            payload.durationMs = action.timeLeftMs;
        }

        logger.debug('Final payload being sent', {
            payload,
            'payload.gameId': payload.gameId,
            'payload.action': payload.action,
            'payload.durationMs': payload.durationMs,
            'payload.questionUid': payload.questionUid,
            'payload.questionUid type': typeof payload.questionUid,
            'payload.questionUid length': payload.questionUid ? payload.questionUid.length : 'null/undefined',
            socketEvent: SOCKET_EVENTS.TEACHER.TIMER_ACTION,
            socketConnected: !!quizSocket?.connected,
            'JSON.stringify(payload)': JSON.stringify(payload)
        });

        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket, accessCode, gameId]);

    const emitLockAnswers = useCallback((lock: boolean) => {
        if (!gameId) {
            logger.warn('Cannot emit lock answers: no gameId available');
            return;
        }
        const payload = { gameId: gameId, lock };
        logger.info(`Emitting lock_answers`, payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.LOCK_ANSWERS, payload);
    }, [quizSocket, gameId]);

    return {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        connectedCount,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitLockAnswers,
        _debug: { timerStatus, timerQuestionUid, timeLeftMs, localTimeLeftMs }
    };
}
