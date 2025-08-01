/**
 * Tournament Socket Hook
 * 
 * Provides tournament functionality using modern timer system
 * with useSimpleTimer and useGameSocket instead of legacy UnifiedGameManager.
 */

import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export interface TournamentSocketConfig {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
}

export function useTournamentSocket(config: TournamentSocketConfig) {
    const { accessCode, userId, username, avatarEmoji } = config;

    // Use modern hooks instead of legacy UnifiedGameManager
    const socket = useGameSocket('student', null, {
        requireAuth: true
    });

    const timer = useSimpleTimer({
        accessCode: accessCode,
        socket: socket.socket,
        role: 'student'
    });
    // Canonical: get timer state for current question (from socket/game state if available)
    // For demo, assume timerQuestionUid is provided externally or from game state
    // Here, just use the first available timer state if any
    const timerStates = timer.timerStates;
    const firstTimerState = Object.values(timerStates)[0];

    // Return modern interface that matches expected tournament behavior
    return {
        // Socket state
        socket: socket.socket,
        socketState: socket.socketState,

        // Timer state (canonical per-question)
        timerStatus: firstTimerState?.status,
        timerQuestionUid: firstTimerState?.questionUid,
        timeLeftMs: firstTimerState?.timeLeftMs,

        // User info for backward compatibility
        userId,
        username,
        avatarEmoji,

        // Connection management
        connect: socket.connect,
        disconnect: socket.disconnect,
        reconnect: socket.reconnect
    };
}
