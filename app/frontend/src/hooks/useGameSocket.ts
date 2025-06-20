/**
 * useGameSocket - Unified Socket Management Hook
 * 
 * This hook consolidates socket connection and event management functionality
 * to work alongside the unified timer system. It provides role-based socket
 * behavior while maintaining consistent patterns.
 * 
 * Phase 2 of the Frontend Modernization Plan
 * Works with useGameTimer for complete timer management consolidation
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { STORAGE_KEYS } from '@/constants/auth';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '@shared/types/socketEvents';
import type { TimerRole, GameTimerState } from '@shared/types';
import {
    joinGamePayloadSchema,
    gameAnswerPayloadSchema,
    timerActionPayloadSchema,
    gameJoinedPayloadSchema,
    timerUpdatePayloadSchema
} from '@shared/types/socketEvents.zod';
import { z } from 'zod';

// Derive types from Zod schemas for type safety
type JoinGamePayload = z.infer<typeof joinGamePayloadSchema>;
type GameAnswerPayload = z.infer<typeof gameAnswerPayloadSchema>;
type TimerActionPayload = z.infer<typeof timerActionPayloadSchema>;
type GameJoinedPayload = z.infer<typeof gameJoinedPayloadSchema>;
type TimerUpdatePayload = z.infer<typeof timerUpdatePayloadSchema>;

const logger = createLogger('useGameSocket');

// --- Socket Configuration ---
export interface SocketConfig {
    role: TimerRole;
    autoConnect?: boolean;
    autoReconnect?: boolean;
    requireAuth?: boolean;
    roomPrefix?: string;
}

// --- Socket Connection State ---
export interface SocketState {
    connected: boolean;
    connecting: boolean;
    error: string | null;
    reconnectAttempts: number;
}

// --- Socket Hook Interface ---
export interface GameSocketHook {
    // Socket instance and state
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    socketState: SocketState;

    // Connection management
    connect: () => void;
    disconnect: () => void;
    reconnect: () => void;

    // Event emitters
    emitGameAnswer?: (payload: GameAnswerPayload) => void;
    emitJoinGame?: (payload: JoinGamePayload) => void;

    // Event listeners (returns cleanup function)
    onGameJoined?: (handler: (payload: Parameters<ServerToClientEvents['game_joined']>[0]) => void) => () => void;

    // Timer-specific events
    emitTimerAction: (action: 'start' | 'pause' | 'resume' | 'stop', accessCode: string, questionUid?: string, duration?: number) => void;
    onTimerUpdate: (handler: (timerState: Partial<GameTimerState>) => void) => () => void;
}

// --- Default Socket Configurations by Role ---
const DEFAULT_SOCKET_CONFIGS: Record<TimerRole, SocketConfig> = {
    teacher: {
        role: 'teacher',
        autoConnect: true,
        autoReconnect: true,
        requireAuth: true,
        roomPrefix: 'dashboard_'
    },
    student: {
        role: 'student',
        autoConnect: true,
        autoReconnect: true,
        requireAuth: false,
        roomPrefix: 'game_'
    },
    projection: {
        role: 'projection',
        autoConnect: true,
        autoReconnect: true,
        requireAuth: false,
        roomPrefix: 'projection_'
    },
    tournament: {
        role: 'tournament',
        autoConnect: true,
        autoReconnect: true,
        requireAuth: false,
        roomPrefix: 'live_'
    }
};

// --- Timer Events by Role ---
const TIMER_EVENTS: Record<TimerRole, {
    update: string;
    action: string;
    status: string;
}> = {
    teacher: {
        update: SOCKET_EVENTS.TEACHER.TIMER_UPDATE,
        action: SOCKET_EVENTS.TEACHER.TIMER_ACTION,
        status: SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED
    },
    student: {
        update: SOCKET_EVENTS.GAME.TIMER_UPDATE,
        action: SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED,
        status: SOCKET_EVENTS.GAME.TIMER_SET
    },
    projection: {
        update: SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED,
        action: SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED,
        status: SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED
    },
    tournament: {
        update: SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_TIMER_UPDATE,
        action: SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_TIMER_UPDATE,
        status: SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STARTED
    }
};

/**
 * Unified Game Socket Hook
 * 
 * Provides role-based socket management with consistent patterns across
 * all socket use cases in the application.
 * 
 * @param role - The role of the socket connection
 * @param gameId - The game/quiz ID for room management
 * @param customConfig - Optional configuration overrides
 * @returns GameSocketHook interface with socket state and controls
 */
