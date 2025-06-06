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
import type { TimerRole, TimerState } from './useGameTimer';

const logger = createLogger('useGameSocket');

// --- Socket Role Configuration ---
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
    socket: Socket | null;
    socketState: SocketState;

    // Connection management
    connect: () => void;
    disconnect: () => void;
    reconnect: () => void;

    // Room management
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;

    // Event emitters
    emit: (event: string, data?: unknown) => void;

    // Event listeners (returns cleanup function)
    on: (event: string, handler: (...args: unknown[]) => void) => () => void;

    // Timer-specific events
    emitTimerAction: (action: 'start' | 'pause' | 'resume' | 'stop', questionId?: string, duration?: number) => void;
    onTimerUpdate: (handler: (timerState: Partial<TimerState>) => void) => () => void;
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
        action: SOCKET_EVENTS.LEGACY_QUIZ.TIMER_UPDATE,
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [socketState, setSocketState] = useState<SocketState>({
        connected: false,
        connecting: false,
        error: null,
        reconnectAttempts: 0
    });

    // --- Socket References ---
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const eventHandlersRef = useRef<Map<string, (...args: unknown[]) => void>>(new Map());

    // --- Connection Management ---
    const connect = useCallback(() => {
        if (socket?.connected || !gameId) return;

        logger.info(`[${role.toUpperCase()}] Connecting socket for game: ${gameId}`);

        setSocketState(prev => ({ ...prev, connecting: true, error: null }));

        // Create socket configuration
        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const newSocket = io(SOCKET_CONFIG.url, socketConfig);

        // Set up connection event handlers
        newSocket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`[${role.toUpperCase()}] Socket connected: ${newSocket.id}`);
            setSocketState(prev => ({
                ...prev,
                connected: true,
                connecting: false,
                error: null,
                reconnectAttempts: 0
            }));

            // Auto-join room if configured
            if (config.roomPrefix) {
                const roomId = `${config.roomPrefix}${gameId}`;
                newSocket.emit(getJoinEvent(role), { gameId, room: roomId });
            }
        });

        newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
            logger.warn(`[${role.toUpperCase()}] Socket disconnected: ${reason}`);
            setSocketState(prev => ({
                ...prev,
                connected: false,
                connecting: false,
                error: `Disconnected: ${reason}`
            }));

            // Auto-reconnect if enabled
            if (config.autoReconnect && reason !== 'io client disconnect') {
                scheduleReconnect();
            }
        });

        newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: Error) => {
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
    }, [disconnect, connect]);

    // --- Room Management ---
    const joinRoom = useCallback((roomId: string) => {
        if (!socket?.connected) {
            logger.warn(`[${role.toUpperCase()}] Cannot join room ${roomId}: socket not connected`);
            return;
        }

        logger.info(`[${role.toUpperCase()}] Joining room: ${roomId}`);
        socket.emit(getJoinEvent(role), { gameId, room: roomId });
    }, [socket, gameId, role]);

    const leaveRoom = useCallback((roomId: string) => {
        if (!socket?.connected) return;

        logger.info(`[${role.toUpperCase()}] Leaving room: ${roomId}`);
        socket.emit('leave_room', { room: roomId });
    }, [socket, role]);

    // --- Event Management ---
    const emit = useCallback((event: string, data?: unknown) => {
        if (!socket?.connected) {
            logger.warn(`[${role.toUpperCase()}] Cannot emit ${event}: socket not connected`);
            return;
        }

        logger.debug(`[${role.toUpperCase()}] Emitting ${event}`, data);
        socket.emit(event, data);
    }, [socket, role]);

    const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
        if (!socket) {
            logger.warn(`[${role.toUpperCase()}] Cannot register handler for ${event}: no socket`);
            return () => { };
        }

        logger.debug(`[${role.toUpperCase()}] Registering handler for ${event}`);
        socket.on(event, handler);
        eventHandlersRef.current.set(event, handler);

        // Return cleanup function
        return () => {
            socket.off(event, handler);
            eventHandlersRef.current.delete(event);
        };
    }, [socket, role]);

    // --- Timer-Specific Methods ---
    const emitTimerAction = useCallback((
        action: 'start' | 'pause' | 'resume' | 'stop',
        questionId?: string,
        duration?: number
    ) => {
        const timerEvents = TIMER_EVENTS[role];
        const payload: Record<string, unknown> = {
            gameId,
            action
        };

        if (questionId) payload.questionId = questionId;
        if (duration) payload.duration = duration;

        emit(timerEvents.action, payload);
    }, [role, gameId, emit]);

    const onTimerUpdate = useCallback((handler: (timerState: Partial<TimerState>) => void) => {
        const timerEvents = TIMER_EVENTS[role];
        return on(timerEvents.update, (...args: unknown[]) => {
            // Type-safe casting: assume first argument is the timer state
            const timerState = args[0] as Partial<TimerState>;
            handler(timerState);
        });
    }, [role, on]);

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
        joinRoom,
        leaveRoom,
        emit,
        on,
        emitTimerAction,
        onTimerUpdate
    };
}

// --- Helper Functions ---

/**
 * Get the appropriate join event for each role
 */
function getJoinEvent(role: TimerRole): string {
    switch (role) {
        case 'teacher':
            return SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD;
        case 'student':
            return SOCKET_EVENTS.GAME.JOIN_GAME;
        case 'projection':
            return SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTOR;
        case 'tournament':
            return SOCKET_EVENTS.TOURNAMENT.JOIN_TOURNAMENT;
        default:
            return 'join_room';
    }
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
