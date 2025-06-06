/**
 * Modern Student Game Socket Hook (No Legacy Code)
 * 
 * Complete rewrite using the unified timer management system.
 * Provides the exact interface expected by the live game component.
 * 
 * Phase 2: Timer Management Consolidation - Clean Modern Implementation
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createLogger } from '@/clientLogger';
import { useStudentGameManager } from '../useUnifiedGameManager';

const logger = createLogger('useStudentGameSocket');

// Modern interfaces based on actual component usage
export interface StudentGameQuestion {
    uid: string;
    text: string;
    type: string;
    answers?: string[];
    answerOptions?: string[];
    explanation?: string;
    correctAnswers?: number[];
}

export interface AnswerFeedback {
    correct: boolean;
    explanation?: string;
    points?: number;
    correctAnswers?: number[];
}

export interface StudentGameState {
    // Core game state
    gameStatus: 'waiting' | 'active' | 'finished' | 'paused';
    phase: 'question' | 'feedback' | 'show_answers';
    currentQuestion: StudentGameQuestion | null;

    // Timer state
    timer: number | null; // Time remaining in seconds

    // Answer state
    answered: boolean;
    lastAnswerFeedback: AnswerFeedback | null;
    correctAnswers: number[] | null;

    // Feedback timing
    feedbackRemaining: number | null;

    // Game progression
    questionIndex: number;
    totalQuestions: number;

    // Mode detection
    gameMode: 'tournament' | 'quiz' | 'practice';
    linkedQuizId: string | null;
}

export interface StudentGameSocketHookProps {
    accessCode: string | null;
    userId: string;
    username: string;
    avatarEmoji: string;
    isDiffered?: boolean;
}

export interface StudentGameSocketHook {
    // Core state
    gameState: StudentGameState;
    socket: any;

    // Connection state
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Actions
    joinGame: () => void;
    submitAnswer: (questionId: string, answer: number | number[], clientTimestamp: number) => void;
    requestNextQuestion: (questionId: string) => void;
}

/**
 * Modern Student Game Socket Hook
 * 
 * Built from scratch using the unified timer system.
 * Provides exactly what the live game component expects.
 */
