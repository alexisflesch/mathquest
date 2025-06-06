/**
 * Migration Wrapper for useTeacherQuizSocket
 * 
 * This file provides a backward-compatible interface for useTeacherQuizSocket
 * while using the new unified system internally and core types.
 * 
 * Phase 3: Frontend Type Consolidation - Migration Layer
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useTeacherGameManager } from '../useUnifiedGameManager';
import type { QuizState } from '../useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Import core types
import type { Question } from '@shared/types/core';
import type { QuestionData, ServerToClientEvents } from '@shared/types/socketEvents';

const logger = createLogger('useTeacherQuizSocketMigrated');

/**
 * Migrated Teacher Quiz Socket Hook
 * 
 * Maintains the exact same interface as the original useTeacherQuizSocket
 * but uses the unified system internally for timer and socket management.
 * 
 * @param accessCode - The access code for the quiz/game
 * @param token - Authentication token
 * @param quizId - The quiz/game ID (optional)
 * @returns The same interface as original useTeacherQuizSocket
 */
export function useTeacherQuizSocket(accessCode: string | null, token: string | null, quizId?: string | null) {
    // Use the unified game manager internally
    const gameManager = useTeacherGameManager(accessCode, token, {
        timerConfig: {
            autoStart: false,
            smoothCountdown: false,
            showMilliseconds: false,
            enableLocalAnimation: false
        }
    });

    // Legacy state that needs to be maintained for backward compatibility
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);

    // Map unified game state to legacy format
    useEffect(() => {
        const unifiedState = gameManager.gameState;

        // Transform unified state to legacy QuizState format
        if (unifiedState.gameId) {
            setQuizState(prev => ({
                currentQuestionIdx: unifiedState.currentQuestionIndex,
                questions: prev?.questions || [], // Keep existing questions array
                chrono: {
                    timeLeft: unifiedState.timer.timeLeft,
                    running: unifiedState.isTimerRunning
                },
                locked: false, // Will be updated by socket events
                ended: unifiedState.gameStatus === 'finished',
                stats: prev?.stats || {},
                profSocketId: gameManager.socket.instance?.id || null,
                timerStatus: unifiedState.timer.status,
                timerQuestionId: unifiedState.timer.questionId,
                timerTimeLeft: unifiedState.timer.timeLeft,
                timerTimestamp: unifiedState.timer.timestamp ?? undefined,
                questionStates: prev?.questionStates || {}
            }));
        }
    }, [gameManager.gameState, gameManager.socket.instance?.id]);

    // Sync local time left for animation purposes
    useEffect(() => {
        setLocalTimeLeft(gameManager.timer.getDisplayTime());
    }, [gameManager.timer]);

    // Set up additional legacy event handlers that aren't covered by unified system
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const cleanupFunctions: (() => void)[] = [];

        // Legacy quiz state handler
        if (gameManager.socket.instance) {
            const gameControlStateHandler = (state: any) => {
                logger.debug('Received legacy quiz_state', state);
                setQuizState(prev => ({
                    ...prev,
                    ...state,
                    chrono: {
                        timeLeft: state.chrono?.timeLeft ?? state.timerTimeLeft ?? 0,
                        running: state.chrono?.running ?? (state.timerStatus === 'play')
                    }
                }));
            };

            gameManager.socket.instance.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents, gameControlStateHandler);
            cleanupFunctions.push(() => {
                gameManager.socket.instance?.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents, gameControlStateHandler);
            });
        }

        // Legacy stats update handler
        if (gameManager.socket.instance) {
            const statsUpdateHandler = (stats: any) => {
                logger.debug('Received stats_update', stats);
                setQuizState(prev => prev ? { ...prev, stats } : prev);
            };

            gameManager.socket.instance.on('stats_update' as keyof ServerToClientEvents, statsUpdateHandler);
            cleanupFunctions.push(() => {
                gameManager.socket.instance?.off('stats_update' as keyof ServerToClientEvents, statsUpdateHandler);
            });
        }

        // Legacy locked state handler
        if (gameManager.socket.instance) {
            const answersLockedHandler = (...args: unknown[]) => {
                const data = args[0] as { locked: boolean };
                logger.debug('Received answers_locked', data);
                setQuizState(prev => prev ? { ...prev, locked: data.locked } : prev);
            };

            gameManager.socket.instance.on('answers_locked' as keyof ServerToClientEvents, answersLockedHandler);
            cleanupFunctions.push(() => {
                gameManager.socket.instance?.off('answers_locked' as keyof ServerToClientEvents, answersLockedHandler);
            });
        }

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [gameManager.socket.instance]);

    // Legacy emitter functions that wrap the unified system
    const emitSetQuestion = useCallback((questionUid: string, duration?: number) => {
        logger.info('Legacy emitSetQuestion called', { questionUid, duration });

        if (gameManager.actions.setQuestion) {
            gameManager.actions.setQuestion(questionUid, duration);
        }

        // Also emit timer action if duration is provided
        if (duration) {
            gameManager.socket.emitTimerAction('start', duration);
        }
    }, [gameManager.actions.setQuestion, gameManager.socket.emitTimerAction]);

    const emitEndQuiz = useCallback(() => {
        logger.info('Legacy emitEndQuiz called');

        if (gameManager.actions.endGame) {
            gameManager.actions.endGame();
        }
    }, [gameManager.actions.endGame]);

    const emitPauseQuiz = useCallback(() => {
        logger.info('Legacy emitPauseQuiz called');
        gameManager.timer.pause();
        gameManager.socket.emitTimerAction('pause');
    }, [gameManager.timer.pause, gameManager.socket.emitTimerAction]);

    const emitResumeQuiz = useCallback(() => {
        logger.info('Legacy emitResumeQuiz called');
        gameManager.timer.resume();
        gameManager.socket.emitTimerAction('resume');
    }, [gameManager.timer.resume, gameManager.socket.emitTimerAction]);

    const emitSetTimer = useCallback((newTime: number, questionUid?: string) => {
        logger.info('Legacy emitSetTimer called', { newTime, questionUid });
        gameManager.timer.setDuration(newTime);
        if (gameManager.socket.instance && quizId) {
            gameManager.socket.instance.emit('set_timer', { gameId: quizId, time: newTime, questionUid });
        }
    }, [gameManager.timer.setDuration, gameManager.socket.instance, quizId]);

    const emitTimerAction = useCallback((payload: { status: string; questionId?: string; timeLeft?: number }) => {
        logger.info('Legacy emitTimerAction called', payload);

        const { status, questionId, timeLeft } = payload;

        switch (status) {
            case 'play':
                if (questionId && timeLeft) {
                    gameManager.timer.start(questionId, timeLeft);
                } else {
                    gameManager.timer.resume();
                }
                gameManager.socket.emitTimerAction('start', timeLeft);
                break;
            case 'pause':
                gameManager.timer.pause();
                gameManager.socket.emitTimerAction('pause');
                break;
            case 'stop':
                gameManager.timer.stop();
                gameManager.socket.emitTimerAction('stop');
                break;
        }
    }, [gameManager.timer, gameManager.socket.emitTimerAction]);

    const emitUpdateTournamentCode = useCallback((tournamentCode: string) => {
        logger.info('Legacy emitUpdateTournamentCode called', { tournamentCode });
        if (gameManager.socket.instance && quizId) {
            gameManager.socket.instance.emit('update_tournament_code', {
                gameId: quizId,
                newCode: tournamentCode
            });
        }
    }, [gameManager.socket.instance, quizId]);

    // Return the same interface as the original hook
    return {
        // Socket instance (for compatibility)
        quizSocket: gameManager.socket.instance,

        // State
        quizState,
        timerStatus: gameManager.gameState.timer.status,
        timerQuestionId: gameManager.gameState.timer.questionId,
        timeLeft: gameManager.gameState.timer.timeLeft,
        localTimeLeft,
        connectedCount: gameManager.gameState.connectedCount,

        // Legacy setters for local time left (for animations)
        setLocalTimeLeft,

        // Action emitters (legacy interface)
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode
    };
}
