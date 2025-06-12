/**
 * Migration Wrapper for useTournamentSocket
 * 
 * This file provides a backward-compatible interface for useTournamentSocket
 * while using the new unified system internally and core types.
 * 
 * Phase 3: Frontend Type Consolidation - Migration Layer
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/clientLogger';
import { useTournamentGameManager } from '../useUnifiedGameManager';
import type { AnswerValue } from '@/types/socket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { ServerToClientEvents } from '@shared/types/socketEvents';

// Import core types
import type { Question, AnswerResponsePayload } from '@shared/types/core';
import type { TournamentQuestion } from '@shared/types';

const logger = createLogger('useTournamentSocketMigrated');

// Legacy interface for backward compatibility - now uses the canonical shared TournamentQuestion type
// export type TournamentQuestion = QuestionData; // REMOVED: Using canonical TournamentQuestion from shared types

// Tournament answer feedback interface using core types
export interface TournamentAnswerReceived extends AnswerResponsePayload {
    points: number;
    totalPoints: number;
    rank?: number;
}

export interface TournamentGameState {
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
    currentQuestion: TournamentQuestion | null;
    timer: { timeLeftMs?: number; isRunning: boolean } | null;
    feedback: any | null;
    waiting: boolean;
    answered: boolean;
    score: number;
    rank: number | null;
}

export interface TournamentSocketHookProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    isDiffered?: boolean;
}

export interface TournamentSocketHook {
    // State
    gameState: TournamentGameState;
    loading: boolean;
    error: string | null;

    // Actions
    joinTournament: () => void;
    submitAnswer: (questionId: string, answer: AnswerValue, timeSpent: number) => void;

    // Connection state
    connected: boolean;
    connecting: boolean;
}

/**
 * Migrated Tournament Socket Hook
 * 
 * Maintains the exact same interface as the original useTournamentSocket
 * but uses the unified system internally for timer and socket management.
 * 
 * @param props - Configuration object with access code, user info, etc.
 * @returns The same interface as original useTournamentSocket
 */