export function useGameSocket(
    role: TimerRole,
    gameId: string | null,
    customConfig?: Partial<SocketConfig>
): GameSocketHook {

    // Merge default config with custom overrides
    const config: SocketConfig = {
        ...DEFAULT_SOCKET_CONFIGS[role],
        ...customConfig
    };

    // --- Socket State ---
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [socketState, setSocketState] = useState<SocketState>({
        connected: false,
        connecting: false,
        error: null,
        reconnectAttempts: 0
    });

    // --- Socket References ---
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Connection Management ---
    const connect = useCallback(() => {
        if (socket?.connected || !gameId) return;

        logger.info(`[${role.toUpperCase()}] Connecting socket for game: ${gameId}`);

        setSocketState(prev => ({ ...prev, connecting: true, error: null }));

        // Create socket configuration
        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_CONFIG.url, socketConfig);

        // Set up connection event handlers
        newSocket.on('connect', () => {
            logger.info(`[${role.toUpperCase()}] Socket connected: ${newSocket.id}`);
            setSocketState(prev => ({
                ...prev,
                connected: true,
                connecting: false,
                error: null,
                reconnectAttempts: 0
            }));
            // No auto-join logic here; handled by explicit helpers
        });

        newSocket.on('disconnect', (reason: string) => {
            logger.warn(`[${role.toUpperCase()}] Socket disconnected: ${reason}`);
            setSocketState(prev => ({ ...prev, connected: false, connecting: false, error: reason }));

            // Auto-reconnect if enabled
            if (config.autoReconnect && reason !== 'io client disconnect') {
                scheduleReconnect();
            }
        });

        newSocket.on('connect_error', (error: Error) => {
            logger.error(`[${role.toUpperCase()}] Socket connection error:`, error);
            setSocketState(prev => ({
                ...prev,
                connected: false,
                connecting: false,
                error: error.message,
                reconnectAttempts: prev.reconnectAttempts + 1
            }));

            if (config.autoReconnect) {
                scheduleReconnect();
            }
        });

        // Connect the socket
        newSocket.connect();
        setSocket(newSocket);
    }, [socket, gameId, role, config]);

    const disconnect = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Disconnecting socket`);

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socket) {
            socket.disconnect();
            setSocket(null);
        }

        setSocketState({
            connected: false,
            connecting: false,
            error: null,
            reconnectAttempts: 0
        });
    }, [socket, role]);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) return;

        const delay = Math.min(1000 * Math.pow(2, socketState.reconnectAttempts), 30000);
        logger.info(`[${role.toUpperCase()}] Scheduling reconnect in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
        }, delay);
    }, [socketState.reconnectAttempts, role, connect]);

    const reconnect = useCallback(() => {
        disconnect();
        setTimeout(connect, 100);
    }, [disconnect, connect]);    // --- Event Management ---
    const emitGameAnswer = useCallback((payload: GameAnswerPayload) => {
        if (!socket?.connected) {
            logger.warn(`[${role.toUpperCase()}] Cannot emit game_answer: socket not connected`);
            return;
        }

        // Validate payload before emitting
        try {
            const validatedPayload = gameAnswerPayloadSchema.parse(payload);
            // TODO: Use SOCKET_EVENTS.GAME.GAME_ANSWER when TypeScript types allow constants
            socket.emit('game_answer', validatedPayload);
        } catch (error) {
            logger.error(`[${role.toUpperCase()}] Invalid game_answer payload:`, error);
        }
    }, [socket, role]);

    const emitJoinGame = useCallback((payload: JoinGamePayload) => {
        if (!socket?.connected) {
            logger.warn(`[${role.toUpperCase()}] Cannot emit join_game: socket not connected`);
            return;
        }

        // Validate payload before emitting
        try {
            const validatedPayload = joinGamePayloadSchema.parse(payload);
            // TODO: Use SOCKET_EVENTS.GAME.JOIN_GAME when TypeScript types allow constants
            socket.emit('join_game', validatedPayload);
        } catch (error) {
            logger.error(`[${role.toUpperCase()}] Invalid join_game payload:`, error);
        }
    }, [socket, role]);

    // Fix onGameJoined defaultMode: registration function returning cleanup
    const onGameJoined = useCallback((handler: (payload: GameJoinedPayload) => void) => {
        if (!socket) {
            logger.warn(`[${role.toUpperCase()}] Cannot register handler for game_joined: no socket`);
            return () => { };
        }

        const validatedHandler = (payload: GameJoinedPayload) => {
            // Add runtime validation for game_joined payload
            try {
                const validatedPayload = gameJoinedPayloadSchema.parse(payload);
                handler(validatedPayload);
            } catch (error) {
                logger.error(`[${role.toUpperCase()}] Invalid game_joined payload:`, error);
            }
        };

        // Use SOCKET_EVENTS constants for consistency
        socket.on(SOCKET_EVENTS.GAME.GAME_JOINED as any, validatedHandler);
        return () => {
            socket.off(SOCKET_EVENTS.GAME.GAME_JOINED as any, validatedHandler);
        };
    }, [socket, role]);

    // --- Timer-Specific Methods ---
    const emitTimerAction = useCallback((
        action: 'start' | 'pause' | 'resume' | 'stop',
        accessCode: string,
        questionUid?: string,
        duration?: number
    ) => {
        if (!socket?.connected) {
            logger.warn(`[${role.toUpperCase()}] Cannot emit timer action: socket not connected`);
            return;
        }
        if (role === 'teacher') {
            const payload = {
                accessCode,
                action,
                duration,
                questionUid
            };

            // Validate payload before emitting
            try {
                const validatedPayload = timerActionPayloadSchema.parse(payload);
                // TODO: Use SOCKET_EVENTS.TEACHER.TIMER_ACTION when TypeScript types allow constants
                socket.emit('quiz_timer_action', validatedPayload);
            } catch (error) {
                logger.error(`[${role.toUpperCase()}] Invalid quiz_timer_action payload:`, error);
            }
        }
        // Add other roles as needed
    }, [socket, role]);

    const onTimerUpdate = useCallback((handler: (timerState: Partial<GameTimerState>) => void) => {
        if (!socket) {
            logger.warn(`[${role.toUpperCase()}] Cannot register timer update handler: no socket`);
            return () => { };
        }

        const validatedHandler = (payload: TimerUpdatePayload) => {
            try {
                const validatedPayload = timerUpdatePayloadSchema.parse(payload);
                // Convert to GameTimerState format
                const timerState: Partial<GameTimerState> = {
                    timeLeftMs: validatedPayload.timeLeftMs ?? 0,
                    isRunning: validatedPayload.running,
                    durationMs: validatedPayload.durationMs,
                };
                handler(timerState);
            } catch (error) {
                logger.error(`[${role.toUpperCase()}] Invalid timer_update payload:`, error);
            }
        };

        // Only listen to allowed timer update events for teacher
        if (role === 'teacher') {
            // Use SOCKET_EVENTS constants for consistency  
            socket.on(SOCKET_EVENTS.GAME.TIMER_UPDATE as any, validatedHandler);
            return () => {
                socket.off(SOCKET_EVENTS.GAME.TIMER_UPDATE as any, validatedHandler);
            };
        }
        // Add other roles as needed
        return () => { };
    }, [socket, role]);

    // --- Effect: Auto-connect ---
    useEffect(() => {
        if (config.autoConnect && gameId && !socket) {
            connect();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [config.autoConnect, gameId, socket, connect]);

    // --- Cleanup on unmount ---
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        socket,
        socketState,
        connect,
        disconnect,
        reconnect,
        emitGameAnswer: role === 'student' ? emitGameAnswer : undefined,
        emitJoinGame: role === 'student' ? emitJoinGame : undefined,
        onGameJoined: role === 'student' ? onGameJoined : undefined,
        emitTimerAction,
        onTimerUpdate
    };
}

// --- Role-Specific Socket Hooks ---

/**
 * Create a socket hook configured for teacher role
 */
export function useTeacherSocket(gameId: string | null, customConfig?: Partial<SocketConfig>) {
    return useGameSocket('teacher', gameId, customConfig);
}

/**
 * Create a socket hook configured for student role
 */
export function useStudentSocket(gameId: string | null, customConfig?: Partial<SocketConfig>) {
    return useGameSocket('student', gameId, customConfig);
}

/**
 * Create a socket hook configured for projection role
 */
export function useProjectionSocket(gameId: string | null, customConfig?: Partial<SocketConfig>) {
    return useGameSocket('projection', gameId, customConfig);
}

/**
 * Create a socket hook configured for tournament role
 */
export function useTournamentSocket(gameId: string | null, customConfig?: Partial<SocketConfig>) {
    return useGameSocket('tournament', gameId, customConfig);
}

// All legacy code and references to LEGACY_QUIZ or legacy events have been removed. Only unified/canonical event usage remains.
