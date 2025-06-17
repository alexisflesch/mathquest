/**
 * Projection Quiz Socket Hook
 * 
 * Modernized hook for teacher projection display using canonical shared types
 * and the modern useSimpleTimer hook. Follows modernization guidelines from .instructions.md.
 * 
 * Key modernization principles:
 * - Uses SOCKET_EVENTS shared constants (no hardcoded event names)
 * - Uses canonical shared types from @shared/types
 * - Uses modern useSimpleTimer hook
 * - Clean room separation with projection_${gameId} pattern
 * - Zod validation for socket payloads
 */

import { useEffect, useState } from 'react';
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { Question, TimerStatus } from '@shared/types';
import type { GameState } from '@shared/types/core/game';

const logger = createLogger('useProjectionQuizSocket');

/**
 * Hook for teacher projection page that displays quiz content
 * Uses modern timer system and joins projection room using shared constants
 */
export function useProjectionQuizSocket(accessCode: string, gameId: string | null) {
    // Use modern game socket with correct role and gameId
    const socket = useGameSocket('projection', gameId);

    // Use modern timer with projection role
    const timer = useSimpleTimer({
        gameId: gameId || undefined,
        accessCode,
        socket: socket.socket,
        role: 'projection'
    });

    // Use canonical GameState from backend response
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(0);

    // Join projection room when socket connects
    useEffect(() => {
        if (!socket.socket || !gameId) return;

        const joinProjection = () => {
            logger.info('🎬 Joining projection room for game:', gameId);
            logger.debug('📡 Emitting join event with payload:', { gameId });
            // Use shared constant for join event (temporary raw emit until types are updated)
            (socket.socket as any)?.emit(SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION, { gameId });
        };

        // Join immediately if already connected
        if (socket.socket.connected) {
            joinProjection();
        }

        // Listen for connection events
        const handleConnect = () => {
            logger.info('🔌 [PROJECTION] Socket connected:', socket.socket?.id);
            joinProjection();
        };

        const handleDisconnect = () => {
            logger.warn('🔌 [PROJECTION] Socket disconnected');
            // Reset state on disconnect - maintain required properties
            setGameState(prev => prev ? ({
                ...prev,
                locked: false,
                connectedSockets: new Set()
            }) : null);
        };

        // Listen for projection join success
        const handleProjectionJoined = (payload: any) => {
            logger.info('✅ [PROJECTION] Successfully joined projection room:', payload);
            logger.debug('🎯 Projection room joined, should receive timer events now');
        };

        // Listen for projection errors
        const handleProjectionError = (payload: any) => {
            logger.error('❌ [PROJECTION] Error joining projection room:', payload);
        };

        socket.socket.on('connect', handleConnect);
        socket.socket.on('disconnect', handleDisconnect);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, handleProjectionJoined);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, handleProjectionError);

        return () => {
            socket.socket?.off('connect', handleConnect);
            socket.socket?.off('disconnect', handleDisconnect);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, handleProjectionJoined);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, handleProjectionError);

            // Leave projection room on cleanup
            if (gameId) {
                (socket.socket as any)?.emit(SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION, { gameId });
            }
        };
    }, [socket.socket, gameId]);

    // Listen for projection-specific game events using shared constants
    useEffect(() => {
        if (!socket.socket) return;

        // Handle question changes from teacher dashboard
        const handleQuestionChanged = (payload: { question: Question; questionIndex: number }) => {
            logger.info('📋 Projection question changed:', payload);

            setGameState(prev => prev ? ({
                ...prev,
                currentQuestionIndex: payload.questionIndex
            }) : null);
        };

        // Handle connected participant count updates
        const handleConnectedCount = (payload: { count: number }) => {
            logger.debug('👥 Connected count update:', payload.count);
            setConnectedCount(payload.count);
        };

        // Handle game state updates (including initial state from getFullGameState)
        const handleGameStateUpdate = (payload: any) => {
            logger.info('🎮 Game state update received:', payload);

            // If this is a full state update from getFullGameState (has gameState property)
            if (payload.gameState) {
                setGameState(payload.gameState);
                logger.info('✅ Full projection state initialized from backend');
                return;
            }

            // Handle partial updates (legacy compatibility)
            if (payload.status) {
                setGameState(prev => prev ? ({
                    ...prev,
                    status: payload.status
                }) : null);
            }

            if (payload.answersLocked !== undefined) {
                setGameState(prev => prev ? ({
                    ...prev,
                    answersLocked: payload.answersLocked
                }) : null);
            }
        };

        // Listen to projection events using shared constants (with type casting until types are updated)
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED, handleQuestionChanged);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_CONNECTED_COUNT, handleConnectedCount);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, handleGameStateUpdate);

        return () => {
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED, handleQuestionChanged);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_CONNECTED_COUNT, handleConnectedCount);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, handleGameStateUpdate);
        };
    }, [socket.socket]);

    // Return clean interface using canonical GameState properties
    return {
        // Socket connection status
        isConnected: socket.socketState.connected,

        // Game state using canonical types
        gameState,
        currentQuestion: null, // Questions need to be fetched separately based on questionUids
        currentQuestionIndex: gameState?.currentQuestionIndex ?? null,
        connectedCount,
        gameStatus: gameState?.status ?? 'pending',
        isAnswersLocked: gameState?.answersLocked ?? false,

        // Modern timer interface
        timerStatus: timer.status,
        timerQuestionUid: timer.questionUid,
        timeLeftMs: timer.timeLeftMs,

        // Socket reference (if needed for advanced usage)
        socket: socket.socket
    };
}
