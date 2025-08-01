import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { createSocketConfig } from '@/utils';
import {
    joinGamePayloadSchema,
    gameAnswerPayloadSchema,
    requestNextQuestionPayloadSchema,
    answerReceivedPayloadSchema,
    feedbackPayloadSchema
} from '@shared/types/socketEvents.zod';
import { z } from 'zod';

// Derive types from Zod schemas for type safety
type JoinGamePayload = z.infer<typeof joinGamePayloadSchema>;
type GameAnswerPayload = z.infer<typeof gameAnswerPayloadSchema>;
type RequestNextQuestionPayload = z.infer<typeof requestNextQuestionPayloadSchema>;
type AnswerReceivedPayload = z.infer<typeof answerReceivedPayloadSchema>;
type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

// Import shared types - organized by module
import type {
    Question,
    PlayMode
} from '@shared/types';

import type {
    ServerToClientEvents,
    ClientToServerEvents,
    GameJoinedPayload,
    ErrorPayload,
    GameAlreadyPlayedPayload,
    GameStateUpdatePayload
} from '@shared/types/socketEvents';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;

import type {
    GameEndedPayload
} from '@shared/types/socket/payloads';

import type {
    LiveQuestionPayload,
    // FilteredQuestion removed: use QuestionDataForStudent instead
} from '@shared/types/quiz/liveQuestion';


// Import type guards for runtime validation
import {
    isQuestionData,
    isParticipantData,
    isErrorPayload,
    isGameJoinedPayload,
    createSafeEventHandler,
    validateEventPayload,
    isCorrectAnswersPayload,
    isGameStateUpdatePayload,
    isAnswerReceivedPayload,
    isFeedbackPayload,
    CorrectAnswersPayload
} from '@/types/socketTypeGuards';

const logger = createLogger('useStudentGameSocket');

// --- Extended Types Based on Core Types ---

export interface GameUpdate {
    timeLeftMs?: number;
    status?: 'play' | 'pause' | 'stop';
    questionState?: 'active' | 'paused' | 'stopped';
}

// Use core AnswerResponsePayload as base for answer feedback
export interface AnswerReceived {
    rejected?: boolean;
    received?: boolean;
    message?: string;
    correct?: boolean;
    questionUid?: string;
    timeSpent?: number;
    correctAnswers?: boolean[];
    explanation?: string;
    score?: number;
}

// Use core answer result type for tournament answers
export interface TournamentAnswerResult {
    questionUid: string;
    rejected?: boolean;
    reason?: string;
    message?: string;
    registered?: boolean;
    updated?: boolean;
}

/**
 * Local UI state for student game interface
 * Separate from shared GameState to maintain clear boundaries
 */
export interface StudentGameUIState {
    // UI-specific game state
    currentQuestion: QuestionDataForStudent | null;
    questionIndex: number;
    totalQuestions: number;
    answered: boolean;
    connectedToRoom: boolean;
    phase: 'question' | 'feedback' | 'show_answers';
    feedbackRemaining: number | null;
    correctAnswers: boolean[] | null;
    lastAnswerFeedback?: AnswerReceived | null;

    // Canonical leaderboard state (shared type)
    leaderboard: import('@shared/types/core/leaderboardEntry.zod').LeaderboardEntry[];

    // Game metadata from shared types
    gameMode?: PlayMode;
    linkedQuizId?: string | null;

    // Game status aligned with shared types
    gameStatus: 'pending' | 'active' | 'paused' | 'completed';
}

export interface StudentGameSocketHookProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    onAnswerReceived?: () => void; // Callback when answer is received
}

export interface StudentGameSocketHook {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    gameState: StudentGameUIState;

    // Connection status
    connected: boolean;
    connecting: boolean;

    error: string | null;

    // Actions
    joinGame: () => void;
    submitAnswer: (questionUid: string, answer: GameAnswerPayload['answer'], timeSpent: number) => void;
    requestNextQuestion: (currentQuestionUid: string) => void;
}