export function useTournamentSocket(props: TournamentSocketHookProps): TournamentSocketHook {
    const { accessCode, userId, username, avatarEmoji, isDiffered = false } = props;

    // Use the unified game manager internally
    const gameManager = useTournamentGameManager(accessCode, userId, username, avatarEmoji, {
        timerConfig: {
            autoStart: true,
            smoothCountdown: true,
            showMilliseconds: false,
            enableLocalAnimation: true
        }
    });

    // Legacy state that needs to be maintained for backward compatibility
    const [currentQuestion, setCurrentQuestion] = useState<TournamentQuestion | null>(null);
    const [feedback, setFeedback] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [rank, setRank] = useState<number | null>(null);

    // Map unified game state to legacy format
    const legacyGameState: TournamentGameState = {
        gameStatus: gameManager.gameState.gameStatus,
        currentQuestion,
        timer: gameManager.gameState.isTimerRunning ? {
            timeLeftMs: gameManager.timer.getDisplayTime(),
            isRunning: gameManager.gameState.isTimerRunning
        } : null,
        feedback,
        waiting: gameManager.gameState.gameStatus === 'waiting',
        answered: gameManager.gameState.answered,
        score,
        rank
    };

    // Set up additional legacy event handlers specific to tournaments
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const cleanupFunctions: (() => void)[] = [];

        // Tournament question received
        const handleTournamentQuestion = (payload: any) => {
            logger.debug('Tournament received tournament_question', payload);
            // If payload.question is already in canonical format, use as is
            setCurrentQuestion(payload.question as TournamentQuestion);
            setFeedback(null); // Clear previous feedback
            setLoading(false);
        };
        gameManager.socket.instance.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_QUESTION as keyof ServerToClientEvents, handleTournamentQuestion);
        cleanupFunctions.push(() => gameManager.socket.instance?.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_QUESTION as keyof ServerToClientEvents, handleTournamentQuestion));

        // Tournament answer result
        const handleTournamentAnswerResult = (...args: unknown[]) => {
            const result = args[0] as TournamentAnswerReceived;
            logger.debug('Tournament received answer result', result);
            setScore(result.totalPoints);
            setRank(result.rank || null);
            setFeedback({
                correct: result.correct,
                explanation: result.explanation
                // Note: points property removed as not part of AnswerFeedback interface
            });
        };
        gameManager.socket.instance.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_ANSWER_RESULT as keyof ServerToClientEvents, handleTournamentAnswerResult);
        cleanupFunctions.push(() => gameManager.socket.instance?.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_ANSWER_RESULT as keyof ServerToClientEvents, handleTournamentAnswerResult));

        // Tournament joined confirmation
        const handleTournamentJoined = (data: any) => {
            logger.debug('Tournament joined', data);
            setLoading(false);
        };
        gameManager.socket.instance.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_JOINED as keyof ServerToClientEvents, handleTournamentJoined);
        cleanupFunctions.push(() => gameManager.socket.instance?.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_JOINED as keyof ServerToClientEvents, handleTournamentJoined));

        // Tournament state updates
        const handleTournamentStateUpdate = (state: any) => {
            logger.debug('Tournament state update', state);
            if (state.score !== undefined) setScore(state.score);
            if (state.rank !== undefined) setRank(state.rank);
        };
        gameManager.socket.instance.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STATE_UPDATE as keyof ServerToClientEvents, handleTournamentStateUpdate);
        cleanupFunctions.push(() => gameManager.socket.instance?.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STATE_UPDATE as keyof ServerToClientEvents, handleTournamentStateUpdate));

        // Tournament errors
        const handleGameError = (error: any) => {
            logger.error('Tournament error', error);
            setLoading(false);
        };
        gameManager.socket.instance.on(SOCKET_EVENTS.GAME.GAME_ERROR as keyof ServerToClientEvents, handleGameError);
        cleanupFunctions.push(() => gameManager.socket.instance?.off(SOCKET_EVENTS.GAME.GAME_ERROR as keyof ServerToClientEvents, handleGameError));

        // Tournament ended
        const handleGameEnded = (results: any) => {
            logger.debug('Tournament ended', results);
            setLoading(false);
            if (results.finalScore !== undefined) setScore(results.finalScore);
            if (results.finalRank !== undefined) setRank(results.finalRank);
        };
        gameManager.socket.instance.on(SOCKET_EVENTS.GAME.GAME_ENDED as keyof ServerToClientEvents, handleGameEnded);
        cleanupFunctions.push(() => gameManager.socket.instance?.off(SOCKET_EVENTS.GAME.GAME_ENDED as keyof ServerToClientEvents, handleGameEnded));

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [gameManager.socket.instance]);

    // Legacy action functions
    const joinTournament = useCallback(() => {
        logger.info('Legacy joinTournament called');
        setLoading(true);

        if (gameManager.actions.joinTournament) {
            gameManager.actions.joinTournament();
        }
    }, [gameManager.actions.joinTournament]);

    const submitAnswer = useCallback((questionId: string, answer: AnswerValue, timeSpent: number) => {
        logger.info('Legacy tournament submitAnswer called', { questionId, answer, timeSpent });

        if (gameManager.actions.submitAnswer) {
            gameManager.actions.submitAnswer(questionId, answer, timeSpent);
        }
    }, [gameManager.actions.submitAnswer]);

    // Auto-join tournament when connection is established
    useEffect(() => {
        if (gameManager.gameState.connected && accessCode && userId && username && !isDiffered) {
            joinTournament();
        }
    }, [gameManager.gameState.connected, accessCode, userId, username, isDiffered, joinTournament]);

    return {
        // State
        gameState: legacyGameState,
        loading,
        error: gameManager.gameState.error,

        // Actions
        joinTournament,
        submitAnswer,

        // Connection state
        connected: gameManager.gameState.connected,
        connecting: gameManager.gameState.connecting
    };
}
