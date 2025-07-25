/**
 * useUnifiedGameManager - Complete Game State Management Hook
 * 
 * This hook combines the unified timer and socket management into a single
 * comprehensive interface that         setDerivedState(prev => ({
            ...prev,
            timer: timer.timerState,
            isTimerRunning: timer.isRunning,
            currentQuestionUid: timer.timerState.questionUid ?? null
        }));
    }, [timer.timerState, timer.isRunning, timer.timerState.timeLeftMs, timer.timerState.questionUid, timer.timerState.status]);s the individual role-specific hooks.
 * 
 * Phase 2 of the Frontend Modernization Plan
 * Integration layer for useGameTimer + useGameSocket
 */

import { useEffect, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { useGameTimer, type TimerRole, type TimerState } from './useGameTimer';
import { useGameSocket as useSocketManager, type SocketConfig } from './useGameSocket';
import type { GameTimerHook } from './useGameTimer';
import type { GameSocketHook } from './useGameSocket';

// Consolidated shared type imports
import {
    SOCKET_EVENTS,
    QUESTION_TYPES,
    type GameTimerState
} from '@shared/types';

import type {
    ClientToServerEvents,
    ServerToClientEvents,
    TimerActionPayload,
    JoinGamePayload,
    GameAnswerPayload,
    TimerUpdatePayload,
    GameTimerUpdatePayload
} from '@shared/types/socketEvents';
import type { LiveQuestionPayload } from '@shared/types/quiz/liveQuestion';
import { logTimerEvent, logTimerState, logTimerCalculation, logTimerError } from '@/utils/timerDebugLogger';

const logger = createLogger('useUnifiedGameManager');

// --- Unified Game State Interface using shared types ---
export interface UnifiedGameUIState {
    // Game identification
    gameId: string | null;
    role: TimerRole;

    // Connection state
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Timer state using shared types
    timer: GameTimerState;
    isTimerRunning: boolean;

    // Question state
    currentQuestionUid: string | null;
    currentQuestionIndex: number | null;
    currentQuestionData: any | null; // Full question data from backend
    totalQuestions: number;

    // Game flow state using shared status values
    gameStatus: 'pending' | 'active' | 'paused' | 'completed';
    phase: 'question' | 'feedback' | 'results';

    // UI state
    connectedCount: number;
    answered: boolean;
}

// --- Configuration Interface ---
export interface UnifiedGameConfig {
    role: TimerRole;
    gameId: string | null;

    // Timer configuration
    timerConfig?: {
        autoStart?: boolean;
        smoothCountdown?: boolean;
        showMilliseconds?: boolean;
        enableLocalAnimation?: boolean;
    };

    // Socket configuration
    socketConfig?: Partial<SocketConfig>;

    // Authentication (for teacher role)
    token?: string | null;

    // Student/Tournament specific
    accessCode?: string | null;
    userId?: string | null;
    username?: string | null;
    avatarEmoji?: string | null;
}

// --- Hook Interface ---
export interface UnifiedGameManagerHook {
    // State
    gameState: UnifiedGameUIState;

    // Timer controls
    timer: {
        start: (questionUid: string, duration?: number) => void;
        pause: () => void;
        resume: () => void;
        stop: () => void;
        reset: (duration?: number) => void;
        setDuration: (duration: number) => void;
        formatTime: (time: number, showMs?: boolean) => string;
        getDisplayTime: () => number;
        syncWithBackend: (payload: TimerUpdatePayload | GameTimerUpdatePayload) => void;
    };

    // Socket controls
    socket: {
        instance: Socket<ServerToClientEvents, ClientToServerEvents> | null;
        connect: () => void;
        disconnect: () => void;
        reconnect: () => void;
        emitTimerAction: (action: 'start' | 'pause' | 'resume' | 'stop', accessCode: string, questionUid?: string, duration?: number) => void;
    };

    // Game actions (role-specific)
    actions: {
        // Teacher actions
        setQuestion?: (questionUid: string, duration?: number) => void;
        endGame?: () => void;
        lockAnswers?: () => void;
        unlockAnswers?: () => void;

        // Student actions
        joinGame?: () => void;
        submitAnswer?: (questionUid: string, answer: unknown, timeSpent: number) => void;

        // Projection actions
        getState?: () => void;

        // Tournament actions
        joinTournament?: () => void;
    };
}

/**
 * Unified Game Manager Hook
 * 
 * Provides complete game state management combining timer and socket functionality
 * with role-based behavior patterns.
 * 
 * @param config - Configuration object with role, gameId, and options
 * @returns UnifiedGameManagerHook interface
 */
export function useUnifiedGameManager(config: UnifiedGameConfig): UnifiedGameManagerHook {
    const { role, gameId, timerConfig, socketConfig, token, accessCode, userId, username, avatarEmoji } = config;

    // --- Initialize Timer and Socket Hooks ---
    const socket = useSocketManager(role, gameId, socketConfig);
    const timer = useGameTimer(role, socket.socket);

    // --- Game State Management ---
    const [gameState, setGameState] = useState<UnifiedGameUIState>({
        gameId,
        role,
        connected: socket.socketState.connected,
        connecting: socket.socketState.connecting,
        error: socket.socketState.error,
        timer: timer.timerState,
        isTimerRunning: timer.isRunning,
        currentQuestionUid: timer.timerState.questionUid ?? null,
        currentQuestionIndex: null,
        currentQuestionData: null,
        totalQuestions: 0,
        gameStatus: 'pending', // Use shared status values
        phase: 'question',
        connectedCount: 1,
        answered: false
    });

    // --- Sync Socket State ---
    useEffect(() => {
        setGameState(prev => ({
            ...prev,
            connected: socket.socketState.connected,
            connecting: socket.socketState.connecting,
            error: socket.socketState.error
        }));
    }, [socket.socketState]);

    // --- Sync Timer State ---
    useEffect(() => {
        setGameState(prev => ({
            ...prev,
            timer: timer.timerState,
            isTimerRunning: timer.isRunning,
            currentQuestionUid: timer.timerState.questionUid ?? null
        }));
    }, [timer.timerState, timer.isRunning, timer.timerState.timeLeftMs, timer.timerState.questionUid, timer.timerState.status]);

    // --- Teacher Dashboard Connection ---
    useEffect(() => {
        if (!socket.socket || !socket.socketState.connected || role !== 'teacher' || !accessCode) return;

        logger.info('Teacher socket connected, joining dashboard room', { accessCode });
        // Use type assertion to bypass TypeScript error for the emit
        (socket.socket.emit as any)('join_dashboard', { accessCode });
    }, [socket.socket, socket.socketState.connected, role, accessCode]);

    // --- Socket Event Handlers ---
    useEffect(() => {
        if (!socket.socket) return;

        const cleanupFunctions: (() => void)[] = [];

        // Timer update handler
        cleanupFunctions.push(
            socket.onTimerUpdate((timerUpdate) => {
                logger.debug(`[${role.toUpperCase()}] Received timer update`, timerUpdate);
                if (timerUpdate && typeof timerUpdate === 'object' && 'running' in timerUpdate) {
                    const fixedTimerUpdate = {
                        ...timerUpdate,
                        timeLeftMs: timerUpdate.timeLeftMs === undefined ? null : timerUpdate.timeLeftMs,
                        running: !!timerUpdate.running,
                        questionUid: timerUpdate.questionUid === null ? undefined : timerUpdate.questionUid
                    };
                    timer.syncWithBackend(fixedTimerUpdate);
                }
            })
        );

        // Connected count handler (canonical event)
        if (socket.socket) {
            socket.socket.on(
                SOCKET_EVENTS.TEACHER.CONNECTED_COUNT as keyof ServerToClientEvents,
                (payload: any) => {
                    // quiz_connected_count: { count: number }
                    setGameState(prev => ({ ...prev, connectedCount: payload.count }));
                }
            );
            cleanupFunctions.push(() => {
                socket.socket?.off(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT as keyof ServerToClientEvents);
            });
        }

        // Role-specific event handlers
        if (role === 'teacher') {
            setupTeacherEvents(socket, setGameState, timer, cleanupFunctions);
        } else if (role === 'student') {
            setupStudentEvents(socket, setGameState, timer, cleanupFunctions);
        } else if (role === 'projection') {
            setupProjectionEvents(socket, setGameState, timer, cleanupFunctions);
        } else if (role === 'tournament') {
            setupTournamentEvents(socket, setGameState, timer, cleanupFunctions);
        }

        // Cleanup on unmount or socket change
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup && cleanup());
        };
    }, [socket.socket, role, timer]);

    // --- Role-Specific Actions ---
    const actions = createRoleSpecificActions(role, socket, timer, config);

    return {
        gameState,
        timer: {
            start: timer.start,
            pause: timer.pause,
            resume: timer.resume,
            stop: timer.stop,
            reset: timer.reset,
            setDuration: timer.setDuration,
            formatTime: timer.formatTime,
            getDisplayTime: timer.getDisplayTime,
            syncWithBackend: timer.syncWithBackend
        },
        socket: {
            instance: socket.socket,
            connect: socket.connect,
            disconnect: socket.disconnect,
            reconnect: socket.reconnect,
            emitTimerAction: socket.emitTimerAction
        },
        actions
    };
}

