/**
 * Teacher Quiz Socket Hook
 * 
 * Provides teacher quiz management functionality using modern timer system
 * with useSimpleTimer instead of legacy UnifiedGameManager.
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Import core types
import type { Question, TimerStatus } from '@shared/types/core';
import type { QuestionData, ServerToClientEvents } from '@shared/types/socketEvents';
import type { ExtendedQuizState as QuizState } from '@shared/types/quiz/state';
import type { DashboardAnswerStatsUpdatePayload } from '@shared/types/socket/dashboardPayloads';

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
    // Use modern hooks instead of legacy UnifiedGameManager
    const socket = useGameSocket('teacher', quizId || null);

    // Timer logic removed - timer should be managed at the component level that needs it
    // This hook only handles quiz state and socket communications

    // State management
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(0);
    const [answerStats, setAnswerStats] = useState<Record<string, number>>({});

    // Timer state is now managed externally - this hook only handles quiz/socket state

    // Set up socket event handlers
    useEffect(() => {
        if (!socket.socket) return;

        const cleanupFunctions: (() => void)[] = [];

        // Game control state handler
        const gameControlStateHandler = (state: any) => {
            logger.debug('Received game_control_state', state);
            setQuizState(prev => ({
                ...prev,
                ...state,
                chrono: {
                    timeLeftMs: state.chrono?.timeLeft ?? state.timerTimeLeft ?? 0,
                    running: state.chrono?.running ?? (state.timerStatus === 'play'),
                    status: state.timerStatus || 'stop'
                }
            }));
        };

        socket.socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents, gameControlStateHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents, gameControlStateHandler);
        });

        // Stats update handler
        const statsUpdateHandler = (stats: any) => {
            logger.debug('Received stats_update', stats);
            setQuizState(prev => prev ? { ...prev, stats } : prev);
        };

        socket.socket.on('stats_update' as keyof ServerToClientEvents, statsUpdateHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off('stats_update' as keyof ServerToClientEvents, statsUpdateHandler);
        });

        // Answers locked handler
        const answersLockedHandler = (...args: unknown[]) => {
            const data = args[0] as { locked: boolean };
            logger.debug('Received answers_locked', data);
            setQuizState(prev => prev ? { ...prev, locked: data.locked } : prev);
        };

        socket.socket.on('answers_locked' as keyof ServerToClientEvents, answersLockedHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off('answers_locked' as keyof ServerToClientEvents, answersLockedHandler);
        });

        // Connected count updates
        const connectedCountHandler = (count: number) => {
            logger.debug('Received connected_count', count);
            setConnectedCount(count);
        };

        socket.socket.on('connected_count' as keyof ServerToClientEvents, connectedCountHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off('connected_count' as keyof ServerToClientEvents, connectedCountHandler);
        });

        // Answer stats updates
        const answerStatsHandler = (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.debug('Received dashboard_answer_stats_update', payload);
            setAnswerStats(payload.stats);
        };

        socket.socket.on('dashboard_answer_stats_update' as keyof ServerToClientEvents, answerStatsHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off('dashboard_answer_stats_update' as keyof ServerToClientEvents, answerStatsHandler);
        });

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [socket.socket]);

    // Action functions
    const emitSetQuestion = useCallback((questionUid: string, duration?: number) => {
        logger.info('emitSetQuestion called', { questionUid, duration });

        if (socket.socket && quizId) {
            socket.socket.emit('set_question', {
                gameId: quizId,
                questionUid
            });
        }
    }, [socket.socket, quizId]);

    const emitEndQuiz = useCallback(() => {
        logger.info('emitEndQuiz called');

        if (socket.socket && quizId && accessCode) {
            socket.socket.emit('end_game', {
                accessCode: accessCode,
                gameId: quizId
            });
        }
    }, [socket.socket, quizId]);

    const emitPauseQuiz = useCallback(() => {
        logger.info('emitPauseQuiz called');

        if (socket.socket && accessCode) {
            socket.socket.emit('quiz_timer_action', {
                accessCode: accessCode,
                action: 'pause',
                questionUid: undefined // Timer state managed externally
            });
        }
    }, [socket.socket, accessCode]);

    const emitResumeQuiz = useCallback(() => {
        logger.info('emitResumeQuiz called');

        if (socket.socket && accessCode) {
            socket.socket.emit('quiz_timer_action', {
                accessCode: accessCode,
                action: 'resume',
                questionUid: undefined // Timer state managed externally
            });
        }
    }, [socket.socket, accessCode]);

    const emitSetTimer = useCallback((newTime: number, questionUid?: string) => {
        logger.info('emitSetTimer called', { newTime, questionUid });

        if (socket.socket && quizId) {
            socket.socket.emit('set_timer', {
                gameId: quizId,
                time: newTime,
                questionUid
            });
        }
    }, [socket.socket, quizId]);

    const emitTimerAction = useCallback((payload: { status: string; questionUid?: string; timeLeftMs?: number }) => {
        logger.info('emitTimerAction called', payload);

        const { status, questionUid, timeLeftMs } = payload;

        if (socket.socket && accessCode) {
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
                accessCode: accessCode,
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

            socket.socket.emit('quiz_timer_action', socketPayload);
        }
    }, [socket.socket, accessCode]);

    const emitUpdateTournamentCode = useCallback((tournamentCode: string) => {
        logger.info('emitUpdateTournamentCode called', { tournamentCode });

        if (socket.socket && quizId) {
            socket.socket.emit('update_tournament_code', {
                gameId: quizId,
                newCode: tournamentCode
            });
        }
    }, [socket.socket, quizId]);

    // Return interface
    return {
        // Socket instance
        quizSocket: socket.socket,

        // State - timer state now managed externally
        quizState,
        timerStatus: 'stop' as TimerStatus, // Default value - actual timer state managed externally
        timerQuestionUid: null, // Default value - actual timer state managed externally
        timeLeftMs: 0, // Default value - actual timer state managed externally
        localTimeLeftMs: 0, // Default value - actual timer state managed externally
        connectedCount,
        answerStats,

        // Setters (deprecated - for backward compatibility only)
        setLocalTimeLeft: () => {
            logger.warn('setLocalTimeLeft is deprecated - timer state is managed externally');
        },

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