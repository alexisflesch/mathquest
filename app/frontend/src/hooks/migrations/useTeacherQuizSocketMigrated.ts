/**
 * Migration Wrapper for useTeacherQuizSocket
 * 
 * This file provides a backward-compatible interface for useTeacherQuizSocket
 * while using the new unified system internally and core types.
 * 
 * Phase 3: Frontend Type Consolidation - Migrat            // Add duration if provided
            if (timeLeftMs !== undefined) {
                socketPayload.durationMs = timeLeftMs;
            }Layer
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
    // Use the unified game manager internally - FIXED: Use quizId (actual game ID) not accessCode
    const gameManager = useTeacherGameManager(quizId || null, token, {
        timerConfig: {
            autoStart: false,
            smoothCountdown: false,
            showMilliseconds: false,
            enableLocalAnimation: false
        }
    });

    // Legacy state that needs to be maintained for backward compatibility
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [localTimeLeftMs, setLocalTimeLeft] = useState<number | null>(null);

    // Optimize state mapping to reduce excessive re-renders
    useEffect(() => {
        const unifiedState = gameManager.gameState;

        // Transform unified state to legacy QuizState format - only update if meaningful changes
        if (unifiedState.gameId) {
            setQuizState(prev => {
                const newState = {
                    currentQuestionIdx: unifiedState.currentQuestionIndex,
                    questions: prev?.questions || [], // Keep existing questions array
                    chrono: {
                        timeLeftMs: unifiedState.timer.timeLeftMs,
                        running: unifiedState.isTimerRunning
                    },
                    locked: prev?.locked ?? false, // Preserve lock state
                    ended: unifiedState.gameStatus === 'finished',
                    stats: prev?.stats || {},
                    profSocketId: gameManager.socket.instance?.id || null,
                    timerStatus: unifiedState.timer.status,
                    timerQuestionId: unifiedState.timer.questionId,
                    timerTimeLeft: unifiedState.timer.timeLeftMs,
                    timerTimestamp: unifiedState.timer.timestamp ?? undefined,
                    questionStates: prev?.questionStates || {}
                };

                // Only update if there are meaningful changes
                if (!prev ||
                    prev.currentQuestionIdx !== newState.currentQuestionIdx ||
                    prev.chrono.timeLeftMs !== newState.chrono.timeLeftMs ||
                    prev.chrono.running !== newState.chrono.running ||
                    prev.ended !== newState.ended ||
                    prev.timerStatus !== newState.timerStatus ||
                    prev.timerQuestionId !== newState.timerQuestionId ||
                    prev.profSocketId !== newState.profSocketId) {
                    return newState;
                }
                return prev;
            });
        }
    }, [gameManager.gameState.gameId, gameManager.gameState.currentQuestionIndex,
    gameManager.gameState.timer.timeLeftMs, gameManager.gameState.isTimerRunning,
    gameManager.gameState.gameStatus, gameManager.gameState.timer.status,
    gameManager.gameState.timer.questionId, gameManager.socket.instance?.id]);

    // Optimize local time sync to reduce re-renders
    useEffect(() => {
        const displayTime = gameManager.timer.getDisplayTime();
        if (displayTime !== localTimeLeftMs) {
            setLocalTimeLeft(displayTime);
        }
    }, [gameManager.timer.getDisplayTime, localTimeLeftMs]);

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
                        timeLeftMs: state.chrono?.timeLeft ?? state.timerTimeLeft ?? 0,
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

    const emitTimerAction = useCallback((payload: { status: string; questionId?: string; timeLeftMs?: number }) => {
        logger.info('Legacy emitTimerAction called', payload);

        const { status, questionId, timeLeftMs } = payload;

        // Update local timer state first
        switch (status) {
            case 'play':
                if (questionId && timeLeftMs) {
                    gameManager.timer.start(questionId, timeLeftMs);
                } else {
                    gameManager.timer.resume();
                }
                break;
            case 'pause':
                gameManager.timer.pause();
                break;
            case 'stop':
                gameManager.timer.stop();
                break;
        }

        // Now emit the timer action with the questionId if available
        if (gameManager.socket.instance && quizId) {
            // Simple mapping of status to backend action - no complex logic
            let backendAction: 'start' | 'pause' | 'resume' | 'stop';
            switch (status) {
                case 'play':
                    // Simple rule: if we have timeLeftMs, it's a start, otherwise resume
                    backendAction = (timeLeftMs !== undefined) ? 'start' : 'resume';
                    break;
                case 'pause':
                    backendAction = 'pause';
                    break;
                case 'stop':
                    backendAction = 'stop';
                    break;
                default:
                    backendAction = 'stop';
            }

            const socketPayload: any = {
                gameId: quizId,
                action: backendAction
            };

            // Add questionUid if provided
            if (questionId) {
                socketPayload.questionUid = questionId;
            }

            // Add duration if provided
            if (timeLeftMs !== undefined) {
                socketPayload.duration = timeLeftMs;
            }

            logger.debug('Migration layer emitting timer action', {
                action: backendAction,
                questionUid: questionId,
                duration: timeLeftMs
            });

            // Emit directly to socket with questionUid preserved
            gameManager.socket.instance.emit('quiz_timer_action', socketPayload);
        }
    }, [gameManager.timer, gameManager.socket.instance, quizId]);

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
        timeLeftMs: gameManager.gameState.timer.timeLeftMs,
        localTimeLeftMs,
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
