/**
 * Migration Wrapper for useProjectionQuizSocket
 * 
 * This file provides a backward-compatible interface for useProjectionQuizSocket
 * while using the new unified system internally and core types.
 * 
 * Phase 3: Frontend Type Consolidation - Migration Layer
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useProjectionGameManager } from '../useUnifiedGameManager';
import type { QuizState } from '../useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Import core types
import type { Question } from '@shared/types/core';
import type { QuestionData } from '@shared/types/socketEvents';

const logger = createLogger('useProjectionQuizSocketMigrated');

/**
 * Migrated Projection Quiz Socket Hook
 * 
 * Maintains the exact same interface as the original useProjectionQuizSocket
 * but uses the unified system internally for timer and socket management.
 * 
 * @param gameId - The game/quiz ID
 * @param tournamentCode - Optional tournament code for tournament mode
 * @returns The same interface as original useProjectionQuizSocket
 */
export function useProjectionQuizSocket(gameId: string | null, tournamentCode: string | null) {
    // Use the unified game manager internally
    const gameManager = useProjectionGameManager(gameId, {
        timerConfig: {
            autoStart: true,
            smoothCountdown: true,
            showMilliseconds: true,
            enableLocalAnimation: true
        }
    });

    // Legacy state that needs to be maintained for backward compatibility
    const [gameState, setGameState] = useState<QuizState | null>(null);
    const [localTimeLeftMs, setLocalTimeLeft] = useState<number | null>(null);

    // Map unified game state to legacy format
    useEffect(() => {
        const unifiedState = gameManager.gameState;

        if (unifiedState.gameId) {
            setGameState(prev => ({
                currentQuestionIdx: unifiedState.currentQuestionIndex,
                questions: prev?.questions || [],
                chrono: {
                    timeLeftMs: unifiedState.timer.timeLeftMs,
                    running: unifiedState.isTimerRunning
                },
                locked: false,
                ended: unifiedState.gameStatus === 'finished',
                stats: prev?.stats || {},
                profSocketId: null, // Not relevant for projection
                timerStatus: unifiedState.timer.status,
                timerQuestionId: unifiedState.timer.questionId,
                timerTimeLeft: unifiedState.timer.timeLeftMs,
                timerTimestamp: unifiedState.timer.timestamp ?? undefined,
                questionStates: prev?.questionStates || {}
            }));
        }
    }, [gameManager.gameState]);

    // Sync local time left for smooth animations
    useEffect(() => {
        setLocalTimeLeft(gameManager.timer.getDisplayTime());
    }, [gameManager.timer]);

    // Set up additional legacy event handlers specific to projection
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const cleanupFunctions: (() => void)[] = [];

        // Legacy projector state handler 
        if (gameManager.socket.instance) {
            const projectorStateHandler = (...args: unknown[]) => {
                const state = args[0] as any;
                logger.debug('Received projector_state for projection', state);
                setGameState(prev => ({
                    ...prev,
                    ...state,
                    chrono: {
                        timeLeftMs: state.chrono?.timeLeft ?? state.timerTimeLeft ?? 0,
                        running: state.chrono?.running ?? (state.timerStatus === 'play')
                    }
                }));
            };

            gameManager.socket.instance.on('projector_state', projectorStateHandler);
            cleanupFunctions.push(() => {
                gameManager.socket.instance?.off('projector_state', projectorStateHandler);
            });
        }

        // Stats updates using existing LEGACY_QUIZ events (removed, needs migration)
        // cleanupFunctions.push(
        //     gameManager.socket.on(SOCKET_EVENTS.LEGACY_QUIZ.STATE_UPDATE, (...args: unknown[]) => {
        //         const stats = args[0] as any;
        //         logger.debug('Received stats update for projection', stats);
        //         setGameState(prev => prev ? { ...prev, stats } : prev);
        //     })
        // );

        // Toggle stats visibility (removed, needs migration)
        // cleanupFunctions.push(
        //     gameManager.socket.on(SOCKET_EVENTS.LEGACY_QUIZ.TOGGLE_STATS, (...args: unknown[]) => {
        //         const data = args[0] as { showStats: boolean };
        //         logger.debug('Received toggle stats for projection', data);
        //         setGameState(prev => prev ? {
        //             ...prev,
        //             stats: { ...prev.stats, showStats: data.showStats }
        //         } : prev);
        //     })
        // );

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [gameManager.socket.instance]);

    // Legacy setLocalTimeLeft function for manual timer animations
    const setLocalTimeLeftLegacy = useCallback((time: number | null) => {
        setLocalTimeLeft(time);
    }, []);

    // Auto-request state on connection for projection
    useEffect(() => {
        if (gameManager.gameState.connected && gameManager.actions.getState) {
            logger.info('Projection connected, requesting state');
            gameManager.actions.getState();
        }
    }, [gameManager.gameState.connected, gameManager.actions.getState]);

    // Return the same interface as the original hook
    return {
        // Socket instance (for compatibility)
        gameSocket: gameManager.socket.instance,

        // State
        gameState,
        timerStatus: gameManager.gameState.timer.status,
        timerQuestionId: gameManager.gameState.timer.questionId,
        timeLeftMs: gameManager.gameState.timer.timeLeftMs,
        localTimeLeftMs,
        connectedCount: gameManager.gameState.connectedCount,

        // Legacy setter for local time left (used by animations)
        setLocalTimeLeft: setLocalTimeLeftLegacy
    };
}
