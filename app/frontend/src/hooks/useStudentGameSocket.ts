import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { Question } from '@shared/types/quiz/question';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { AnswerValue, TimerUpdate, GameTimerUpdate } from '@/types/socket';

const logger = createLogger('useStudentGameSocket');

// --- Types ---
export interface StudentGameQuestion {
    uid: string;
    text: string;
    type: 'choix_simple' | 'choix_multiple';
    answers?: string[];
    answerOptions?: string[];
    correctAnswers?: boolean[];
    responses?: { text: string; correct: boolean }[];
    subject?: string;
    themes?: string[];
    difficulty?: number;
    gradeLevel?: string;
    explanation?: string;
}

export interface GameQuestionPayload {
    code: string;
    question: StudentGameQuestion;
    timer: number;
    questionIndex: number;
    totalQuestions: number;
    tournoiState?: 'running' | 'paused' | 'finished';
    questionState?: 'active' | 'paused' | 'stopped';
    phase?: 'question' | 'feedback' | 'show_answers';
    feedbackRemaining?: number;
}

export interface GameUpdate {
    timeLeft?: number;
    status?: 'play' | 'pause' | 'stop';
    questionState?: 'active' | 'paused' | 'stopped';
}

export interface AnswerReceived {
    rejected?: boolean;
    received?: boolean;
    message?: string;
    correct?: boolean;
    questionId?: string;
    timeSpent?: number;
    correctAnswers?: number[];
    explanation?: string;
}

export interface FeedbackEvent {
    questionId: string;
    feedbackRemaining: number;
}

export interface CorrectAnswersEvent {
    questionId: string;
}

export interface TournamentAnswerResult {
    questionUid: string;
    rejected?: boolean;
    reason?: string;
    message?: string;
    registered?: boolean;
    updated?: boolean;
}

export interface GameState {
    currentQuestion: StudentGameQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    timer: number | null;
    timerStatus: 'play' | 'pause' | 'stop';
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
    answered: boolean;
    connectedToRoom: boolean;
    phase: 'question' | 'feedback' | 'show_answers';
    feedbackRemaining: number | null;
    correctAnswers: number[] | null;
    gameMode?: 'tournament' | 'quiz' | 'practice';
    linkedQuizId?: string | null;
    lastAnswerFeedback?: AnswerReceived | null;
}

export interface StudentGameSocketHookProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    isDiffered?: boolean;
}

export interface StudentGameSocketHook {
    socket: Socket | null;
    gameState: GameState;

    // Connection status
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Actions
    joinGame: () => void;
    submitAnswer: (questionId: string, answer: AnswerValue, timeSpent: number) => void;
    requestNextQuestion: (currentQuestionId: string) => void;

    // Event handlers (optional callbacks)
    onQuestionReceived?: (question: GameQuestionPayload) => void;
    onAnswerReceived?: (result: AnswerReceived) => void;
    onFeedbackReceived?: (feedback: FeedbackEvent) => void;
    onCorrectAnswersReceived?: (correctAnswers: CorrectAnswersEvent) => void;
    onGameEnded?: (results: unknown) => void;
    onGameError?: (error: { message: string }) => void;
    onCorrectAnswers?: (payload: { questionId: string, correctAnswers: number[] }) => void;
}

