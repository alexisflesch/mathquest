/**
 * Projection Quiz Socket Hook
 * 
 * Provides projection display functionality using the unified system
 * for timer and socket management with clean, production-ready code.
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useProjectionGameManager } from './useUnifiedGameManager';
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
    // Use the unified game manager internally
    const gameManager = useProjectionGameManager(gameId, {
        timerConfig: {
            autoStart: true,
            smoothCountdown: true,
            showMilliseconds: true,
            enableLocalAnimation: true
        }
    });

    // State management
    const [gameState, setGameState] = useState<QuizState | null>(null);
    const [localTimeLeftMs, setLocalTimeLeft] = useState<number | null>(null);

    // Map unified game state to projection format
    useEffect(() => {
        const unifiedState = gameManager.gameState;

        if (unifiedState.gameId) {
            setGameState((prev: QuizState | null) => ({
                currentQuestionidx: unifiedState.currentQuestionIndex,
                currentQuestionUid: unifiedState.currentQuestionUid || null,
                questions: prev?.questions || [],
                chrono: {
                    timeLeftMs: unifiedState.timer.timeLeftMs,
                    running: unifiedState.isTimerRunning,
                    status: unifiedState.timer.status
                },
                locked: false,
                ended: unifiedState.gameStatus === 'finished',
                stats: prev?.stats || {},
                profSocketId: null,
                timerStatus: unifiedState.timer.status,
                timerQuestionUid: unifiedState.timer.questionUid,
                timerTimeLeft: unifiedState.timer.timeLeftMs,
                timerTimestamp: unifiedState.timer.timestamp ?? undefined,
            }));
        }
    }, [gameManager.gameState]);

    // Sync local time left for smooth animations
    useEffect(() => {
        setLocalTimeLeft(gameManager.timer.getDisplayTime());
    }, [gameManager.timer]);

    // Set up projection-specific event handlers
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const cleanupFunctions: (() => void)[] = [];

        // Projector state handler
        if (gameManager.socket.instance) {
            const projectorStateHandler = (...args: unknown[]) => {
                const state = args[0] as any;
                logger.debug('Received projector_state', state);
                setGameState((prev: QuizState | null) => ({
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

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [gameManager.socket.instance]);

    // Timer setter for manual animations
    const setLocalTimeLeftCallback = useCallback((time: number | null) => {
        setLocalTimeLeft(time);
    }, []);

    // Auto-request state on connection
    useEffect(() => {
        if (gameManager.gameState.connected && gameManager.actions.getState) {
            logger.info('Projection connected, requesting state');
            gameManager.actions.getState();
        }
    }, [gameManager.gameState.connected, gameManager.actions.getState]);

    // Return interface
    return {
        // Socket instance
        gameSocket: gameManager.socket.instance,

        // State
        gameState,
        timerStatus: gameManager.gameState.timer.status,
        timerQuestionUid: gameManager.gameState.timer.questionUid,
        timeLeftMs: gameManager.gameState.timer.timeLeftMs,
        localTimeLeftMs,
        connectedCount: gameManager.gameState.connectedCount,

        // Timer setter for animations
        setLocalTimeLeft: setLocalTimeLeftCallback
    };
}
