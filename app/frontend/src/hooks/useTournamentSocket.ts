import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { Question } from '@shared/types/quiz/question';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { AnswerValue, SocketQuestion, AnswerFeedback } from '@/types/socket';

const logger = createLogger('useTournamentSocket');

// --- Types ---
export interface TournamentQuestion {
    uid: string;
    text: string;
    type: string;
    answers: string[] | { text: string; correct: boolean }[];
    correctAnswers?: boolean[];
    explanation?: string;
    tags?: string[];
    time?: number;
    difficulty?: number;
    discipline?: string;
    level?: string;
    themes?: string[];
    // Tournament-specific properties
    question?: SocketQuestion; // Nested question data with proper typing
    questionIndex?: number;
    totalQuestions?: number;
    timer?: number;
    questionState?: 'active' | 'paused' | 'stopped';
}

export interface TournamentAnswerReceived {
    rejected?: boolean;
    received?: boolean;
    message?: string;
    correct?: boolean;
    questionId?: string;
    timeSpent?: number;
    correctAnswers?: number[];
    explanation?: string;
}

export interface TournamentGameState {
    currentQuestion: TournamentQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    timer: number | null;
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
    answered: boolean;
    connectedToRoom: boolean;
    feedback: TournamentAnswerReceived | null;
    showingCorrectAnswers: boolean;
    paused: boolean;
    waiting: boolean;
}

export interface TournamentSocketHookProps {
    accessCode: string;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    isDiffered?: boolean;
}

export interface TournamentSocketHook {
    socket: Socket | null;
    gameState: TournamentGameState;

    // Connection status
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Actions
    joinTournament: () => void;
    submitAnswer: (questionId: string, answer: AnswerValue, timeSpent?: number) => void;

    // UI helpers
    clearFeedback: () => void;
    resetGameState: () => void;
}

