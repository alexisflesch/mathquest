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
import {
    setQuestionPayloadSchema,
    endGamePayloadSchema,
    timerActionPayloadSchema
} from '@shared/types/socketEvents.zod';
import {
    setTimerPayloadSchema,
    updateTournamentCodePayloadSchema
} from '@shared/types/socket/payloads.zod';
import { z } from 'zod';

// Derive types from Zod schemas
type SetQuestionPayload = z.infer<typeof setQuestionPayloadSchema>;
type EndGamePayload = z.infer<typeof endGamePayloadSchema>;

// Import core types
import type { TimerStatus, TimerActionPayload } from '@shared/types/core/timer';
import type { SetTimerPayload, UpdateTournamentCodePayload } from '@shared/types/socket/payloads';
import type { QuestionData, ServerToClientEvents } from '@shared/types/socketEvents';
import type { ExtendedQuizState as QuizState } from '@shared/types/quiz/state';
import type { DashboardAnswerStatsUpdatePayload } from '@shared/types/socket/dashboardPayloads';

// Re-export QuizState for other files that import it from this hook
export type { ExtendedQuizState as QuizState } from '@shared/types/quiz/state';

// Answer stats can be legacy format or new format with type discrimination
type AnswerStats = Record<string, number> | {
    type: 'multipleChoice';
    stats: Record<string, number>;
    totalUsers: number;
} | {
    type: 'numeric';
    values: number[];
    totalAnswers: number;
};

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
    const [answerStats, setAnswerStats] = useState<AnswerStats>({});

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

        socket.socket.on(SOCKET_EVENTS.TEACHER.STATS_UPDATE as any, statsUpdateHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off(SOCKET_EVENTS.TEACHER.STATS_UPDATE as any, statsUpdateHandler);
        });

        // Answers locked handler
        const answersLockedHandler = (...args: unknown[]) => {
            const data = args[0] as { locked: boolean };
            logger.debug('Received answers_locked', data);
            setQuizState(prev => prev ? { ...prev, locked: data.locked } : prev);
        };

        socket.socket.on(SOCKET_EVENTS.TEACHER.ANSWERS_LOCKED as any, answersLockedHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off(SOCKET_EVENTS.TEACHER.ANSWERS_LOCKED as any, answersLockedHandler);
        });

        // Connected count updates
        const connectedCountHandler = (count: number) => {
            logger.debug('Received connected_count', count);
            setConnectedCount(count);
        };

        socket.socket.on(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT as any, connectedCountHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT as any, connectedCountHandler);
        });

        // Answer stats updates
        const answerStatsHandler = (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.debug('Received dashboard_answer_stats_update', payload);
            setAnswerStats(payload.stats);
        };

        socket.socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE as any, answerStatsHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE as any, answerStatsHandler);
        });

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [socket.socket]);

    // Action functions
    const emitSetQuestion = useCallback((questionUid: string, duration?: number) => {
        logger.info('emitSetQuestion called', { questionUid, duration });

        if (socket.socket && quizId) {
            const payload: SetQuestionPayload = {
                accessCode: accessCode || '',
                questionUid,
                questionIndex: undefined // Optional field
            };

            // Validate payload before emitting
            try {
                const validatedPayload = setQuestionPayloadSchema.parse(payload);
                // TODO: Use SOCKET_EVENTS.TEACHER.SET_QUESTION when TypeScript types allow constants
                socket.socket.emit('set_question', validatedPayload);
            } catch (error) {
                logger.error('Invalid set_question payload:', error);
            }
        }
    }, [socket.socket, quizId, accessCode]);

    const emitEndQuiz = useCallback(() => {
        logger.info('emitEndQuiz called');

        if (socket.socket && quizId && accessCode) {
            // Validate payload with Zod schema
            const payload: EndGamePayload = { accessCode };

            try {
                const validatedPayload = endGamePayloadSchema.parse(payload);
                socket.socket.emit('end_game', validatedPayload);
            } catch (error) {
                logger.error('Invalid end_game payload:', error);
            }
        }
    }, [socket.socket, quizId, accessCode]);

    const emitPauseQuiz = useCallback((questionUid: string) => {
        logger.info('emitPauseQuiz called');

        if (socket.socket && accessCode) {
            const payload: TimerActionPayload = {
                accessCode: accessCode,
                action: 'pause',
                questionUid: questionUid
            };
            socket.socket.emit('quiz_timer_action', payload);
        }
    }, [socket.socket, accessCode]);

    const emitResumeQuiz = useCallback((questionUid: string) => {
        logger.info('emitResumeQuiz called');

        if (socket.socket && accessCode) {
            const payload: TimerActionPayload = {
                accessCode: accessCode,
                action: 'run',
                questionUid: questionUid
            };
            socket.socket.emit('quiz_timer_action', payload);
        }
    }, [socket.socket, accessCode]);

    const emitSetTimer = useCallback((newTime: number, questionUid: string) => {
        logger.info('emitSetTimer called', { newTime, questionUid });

        if (socket.socket && quizId) {
            const payload: SetTimerPayload = {
                gameId: quizId,
                time: newTime,
                questionUid // now required
            };

            try {
                setTimerPayloadSchema.parse(payload);
                socket.socket.emit('set_timer', payload);
            } catch (error) {
                logger.error('Invalid set_timer payload:', error);
            }
        }
    }, [socket.socket, quizId]);

    // Canonical timer action emitter: only 'run', 'pause', 'stop' allowed
    const emitTimerAction = useCallback((payload: { action: 'run' | 'pause' | 'stop'; questionUid: string; durationMs?: number }) => {
        logger.info('emitTimerAction called', payload);

        const { action, questionUid, durationMs } = payload;

        if (socket.socket && accessCode) {
            const socketPayload: TimerActionPayload = {
                accessCode: accessCode,
                action,
                questionUid,
                ...(durationMs !== undefined ? { durationMs } : {})
            };
            socket.socket.emit('quiz_timer_action', socketPayload);
        }
    }, [socket.socket, accessCode]);

    const emitUpdateTournamentCode = useCallback((tournamentCode: string) => {
        logger.info('emitUpdateTournamentCode called', { tournamentCode });

        if (socket.socket && quizId) {
            const payload: UpdateTournamentCodePayload = {
                gameId: quizId,
                newCode: tournamentCode
            };

            try {
                updateTournamentCodePayloadSchema.parse(payload);
                socket.socket.emit('update_tournament_code', payload);
            } catch (error) {
                logger.error('Invalid update_tournament_code payload:', error);
            }
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