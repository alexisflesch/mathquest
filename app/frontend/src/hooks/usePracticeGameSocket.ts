import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { Question } from '@shared/types/quiz/question';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { AnswerValue } from '@/types/socket';

const logger = createLogger('usePracticeGameSocket');

// --- Types ---
export interface FeedbackPayload {
    questionId: string;
    correct: boolean;
    explanation?: string;
    timeSpent?: number;
    scoreAwarded?: number;
    feedbackWaitTime?: number; // Optional timer for feedback phase
    correctAnswers?: boolean[]; // Array indicating which answers are correct
    correctAnswersText?: string[]; // Text of correct answers for display
}

export interface PracticeQuestion {
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
}

export interface PracticeQuestionPayload {
    question: PracticeQuestion;
    questionIndex: number;
    totalQuestions: number;
    timer?: number;
    questionState?: 'active' | 'paused' | 'stopped';
    currentQuestionIndex?: number; // For backward compatibility
}

export interface PracticeAnswerReceived {
    rejected?: boolean;
    received?: boolean;
    message?: string;
    correct?: boolean;
    questionId?: string;
    timeSpent?: number;
    correctAnswers?: boolean[];
    correctAnswersText?: string[]; // Added for better feedback display
    explanation?: string;
    scoreAwarded?: number;
}

export interface PracticeGameState {
    currentQuestion: PracticeQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    score: number;
    timer: number | null;
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
    answered: boolean;
    connectedToRoom: boolean;
    feedback: {
        correct?: boolean;
        explanation?: string;
        questionId?: string;
        timeSpent?: number;
        correctAnswers?: boolean[];
        correctAnswersText?: string[]; // Enhanced for better display
        scoreAwarded?: number;
    } | null;
    showingCorrectAnswers: boolean;
    // Enhanced for practice mode feedback experience
    isShowingFeedback: boolean;
    canProgressToNext: boolean;
}

export interface PracticeGameSocketHookProps {
    // Practice-specific configuration
    discipline?: string;
    level?: string;
    themes?: string[];
    questionLimit?: number;
    // User authentication
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
}

export interface PracticeGameSocketHook {
    socket: Socket | null;
    gameState: PracticeGameState;

    // Connection status
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Actions
    startPracticeSession: () => void;
    submitAnswer: (questionId: string, answer: AnswerValue, timeSpent: number) => void;
    requestNextQuestion: (currentQuestionId: string) => void;
    endPracticeSession: () => void;

    // UI helpers
    clearFeedback: () => void;
    resetSession: () => void;
}