export function useStudentGameSocket({
    accessCode,
    userId,
    username,
    avatarEmoji,
    onAnswerReceived
}: StudentGameSocketHookProps): StudentGameSocketHook {

    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCounter, setErrorCounter] = useState(0);

    const [gameState, setGameState] = useState<StudentGameUIState>({
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        gameStatus: 'pending',
        answered: false,
        connectedToRoom: false,
        phase: 'question',
        feedbackRemaining: null,
        correctAnswers: null,
        leaderboard: [],
        gameMode: 'tournament', // Default to tournament mode
        linkedQuizId: null,
        lastAnswerFeedback: null
    });
    // --- Leaderboard Update Handler ---
    useEffect(() => {
        if (!socket) return;
        // Canonical event: leaderboard_update { leaderboard: LeaderboardEntry[] }
        const handleLeaderboardUpdate = (payload: { leaderboard: import('@shared/types/core/leaderboardEntry.zod').LeaderboardEntry[] }) => {
            logger.info('🏆 [LEADERBOARD] Received leaderboard_update event', {
                payloadKeys: Object.keys(payload),
                leaderboardLength: payload.leaderboard?.length || 0,
                leaderboard: payload.leaderboard,
                timestamp: Date.now()
            });

            if (!payload.leaderboard) {
                logger.warn('🏆 [LEADERBOARD] Received leaderboard_update with no leaderboard property', payload);
                return;
            }

            setGameState(prev => {
                logger.info('🏆 [LEADERBOARD] Updating game state with new leaderboard', {
                    previousLength: prev.leaderboard.length,
                    newLength: payload.leaderboard.length,
                    previousLeaderboard: prev.leaderboard,
                    newLeaderboard: payload.leaderboard
                });

                return {
                    ...prev,
                    leaderboard: payload.leaderboard || []
                };
            });
        };

        logger.info('🏆 [LEADERBOARD] Setting up leaderboard_update event listener');
        socket.on('leaderboard_update', handleLeaderboardUpdate);

        return () => {
            logger.info('🏆 [LEADERBOARD] Cleaning up leaderboard_update event listener');
            socket.off('leaderboard_update', handleLeaderboardUpdate);
        };
    }, [socket]);

    // Use unified timer system for student countdown
    // --- Socket Connection ---
    useEffect(() => {
        if (!accessCode || !userId || !username) {
            logger.debug('Missing required connection parameters', { accessCode, userId, username });
            return;
        }

        logger.info(`Initializing student socket connection for game: ${accessCode}`, {
            userId,
            username,
            url: SOCKET_CONFIG.url
        });

        setConnecting(true);
        logger.debug('Clearing error state during socket initialization');
        setError(null);

        // Create socket configuration with authentication
        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const s: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_CONFIG.url, socketConfig);

        s.connect();
        setSocket(s);

        // Connection event handlers
        s.on('connect', () => {
            logger.info(`Student socket connected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            logger.debug('Clearing error state on socket connect');
            setError(null);
        });

        // Use 'reconnect' event with type assertion to bypass type error
        (s.on as unknown as (event: string, handler: () => void) => void)('reconnect', () => {
            logger.info(`Student socket reconnected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            logger.debug('Clearing error state on socket reconnect');
            setError(null);
        });

        s.on('disconnect', (reason: string) => {
            logger.warn(`Student socket disconnected: ${reason}`);
            setConnected(false);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: false
            }));
        });

        s.on('connect_error', (err: Error) => {
            logger.error("Student socket connection error:", err);
            setConnecting(false);
            setError(`Connection error: ${err.message}`);
        });

        return () => {
            logger.info(`Disconnecting student socket for game: ${accessCode}`);
            s.disconnect();
            setSocket(null);
            setConnected(false);
            setConnecting(false);
        };
    }, [accessCode, userId, username, avatarEmoji]);

    // --- Game Event Handlers ---
    useEffect(() => {
        if (!socket) return;
        socket.on(SOCKET_EVENTS.GAME.GAME_JOINED as any, createSafeEventHandler<GameJoinedPayload>((payload) => {
            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'pending',
                gameMode: payload.gameMode
            }));
        }, isGameJoinedPayload, SOCKET_EVENTS.GAME.GAME_JOINED));
        socket.on(
            SOCKET_EVENTS.GAME.GAME_QUESTION as any,
            createSafeEventHandler<QuestionDataForStudent>((payload) => {
                logger.info('Received canonical game_question', payload);
                // Validate at runtime with Zod
                const parseResult = questionDataForStudentSchema.safeParse(payload);
                if (!parseResult.success) {
                    logger.error({ errors: parseResult.error.errors, payload }, '[MODERNIZATION] Invalid GAME_QUESTION payload received on frontend');
                    return;
                }
                setGameState(prev => {
                    const newState = {
                        ...prev,
                        currentQuestion: payload,
                        questionIndex: payload.currentQuestionIndex ?? 0,
                        totalQuestions: payload.totalQuestions ?? prev.totalQuestions ?? 1,
                        answered: false,
                        gameStatus: 'active' as const,
                        phase: 'question' as const,
                        feedbackRemaining: null,
                        correctAnswers: null,
                        connectedToRoom: true
                    };
                    logger.info('=== QUESTION STATE UPDATED ===', {
                        questionUid: payload.uid,
                        questionIndex: payload.currentQuestionIndex ?? 0,
                        totalQuestions: payload.totalQuestions ?? 0,
                        questionText: payload.text.substring(0, 50) + '...'
                    });
                    return newState;
                });
            }, (data): data is QuestionDataForStudent => questionDataForStudentSchema.safeParse(data).success, SOCKET_EVENTS.GAME.GAME_QUESTION)
        );

        // Game state update handler
        socket.on(SOCKET_EVENTS.GAME.GAME_STATE_UPDATE as any, createSafeEventHandler<GameStateUpdatePayload>((data) => {
            setGameState(prev => ({
                ...prev,
                currentQuestion: data.currentQuestion
                    ? {
                        uid: data.currentQuestion.uid,
                        text: data.currentQuestion.text,
                        questionType: data.currentQuestion.questionType,
                        answerOptions: data.currentQuestion.answerOptions || [],
                        timeLimit: data.currentQuestion.timeLimit ?? 30 // fallback to 30s if missing
                    }
                    : prev.currentQuestion,
                questionIndex: data.questionIndex ?? prev.questionIndex,
                totalQuestions: data.totalQuestions ?? prev.totalQuestions,
                gameStatus: data.status ? (
                    data.status === 'waiting' ? 'pending' :
                        data.status === 'finished' ? 'completed' :
                            data.status as 'active' | 'paused'
                ) : prev.gameStatus,
                gameMode: data.gameMode ?? prev.gameMode
                // Don't update timer - use our timer system instead
                // Keep existing phase and feedbackRemaining values
            }));
        }, isGameStateUpdatePayload, SOCKET_EVENTS.GAME.GAME_STATE_UPDATE));
        socket.on(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, createSafeEventHandler<AnswerReceivedPayload>((payload) => {
            logger.info('=== ANSWER RECEIVED ===', payload);

            // Trigger snackbar callback
            if (onAnswerReceived) {
                onAnswerReceived();
            }

            // Store the answer feedback (without correct answers - those come from correct_answers event)
            setGameState(prev => {
                const feedback = {
                    correct: payload.correct,
                    explanation: payload.explanation,
                    questionUid: payload.questionUid
                };

                logger.info('=== FEEDBACK SET ===', feedback);

                return {
                    ...prev,
                    answered: true,
                    lastAnswerFeedback: feedback
                };
            });
        }, isAnswerReceivedPayload, 'answer_received'));

        // Add missing event listeners that backend emits
        socket.on(SOCKET_EVENTS.GAME.CORRECT_ANSWERS as any, createSafeEventHandler<CorrectAnswersPayload>((payload) => {
            logger.info('=== CORRECT ANSWERS EVENT ===', payload);

            setGameState(prev => {
                logger.info('=== SETTING SHOW ANSWERS PHASE ===', {
                    newCorrectAnswers: payload.correctAnswers,
                    hasNewCorrectAnswers: !!payload.correctAnswers
                });

                return {
                    ...prev,
                    phase: 'show_answers',
                    correctAnswers: payload.correctAnswers || prev.correctAnswers
                };
            });
        }, isCorrectAnswersPayload, 'correct_answers'));

        socket.on(SOCKET_EVENTS.GAME.FEEDBACK as any, createSafeEventHandler<FeedbackPayload>((payload) => {
            logger.info('=== FEEDBACK PHASE STARTED ===', payload);
            setGameState(prev => ({
                ...prev,
                phase: 'feedback',
                feedbackRemaining: payload.feedbackRemaining,
                lastAnswerFeedback: {
                    ...prev.lastAnswerFeedback,
                    explanation: (payload as any).explanation, // Store the explanation from feedback event
                    questionUid: payload.questionUid
                }
            }));
        }, isFeedbackPayload, SOCKET_EVENTS.GAME.FEEDBACK));

        socket.on(SOCKET_EVENTS.GAME.GAME_ERROR as any, createSafeEventHandler<ErrorPayload>((error) => {
            logger.warn('=== GAME ERROR RECEIVED ===', { errorMessage: error.message, errorCode: error.code });
            // Include timestamp to force unique error strings and trigger React re-renders
            const uniqueErrorMessage = `${error.message || 'Unknown game error'}|${Date.now()}`;
            setError(uniqueErrorMessage);
        }, isErrorPayload, SOCKET_EVENTS.GAME.GAME_ERROR));
        socket.on(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED as any, createSafeEventHandler<GameAlreadyPlayedPayload>((payload) => {
            logger.info('=== GAME ALREADY PLAYED ===', { accessCode: payload.accessCode });

            // For tournaments, redirect to leaderboard instead of showing error
            // This provides better UX since users get useful information (their rank/score)
            if (typeof window !== 'undefined') {
                const tournamentCode = payload.accessCode;
                logger.info(`Tournament already played, redirecting to leaderboard: /leaderboard/${tournamentCode}`);

                // Silent redirect to leaderboard with a parameter to show a subtle notification
                window.location.href = `/leaderboard/${tournamentCode}?already_played=1`;
            }
        }, (d): d is GameAlreadyPlayedPayload => true, SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED));

        // Listen for backend game end signal - this should control navigation
        socket.on(SOCKET_EVENTS.GAME.GAME_ENDED as any, createSafeEventHandler<GameEndedPayload>((payload) => {
            logger.info('=== GAME ENDED ===', payload);
            // Use window.location for more reliable navigation
            window.location.href = `/leaderboard/${payload.accessCode}`;
        }, (data): data is GameEndedPayload => {
            return typeof data === 'object' && data !== null && 'accessCode' in data && typeof (data as any).accessCode === 'string';
        }, SOCKET_EVENTS.GAME.GAME_ENDED));

        // No legacy or backward compatibility event listeners remain
        return () => {
            socket.off(SOCKET_EVENTS.GAME.GAME_JOINED as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_QUESTION as any);
            socket.off(SOCKET_EVENTS.GAME.TIMER_UPDATE as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_STATE_UPDATE as any);
            socket.off(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_ENDED as any);
            socket.off(SOCKET_EVENTS.GAME.CORRECT_ANSWERS as any);
            socket.off(SOCKET_EVENTS.GAME.FEEDBACK as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_ERROR as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED as any);
        };
    }, [socket]);


    // --- Action Functions ---
    const joinGame = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("Cannot join game: missing socket or parameters");
            return;
        }

        logger.info(`Joining game ${accessCode}`, { userId, username });

        const payload: JoinGamePayload = { accessCode, userId, username, avatarEmoji: avatarEmoji || '🐼' };

        // Validate payload before emitting
        try {
            const validatedPayload = joinGamePayloadSchema.parse(payload);
            socket.emit('join_game', validatedPayload);
        } catch (error) {
            logger.error('Invalid join_game payload:', error);
        }
    }, [socket, accessCode, userId, username, avatarEmoji]);

    const submitAnswer = useCallback((questionUid: string, answer: GameAnswerPayload['answer'], timeSpent: number) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot submit answer: missing socket or parameters");
            return;
        }

        logger.info("Submitting answer", { questionUid, answer, timeSpent });

        const payload: GameAnswerPayload = { accessCode, userId, questionUid, answer, timeSpent };

        // Validate payload before emitting
        try {
            const validatedPayload = gameAnswerPayloadSchema.parse(payload);
            socket.emit('game_answer', validatedPayload);
        } catch (error) {
            logger.error('Invalid game_answer payload:', error);
        }
    }, [socket, accessCode, userId]);

    const requestNextQuestion = useCallback((currentQuestionUid: string) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot request next question: missing socket or parameters");
            return;
        }

        logger.info("Requesting next question", { currentQuestionUid });

        const payload: RequestNextQuestionPayload = { accessCode, userId, currentQuestionUid };

        try {
            requestNextQuestionPayloadSchema.parse(payload);
            socket.emit('request_next_question', payload);
        } catch (error) {
            logger.error('Invalid request_next_question payload:', error);
        }
    }, [socket, accessCode, userId]);

    // UNIFIED JOIN FLOW: Always use join_game event regardless of game state
    // Backend handles PENDING vs ACTIVE status automatically
    useEffect(() => {
        if (connected && !gameState.connectedToRoom && accessCode && userId && username) {
            logger.info('Auto-joining game with unified join flow', { accessCode, userId, username, gameStatus: gameState.gameStatus });
            joinGame();
        }
    }, [connected, gameState.connectedToRoom, accessCode, userId, username, joinGame]);

    return {
        socket,
        gameState,
        connected,
        connecting,
        error,
        joinGame,
        submitAnswer,
        requestNextQuestion
    };
}
