import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { useStudentTimer } from '@/hooks/useGameTimer';

// Import shared types - organized by module
import type {
    Question,
    PlayMode,
    TimerStatus,
    GameTimerState
} from '@shared/types';

import type {
    ServerToClientEvents,
    ClientToServerEvents,
    JoinGamePayload,
    GameAnswerPayload,
    GameJoinedPayload,
    ErrorPayload,
    GameAlreadyPlayedPayload,
    QuestionData,
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    GameStateUpdatePayload
} from '@shared/types/socketEvents';

import type {
    LiveQuestionPayload,
    FilteredQuestion
} from '@shared/types/quiz/liveQuestion';

import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Import type guards for runtime validation
import {
    isQuestionData,
    isParticipantData,
    isErrorPayload,
    isGameJoinedPayload,
    isTimerUpdatePayload,
    isGameTimerUpdatePayload,
    createSafeEventHandler,
    validateEventPayload,
    isLiveQuestionPayload,
    isCorrectAnswersPayload,
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
    currentQuestion: FilteredQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    answered: boolean;
    connectedToRoom: boolean;
    phase: 'question' | 'feedback' | 'show_answers';
    feedbackRemaining: number | null;
    correctAnswers: boolean[] | null;
    lastAnswerFeedback?: AnswerReceived | null;

    // Game metadata from shared types
    gameMode?: PlayMode;
    linkedQuizId?: string | null;

    // Timer state using shared types
    timer: GameTimerState | null;

    // Game status aligned with shared types
    gameStatus: 'pending' | 'active' | 'paused' | 'completed';
}