export function usePracticeGameSocket({
    discipline = '',
    level = '',
    themes = [],
    questionLimit = 10,
    userId,
    username,
    avatarEmoji
}: PracticeGameSocketHookProps): PracticeGameSocketHook {

    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [gameState, setGameState] = useState<PracticeGameState>({
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: questionLimit,
        score: 0,
        timer: null,
        gameStatus: 'waiting',
        answered: false,
        connectedToRoom: false,
        feedback: null,
        showingCorrectAnswers: false,
        isShowingFeedback: false,
        canProgressToNext: false
    });

    // Refs for access code management
    const practiceAccessCodeRef = useRef<string | null>(null);

    // --- Socket Connection ---
    useEffect(() => {
        if (!userId || !username) return;

        logger.info(`Initializing practice socket connection for user: ${userId}`);
        setConnecting(true);
        setError(null);

        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const s = io(SOCKET_CONFIG.url, socketConfig);

        setSocket(s);

        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Practice socket connected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            setError(null);
        });

        s.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn(`Practice socket disconnected: ${reason}`);
            setConnected(false);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: false
            }));
        });

        s.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error("Practice socket connection error:", err);
            setConnecting(false);
            setError(`Connection error: ${err.message}`);
        });

        return () => {
            logger.info(`Disconnecting practice socket for user: ${userId}`);
            s.disconnect();
            setSocket(null);
            setConnected(false);
            setConnecting(false);
        };
    }, [userId, username]);

    // --- Game Event Handlers ---
    useEffect(() => {
        if (!socket) return;

        // Handle successful game join
        socket.on(SOCKET_EVENTS.GAME.GAME_JOINED, (payload) => {
            logger.debug("Practice game joined successfully", payload);

            // Store the access code for future use
            if (payload.accessCode) {
                practiceAccessCodeRef.current = payload.accessCode;
            }

            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'waiting'
            }));
        });

        // Handle practice questions
        socket.on(SOCKET_EVENTS.GAME.GAME_QUESTION, (payload: PracticeQuestionPayload) => {
            logger.debug("Received practice question", payload);

            // Handle both structured payload and flat question data
            const question = payload.question || payload;
            const questionIndex = payload.questionIndex ?? payload.currentQuestionIndex ?? 0;
            const totalQuestions = payload.totalQuestions ?? questionLimit;

            setGameState(prev => ({
                ...prev,
                currentQuestion: question,
                questionIndex: questionIndex,
                totalQuestions: totalQuestions,
                timer: null, // Practice mode: no enforced timers
                answered: false,
                feedback: null,
                showingCorrectAnswers: false,
                gameStatus: 'active'
            }));

            // Practice mode: No enforced timers - students have unlimited time
            logger.debug("Practice mode: Question received, no timer started (self-paced)");
        });

        // Handle answer responses with immediate feedback
        socket.on(SOCKET_EVENTS.GAME.ANSWER_RECEIVED, (payload: PracticeAnswerReceived) => {
            logger.debug("Received practice answer feedback", payload);

            // Extract correct answers text from current question if available
            let correctAnswersText: string[] = [];
            if (payload.correctAnswers && gameState.currentQuestion?.answers) {
                correctAnswersText = payload.correctAnswers
                    .map((isCorrect, index) => {
                        if (isCorrect && gameState.currentQuestion?.answers[index]) {
                            const answer = gameState.currentQuestion.answers[index];
                            return typeof answer === 'string' ? answer : answer.text;
                        }
                        return null;
                    })
                    .filter((text): text is string => text !== null);
            }

            // Create comprehensive feedback object from backend response
            const feedback = {
                correct: payload.correct,
                explanation: payload.explanation,
                questionId: payload.questionId,
                timeSpent: payload.timeSpent,
                correctAnswers: payload.correctAnswers,
                correctAnswersText: payload.correctAnswersText || correctAnswersText,
                scoreAwarded: payload.scoreAwarded
            };

            setGameState(prev => ({
                ...prev,
                answered: true,
                feedback: feedback,
                isShowingFeedback: true,
                canProgressToNext: true, // Enable progression after feedback
                score: payload.scoreAwarded ? prev.score + payload.scoreAwarded : prev.score
            }));

            // Practice mode: No timer to clear since we don't use enforced timers
            logger.info("Practice answer processed with enhanced feedback", {
                correct: payload.correct,
                hasExplanation: !!payload.explanation,
                correctAnswersCount: correctAnswersText.length
            });

            if (payload.rejected) {
                logger.warn("Practice answer was rejected", payload.message);
            } else if (payload.received) {
                logger.info("Practice answer was accepted", { correct: payload.correct });
            }
        });

        // Handle correct answers display
        socket.on(SOCKET_EVENTS.GAME.CORRECT_ANSWERS, (payload: { questionId: string }) => {
            logger.debug("Received correct answers for practice", payload);
            setGameState(prev => ({
                ...prev,
                showingCorrectAnswers: true
            }));
        });

        // Handle practice game end
        socket.on(SOCKET_EVENTS.GAME.GAME_ENDED, (results) => {
            logger.debug("Practice game ended", results);
            setGameState(prev => ({
                ...prev,
                gameStatus: 'finished',
                timer: null,
                score: results.score ?? prev.score
            }));
        });

        // Handle errors
        socket.on(SOCKET_EVENTS.GAME.GAME_ERROR, (error) => {
            logger.error("Practice game error received", error);
            setError(error.message || 'Unknown practice game error');
        });

        // Handle feedback event (ignored in practice mode - students have unlimited time)
        socket.on('feedback', (payload: { questionId: string, feedbackRemaining: number }) => {
            logger.debug("Received feedback event (ignored in practice mode)", payload);
            // Practice mode: Students have unlimited time to read feedback
            // Feedback events are only used for synchronized tournament/quiz experiences
            // No action taken - students can read at their own pace
        });

        return () => {
            socket.off(SOCKET_EVENTS.GAME.GAME_JOINED);
            socket.off(SOCKET_EVENTS.GAME.GAME_QUESTION);
            socket.off(SOCKET_EVENTS.GAME.ANSWER_RECEIVED);
            socket.off(SOCKET_EVENTS.GAME.CORRECT_ANSWERS);
            socket.off(SOCKET_EVENTS.GAME.GAME_ENDED);
            socket.off(SOCKET_EVENTS.GAME.GAME_ERROR);
            socket.off('feedback');
        };
    }, [socket, questionLimit]);

    // --- Action Functions ---
    const startPracticeSession = useCallback(() => {
        if (!socket || !userId || !username) {
            logger.warn("Cannot start practice session: missing socket or parameters");
            return;
        }

        logger.info("Starting practice session", {
            userId,
            username,
            discipline,
            level,
            themes,
            questionLimit
        });

        // Reset game state
        setGameState(prev => ({
            ...prev,
            currentQuestion: null,
            questionIndex: 0,
            totalQuestions: questionLimit,
            score: 0,
            timer: null,
            gameStatus: 'waiting',
            answered: false,
            connectedToRoom: false,
            feedback: null,
            showingCorrectAnswers: false,
            isShowingFeedback: false,
            canProgressToNext: false
        }));

        // Practice mode uses isDiffered: true to enable deferred/manual progression
        socket.emit(SOCKET_EVENTS.GAME.JOIN_GAME, {
            accessCode: 'PRACTICE', // Special identifier for practice mode
            userId,
            username,
            avatarEmoji: avatarEmoji || undefined,
            isDiffered: true,
            practiceMode: true,
            practiceConfig: {
                discipline,
                level,
                themes,
                questionLimit
            }
        });
    }, [socket, userId, username, avatarEmoji, discipline, level, themes, questionLimit]);

    const submitAnswer = useCallback((questionId: string, answer: AnswerValue, timeSpent: number) => {
        if (!socket || !userId) {
            logger.warn("Cannot submit practice answer: missing socket or parameters");
            return;
        }

        const accessCode = practiceAccessCodeRef.current || 'PRACTICE';

        logger.info("Submitting practice answer", { questionId, answer, timeSpent });

        socket.emit(SOCKET_EVENTS.GAME.GAME_ANSWER, {
            accessCode,
            userId,
            questionId,
            answer,
            timeSpent
        });
    }, [socket, userId]);

    const requestNextQuestion = useCallback((currentQuestionId: string) => {
        if (!socket || !userId) {
            logger.warn("Cannot request next practice question: missing socket or parameters");
            return;
        }

        const accessCode = practiceAccessCodeRef.current || 'PRACTICE';

        logger.info("Requesting next practice question", { currentQuestionId });

        socket.emit(SOCKET_EVENTS.GAME.REQUEST_NEXT_QUESTION, {
            accessCode,
            userId,
            currentQuestionId
        });
    }, [socket, userId]);

    const endPracticeSession = useCallback(() => {
        if (!socket || !userId) {
            logger.warn("Cannot end practice session: missing socket or parameters");
            return;
        }

        const accessCode = practiceAccessCodeRef.current || 'PRACTICE';

        logger.info("Ending practice session");

        socket.emit(SOCKET_EVENTS.GAME.GAME_ENDED, {
            accessCode,
            userId
        });

        // Reset local state
        setGameState(prev => ({
            ...prev,
            gameStatus: 'finished'
        }));
    }, [socket, userId]);

    // --- UI Helper Functions ---
    const clearFeedback = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            feedback: null,
            showingCorrectAnswers: false,
            isShowingFeedback: false,
            canProgressToNext: false
        }));
    }, []);

    const resetSession = useCallback(() => {
        setGameState({
            currentQuestion: null,
            questionIndex: 0,
            totalQuestions: questionLimit,
            score: 0,
            timer: null,
            gameStatus: 'waiting',
            answered: false,
            connectedToRoom: false,
            feedback: null,
            showingCorrectAnswers: false,
            isShowingFeedback: false,
            canProgressToNext: false
        });
        practiceAccessCodeRef.current = null;
        setError(null);
    }, [questionLimit]);

    return {
        socket,
        gameState,
        connected,
        connecting,
        error,
        startPracticeSession,
        submitAnswer,
        requestNextQuestion,
        endPracticeSession,
        clearFeedback,
        resetSession
    };
}
