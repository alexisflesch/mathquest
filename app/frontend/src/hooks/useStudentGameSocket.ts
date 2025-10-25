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
    numericAnswer?: {
        correctAnswer: number;
        tolerance?: number;
    } | null;
    lastAnswerFeedback?: AnswerReceived | null;

    // Timer fields expected by tests
    timer: number;
    timerStatus: 'play' | 'pause' | 'stop';

    // Canonical leaderboard state (shared type)
    leaderboard: import('@shared/types/core/leaderboardEntry.zod').LeaderboardEntry[];

    // Game metadata from shared types
    gameMode?: PlayMode;
    linkedQuizId?: string | null;

    // Game status aligned with test expectations
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
}

export interface StudentGameSocketHookProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    isDiffered?: boolean; // For deferred tournament mode
    onAnswerReceived?: () => void; // Callback when answer is received
}

export interface StudentGameSocketHook {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    gameState: StudentGameUIState;

    // Connection status
    connected: boolean;
    connecting: boolean;

    error: string | null;
    errorVersion: number;

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
    isDiffered,
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
        gameStatus: 'waiting',
        answered: false,
        connectedToRoom: false,
        phase: 'question',
        feedbackRemaining: null,
        correctAnswers: null,
        numericAnswer: null,
        timer: 0,
        timerStatus: 'stop',
        leaderboard: [],
        gameMode: 'tournament', // Default to tournament mode
        linkedQuizId: null,
        lastAnswerFeedback: null
    });
    // Late-join recovery timer
    const lateJoinRecoveryTimeoutRef = useRef<number | null>(null);
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
            logger.info(`🔌 [CONNECTION] Student socket connected: ${s.id}`, {
                socketId: s.id,
                accessCode,
                userId,
                username
            });
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
            setErrorCounter(prev => prev + 1);
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
            logger.info('🎮 [GAME JOIN] Successfully joined game', {
                accessCode: payload.accessCode,
                gameStatus: payload.gameStatus,
                gameMode: payload.gameMode,
                participantId: payload.participant.id,
                participantUserId: payload.participant.userId,
                participantUsername: payload.participant.username
            });

            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'waiting',
                gameMode: payload.gameMode
            }));

            // Late-join defensive replay: if game is active but no question arrives shortly,
            // proactively re-emit join_game to ask the server to resend the current state.
            if (payload.gameStatus === 'active') {
                if (lateJoinRecoveryTimeoutRef.current) {
                    window.clearTimeout(lateJoinRecoveryTimeoutRef.current);
                }
                lateJoinRecoveryTimeoutRef.current = window.setTimeout(() => {
                    try {
                        // If we still have no currentQuestion, ask again
                        const stillNoQuestion = !gameState.currentQuestion;
                        if (stillNoQuestion && socket && socket.connected && accessCode && userId && username) {
                            logger.warn('⚠️ [LATE-JOIN-RECOVERY] Active game but no current question received; re-emitting join_game');
                            const payload = {
                                accessCode,
                                userId,
                                username,
                                avatarEmoji: avatarEmoji || '🐼'
                            } as any;
                            socket.emit('join_game' as any, payload);
                        }
                    } catch (err) {
                        logger.error('Late-join recovery error', err as any);
                    }
                }, 1200);
            }
        }, isGameJoinedPayload, SOCKET_EVENTS.GAME.GAME_JOINED));
        socket.on(
            SOCKET_EVENTS.GAME.GAME_QUESTION as any,
            createSafeEventHandler<QuestionDataForStudent>((payload) => {
                // Cancel any pending late-join recovery re-join once a question arrives
                try {
                    if (lateJoinRecoveryTimeoutRef.current) {
                        window.clearTimeout(lateJoinRecoveryTimeoutRef.current);
                        lateJoinRecoveryTimeoutRef.current = null;
                        logger.info('🧹 [LATE-JOIN-RECOVERY] Cancelled re-emit timer on GAME_QUESTION');
                    }
                } catch { }

                // Drop duplicate GAME_QUESTION payloads for the same question to avoid heavy re-renders/MathJax re-typeset storms
                try {
                    const incomingIndex = payload.currentQuestionIndex ?? 0;
                    if (
                        gameState.currentQuestion?.uid === payload.uid &&
                        gameState.questionIndex === incomingIndex &&
                        gameState.totalQuestions === (payload.totalQuestions ?? gameState.totalQuestions)
                    ) {
                        logger.debug('🛑 [QUESTION UPDATE] Duplicate payload for same question detected — skipping state update', {
                            uid: payload.uid,
                            incomingIndex,
                            totalQuestions: payload.totalQuestions
                        });
                        return;
                    }
                } catch { }
                logger.info('🔄 [QUESTION UPDATE] Received game_question event', {
                    event: 'game_question',
                    socketId: socket.id,
                    payload: {
                        uid: payload.uid,
                        questionType: payload.questionType,
                        currentQuestionIndex: payload.currentQuestionIndex,
                        totalQuestions: payload.totalQuestions,
                        text: payload.text?.substring(0, 100) + '...',
                        hasAnswerOptions: !!payload.answerOptions?.length,
                        hasMultipleChoiceQuestion: !!payload.multipleChoiceQuestion,
                        hasNumericQuestion: !!payload.numericQuestion
                    }
                });

                // Validate at runtime with Zod
                const parseResult = questionDataForStudentSchema.safeParse(payload);
                if (!parseResult.success) {
                    logger.error({
                        errors: parseResult.error.errors,
                        payload,
                        payloadKeys: Object.keys(payload),
                        schema: 'questionDataForStudentSchema'
                    }, '❌ [VALIDATION ERROR] Invalid GAME_QUESTION payload received on frontend');
                    return;
                }

                logger.info('✅ [VALIDATION SUCCESS] Payload validation passed, updating game state');

                setGameState(prev => {
                    const newState = {
                        ...prev,
                        currentQuestion: payload,
                        questionIndex: payload.currentQuestionIndex ?? 0,
                        totalQuestions: payload.totalQuestions ?? prev.totalQuestions ?? 1,
                        answered: false,
                        // Don't override gameStatus - let it be controlled by other events
                        phase: 'question' as const,
                        feedbackRemaining: null,
                        correctAnswers: null,
                        numericAnswer: null,
                        connectedToRoom: true
                    };
                    logger.info('🎯 [STATE UPDATE] Question state updated successfully', {
                        previousQuestionUid: prev.currentQuestion?.uid,
                        newQuestionUid: payload.uid,
                        previousQuestionIndex: prev.questionIndex,
                        newQuestionIndex: payload.currentQuestionIndex ?? 0,
                        totalQuestions: payload.totalQuestions ?? 0,
                        questionType: payload.questionType,
                        questionText: payload.text?.substring(0, 50) + '...',
                        stateChanged: prev.currentQuestion?.uid !== payload.uid
                    });
                    return newState;
                });
            }, (data): data is QuestionDataForStudent => questionDataForStudentSchema.safeParse(data).success, SOCKET_EVENTS.GAME.GAME_QUESTION)
        );

        // DEBUG: Test event listener to verify backend communication
        socket.on('test_deferred_debug' as any, (data: any) => {
            console.log('🧪 [DEBUG] Received test_deferred_debug event:', data);
            logger.info('🧪 [DEBUG] Received test_deferred_debug event', { data });
        });

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
                    data.status === 'waiting' ? 'waiting' :
                        data.status === 'finished' ? 'finished' :
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
                    hasNewCorrectAnswers: !!payload.correctAnswers,
                    numericAnswer: payload.numericAnswer,
                    hasNumericAnswer: !!payload.numericAnswer
                });

                return {
                    ...prev,
                    phase: 'show_answers',
                    correctAnswers: payload.correctAnswers || prev.correctAnswers,
                    numericAnswer: payload.numericAnswer || prev.numericAnswer
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
            // In tests, use clean error message. In production, add timestamp for unique re-renders
            const errorMessage = error.message || 'Unknown game error';
            const uniqueErrorMessage = process.env.NODE_ENV === 'test'
                ? errorMessage
                : `${errorMessage}|${Date.now()}`;
            setError(uniqueErrorMessage);
            setErrorCounter(prev => prev + 1);
        }, isErrorPayload, SOCKET_EVENTS.GAME.GAME_ERROR));
        socket.on(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED as any, createSafeEventHandler<GameAlreadyPlayedPayload>((payload) => {
            logger.info('=== GAME ALREADY PLAYED ===', { accessCode: payload.accessCode });

            // Set error message for tests or as fallback
            setError('You have already played this game');
            setErrorCounter(prev => prev + 1);

            // For tournaments, redirect to leaderboard instead of showing error
            // This provides better UX since users get useful information (their rank/score)
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
                const tournamentCode = payload.accessCode;
                logger.info(`Tournament already played, redirecting to leaderboard: /leaderboard/${tournamentCode}`);

                // Silent redirect to leaderboard with a parameter to show a subtle notification
                window.location.href = `/leaderboard/${tournamentCode}?already_played=1`;
            }
        }, (d): d is GameAlreadyPlayedPayload => true, SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED));

        // Listen for backend game end signal - this should control navigation
        socket.on(SOCKET_EVENTS.GAME.GAME_ENDED as any, createSafeEventHandler<GameEndedPayload>((payload) => {
            logger.info('=== GAME ENDED ===', payload);

            // Update game status to finished before navigation
            setGameState(prev => ({
                ...prev,
                gameStatus: 'finished'
            }));

            // Use window.location for more reliable navigation (in tests, this will error which is expected)
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
                window.location.href = `/leaderboard/${payload.accessCode}`;
            }
        }, (data): data is GameEndedPayload => {
            return typeof data === 'object' && data !== null && 'accessCode' in data && typeof (data as any).accessCode === 'string';
        }, SOCKET_EVENTS.GAME.GAME_ENDED));

        // Timer update handlers
        socket.on(SOCKET_EVENTS.GAME.TIMER_UPDATE as any, (payload: any) => {
            logger.info('=== TIMER UPDATE ===', payload);

            setGameState(prev => ({
                ...prev,
                timer: payload.timeLeftMs || 0,
                timerStatus: payload.status === 'run' ? 'play' :
                    payload.status === 'pause' ? 'pause' : 'stop',
                gameStatus: payload.status === 'run' ? 'active' :
                    payload.status === 'pause' ? 'paused' :
                        prev.gameStatus // Keep existing status for 'stop'
            }));
        });

        // No legacy or backward compatibility event listeners remain
        return () => {
            socket.off(SOCKET_EVENTS.GAME.GAME_JOINED as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_QUESTION as any);
            socket.off('test_deferred_debug' as any); // DEBUG: Clean up test event listener
            socket.off(SOCKET_EVENTS.GAME.TIMER_UPDATE as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_STATE_UPDATE as any);
            socket.off(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_ENDED as any);
            socket.off(SOCKET_EVENTS.GAME.CORRECT_ANSWERS as any);
            socket.off(SOCKET_EVENTS.GAME.FEEDBACK as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_ERROR as any);
            socket.off(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED as any);
            if (lateJoinRecoveryTimeoutRef.current) {
                window.clearTimeout(lateJoinRecoveryTimeoutRef.current);
                lateJoinRecoveryTimeoutRef.current = null;
            }
        };
    }, [socket]);


    // --- Action Functions ---
    const joinGame = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("❌ [JOIN GAME] Cannot join game: missing socket or parameters", {
                hasSocket: !!socket,
                accessCode,
                userId,
                username
            });
            return;
        }

        logger.info(`🎯 [JOIN GAME] Attempting to join game ${accessCode}`, {
            userId,
            username,
            socketId: socket.id,
            socketConnected: socket.connected
        });

        // 🐛 DEBUG: Add debugging to track username vs cookieId issue
        const cookieId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('🐛 [USERNAME_DEBUG] Frontend join game payload construction', {
            accessCode,
            userId,
            username,
            avatarEmoji,
            cookieId,
            marker: '[FRONTEND_USERNAME_DEBUG]'
        });

        const payload: JoinGamePayload = {
            accessCode,
            userId,
            username,
            avatarEmoji: avatarEmoji || '🐼',
            ...(isDiffered && { isDiffered: true })
        };

        // Validate payload before emitting
        try {
            const validatedPayload = joinGamePayloadSchema.parse(payload);
            logger.info('✅ [JOIN GAME] Payload validated, emitting join_game event', validatedPayload);
            socket.emit('join_game', validatedPayload);
        } catch (error) {
            logger.error('❌ [JOIN GAME] Invalid join_game payload:', error);
        }
    }, [socket, accessCode, userId, username, avatarEmoji, isDiffered]);

    const submitAnswer = useCallback((questionUid: string, answer: GameAnswerPayload['answer'], timeSpent: number) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot submit answer: missing socket or parameters");
            setError("Connexion perdue. Tentative de reconnexion...");
            setErrorCounter(prev => prev + 1);
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
            setError("Erreur lors de l'envoi de la réponse. Veuillez réessayer.");
            setErrorCounter(prev => prev + 1);
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
    // NOTE: Auto-join only enabled for differed mode to prevent duplicate joins in regular mode
    useEffect(() => {
        if (isDiffered && connected && !gameState.connectedToRoom && accessCode && userId && username) {
            logger.info('Auto-joining game with unified join flow (differed mode)', { accessCode, userId, username, isDiffered, gameStatus: gameState.gameStatus });
            joinGame();
        }
    }, [isDiffered, connected, gameState.connectedToRoom, accessCode, userId, username, joinGame]);

    return {
        socket,
        gameState,
        connected,
        connecting,
        error,
        errorVersion: errorCounter,
        joinGame,
        submitAnswer,
        requestNextQuestion
    };
}