// --- Role-Specific Event Setup Functions ---

function setupTeacherEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<UnifiedGameUIState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    if (!socket.socket) return;

    // Game control state updates
    socket.socket.on(
        SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents,
        (state: any) => {
            logger.debug('Teacher received game_control_state', state);
            setGameState(prev => ({
                ...prev,
                currentQuestionIndex: state.currentQuestionIdx,
                totalQuestions: state.questions?.length || 0,
                gameStatus: state.ended ? 'completed' : 'active'
            }));
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents);
    });

    // Dashboard-specific events
    socket.socket.on(
        SOCKET_EVENTS.TEACHER.DASHBOARD_QUESTION_CHANGED as keyof ServerToClientEvents,
        (payload: any) => {
            // dashboard_question_changed: { questionUid: string }
            setGameState(prev => ({ ...prev, currentQuestionUid: payload.questionUid }));
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.TEACHER.DASHBOARD_QUESTION_CHANGED as keyof ServerToClientEvents);
    });

    // Note: dashboard_timer_updated is handled by useGameTimer.ts to avoid conflicts
}

function setupStudentEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<UnifiedGameUIState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    if (!socket.socket) return;

    // Game question received
    socket.socket.on(
        SOCKET_EVENTS.GAME.GAME_QUESTION as keyof ServerToClientEvents,
        (payload: LiveQuestionPayload) => {
            logger.debug('Student received game_question', payload);
            setGameState(prev => ({
                ...prev,
                currentQuestionUid: payload.question?.uid,
                currentQuestionIndex: payload.questionIndex ?? null,
                currentQuestionData: payload, // Store full payload including question data
                totalQuestions: payload.totalQuestions ?? 0,
                gameStatus: 'active',
                phase: 'question',
                answered: false
            }));
            if (payload.question?.uid && payload.timer) {
                logger.debug('Starting timer for question', { questionUid: payload.question.uid, timer: payload.timer });
                // Extract duration from GameTimerState object
                const duration = typeof payload.timer === 'object' ? payload.timer.durationMs : payload.timer;
                timer.start(payload.question.uid, duration);
            }
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.GAME.GAME_QUESTION as keyof ServerToClientEvents);
    });

    // Answer received feedback - handled by custom hook
    // socket.socket.on(
    //     SOCKET_EVENTS.GAME.ANSWER_RECEIVED as keyof ServerToClientEvents,
    //     (result: any) => {
    //         logger.debug('Student received answer_received', result);
    //         setGameState(prev => ({ ...prev, answered: true, phase: 'feedback' }));
    //     }
    // );
    // cleanupFunctions.push(() => {
    //     socket.socket?.off(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as keyof ServerToClientEvents);
    // });

    // Game ended
    socket.socket.on(
        SOCKET_EVENTS.GAME.GAME_ENDED as keyof ServerToClientEvents,
        (results: any) => {
            logger.debug('Student received game_ended', results);
            setGameState(prev => ({ ...prev, gameStatus: 'completed', phase: 'results' }));
            timer.stop();
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.GAME.GAME_ENDED as keyof ServerToClientEvents);
    });
}

function setupProjectionEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<UnifiedGameUIState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    if (!socket.socket) return;

    socket.socket.on(
        SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE as keyof ServerToClientEvents,
        (state: any) => {
            logger.debug('Projection received projector_state', state);
            setGameState(prev => ({
                ...prev,
                currentQuestionIndex: state.currentQuestionIdx,
                totalQuestions: state.questions?.length || 0,
                gameStatus: state.ended ? 'completed' : 'active',
                currentQuestionUid: state.timerQuestionUid ||
                    (state.currentQuestionIdx !== null && state.questions?.[state.currentQuestionIdx]?.uid)
            }));
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE as keyof ServerToClientEvents);
    });
}

function setupTournamentEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<UnifiedGameUIState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    if (!socket.socket) return;

    socket.socket.on(
        SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STATE_UPDATE as keyof ServerToClientEvents,
        (state: any) => {
            logger.debug('Tournament received tournament_state_update', state);
            setGameState(prev => ({
                ...prev,
                gameStatus: state.stopped ? 'completed' : 'active',
                currentQuestionUid: state.currentQuestionUid
            }));
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STATE_UPDATE as keyof ServerToClientEvents);
    });

    socket.socket.on(
        SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_QUESTION as keyof ServerToClientEvents,
        (data: any) => {
            logger.debug('Tournament received tournament_question', data);

            // Store full question data similar to game_question
            setGameState(prev => ({
                ...prev,
                currentQuestionUid: data.uid || data.question?.uid,
                currentQuestionIndex: data.index ?? null,
                currentQuestionData: {
                    question: {
                        uid: data.uid || data.question?.uid,
                        text: data.question || data.text,
                        defaultMode: data.defaultMode || QUESTION_TYPES.MULTIPLE_CHOICE_EN,
                        answerOptions: data.answerOptions || []
                    },
                    timer: data.remainingTime || data.timeLeftMs,
                    questionIndex: data.index,
                    totalQuestions: data.total,
                    questionState: data.questionState || 'active'
                },
                totalQuestions: data.total ?? 0,
                gameStatus: 'active',
                phase: 'question',
                answered: false
            }));

            if ((data.uid || data.question?.uid) && (data.remainingTime || data.timeLeftMs)) {
                timer.start(data.uid || data.question?.uid, data.remainingTime || data.timeLeftMs);
            }
        }
    );
    cleanupFunctions.push(() => {
        socket.socket?.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_QUESTION as keyof ServerToClientEvents);
    });
}