export function useStudentGameSocket(props: StudentGameSocketHookProps): StudentGameSocketHook {
    const { accessCode, userId, username, avatarEmoji, isDiffered = false } = props;

    // Use unified game manager
    const gameManager = useStudentGameManager(accessCode, userId, username, avatarEmoji);

    // Local state for game-specific data
    const [currentQuestion, setCurrentQuestion] = useState<StudentGameQuestion | null>(null);
    const [lastAnswerFeedback, setLastAnswerFeedback] = useState<AnswerFeedback | null>(null);
    const [answered, setAnswered] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState<number[] | null>(null);
    const [gamePhase, setGamePhase] = useState<'question' | 'feedback' | 'show_answers'>('question');
    const [feedbackRemaining, setFeedbackRemaining] = useState<number | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [linkedQuizId, setLinkedQuizId] = useState<string | null>(null);

    // Determine game mode
    const gameMode = useMemo(() => {
        if (isDiffered && !linkedQuizId) return 'practice';
        if (linkedQuizId) return 'quiz';
        return 'tournament';
    }, [isDiffered, linkedQuizId]);

    // Set up socket event handlers
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const socket = gameManager.socket.instance;
        const handlers: { [key: string]: (...args: unknown[]) => void } = {};

        // Question received
        handlers.game_question = (data: any) => {
            logger.debug('Received game_question', data);

            setCurrentQuestion({
                uid: data.question?.uid || data.uid,
                text: data.question?.text || data.text,
                type: data.question?.type || data.type,
                answers: data.question?.answers || data.answers || data.answerOptions,
                answerOptions: data.question?.answerOptions || data.answerOptions || data.answers,
                explanation: data.question?.explanation || data.explanation,
                correctAnswers: data.question?.correctAnswers || data.correctAnswers
            });

            setAnswered(false);
            setLastAnswerFeedback(null);
            setCorrectAnswers(null);
            setGamePhase('question');
            setFeedbackRemaining(null);

            if (data.questionIndex !== undefined) setQuestionIndex(data.questionIndex);
            if (data.totalQuestions !== undefined) setTotalQuestions(data.totalQuestions);
        };

        // Answer feedback
        handlers.answer_feedback = (data: any) => {
            logger.debug('Received answer_feedback', data);

            const feedback: AnswerFeedback = {
                correct: data.correct,
                explanation: data.explanation,
                points: data.points,
                correctAnswers: data.correctAnswers
            };

            setLastAnswerFeedback(feedback);
            setCorrectAnswers(data.correctAnswers || null);

            if (gameMode === 'practice') {
                // In practice mode, show feedback immediately
                setGamePhase('feedback');
            }
        };

        // Answer received confirmation
        handlers.answer_received = (data: any) => {
            logger.debug('Answer received confirmation', data);
            setAnswered(true);
        };

        // Game joined
        handlers.game_joined = (data: any) => {
            logger.debug('Game joined', data);

            if (data.gameInfo) {
                setLinkedQuizId(data.gameInfo.linkedQuizId || null);
                setTotalQuestions(data.gameInfo.totalQuestions || 0);
            }
        };

        // Feedback phase (tournament/quiz modes)
        handlers.feedback_phase = (data: any) => {
            logger.debug('Feedback phase started', data);
            setGamePhase('feedback');
            setFeedbackRemaining(data.duration || null);

            if (data.correctAnswers) {
                setCorrectAnswers(data.correctAnswers);
            }
        };

        // Show answers phase
        handlers.show_answers = (data: any) => {
            logger.debug('Show answers phase', data);
            setGamePhase('show_answers');
            setCorrectAnswers(data.correctAnswers || null);
        };

        // Tournament/game info
        handlers.tournament_info = (data: any) => {
            logger.debug('Tournament info', data);
            setLinkedQuizId(data.linkedQuizId || null);
            setTotalQuestions(data.totalQuestions || 0);
        };

        // Register all handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        // Cleanup
        return () => {
            Object.entries(handlers).forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        };
    }, [gameManager.socket.instance, gameMode]);

    // Handle feedback timer countdown
    useEffect(() => {
        if (feedbackRemaining !== null && feedbackRemaining > 0) {
            const timer = setTimeout(() => {
                setFeedbackRemaining(prev => prev !== null && prev > 0 ? prev - 1 : null);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (feedbackRemaining === 0) {
            setGamePhase('question');
            setFeedbackRemaining(null);
        }
    }, [feedbackRemaining]);

    // Actions
    const joinGame = useCallback(() => {
        if (!gameManager.socket.instance || !accessCode || !userId || !username) return;

        logger.info('Joining game', { accessCode, userId, username, isDiffered });

        gameManager.socket.instance.emit('join_game', {
            accessCode,
            userId,
            username,
            avatarEmoji,
            isDiffered
        });
    }, [gameManager.socket.instance, accessCode, userId, username, avatarEmoji, isDiffered]);

    const submitAnswer = useCallback((questionId: string, answer: number | number[], clientTimestamp: number) => {
        if (!gameManager.socket.instance || answered) return;

        logger.info('Submitting answer', { questionId, answer, clientTimestamp });

        gameManager.socket.instance.emit('submit_answer', {
            questionId,
            answer,
            accessCode,
            userId,
            clientTimestamp
        });
    }, [gameManager.socket.instance, accessCode, userId, answered]);

    const requestNextQuestion = useCallback((questionId: string) => {
        if (!gameManager.socket.instance) return;

        logger.info('Requesting next question', { questionId });

        gameManager.socket.instance.emit('request_next_question', {
            accessCode,
            userId,
            currentQuestionId: questionId
        });
    }, [gameManager.socket.instance, accessCode, userId]);

    // Build game state
    const gameState: StudentGameState = {
        gameStatus: gameManager.gameState.gameStatus,
        phase: gamePhase,
        currentQuestion,
        timer: gameManager.gameState.isTimerRunning ? gameManager.timer.getDisplayTime() : null,
        answered,
        lastAnswerFeedback,
        correctAnswers,
        feedbackRemaining,
        questionIndex,
        totalQuestions,
        gameMode,
        linkedQuizId
    };

    return {
        gameState,
        socket: gameManager.socket.instance,
        connected: gameManager.gameState.connected,
        connecting: gameManager.gameState.connecting,
        error: gameManager.gameState.error,
        joinGame,
        submitAnswer,
        requestNextQuestion
    };
}