export function useTournamentSocket({
    accessCode,
    userId,
    username,
    avatarEmoji,
    isDiffered = false
}: TournamentSocketHookProps): TournamentSocketHook {

    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [gameState, setGameState] = useState<TournamentGameState>({
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        timer: null,
        gameStatus: 'waiting',
        answered: false,
        connectedToRoom: false,
        feedback: null,
        showingCorrectAnswers: false,
        paused: false,
        waiting: false
    });

    // Refs for timer management
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Timer Functions ---
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback((initialTime: number) => {
        clearTimer();

        if (initialTime <= 0) {
            setGameState(prev => ({
                ...prev,
                timer: 0,
                waiting: true
            }));
            return;
        }

        setGameState(prev => ({
            ...prev,
            timer: initialTime,
            gameStatus: 'active',
            waiting: false
        }));

        timerRef.current = setInterval(() => {
            setGameState(prev => {
                const newTime = (prev.timer || 0) - 1;

                if (newTime <= 0) {
                    clearTimer();
                    return {
                        ...prev,
                        timer: 0,
                        waiting: true
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
            logger.warn("Cannot initialize tournament socket: missing required parameters");
            return;
        }

        logger.info(`Initializing tournament socket connection for ${accessCode}`);
        setConnecting(true);
        setError(null);

        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const s = io(SOCKET_CONFIG.url, socketConfig);

        setSocket(s);

        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Tournament socket connected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            setError(null);
        });

        s.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn(`Tournament socket disconnected: ${reason}`);
            setConnected(false);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: false
            }));
            clearTimer();
        });

        s.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error("Tournament socket connection error:", err);
            setConnecting(false);
            setError(`Connection error: ${err.message}`);
        });

        return () => {
            logger.info(`Disconnecting tournament socket for ${accessCode}`);
            clearTimer();
            s.disconnect();
            setSocket(null);
            setConnected(false);
            setConnecting(false);
        };
    }, [accessCode, userId, username, clearTimer]);

    // --- Game Event Handlers ---
    useEffect(() => {
        if (!socket) return;

        // Handle successful game join
        socket.on(SOCKET_EVENTS.GAME.GAME_JOINED, (payload) => {
            logger.debug("Tournament game joined successfully", payload);

            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'waiting'
            }));
        });

        // Handle tournament questions
        socket.on(SOCKET_EVENTS.GAME.GAME_QUESTION, (payload: TournamentQuestion) => {
            logger.debug("Received tournament question", payload);

            // Handle both structured payload and flat question data
            const question = payload.question || payload;
            const questionIndex = payload.questionIndex ?? 0;
            const totalQuestions = payload.totalQuestions ?? 0;
            const roundedTime = payload.timer != null ? Math.floor(payload.timer) : 20;

            setGameState(prev => ({
                ...prev,
                currentQuestion: question,
                questionIndex: questionIndex,
                totalQuestions: totalQuestions,
                timer: roundedTime,
                answered: false,
                feedback: null,
                showingCorrectAnswers: false,
                paused: payload.questionState === "paused",
                waiting: false,
                gameStatus: 'active'
            }));

            // Start timer if we have time and not paused
            if (roundedTime > 0 && payload.questionState !== "paused") {
                startTimer(roundedTime);
            }
        });

        // Handle timer updates
        socket.on(SOCKET_EVENTS.GAME.TIMER_UPDATE, (payload) => {
            logger.debug("Received timer update", payload);

            if (payload.status === 'pause') {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    paused: true,
                    timer: payload.timeLeft || prev.timer
                }));
            } else if (payload.status === 'play') {
                setGameState(prev => ({
                    ...prev,
                    paused: false
                }));
                if (payload.timeLeft && payload.timeLeft > 0) {
                    startTimer(payload.timeLeft);
                }
            } else if (payload.status === 'stop') {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    timer: 0,
                    waiting: true
                }));
            }
        });

        // Handle game updates (pause/resume/stop)
        socket.on(SOCKET_EVENTS.GAME.GAME_UPDATE, (update) => {
            logger.debug("Received game update", update);

            if (update.status === 'pause') {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    paused: true
                }));
            } else if (update.status === 'play') {
                setGameState(prev => ({
                    ...prev,
                    paused: false
                }));
                // Restart timer if we have time
                if (gameState.timer && gameState.timer > 0) {
                    startTimer(gameState.timer);
                }
            } else if (update.status === 'stop') {
                clearTimer();
                setGameState(prev => ({
                    ...prev,
                    timer: 0,
                    waiting: true
                }));
            }
        });

        // Handle timer set events
        socket.on(SOCKET_EVENTS.GAME.TIMER_SET, ({ timeLeft, questionState }) => {
            logger.debug('timer_set', { timeLeft, questionState });

            if (questionState === "stopped") {
                setGameState(prev => ({
                    ...prev,
                    timer: 0,
                    waiting: true
                }));
                clearTimer();
                return;
            }

            if (questionState === "paused") {
                setGameState(prev => ({
                    ...prev,
                    timer: timeLeft,
                    paused: true
                }));
                clearTimer();
                return;
            }

            // For active state
            setGameState(prev => ({
                ...prev,
                timer: timeLeft,
                paused: false,
                waiting: timeLeft === 0
            }));

            if (timeLeft > 0) {
                startTimer(timeLeft);
            } else {
                clearTimer();
            }
        });

        // Handle answer responses
        socket.on(SOCKET_EVENTS.GAME.ANSWER_RECEIVED, (payload: TournamentAnswerReceived) => {
            logger.debug("Received tournament answer feedback", payload);

            setGameState(prev => ({
                ...prev,
                answered: true,
                feedback: payload,
                waiting: true
            }));

            // Stop timer when answer is received
            clearTimer();
        });

        // Handle feedback timer for synchronized tournament experience
        socket.on('feedback', (payload: { questionId: string, feedbackRemaining: number }) => {
            logger.debug("Received feedback timer for tournament", payload);
            setGameState(prev => ({
                ...prev,
                feedbackTimer: payload.feedbackRemaining,
                showingFeedback: true
            }));

            // Start countdown for feedback phase
            if (payload.feedbackRemaining > 0) {
                setGameState(prev => ({ ...prev, timer: payload.feedbackRemaining }));
                startTimer(payload.feedbackRemaining);
            }
        });

        // Handle correct answers display
        socket.on(SOCKET_EVENTS.GAME.CORRECT_ANSWERS, (payload: { questionId: string; correctAnswers?: number[] }) => {
            logger.debug("Received correct answers for tournament", payload);
            setGameState(prev => ({
                ...prev,
                showingCorrectAnswers: true
            }));
        });

        // Handle tournament game end
        socket.on(SOCKET_EVENTS.GAME.GAME_ENDED, (results) => {
            logger.debug("Tournament game ended", results);
            clearTimer();
            setGameState(prev => ({
                ...prev,
                gameStatus: 'finished',
                timer: null,
                waiting: true
            }));
        });

        // Handle errors
        socket.on(SOCKET_EVENTS.GAME.GAME_ERROR, (error) => {
            logger.error("Tournament game error received", error);
            setError(error.message || 'Unknown tournament error');
        });

        // Handle already played
        socket.on(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED, (payload) => {
            logger.info("Player has already played this tournament", payload);
            setError("You have already played this tournament");
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
            socket.off(SOCKET_EVENTS.GAME.GAME_JOINED);
            socket.off(SOCKET_EVENTS.GAME.GAME_QUESTION);
            socket.off(SOCKET_EVENTS.GAME.TIMER_UPDATE);
            socket.off(SOCKET_EVENTS.GAME.GAME_UPDATE);
            socket.off(SOCKET_EVENTS.GAME.TIMER_SET);
            socket.off(SOCKET_EVENTS.GAME.ANSWER_RECEIVED);
            socket.off(SOCKET_EVENTS.GAME.CORRECT_ANSWERS);
            socket.off(SOCKET_EVENTS.GAME.GAME_ENDED);
            socket.off(SOCKET_EVENTS.GAME.GAME_ERROR);
            socket.off(SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED);
            socket.off(SOCKET_EVENTS.GAME.GAME_REDIRECT_TO_LOBBY);
        };
    }, [socket, startTimer, clearTimer, gameState.timer]);

    // --- Action Functions ---
    const joinTournament = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("Cannot join tournament: missing socket or parameters");
            return;
        }

        logger.info(`Joining tournament ${accessCode}`, { userId, username, avatarEmoji, isDiffered });

        socket.emit(SOCKET_EVENTS.GAME.JOIN_TOURNAMENT, {
            accessCode,
            userId,
            username,
            avatarEmoji: avatarEmoji || undefined,
            isDiffered
        });
    }, [socket, accessCode, userId, username, avatarEmoji, isDiffered]);

    const submitAnswer = useCallback((questionId: string, answer: AnswerValue, timeSpent = 0) => {
        if (!socket || !accessCode || !userId) {
            logger.warn("Cannot submit tournament answer: missing socket or parameters");
            return;
        }

        logger.info("Submitting tournament answer", { questionId, answer, timeSpent });

        socket.emit(SOCKET_EVENTS.GAME.GAME_ANSWER, {
            accessCode,
            userId,
            questionId,
            answer,
            timeSpent
        });
    }, [socket, accessCode, userId]);

    // --- UI Helper Functions ---
    const clearFeedback = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            feedback: null,
            showingCorrectAnswers: false
        }));
    }, []);

    const resetGameState = useCallback(() => {
        clearTimer();
        setGameState({
            currentQuestion: null,
            questionIndex: 0,
            totalQuestions: 0,
            timer: null,
            gameStatus: 'waiting',
            answered: false,
            connectedToRoom: false,
            feedback: null,
            showingCorrectAnswers: false,
            paused: false,
            waiting: false
        });
        setError(null);
    }, [clearTimer]);

    return {
        socket,
        gameState,
        connected,
        connecting,
        error,
        joinTournament,
        submitAnswer,
        clearFeedback,
        resetGameState
    };
}