export interface StudentGameSocketHookProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    isDiffered?: boolean;
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
    isDiffered = false,
    onAnswerReceived
}: StudentGameSocketHookProps): StudentGameSocketHook {

    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [gameState, setGameState] = useState<StudentGameUIState>({
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        timer: null,
        gameStatus: 'pending',
        answered: false,
        connectedToRoom: false,
        phase: 'question',
        feedbackRemaining: null,
        correctAnswers: null,
        gameMode: isDiffered ? 'practice' : 'tournament',
        linkedQuizId: null,
        lastAnswerFeedback: null
    });

    // Use unified timer system for student countdown
    const gameTimer = useStudentTimer(socket, {
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: false,
        enableLocalAnimation: true
    });

    // Sync unified timer state with game state using shared types
    useEffect(() => {
        setGameState(prev => ({
            ...prev,
            timer: gameTimer.timerState, // Use complete GameTimerState
            gameStatus: gameTimer.timerState.status === 'play' ? 'active' :
                gameTimer.timerState.status === 'pause' ? 'paused' :
                    gameTimer.timerState.status === 'stop' && gameTimer.timerState.timeLeftMs === 0 ? 'pending' :
                        prev.gameStatus
        }));
    }, [gameTimer.timerState]);

    // --- Socket Connection ---
    useEffect(() => {
        if (!accessCode || !userId || !username) {
            logger.debug('Missing required connection parameters', { accessCode, userId, username });
            return;
        }

        logger.info(`Initializing student socket connection for game: ${accessCode}`, {
            userId,
            username,
            isDiffered,
            url: SOCKET_CONFIG.url
        });

        setConnecting(true);
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
            setError(null);
        });

        // Use 'reconnect' event with type assertion to bypass type error
        (s.on as unknown as (event: string, handler: () => void) => void)('reconnect', () => {
            logger.info(`Student socket reconnected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
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
    }, [accessCode, userId, username, avatarEmoji, isDiffered]);

    // --- Game Event Handlers ---
    useEffect(() => {
        if (!socket) return;
        socket.on('game_joined', createSafeEventHandler<GameJoinedPayload>((payload) => {
            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'pending'
            }));
        }, isGameJoinedPayload, 'game_joined'));
        socket.on('game_question', createSafeEventHandler<LiveQuestionPayload>((payload) => {
            logger.info('Received game_question', payload);

            // Sync timer immediately if present in payload (for late joiners)
            if (payload.timer) {
                // Convert GameTimerState to TimerUpdatePayload format for syncWithBackend
                const timerUpdate: TimerUpdatePayload = {
                    timeLeftMs: payload.timer.timeLeftMs,
                    running: payload.timer.status === 'play',
                    status: payload.timer.status,
                    durationMs: payload.timer.durationMs,
                    questionUid: payload.timer.questionUid || undefined
                };
                gameTimer.syncWithBackend(timerUpdate);
                logger.info('Synced timer from game_question payload', timerUpdate);
            }

            setGameState(prev => {
                const newState = {
                    ...prev,
                    currentQuestion: payload.question,
                    questionIndex: payload.questionIndex ?? 0,
                    totalQuestions: payload.totalQuestions ?? prev.totalQuestions ?? 1, // Fallback to prevent 0
                    answered: false,
                    gameStatus: 'active' as const,
                    phase: 'question' as const,
                    feedbackRemaining: null,
                    correctAnswers: null,
                    connectedToRoom: true,
                    timerStatus: payload.timer?.status || 'play'
                };

                logger.info('=== QUESTION STATE UPDATED ===', {
                    questionUid: payload.question.uid,
                    questionIndex: payload.questionIndex ?? 0,
                    totalQuestions: payload.totalQuestions ?? 0,
                    questionText: payload.question.text.substring(0, 50) + '...'
                });

                return newState;
            });
        }, isLiveQuestionPayload, 'game_question'));
        socket.on('timer_update', createSafeEventHandler<TimerUpdatePayload>((data) => {
            gameTimer.syncWithBackend(data);
            if (typeof data.timeLeftMs === 'number' && data.timeLeftMs !== null) {
                setGameState(prev => ({
                    ...prev,
                    gameStatus: data.running && !!data.timeLeftMs && data.timeLeftMs > 0 ? 'active' : 'pending'
                }));
            }
        }, isTimerUpdatePayload, 'timer_update'));
        socket.on('game_timer_updated', createSafeEventHandler<GameTimerUpdatePayload>((data) => {
            gameTimer.syncWithBackend(data);
            setGameState(prev => ({ ...prev }));
        }, isGameTimerUpdatePayload, 'game_timer_updated'));
        socket.on('game_state_update', createSafeEventHandler<GameStateUpdatePayload>((data) => {
            setGameState(prev => ({
                ...prev,
                currentQuestion: data.currentQuestion
                    ? {
                        uid: data.currentQuestion.uid,
                        text: data.currentQuestion.text,
                        questionType: data.currentQuestion.questionType,
                        answerOptions: data.currentQuestion.answerOptions || []
                    }
                    : prev.currentQuestion,
                questionIndex: data.questionIndex ?? prev.questionIndex,
                totalQuestions: data.totalQuestions ?? prev.totalQuestions,
                gameStatus: data.status ? (
                    data.status === 'waiting' ? 'pending' :
                        data.status === 'finished' ? 'completed' :
                            data.status as 'active' | 'paused'
                ) : prev.gameStatus
                // Don't update timer - use our timer system instead
                // Keep existing phase and feedbackRemaining values
            }));
        }, (d): d is GameStateUpdatePayload => true, 'game_state_update'));
        socket.on('answer_received', createSafeEventHandler<{
            questionUid: string;
            timeSpent: number;
            correct?: boolean;
            correctAnswers?: boolean[];
            explanation?: string;
        }>((payload) => {
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
        }, (data): data is {
            questionUid: string;
            timeSpent: number;
            correct?: boolean;
            correctAnswers?: boolean[];
            explanation?: string;
        } => {
            if (!data || typeof data !== 'object') return false;
            const a = data as Record<string, unknown>;
            return typeof a.questionUid === 'string' &&
                typeof a.timeSpent === 'number';
            // correct is optional, so don't require it
        }, 'answer_received'));

        // Add missing event listeners that backend emits
        socket.on('correct_answers', createSafeEventHandler<CorrectAnswersPayload>((payload) => {
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

        socket.on('feedback', createSafeEventHandler<{
            questionUid: string;
            feedbackRemaining: number;
            [key: string]: any; // Allows explanation and other fields
        }>((payload) => {
            logger.info('=== FEEDBACK PHASE STARTED ===', payload);
            setGameState(prev => ({
                ...prev,
                phase: 'feedback',
                feedbackRemaining: payload.feedbackRemaining,
                lastAnswerFeedback: {
                    ...prev.lastAnswerFeedback,
                    explanation: payload.explanation, // Store the explanation from feedback event
                    questionUid: payload.questionUid
                }
            }));
        }, (data): data is { questionUid: string; feedbackRemaining: number;[key: string]: any } => {
            if (!data || typeof data !== 'object') return false;
            const f = data as Record<string, unknown>;
            return typeof f.questionUid === 'string' && typeof f.feedbackRemaining === 'number';
        }, 'feedback'));

        socket.on('game_error', createSafeEventHandler<ErrorPayload>((error) => {
            setError(error.message || 'Unknown game error');
        }, isErrorPayload, 'game_error'));
        socket.on('game_already_played', createSafeEventHandler<GameAlreadyPlayedPayload>(() => {
            setError('You have already played this game');
        }, (d): d is GameAlreadyPlayedPayload => true, 'game_already_played'));

        // Listen for backend game end signal - this should control navigation
        socket.on('game_ended', createSafeEventHandler<{ accessCode: string; endedAt?: string; score?: number; totalQuestions?: number; correct?: number; total?: number }>((payload) => {
            logger.info('=== GAME ENDED ===', payload);
            // Use window.location for more reliable navigation
            window.location.href = `/leaderboard/${payload.accessCode}`;
        }, (data): data is { accessCode: string; endedAt?: string; score?: number; totalQuestions?: number; correct?: number; total?: number } => {
            return typeof data === 'object' && data !== null && 'accessCode' in data && typeof (data as any).accessCode === 'string';
        }, 'game_ended'));

        // No legacy or backward compatibility event listeners remain
        return () => {
            socket.off('game_joined');
            socket.off('game_question');
            socket.off('timer_update');
            socket.off('game_timer_updated');
            socket.off('game_state_update');
            socket.off('answer_received');
            socket.off('game_ended');
            socket.off('correct_answers');
            socket.off('feedback');
            socket.off('game_error');
            socket.off('game_already_played');
        };
    }, [socket]);

    // --- Action Functions ---
    const joinGame = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("Cannot join game: missing socket or parameters");
            return;
        }

        logger.info(`Joining game ${accessCode}`, { userId, username, isDiffered });

        const payload: JoinGamePayload = { accessCode, userId, username, avatarEmoji: avatarEmoji || '🐼', isDiffered };
        socket.emit('join_game', payload);
    }, [socket, accessCode, userId, username, avatarEmoji, isDiffered]);

    const submitAnswer = useCallback((questionUid: string, answer: GameAnswerPayload['answer'], timeSpent: number) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot submit answer: missing socket or parameters");
            return;
        }

        logger.info("Submitting answer", { questionUid, answer, timeSpent });

        const payload: GameAnswerPayload = { accessCode, userId, questionUid, answer, timeSpent };
        socket.emit('game_answer', payload);
    }, [socket, accessCode, userId]);

    const requestNextQuestion = useCallback((currentQuestionUid: string) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot request next question: missing socket or parameters");
            return;
        }

        logger.info("Requesting next question", { currentQuestionUid });

        const payload: Parameters<ClientToServerEvents['request_next_question']>[0] = { accessCode, userId, currentQuestionUid };
        socket.emit('request_next_question', payload);
    }, [socket, accessCode, userId]);

    // Auto-join game when connected
    useEffect(() => {
        if (connected && !gameState.connectedToRoom && accessCode && userId && username) {
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
