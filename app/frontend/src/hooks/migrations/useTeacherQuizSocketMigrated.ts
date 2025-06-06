/**
 * Migration Wrapper for useTeacherQuizSocket
 * 
 * This file provides a backward-compatible interface for useTeacherQuizSocket
 * while using the new unified system internally. This allows for gradual
 * migration without breaking existing components.
 * 
 * Phase 2: Timer Management Consolidation - Migration Layer
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useTeacherGameManager } from '../useUnifiedGameManager';
import type { Question, QuizState } from '../useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('useTeacherQuizSocketMigrated');

/**
 * Migrated Teacher Quiz Socket Hook
 * 
 * Maintains the exact same interface as the original useTeacherQuizSocket
 * but uses the unified system internally for timer and socket management.
 * 
 * @param quizId - The quiz/game ID
 * @param token - Authentication token
 * @returns The same interface as original useTeacherQuizSocket
 */
export function useTeacherQuizSocket(quizId: string | null, token: string | null) {
    // Use the unified game manager internally
    const gameManager = useTeacherGameManager(quizId, token, {
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
        cleanupFunctions.push(
            gameManager.socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, (state: any) => {
                logger.debug('Received legacy quiz_state', state);
                setQuizState(prev => ({
                    ...prev,
                    ...state,
                    chrono: {
                        timeLeft: state.chrono?.timeLeft ?? state.timerTimeLeft ?? 0,
                        running: state.chrono?.running ?? (state.timerStatus === 'play')
                    }
                }));
            })
        );

        // Legacy stats update handler
        cleanupFunctions.push(
            gameManager.socket.on('stats_update', (stats: any) => {
                setQuizState(prev => prev ? { ...prev, stats } : prev);
            })
        );

        // Legacy locked state handler
        cleanupFunctions.push(
            gameManager.socket.on('answers_locked', (...args: unknown[]) => {
                const data = args[0] as { locked: boolean };
                setQuizState(prev => prev ? { ...prev, locked: data.locked } : prev);
            })
        );

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
            gameManager.socket.emitTimerAction('start', questionUid, duration);
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
        gameManager.socket.emit('set_timer', { gameId: quizId, time: newTime, questionUid });
    }, [gameManager.timer.setDuration, gameManager.socket.emit, quizId]);

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
                gameManager.socket.emitTimerAction('start', questionId, timeLeft);
                break;
            case 'pause':
                gameManager.timer.pause();
                gameManager.socket.emitTimerAction('pause', questionId);
                break;
            case 'stop':
                gameManager.timer.stop();
                gameManager.socket.emitTimerAction('stop', questionId);
                break;
        }
    }, [gameManager.timer, gameManager.socket.emitTimerAction]);

    const emitUpdateTournamentCode = useCallback((tournamentCode: string) => {
        logger.info('Legacy emitUpdateTournamentCode called', { tournamentCode });
        gameManager.socket.emit('update_tournament_code', {
            gameId: quizId,
            tournamentCode
        });
    }, [gameManager.socket.emit, quizId]);

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