// --- Role-Specific Actions Creation ---
function createRoleSpecificActions(
    role: TimerRole,
    socket: GameSocketHook,
    timer: GameTimerHook,
    config: UnifiedGameConfig
) {
    const actions: any = {};
    if (role === 'teacher') {
        actions.setQuestion = (questionUid: string, duration?: number) => {
            if (!config.accessCode) {
                logger.error('Missing accessCode for setQuestion');
                return;
            }
            const payload: import('@shared/types/socket/dashboardPayloads').SetQuestionPayload = {
                accessCode: config.accessCode,
                questionUid: questionUid,
                questionIndex: 0 // TODO: Replace with actual index if available
            };
            socket.socket?.emit(
                SOCKET_EVENTS.TEACHER.SET_QUESTION as keyof ClientToServerEvents,
                payload
            );
            if (duration && config.accessCode) {
                // Use the new emitTimerAction signature
                socket.emitTimerAction(
                    'start',
                    config.accessCode,
                    questionUid,
                    duration
                );
            }
        };
        actions.endGame = () => {
            if (!config.accessCode) {
                logger.error('Missing accessCode for endGame');
                return;
            }
            const payload: { accessCode: string; gameId?: string } = { accessCode: config.accessCode };
            if (config.gameId) payload.gameId = config.gameId;
            socket.socket?.emit(
                SOCKET_EVENTS.TEACHER.END_GAME as keyof ClientToServerEvents,
                payload
            );
        };
        actions.lockAnswers = () => {
            if (!config.accessCode) {
                logger.error('Missing accessCode for lockAnswers');
                return;
            }
            const payload: { accessCode: string; gameId?: string; lock: boolean } = { accessCode: config.accessCode, lock: true };
            if (config.gameId) payload.gameId = config.gameId;
            socket.socket?.emit(
                SOCKET_EVENTS.TEACHER.LOCK_ANSWERS as keyof ClientToServerEvents,
                payload
            );
        };
        actions.unlockAnswers = () => {
            if (!config.accessCode) {
                logger.error('Missing accessCode for unlockAnswers');
                return;
            }
            const payload: { accessCode: string; gameId?: string; lock: boolean } = { accessCode: config.accessCode, lock: false };
            if (config.gameId) payload.gameId = config.gameId;
            socket.socket?.emit(
                SOCKET_EVENTS.TEACHER.LOCK_ANSWERS as keyof ClientToServerEvents,
                payload
            );
        };
    }
    if (role === 'student') {
        actions.joinGame = () => {
            if (config.accessCode && config.userId && config.username) {
                socket.socket?.emit(
                    SOCKET_EVENTS.GAME.JOIN_GAME as keyof ClientToServerEvents,
                    {
                        accessCode: config.accessCode,
                        userId: config.userId,
                        username: config.username,
                        avatarEmoji: config.avatarEmoji || '🐼'
                    } as JoinGamePayload
                );
            }
        };
        actions.submitAnswer = (questionUid: string, answer: unknown, timeSpent: number) => {
            socket.socket?.emit(
                SOCKET_EVENTS.GAME.GAME_ANSWER as keyof ClientToServerEvents,
                {
                    accessCode: config.accessCode!,
                    userId: config.userId!,
                    questionUid: questionUid,
                    answer,
                    timeSpent
                } as GameAnswerPayload
            );
        };
    }
    if (role === 'projection') {
        actions.getState = () => {
            if (!config.accessCode) {
                logger.error('Missing accessCode for getState (projection role)');
                return;
            }
            socket.socket?.emit(
                SOCKET_EVENTS.TEACHER.GET_GAME_STATE as keyof ClientToServerEvents,
                { accessCode: config.accessCode }
            );
        };
    }
    if (role === 'tournament') {
        actions.joinTournament = () => {
            if (config.accessCode && config.userId && config.username) {
                socket.socket?.emit(
                    SOCKET_EVENTS.TOURNAMENT.JOIN_TOURNAMENT as keyof ClientToServerEvents,
                    {
                        accessCode: config.accessCode,
                        userId: config.userId,
                        username: config.username,
                        avatarEmoji: config.avatarEmoji || '🐼'
                    }
                );
            }
        };
    }
    return actions;
}

