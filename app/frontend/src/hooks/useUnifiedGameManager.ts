/**
 * useUnifiedGameManager - Complete Game State Management Hook
 * 
 * This hook combines the unified timer and socket management into a single
 * comprehensive interface that replaces the individual role-specific hooks.
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

const logger = createLogger('useUnifiedGameManager');

// --- Game State Interface ---
export interface GameState {
    // Game identification
    gameId: string | null;
    role: TimerRole;

    // Connection state
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Timer state
    timer: TimerState;
    isTimerRunning: boolean;

    // Question state
    currentQuestionId: string | null;
    currentQuestionIndex: number | null;
    totalQuestions: number;

    // Game flow state
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
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
    gameState: GameState;

    // Timer controls
    timer: {
        start: (questionId: string, duration?: number) => void;
        pause: () => void;
        resume: () => void;
        stop: () => void;
        reset: (duration?: number) => void;
        setDuration: (duration: number) => void;
        formatTime: (time: number, showMs?: boolean) => string;
        getDisplayTime: () => number;
    };

    // Socket controls
    socket: {
        instance: Socket | null;
        connect: () => void;
        disconnect: () => void;
        reconnect: () => void;
        emit: (event: string, data?: unknown) => void;
        on: (event: string, handler: (...args: unknown[]) => void) => () => void;
        emitTimerAction: (action: 'start' | 'pause' | 'resume' | 'stop', questionId?: string, duration?: number) => void;
    };

    // Game actions (role-specific)
    actions: {
        // Teacher actions
        setQuestion?: (questionId: string, duration?: number) => void;
        endGame?: () => void;
        lockAnswers?: () => void;
        unlockAnswers?: () => void;

        // Student actions
        joinGame?: () => void;
        submitAnswer?: (questionId: string, answer: unknown, timeSpent: number) => void;

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
    const timer = useGameTimer(role, timerConfig);
    const socket = useSocketManager(role, gameId, socketConfig);

    // --- Game State Management ---
    const [gameState, setGameState] = useState<GameState>({
        gameId,
        role,
        connected: socket.socketState.connected,
        connecting: socket.socketState.connecting,
        error: socket.socketState.error,
        timer: timer.timerState,
        isTimerRunning: timer.isRunning,
        currentQuestionId: timer.timerState.questionId,
        currentQuestionIndex: null,
        totalQuestions: 0,
        gameStatus: 'waiting',
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
            currentQuestionId: timer.timerState.questionId
        }));
    }, [timer.timerState, timer.isRunning]);

    // --- Socket Event Handlers ---
    useEffect(() => {
        if (!socket.socket) return;

        const cleanupFunctions: (() => void)[] = [];

        // Timer update handler
        cleanupFunctions.push(
            socket.onTimerUpdate((timerUpdate) => {
                logger.debug(`[${role.toUpperCase()}] Received timer update`, timerUpdate);
                timer.syncWithBackend(timerUpdate);
            })
        );

        // Connected count handler (common across roles)
        cleanupFunctions.push(
            socket.on('connected_count', (...args: unknown[]) => {
                const data = args[0] as { count: number };
                setGameState(prev => ({ ...prev, connectedCount: data.count }));
            })
        );

        // Role-specific event handlers
        if (role === 'teacher') {
            setupTeacherEvents(socket, setGameState, cleanupFunctions);
        } else if (role === 'student') {
            setupStudentEvents(socket, setGameState, timer, cleanupFunctions);
        } else if (role === 'projection') {
            setupProjectionEvents(socket, setGameState, timer, cleanupFunctions);
        } else if (role === 'tournament') {
            setupTournamentEvents(socket, setGameState, timer, cleanupFunctions);
        }

        // Cleanup on unmount or socket change
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
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
            getDisplayTime: timer.getDisplayTime
        },
        socket: {
            instance: socket.socket,
            connect: socket.connect,
            disconnect: socket.disconnect,
            reconnect: socket.reconnect,
            emit: socket.emit,
            on: socket.on,
            emitTimerAction: socket.emitTimerAction
        },
        actions
    };
}

// --- Role-Specific Event Setup Functions ---

function setupTeacherEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    cleanupFunctions: (() => void)[]
) {
    // Game control state updates
    cleanupFunctions.push(
        socket.on('game_control_state', (state: any) => {
            logger.debug('Teacher received game_control_state', state);
            setGameState(prev => ({
                ...prev,
                currentQuestionIndex: state.currentQuestionIdx,
                totalQuestions: state.questions?.length || 0,
                gameStatus: state.ended ? 'finished' : 'active'
            }));
        })
    );

    // Dashboard-specific events
    cleanupFunctions.push(
        socket.on('dashboard_question_changed', (...args: unknown[]) => {
            const data = args[0] as { questionUid: string };
            setGameState(prev => ({ ...prev, currentQuestionId: data.questionUid }));
        })
    );
}

function setupStudentEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    // Game question received
    cleanupFunctions.push(
        socket.on('game_question', (payload: any) => {
            logger.debug('Student received game_question', payload);
            setGameState(prev => ({
                ...prev,
                currentQuestionId: payload.question?.uid,
                currentQuestionIndex: payload.questionIndex,
                totalQuestions: payload.totalQuestions,
                gameStatus: 'active',
                phase: 'question',
                answered: false
            }));

            // Auto-start timer if configured
            if (payload.question?.uid && payload.timer) {
                timer.start(payload.question.uid, payload.timer);
            }
        })
    );

    // Answer received feedback
    cleanupFunctions.push(
        socket.on('answer_received', (result: any) => {
            logger.debug('Student received answer_received', result);
            setGameState(prev => ({ ...prev, answered: true, phase: 'feedback' }));
        })
    );

    // Game ended
    cleanupFunctions.push(
        socket.on('game_ended', (results: any) => {
            logger.debug('Student received game_ended', results);
            setGameState(prev => ({ ...prev, gameStatus: 'finished', phase: 'results' }));
            timer.stop();
        })
    );
}

function setupProjectionEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    // Projector state updates
    cleanupFunctions.push(
        socket.on('projector_state', (state: any) => {
            logger.debug('Projection received projector_state', state);
            setGameState(prev => ({
                ...prev,
                currentQuestionIndex: state.currentQuestionIdx,
                totalQuestions: state.questions?.length || 0,
                gameStatus: state.ended ? 'finished' : 'active',
                currentQuestionId: state.timerQuestionId ||
                    (state.currentQuestionIdx !== null && state.questions?.[state.currentQuestionIdx]?.uid)
            }));
        })
    );
}

function setupTournamentEvents(
    socket: GameSocketHook,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    timer: GameTimerHook,
    cleanupFunctions: (() => void)[]
) {
    // Tournament state updates
    cleanupFunctions.push(
        socket.on('tournament_state', (state: any) => {
            logger.debug('Tournament received tournament_state', state);
            setGameState(prev => ({
                ...prev,
                gameStatus: state.stopped ? 'finished' : 'active',
                currentQuestionId: state.currentQuestionUid
            }));
        })
    );

    // Tournament question updates
    cleanupFunctions.push(
        socket.on('tournament_question', (data: any) => {
            logger.debug('Tournament received tournament_question', data);
            if (data.question?.uid && data.timeLeft) {
                timer.start(data.question.uid, data.timeLeft);
            }
        })
    );
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
        actions.setQuestion = (questionId: string, duration?: number) => {
            socket.emit('set_question', { gameId: config.gameId, questionUid: questionId });
            if (duration) {
                socket.emitTimerAction('start', questionId, duration);
            }
        };

        actions.endGame = () => {
            socket.emit('end_game', { gameId: config.gameId });
        };

        actions.lockAnswers = () => {
            socket.emit('lock_answers', { gameId: config.gameId });
        };

        actions.unlockAnswers = () => {
            socket.emit('unlock_answers', { gameId: config.gameId });
        };
    }

    if (role === 'student') {
        actions.joinGame = () => {
            if (config.accessCode && config.userId && config.username) {
                socket.emit('join_game', {
                    code: config.accessCode,
                    userId: config.userId,
                    username: config.username,
                    avatarEmoji: config.avatarEmoji
                });
            }
        };

        actions.submitAnswer = (questionId: string, answer: unknown, timeSpent: number) => {
            socket.emit('submit_answer', {
                questionId,
                answer,
                timeSpent,
                code: config.accessCode
            });
        };
    }

    if (role === 'projection') {
        actions.getState = () => {
            socket.emit('get_quiz_state', { gameId: config.gameId });
        };
    }

    if (role === 'tournament') {
        actions.joinTournament = () => {
            if (config.accessCode && config.userId && config.username) {
                socket.emit('join_tournament', {
                    code: config.accessCode,
                    userId: config.userId,
                    username: config.username,
                    avatarEmoji: config.avatarEmoji
                });
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