export function useStudentGameSocket({
    accessCode,
    userId,
    username,
    avatarEmoji,
    isDiffered = false
}: StudentGameSocketHookProps): StudentGameSocketHook {

    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [gameState, setGameState] = useState<GameState>({
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        timer: null,
        timerStatus: 'stop',
        gameStatus: 'waiting',
        answered: false,
        connectedToRoom: false,
        phase: 'question',
        feedbackRemaining: null,
        correctAnswers: null,
        gameMode: isDiffered ? 'practice' : 'tournament',
        linkedQuizId: null,
        lastAnswerFeedback: null
    });

    // TIMER MANAGEMENT OVERHAUL: Local countdown timer refs for smooth UI
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const UI_UPDATE_THRESHOLD = 200; // Only update UI state every 200ms

    // Update timer display with throttling
    const updateTimer = useCallback((newTimeLeft: number) => {
        const roundedTimeLeft = Math.floor(newTimeLeft);
        const now = Date.now();

        if (now - lastUpdateTimeRef.current > UI_UPDATE_THRESHOLD) {
            lastUpdateTimeRef.current = now;
            setGameState(prev => ({
                ...prev,
                timer: roundedTimeLeft
            }));
        }
    }, []);

    // Local countdown timer management
    const startLocalTimer = useCallback((initialTime: number) => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (initialTime <= 0) return;

        // Set initial timer value immediately
        setGameState(prev => ({
            ...prev,
            timer: initialTime,
            timerStatus: 'play',
            gameStatus: 'active'
        }));

        // Use a local countdown variable to avoid React state race conditions
        let countdown = initialTime;

        // Start new countdown timer
        timerRef.current = setInterval(() => {
            countdown = Math.max(countdown - 1, 0);

            // Stop timer when reaching zero
            if (countdown === 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setGameState(prev => ({
                    ...prev,
                    timer: 0,
                    timerStatus: 'stop',
                    gameStatus: 'waiting'
                }));
            } else {
                setGameState(prev => ({
                    ...prev,
                    timer: countdown
                }));
            }
        }, 1000);
    }, []);

    // Stop local countdown timer
    const stopLocalTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Start local feedback countdown timer
    const startFeedbackTimer = useCallback((initialTime: number) => {
        // Clear any existing feedback timer
        if (feedbackTimerRef.current) {
            clearInterval(feedbackTimerRef.current);
            feedbackTimerRef.current = null;
        }

        if (initialTime <= 0) return;

        // Set initial feedback timer value immediately
        setGameState(prev => ({
            ...prev,
            feedbackRemaining: initialTime
        }));

        // Use a local countdown variable to avoid React state race conditions
        let feedbackCountdown = initialTime;

        // Start new feedback countdown timer
        feedbackTimerRef.current = setInterval(() => {
            feedbackCountdown = Math.max(feedbackCountdown - 1, 0);

            // Stop timer when reaching zero
            if (feedbackCountdown === 0) {
                if (feedbackTimerRef.current) {
                    clearInterval(feedbackTimerRef.current);
                    feedbackTimerRef.current = null;
                }
                setGameState(prev => ({
                    ...prev,
                    feedbackRemaining: 0,
                    phase: 'show_answers'
                }));
            } else {
                setGameState(prev => ({
                    ...prev,
                    feedbackRemaining: feedbackCountdown
                }));
            }
        }, 1000);
    }, []);

    // Stop local feedback countdown timer
    const stopFeedbackTimer = useCallback(() => {
        if (feedbackTimerRef.current) {
            clearInterval(feedbackTimerRef.current);
            feedbackTimerRef.current = null;
        }
    }, []);

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
        const s = io(SOCKET_CONFIG.url, socketConfig);

        s.connect();
        setSocket(s);

        // Connection event handlers
        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Student socket connected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            setError(null);
        });

        s.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn(`Student socket disconnected: ${reason}`);
            setConnected(false);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: false
            }));
        });

        s.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error("Student socket connection error:", err);
            setConnecting(false);
            setError(`Connection error: ${err.message}`);
        });

        s.on(SOCKET_EVENTS.GAME.RECONNECT, (attemptNumber) => {
            logger.info(`Student socket reconnected after ${attemptNumber} attempts`);
            setConnected(true);
            setError(null);
            // Auto-rejoin game after reconnection
            if (accessCode && userId && username) {
                s.emit(SOCKET_EVENTS.GAME.JOIN_GAME, {
                    accessCode,
                    userId,
                    username,
                    avatarEmoji: avatarEmoji || undefined,
                    isDiffered
                });
            }
        });

        return () => {
            logger.info(`Disconnecting student socket for game: ${accessCode}`);
            // TIMER MANAGEMENT OVERHAUL: Clean up local timer on disconnect
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (feedbackTimerRef.current) {
                clearInterval(feedbackTimerRef.current);
                feedbackTimerRef.current = null;
            }
            s.disconnect();
            setSocket(null);
            setConnected(false);
            setConnecting(false);
        };
    }, [accessCode, userId, username, avatarEmoji, isDiffered]);

    // --- Game Event Handlers ---
    useEffect(() => {
        if (!socket) return;

        // Handle successful game join
        socket.on(SOCKET_EVENTS.GAME.GAME_JOINED, (payload) => {
            logger.debug("Game joined successfully", payload);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'waiting'
            }));
        });

        // Handle game questions
        socket.on(SOCKET_EVENTS.GAME.GAME_QUESTION, (payload: GameQuestionPayload) => {
            logger.debug("Received game_question", payload);

            const roundedTime = payload.timer != null ? Math.floor(payload.timer) : 30;

            // Determine game status based on questionState and timer value
            let gameStatus: 'waiting' | 'active' | 'paused';
            if (payload.questionState === 'paused') {
                gameStatus = 'paused';
            } else if (roundedTime <= 0) {
                gameStatus = 'waiting';
            } else {
                gameStatus = 'active';
            }

            // Determine phase from payload or infer from game state
            const phase = payload.phase || 'question';
            const feedbackRemaining = payload.feedbackRemaining || null;

            setGameState(prev => ({
                ...prev,
                currentQuestion: payload.question,
                questionIndex: payload.questionIndex || 0,
                totalQuestions: payload.totalQuestions || 0,
                timer: roundedTime,
                answered: false,
                gameStatus,
                phase,
                feedbackRemaining,
                correctAnswers: null // Reset correct answers for new question
            }));

            // TIMER MANAGEMENT OVERHAUL: Start local countdown timer
            const timerStatus = payload.questionState === 'paused' ? 'pause' : 'play';
            setGameState(prev => ({
                ...prev,
                timerStatus
            }));

            // Start local countdown if not paused and timer > 0
            if (payload.questionState !== 'paused' && roundedTime > 0) {
                startLocalTimer(roundedTime);
            } else {
                stopLocalTimer();
            }

            // Start feedback timer if in feedback phase
            if (phase === 'feedback' && feedbackRemaining && feedbackRemaining > 0) {
                startFeedbackTimer(feedbackRemaining);
            } else {
                stopFeedbackTimer();
            }
        });

        // Handle timer updates
        socket.on(SOCKET_EVENTS.GAME.TIMER_UPDATE, (data: TimerUpdate) => {
            logger.debug("Received timer_update", data);

            if (typeof data.timeLeft === 'number') {
                // TIMER MANAGEMENT OVERHAUL: Manage local countdown based on status
                if (data.status === 'pause') {
                    stopLocalTimer();
                    setGameState(prev => ({
                        ...prev,
                        timer: data.timeLeft,
                        timerStatus: 'pause',
                        gameStatus: 'paused'
                    }));
                } else if (data.status === 'play' && data.timeLeft > 0) {
                    // Start local timer and let it manage the countdown
                    startLocalTimer(data.timeLeft);
                } else if (data.timeLeft === 0) {
                    stopLocalTimer();
                    setGameState(prev => ({
                        ...prev,
                        timer: 0,
                        timerStatus: data.status || 'stop',
                        gameStatus: 'waiting'
                    }));
                } else {
                    // For other cases, just update the display
                    setGameState(prev => ({
                        ...prev,
                        timer: data.timeLeft,
                        timerStatus: data.status || prev.timerStatus
                    }));
                }
            }
        });

        // Handle backend timer updates (new backend event)
        socket.on(SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED, (data: GameTimerUpdate) => {
            logger.debug("Received game_timer_updated", data);

            if (data.timer) {
                const timerObj = data.timer;
                let timeLeft = 0;
                let status: 'play' | 'pause' | 'stop' = 'stop';

                if (timerObj.isPaused) {
                    status = 'pause';
                    timeLeft = typeof timerObj.timeRemaining === 'number' ? Math.ceil(timerObj.timeRemaining / 1000) : 0;
                } else if (typeof timerObj.startedAt === 'number' && typeof timerObj.duration === 'number') {
                    const elapsed = Date.now() - timerObj.startedAt;
                    const remaining = Math.max(0, timerObj.duration - elapsed);
                    timeLeft = Math.ceil(remaining / 1000);
                    status = 'play';
                }

                // TIMER MANAGEMENT OVERHAUL: Manage local countdown based on status
                if (status === 'pause') {
                    stopLocalTimer();
                    setGameState(prev => ({
                        ...prev,
                        timer: timeLeft,
                        timerStatus: status,
                        gameStatus: 'paused'
                    }));
                } else if (status === 'play' && timeLeft > 0) {
                    // Start local timer and let it manage the countdown
                    startLocalTimer(timeLeft);
                } else {
                    stopLocalTimer();
                    setGameState(prev => ({
                        ...prev,
                        timer: timeLeft,
                        timerStatus: status,
                        gameStatus: timeLeft === 0 ? 'waiting' : prev.gameStatus
                    }));
                }
            }
        });

        // Handle game updates
        socket.on(SOCKET_EVENTS.GAME.GAME_UPDATE, (data: GameUpdate) => {
            logger.debug("Received game_update", data);

            setGameState(prev => {
                const updates: Partial<GameState> = {};

                if (typeof data.timeLeft === 'number') {
                    updates.timer = data.timeLeft;
                }

                if (data.status) {
                    updates.timerStatus = data.status;

                    if (data.status === 'pause') {
                        updates.gameStatus = 'paused';
                    } else if (data.status === 'play' && (data.timeLeft || prev.timer || 0) > 0) {
                        updates.gameStatus = 'active';
                    } else if (data.status === 'stop') {
                        updates.timer = 0;
                        updates.gameStatus = 'waiting';
                    }
                }

                return { ...prev, ...updates };
            });
        });

        // Handle timer set events
        socket.on(SOCKET_EVENTS.GAME.TIMER_SET, ({ timeLeft, questionState }) => {
            logger.debug("Received timer_set", { timeLeft, questionState });

            if (questionState === "stopped") {
                stopLocalTimer();
                setGameState(prev => ({
                    ...prev,
                    timer: 0,
                    gameStatus: 'waiting'
                }));
                return;
            }

            if (questionState === "paused") {
                stopLocalTimer();
                setGameState(prev => ({
                    ...prev,
                    timer: timeLeft,
                    timerStatus: 'pause',
                    gameStatus: 'paused'
                }));
                return;
            }

            // Active state - start local countdown
            setGameState(prev => ({
                ...prev,
                timer: timeLeft
            }));

            if (timeLeft > 0) {
                startLocalTimer(timeLeft);
                setGameState(prev => ({
                    ...prev,
                    timerStatus: 'play',
                    gameStatus: 'active'
                }));
            } else {
                stopLocalTimer();
                setGameState(prev => ({
                    ...prev,
                    gameStatus: 'waiting'
                }));
            }
        });

        // Handle answer responses
        socket.on(SOCKET_EVENTS.GAME.ANSWER_RECEIVED, (payload: AnswerReceived) => {
            logger.debug("Received answer_received", payload);

            setGameState(prev => ({
                ...prev,
                answered: true
            }));

            if (payload.rejected) {
                logger.warn("Answer was rejected", payload.message);
            } else if (payload.received) {
                logger.info("Answer was accepted");
            }
        });

        // Handle feedback events with backend timing
        socket.on(SOCKET_EVENTS.GAME.FEEDBACK, (payload: FeedbackEvent) => {
            logger.debug("Received feedback event", payload);

            const { questionId, feedbackRemaining } = payload;

            setGameState(prev => ({
                ...prev,
                phase: 'feedback',
                feedbackRemaining: feedbackRemaining
            }));

            // Start feedback countdown timer
            if (feedbackRemaining > 0) {
                startFeedbackTimer(feedbackRemaining);
            }
        });

        // Handle correct answers display
        socket.on(SOCKET_EVENTS.GAME.CORRECT_ANSWERS, (payload: CorrectAnswersEvent) => {
            logger.debug("Received correct_answers", payload);

            const { questionId } = payload;

            // Extract correct answers from current question if available
            let correctAnswers: number[] = [];

            setGameState(prev => {
                if (prev.currentQuestion && prev.currentQuestion.responses) {
                    correctAnswers = prev.currentQuestion.responses
                        .map((response, index) => response.correct ? index : -1)
                        .filter(index => index !== -1);
                } else if (prev.currentQuestion && prev.currentQuestion.correctAnswers) {
                    correctAnswers = prev.currentQuestion.correctAnswers
                        .map((isCorrect, index) => isCorrect ? index : -1)
                        .filter(index => index !== -1);
                }

                return {
                    ...prev,
                    correctAnswers,
                    phase: 'show_answers'
                };
            });
        });

        // Handle tournament answer results
        socket.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_ANSWER_RESULT, (payload: TournamentAnswerResult) => {
            logger.debug("Received tournament_answer_result", payload);

            const { questionUid, rejected, reason, message, registered, updated } = payload;

            // Create feedback object compatible with existing AnswerReceived interface
            const answerFeedback: AnswerReceived = {
                rejected: rejected || false,
                received: registered || false,
                message: message || '',
                questionId: questionUid
            };

            setGameState(prev => ({
                ...prev,
                answered: registered || false,
                lastAnswerFeedback: answerFeedback
            }));

            if (rejected) {
                logger.warn("Tournament answer was rejected", { reason, message });
            } else if (registered) {
                logger.info("Tournament answer was registered", { updated, message });
            }
        });

        // Handle game end
        socket.on(SOCKET_EVENTS.GAME.GAME_ENDED, (results) => {
            logger.debug("Game ended", results);
            setGameState(prev => ({
                ...prev,
                gameStatus: 'finished',
                timer: null
            }));
        });

        // Handle errors
        socket.on(SOCKET_EVENTS.GAME.GAME_ERROR, (error) => {
            logger.error("Game error received", error);
            setError(error.message || 'Unknown game error');
        });

        // Handle already played
        socket.on(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED, (payload) => {
            logger.info("Player has already played this game", payload);
            setError("You have already played this game");
        });

        // Handle redirect to lobby
        socket.on(SOCKET_EVENTS.GAME.GAME_REDIRECT_TO_LOBBY, (payload) => {
            logger.info("Redirected to lobby", payload);
            setGameState(prev => ({
                ...prev,
                gameStatus: 'waiting'
            }));
        });

        return () => {
            // TIMER MANAGEMENT OVERHAUL: Clean up local timer on unmount
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (feedbackTimerRef.current) {
                clearInterval(feedbackTimerRef.current);
                feedbackTimerRef.current = null;
            }
            socket.off(SOCKET_EVENTS.GAME.GAME_JOINED);
            socket.off(SOCKET_EVENTS.GAME.GAME_QUESTION);
            socket.off(SOCKET_EVENTS.GAME.TIMER_UPDATE);
            socket.off(SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED);
            socket.off(SOCKET_EVENTS.GAME.GAME_UPDATE);
            socket.off(SOCKET_EVENTS.GAME.TIMER_SET);
            socket.off(SOCKET_EVENTS.GAME.ANSWER_RECEIVED);
            socket.off(SOCKET_EVENTS.GAME.FEEDBACK);
            socket.off(SOCKET_EVENTS.GAME.CORRECT_ANSWERS);
            socket.off(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_ANSWER_RESULT);
            socket.off(SOCKET_EVENTS.GAME.GAME_ENDED);
            socket.off(SOCKET_EVENTS.GAME.GAME_ERROR);
            socket.off(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED);
            socket.off(SOCKET_EVENTS.GAME.GAME_REDIRECT_TO_LOBBY);
        };
    }, [socket]);

    // --- Action Functions ---
    const joinGame = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("Cannot join game: missing socket or parameters");
            return;
        }

        logger.info(`Joining game ${accessCode}`, { userId, username, isDiffered });

        socket.emit(SOCKET_EVENTS.GAME.JOIN_GAME, {
            accessCode,
            userId,
            username,
            avatarEmoji: avatarEmoji || undefined,
            isDiffered
        });
    }, [socket, accessCode, userId, username, avatarEmoji, isDiffered]);

    const submitAnswer = useCallback((questionId: string, answer: AnswerValue, timeSpent: number) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot submit answer: missing socket or parameters");
            return;
        }

        logger.info("Submitting answer", { questionId, answer, timeSpent });

        socket.emit(SOCKET_EVENTS.GAME.GAME_ANSWER, {
            accessCode,
            userId,
            questionId,
            answer,
            timeSpent
        });
    }, [socket, accessCode, userId]);

    const requestNextQuestion = useCallback((currentQuestionId: string) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot request next question: missing socket or parameters");
            return;
        }

        logger.info("Requesting next question", { currentQuestionId });

        socket.emit(SOCKET_EVENTS.GAME.REQUEST_NEXT_QUESTION, {
            accessCode,
            userId,
            currentQuestionId
        });
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