// --- Convenience Hooks for Each Role ---

/**
 * Teacher-specific unified game manager
 */
export function useTeacherGameManager(
    gameId: string | null,
    token: string | null,
    customConfig?: Partial<UnifiedGameConfig>
) {
    return useUnifiedGameManager({
        role: 'teacher',
        gameId,
        token,
        ...customConfig
    });
}

/**
 * Student-specific unified game manager
 */
export function useStudentGameManager(
    accessCode: string | null,
    userId: string | null,
    username: string | null,
    avatarEmoji?: string | null,
    customConfig?: Partial<UnifiedGameConfig>
) {
    return useUnifiedGameManager({
        role: 'student',
        gameId: accessCode, // For students, accessCode serves as gameId
        accessCode,
        userId,
        username,
        avatarEmoji,
        ...customConfig
    });
}

/**
 * Projection-specific unified game manager
 */
export function useProjectionGameManager(
    gameId: string | null,
    customConfig?: Partial<UnifiedGameConfig>
) {
    return useUnifiedGameManager({
        role: 'projection',
        gameId,
        ...customConfig
    });
}

/**
 * Tournament-specific unified game manager
 */
export function useTournamentGameManager(
    accessCode: string | null,
    userId: string | null,
    username: string | null,
    avatarEmoji?: string | null,
    customConfig?: Partial<UnifiedGameConfig>
) {
    return useUnifiedGameManager({
        role: 'tournament',
        gameId: accessCode,
        accessCode,
        userId,
        username,
        avatarEmoji,
        ...customConfig
    });
}
