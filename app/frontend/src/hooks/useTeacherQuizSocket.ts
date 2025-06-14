/**
 * Teacher Quiz Socket Hook
 * 
 * Provides teacher quiz management functionality using the unified system
 * for timer and socket management with clean, production-ready code.
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useTeacherGameManager } from './useUnifiedGameManager';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Import core types
import type { Question } from '@shared/types/core';
import type { QuestionData, ServerToClientEvents } from '@shared/types/socketEvents';
import type { ExtendedQuizState as QuizState } from '@shared/types/quiz/state';

// Re-export QuizState for other files that import it from this hook
export type { ExtendedQuizState as QuizState } from '@shared/types/quiz/state';

const logger = createLogger('useTeacherQuizSocket');

/**
 * Teacher Quiz Socket Hook
 * 
 * Provides comprehensive teacher quiz management functionality including
 * timer control, question management, and real-time synchronization.
 * 
 * @param accessCode - The access code for the quiz/game
 * @param token - Authentication token
 * @param quizId - The quiz/game ID (optional)
 * @returns Complete teacher quiz interface
 */
export function useTeacherQuizSocket(accessCode: string | null, token: string | null, quizId?: string | null) {
    // Use the unified game manager internally
    const gameManager = useTeacherGameManager(quizId || null, token, {
        timerConfig: {
            autoStart: false,
            smoothCountdown: false,
            showMilliseconds: false,
            enableLocalAnimation: false
        }
    });

    // State management
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [localTimeLeftMs, setLocalTimeLeft] = useState<number | null>(null);

    // Sync unified state to QuizState format
    useEffect(() => {
        const unifiedState = gameManager.gameState;

        if (unifiedState.gameId) {
            setQuizState(prev => {
                const newState = {
                    currentQuestionidx: unifiedState.currentQuestionIndex,
                    currentQuestionUid: unifiedState.currentQuestionUid || null,
                    questions: prev?.questions || [],
                    chrono: {
                        timeLeftMs: unifiedState.timer.timeLeftMs,
                        running: unifiedState.isTimerRunning,
                        status: unifiedState.timer.status
                    },
                    locked: prev?.locked ?? false,
                    ended: unifiedState.gameStatus === 'completed',
                    stats: prev?.stats || {},
                    profSocketId: gameManager.socket.instance?.id || null,
                    timerStatus: unifiedState.timer.status,
                    timerQuestionUid: unifiedState.timer.questionUid,
                    timerTimeLeft: unifiedState.timer.timeLeftMs,
                    timerTimestamp: unifiedState.timer.timestamp ?? undefined,
                };

                // Only update if there are meaningful changes
                if (!prev ||
                    prev.currentQuestionidx !== newState.currentQuestionidx ||
                    prev.chrono.timeLeftMs !== newState.chrono.timeLeftMs ||
                    prev.chrono.running !== newState.chrono.running ||
                    prev.ended !== newState.ended ||
                    prev.timerStatus !== newState.timerStatus ||
                    prev.timerQuestionUid !== newState.timerQuestionUid ||
                    prev.profSocketId !== newState.profSocketId) {
                    return newState;
                }
                return prev;
            });
        }
    }, [gameManager.gameState.gameId, gameManager.gameState.currentQuestionIndex,
    gameManager.gameState.timer.timeLeftMs, gameManager.gameState.isTimerRunning,
    gameManager.gameState.gameStatus, gameManager.gameState.timer.status,
    gameManager.gameState.timer.questionUid, gameManager.socket.instance?.id]);

    // Sync local timer display
    useEffect(() => {
        const displayTime = gameManager.timer.getDisplayTime();
        if (displayTime !== localTimeLeftMs) {
            setLocalTimeLeft(displayTime);
        }
    }, [gameManager.timer.getDisplayTime, localTimeLeftMs]);

    // Set up additional event handlers
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const cleanupFunctions: (() => void)[] = [];

        // Game control state handler
        if (gameManager.socket.instance) {
            const gameControlStateHandler = (state: any) => {
                logger.debug('Received game_control_state', state);
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

        // Stats update handler
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

        // Answers locked handler
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

        // Dashboard timer updated handler (for timer debug and canonical timer sync)
        if (gameManager.socket.instance) {
            const dashboardTimerHandler = (payload: any) => {
                logger.debug('Received dashboard_timer_updated', payload);
                if (payload && payload.timer && typeof payload.timer.timeLeftMs === 'number') {
                    // Canonical: update the actual timer state in the game manager
                    if (typeof gameManager.timer.setDuration === 'function') {
                        gameManager.timer.setDuration(payload.timer.timeLeftMs);
                    }
                }
            };
            gameManager.socket.instance.on('dashboard_timer_updated' as keyof ServerToClientEvents, dashboardTimerHandler);
            cleanupFunctions.push(() => {
                gameManager.socket.instance?.off('dashboard_timer_updated' as keyof ServerToClientEvents, dashboardTimerHandler);
            });
        }

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [gameManager.socket.instance]);

    // Action functions
    const emitSetQuestion = useCallback((questionUid: string, duration?: number) => {
        logger.info('emitSetQuestion called', { questionUid, duration });

        if (gameManager.actions.setQuestion) {
            gameManager.actions.setQuestion(questionUid, duration);
        }

        if (duration) {
            gameManager.socket.emitTimerAction('start', duration);
        }
    }, [gameManager.actions.setQuestion, gameManager.socket.emitTimerAction]);

    const emitEndQuiz = useCallback(() => {
        logger.info('emitEndQuiz called');

        if (gameManager.actions.endGame) {
            gameManager.actions.endGame();
        }
    }, [gameManager.actions.endGame]);

    const emitPauseQuiz = useCallback(() => {
        logger.info('emitPauseQuiz called');
        gameManager.timer.pause();
        gameManager.socket.emitTimerAction('pause');
    }, [gameManager.timer.pause, gameManager.socket.emitTimerAction]);

    const emitResumeQuiz = useCallback(() => {
        logger.info('emitResumeQuiz called');
        gameManager.timer.resume();
        gameManager.socket.emitTimerAction('resume');
    }, [gameManager.timer.resume, gameManager.socket.emitTimerAction]);

    const emitSetTimer = useCallback((newTime: number, questionUid?: string) => {
        logger.info('emitSetTimer called', { newTime, questionUid });
        gameManager.timer.setDuration(newTime);
        if (gameManager.socket.instance && quizId) {
            gameManager.socket.instance.emit('set_timer', { gameId: quizId, time: newTime, questionUid });
        }
    }, [gameManager.timer.setDuration, gameManager.socket.instance, quizId]);

    const emitTimerAction = useCallback((payload: { status: string; questionUid?: string; timeLeftMs?: number }) => {
        logger.info('emitTimerAction called', payload);

        const { status, questionUid, timeLeftMs } = payload;

        // Update local timer state
        switch (status) {
            case 'play':
                if (questionUid && timeLeftMs) {
                    gameManager.timer.start(questionUid, timeLeftMs);
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

        // Emit socket event
        if (gameManager.socket.instance && quizId) {
            let backendAction: 'start' | 'pause' | 'resume' | 'stop';
            switch (status) {
                case 'play':
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

            if (questionUid) {
                socketPayload.questionUid = questionUid;
            }

            if (timeLeftMs !== undefined) {
                socketPayload.duration = timeLeftMs;
            }

            logger.debug('Emitting timer action', {
                action: backendAction,
                questionUid: questionUid,
                duration: timeLeftMs
            });

            gameManager.socket.instance.emit('quiz_timer_action', socketPayload);
        }
    }, [gameManager.timer, gameManager.socket.instance, quizId]);

    const emitUpdateTournamentCode = useCallback((tournamentCode: string) => {
        logger.info('emitUpdateTournamentCode called', { tournamentCode });
        if (gameManager.socket.instance && quizId) {
            gameManager.socket.instance.emit('update_tournament_code', {
                gameId: quizId,
                newCode: tournamentCode
            });
        }
    }, [gameManager.socket.instance, quizId]);

    // Return interface
    return {
        // Socket instance
        quizSocket: gameManager.socket.instance,

        // State
        quizState,
        timerStatus: gameManager.gameState.timer.status,
        timerQuestionUid: gameManager.gameState.timer.questionUid,
        timeLeftMs: gameManager.gameState.timer.timeLeftMs,
        localTimeLeftMs,
        connectedCount: gameManager.gameState.connectedCount,

        // Setters
        setLocalTimeLeft,

        // Actions
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode
    };
}