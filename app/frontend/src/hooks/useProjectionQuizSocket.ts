/**
 * Projection Quiz Socket Hook
 * 
 * Provides projection display functionality using the modern timer system
 * with useSimpleTimer and useGameSocket instead of legacy UnifiedGameManager.
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import type { QuizState } from './useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Import core types
import type { Question } from '@shared/types/core';
import type { QuestionData } from '@shared/types/socketEvents';

const logger = createLogger('useProjectionQuizSocket');

/**
 * Projection Quiz Socket Hook
 * 
 * Provides projection display functionality with timer animations
 * and real-time synchronization for quiz projection screens.
 * 
 * @param gameId - The game/quiz ID
 * @param tournamentCode - Optional tournament code for tournament mode
 * @returns Complete projection interface
 */
export function useProjectionQuizSocket(gameId: string | null, tournamentCode: string | null) {
    // Use modern hooks instead of legacy UnifiedGameManager
    const socket = useGameSocket('projection', gameId || null);

    const timer = useSimpleTimer({
        gameId: gameId || undefined,
        accessCode: tournamentCode || '',
        socket: socket.socket,
        role: 'projection'
    });

    // State management
    const [gameState, setGameState] = useState<QuizState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(0);

    // Update game state based on timer state changes
    useEffect(() => {
        if (timer.questionUid || timer.timeLeftMs !== null) {
            setGameState(prev => {
                if (!prev) {
                    // Initialize basic state for projections
                    return {
                        currentQuestionidx: 0,
                        currentQuestionUid: timer.questionUid,
                        questions: [],
                        chrono: {
                            timeLeftMs: timer.timeLeftMs || 0,
                            running: timer.status === 'play',
                            status: timer.status
                        },
                        locked: false,
                        ended: false,
                        stats: {},
                        profSocketId: null,
                        timerStatus: timer.status,
                        timerQuestionUid: timer.questionUid,
                        timerTimeLeft: timer.timeLeftMs || 0
                    };
                }

                const newState = {
                    ...prev,
                    currentQuestionUid: timer.questionUid,
                    chrono: {
                        timeLeftMs: timer.timeLeftMs || 0,
                        running: timer.status === 'play',
                        status: timer.status
                    },
                    timerStatus: timer.status,
                    timerQuestionUid: timer.questionUid,
                    timerTimeLeft: timer.timeLeftMs || 0
                };

                // Only update if there are meaningful changes
                if (prev.chrono.timeLeftMs !== newState.chrono.timeLeftMs ||
                    prev.chrono.running !== newState.chrono.running ||
                    prev.timerStatus !== newState.timerStatus ||
                    prev.timerQuestionUid !== newState.timerQuestionUid) {
                    return newState;
                }
                return prev;
            });
        }
    }, [timer.timeLeftMs, timer.status, timer.questionUid]);

    // Set up projection-specific event handlers
    useEffect(() => {
        if (!socket.socket) return;

        const cleanupFunctions: (() => void)[] = [];

        // Projector state handler for additional projection data
        const projectorStateHandler = (...args: unknown[]) => {
            const state = args[0] as any;
            logger.debug('Received projector_state', state);
            setGameState((prev: QuizState | null) => ({
                ...prev,
                ...state,
                chrono: {
                    timeLeftMs: state.chrono?.timeLeft ?? state.timerTimeLeft ?? 0,
                    running: state.chrono?.running ?? (state.timerStatus === 'play'),
                    status: state.timerStatus || 'stop'
                }
            }));
        };

        (socket.socket as any).on('projector_state', projectorStateHandler);
        cleanupFunctions.push(() => {
            (socket.socket as any)?.off('projector_state', projectorStateHandler);
        });

        // Connected count updates (use any type for now until proper event is defined)
        const connectedCountHandler = (count: number) => {
            logger.debug('Received connected_count', count);
            setConnectedCount(count);
        };

        (socket.socket as any).on('connected_count', connectedCountHandler);
        cleanupFunctions.push(() => {
            (socket.socket as any)?.off('connected_count', connectedCountHandler);
        });

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [socket.socket]);

    // Auto-request state on connection for projections
    useEffect(() => {
        if (socket.socketState.connected && socket.socket && gameId) {
            logger.info('Projection connected, requesting state');
            (socket.socket as any).emit('get_state', { gameId });
        }
    }, [socket.socketState.connected, socket.socket, gameId]);

    // Return interface
    return {
        // Socket instance
        gameSocket: socket.socket,

        // State - use modern timer values
        gameState,
        timerStatus: timer.status,
        timerQuestionUid: timer.questionUid,
        timeLeftMs: timer.timeLeftMs,
        localTimeLeftMs: timer.timeLeftMs, // Use timer's smooth countdown directly
        connectedCount,

        // Timer setter for backward compatibility (deprecated)
        setLocalTimeLeft: (time: number | null) => {
            logger.warn('setLocalTimeLeft is deprecated for projections - timer state is managed by useSimpleTimer');
        }
    };
}
