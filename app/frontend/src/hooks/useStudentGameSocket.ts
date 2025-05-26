
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { Question } from '@shared/types/quiz/question';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';

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
}

export interface TimerUpdate {
    timeLeft: number;
    status?: 'play' | 'pause' | 'stop';
    timestamp?: number;
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

export interface GameState {
    currentQuestion: StudentGameQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    timer: number | null;
    timerStatus: 'play' | 'pause' | 'stop';
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
    answered: boolean;
    connectedToRoom: boolean;
}

export interface StudentGameSocketHookProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarUrl?: string | null;
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
    submitAnswer: (questionId: string, answer: any, timeSpent: number) => void;
    requestNextQuestion: (currentQuestionId: string) => void;

    // Event handlers (optional callbacks)
    onQuestionReceived?: (question: GameQuestionPayload) => void;
    onAnswerReceived?: (result: AnswerReceived) => void;
    onGameEnded?: (results: any) => void;
    onGameError?: (error: any) => void;
    onCorrectAnswers?: (payload: { questionId: string, correctAnswers: number[] }) => void;
}

export function useStudentGameSocket({
    accessCode,
    userId,
    username,
    avatarUrl,
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
        connectedToRoom: false
    });

    // Refs for timer management
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const UI_UPDATE_THRESHOLD = 200; // Only update UI state every 200ms

    // Update timer with throttling to avoid unnecessary re-renders
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

    // Clear timer function
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Start timer countdown
    const startTimer = useCallback((initialTime: number) => {
        clearTimer();

        if (initialTime <= 0) {
            setGameState(prev => ({
                ...prev,
                timer: 0,
                gameStatus: 'waiting'
            }));
            return;
        }

        setGameState(prev => ({
            ...prev,
            timer: initialTime,
            timerStatus: 'play'
        }));

        timerRef.current = setInterval(() => {
            setGameState(prev => {
                if (prev.timerStatus === 'pause') {
                    return prev;
                }

                const newTime = (prev.timer || 0) - 1;

                if (newTime <= 0) {
                    clearTimer();
                    return {
                        ...prev,
                        timer: 0,
                        gameStatus: 'waiting'
                    };
                }

                return {
                    ...prev,
                    timer: newTime
                };
            });
        }, 1000);
    }, [clearTimer]);

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
        s.on("connect", () => {
            logger.info(`Student socket connected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            setError(null);
        });

        s.on("disconnect", (reason) => {
            logger.warn(`Student socket disconnected: ${reason}`);
            setConnected(false);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: false
            }));
            clearTimer();
        });

        s.on("connect_error", (err) => {
            logger.error("Student socket connection error:", err);
            setConnecting(false);
            setError(`Connection error: ${err.message}`);
        });

        s.on("reconnect", (attemptNumber) => {
            logger.info(`Student socket reconnected after ${attemptNumber} attempts`);
            setConnected(true);
            setError(null);
            // Auto-rejoin game after reconnection
            if (accessCode && userId && username) {
                s.emit("join_game", {
                    accessCode,
                    userId,
                    username,
                    avatarUrl: avatarUrl || undefined,
                    isDiffered
                });
            }
        });

        return () => {
            logger.info(`Disconnecting student socket for game: ${accessCode}`);
            clearTimer();
            s.disconnect();
            setSocket(null);
            setConnected(false);
            setConnecting(false);
        };
    }, [accessCode, userId, username, avatarUrl, isDiffered, clearTimer]);

    // --- Game Event Handlers ---
    useEffect(() => {
        if (!socket) return;

        // Handle successful game join
        socket.on("game_joined", (payload) => {
            logger.debug("Game joined successfully", payload);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'waiting'
            }));
        });

        // Handle game questions
        socket.on("game_question", (payload: GameQuestionPayload) => {
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

            setGameState(prev => ({
                ...prev,
                currentQuestion: payload.question,
                questionIndex: payload.questionIndex || 0,
                totalQuestions: payload.totalQuestions || 0,
                timer: roundedTime,
                answered: false,
                gameStatus
            }));

            // Start timer if not paused and timer > 0
            if (payload.questionState !== 'paused' && roundedTime > 0) {
                startTimer(roundedTime);
            }
        });

        // Handle timer updates
        socket.on("timer_update", (data: TimerUpdate) => {
            logger.debug("Received timer_update", data);

            if (typeof data.timeLeft === 'number') {
                setGameState(prev => ({
                    ...prev,
                    timer: data.timeLeft,
                    timerStatus: data.status || prev.timerStatus
                }));

                if (data.status === 'pause') {
                    clearTimer();
                    setGameState(prev => ({
                        ...prev,
                        gameStatus: 'paused'
                    }));
                } else if (data.status === 'play' && data.timeLeft > 0) {
                    startTimer(data.timeLeft);
                    setGameState(prev => ({
                        ...prev,
                        gameStatus: 'active'
                    }));
                } else if (data.timeLeft === 0) {
                    clearTimer();
                    setGameState(prev => ({
                        ...prev,
                        gameStatus: 'waiting'
                    }));
                }
            }
        });

        // Handle game updates
        socket.on("game_update", (data: GameUpdate) => {
            logger.debug("Received game_update", data);

            setGameState(prev => {
                const updates: Partial<GameState> = {};

                if (typeof data.timeLeft === 'number') {
                    updates.timer = data.timeLeft;
                }

                if (data.status) {
                    updates.timerStatus = data.status;

                    if (data.status === 'pause') {
                        clearTimer();
                        updates.gameStatus = 'paused';
                    } else if (data.status === 'play' && (data.timeLeft || prev.timer || 0) > 0) {
                        startTimer(data.timeLeft || prev.timer || 0);
                        updates.gameStatus = 'active';
                    } else if (data.status === 'stop') {
                        clearTimer();
                        updates.timer = 0;
                        updates.gameStatus = 'waiting';
                    }
                }

                return { ...prev, ...updates };
            });
        });

        // Handle timer set events
        socket.on("timer_set", ({ timeLeft, questionState }) => {
            logger.debug("Received timer_set", { timeLeft, questionState });

            if (questionState === "stopped") {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    timer: 0,
                    gameStatus: 'waiting'
                }));
                return;
            }

            if (questionState === "paused") {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    timer: timeLeft,
                    timerStatus: 'pause',
                    gameStatus: 'paused'
                }));
                return;
            }

            // Active state
            setGameState(prev => ({
                ...prev,
                timer: timeLeft
            }));

            if (timeLeft > 0) {
                startTimer(timeLeft);
            } else {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    gameStatus: 'waiting'
                }));
            }
        });

        // Handle answer responses
        socket.on("answer_received", (payload: AnswerReceived) => {
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

        // Handle correct answers display
        socket.on("correct_answers", (payload: { questionId: string }) => {
            logger.debug("Received correct_answers", payload);
            // This event signals that the correct answers should be displayed
            // The actual correct answers are typically derived from the question object
        });

        // Handle game end
        socket.on("game_ended", (results) => {
            logger.debug("Game ended", results);
            clearTimer();
            setGameState(prev => ({
                ...prev,
                gameStatus: 'finished',
                timer: null
            }));
        });

        // Handle errors
        socket.on("game_error", (error) => {
            logger.error("Game error received", error);
            setError(error.message || 'Unknown game error');
        });

        // Handle already played
        socket.on("game_already_played", (payload) => {
            logger.info("Player has already played this game", payload);
            setError("You have already played this game");
        });

        // Handle redirect to lobby
        socket.on("game_redirect_to_lobby", (payload) => {
            logger.info("Redirected to lobby", payload);
            setGameState(prev => ({
                ...prev,
                gameStatus: 'waiting'
            }));
        });

        return () => {
            socket.off("game_joined");
            socket.off("game_question");
            socket.off("timer_update");
            socket.off("game_update");
            socket.off("timer_set");
            socket.off("answer_received");
            socket.off("correct_answers");
            socket.off("game_ended");
            socket.off("game_error");
            socket.off("game_already_played");
            socket.off("game_redirect_to_lobby");
        };
    }, [socket, startTimer, clearTimer]);

    // --- Action Functions ---
    const joinGame = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("Cannot join game: missing socket or parameters");
            return;
        }

        logger.info(`Joining game ${accessCode}`, { userId, username, isDiffered });

        socket.emit("join_game", {
            accessCode,
            userId,
            username,
            avatarUrl: avatarUrl || undefined,
            isDiffered
        });
    }, [socket, accessCode, userId, username, avatarUrl, isDiffered]);

    const submitAnswer = useCallback((questionId: string, answer: any, timeSpent: number) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot submit answer: missing socket or parameters");
            return;
        }

        logger.info("Submitting answer", { questionId, answer, timeSpent });

        socket.emit("game_answer", {
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

        socket.emit("request_next_question", {
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
