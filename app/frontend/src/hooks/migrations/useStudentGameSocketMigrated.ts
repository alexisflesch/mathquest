/**
 * Modern Student Game Socket Hook (No Legacy Code)
 * 
 * Complete rewrite using the unified timer management system and core types.
 * Provides the exact interface expected by the live game component.
 * 
 * Phase 3: Frontend Type Consolidation - Uses core types from @shared/types
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createLogger } from '@/clientLogger';
import { useStudentGameManager } from '../useUnifiedGameManager';

// Import core types instead of local interfaces
import type {
    Question,
    AnswerResponsePayload
} from '@shared/types/core';
import type { ServerToClientEvents } from '@shared/types/socketEvents';

const logger = createLogger('useStudentGameSocket');

// Modern interfaces based on core types and actual component usage
export interface StudentGameQuestion {
    uid: string;
    text: string;
    questionType: string;
    answerOptions: string[];
    answers?: string[]; // Legacy field for backward compatibility
    correctAnswers?: boolean[];
    explanation?: string;
    timeLimit?: number;
    gradeLevel?: string;
    difficulty?: number;
    themes?: string[];
}

export interface AnswerFeedback {
    correct: boolean;
    explanation?: string;
    points?: number;
    correctAnswers?: boolean[];
    questionId?: string;
    timeSpent?: number;
    score?: number;
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
    correctAnswers: boolean[] | null;

    // Feedback timing
    feedbackRemaining: number | null;

    // Game progression
    questionIndex: number;
    totalQuestions: number;

    // Mode detection
    gameMode: 'tournament' | 'quiz';
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
    const [correctAnswers, setCorrectAnswers] = useState<boolean[] | null>(null);
    const [gamePhase, setGamePhase] = useState<'question' | 'feedback' | 'show_answers'>('question');
    const [feedbackRemaining, setFeedbackRemaining] = useState<number | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [linkedQuizId, setLinkedQuizId] = useState<string | null>(null);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'finished' | 'paused'>('waiting');
    const [isDifferedMode, setIsDifferedMode] = useState(isDiffered);

    // FRONTEND TIMER: Re-enabled since unified timer not working properly
    const [frontendTimer, setFrontendTimer] = useState<number | null>(null);
    const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
    const [timerUpdateCounter, setTimerUpdateCounter] = useState(0); // Force re-renders during countdown

    // Determine game mode based on actual backend behavior  
    const gameMode = useMemo(() => {
        if (linkedQuizId) return 'quiz'; // Teacher-driven quiz
        if (isDifferedMode) return 'tournament'; // Deferred tournament (still timed, but asynchronous)
        return 'tournament'; // Live tournament (synchronized)
    }, [isDifferedMode, linkedQuizId]);

    // Add custom listeners for new backend events (in addition to unified game manager)
    useEffect(() => {
        if (!gameManager.socket.instance) return;

        const socket = gameManager.socket.instance;
        const handlers: { [key: string]: (...args: unknown[]) => void } = {};

        logger.info('=== REGISTERING SOCKET EVENT HANDLERS ===');

        // 🔥 CRITICAL DEBUG: Log ALL socket events received (but only once)
        const logAllEvents = (eventName: string, ...args: unknown[]) => {
            console.log(`🔴 SOCKET EVENT RECEIVED: ${eventName}`, args);
            logger.info(`SOCKET EVENT: ${eventName}`, args);

            // Special handling for answer-related events
            if (eventName === 'answer_received' || eventName === 'game_answer_received' || eventName === 'feedback') {
                console.log(`🔥 ANSWER/FEEDBACK EVENT: ${eventName}`, args);
                logger.info(`🔥 ANSWER/FEEDBACK EVENT: ${eventName}`, args);
            }
        };
        socket.onAny(logAllEvents);        // CRITICAL FIX: Listen to game_timer_updated for timer data
        handlers.game_timer_updated = (data: any) => {
            logger.info('=== GAME TIMER UPDATED ===', data);
            if (data && data.timer) {
                const timer = data.timer;
                let timeLeftMs = 0; // Keep in milliseconds

                if (timer.isPaused) {
                    timeLeftMs = timer.timeRemaining || 0; // Keep in milliseconds
                } else if (timer.startedAt && timer.durationMs) {
                    const elapsed = Date.now() - timer.startedAt;
                    const remaining = Math.max(0, timer.durationMs - elapsed);
                    timeLeftMs = remaining; // Keep in milliseconds
                } else {
                    timeLeftMs = timer.durationMs || 0; // Keep in milliseconds
                }

                // CRITICAL FIX: Start frontend countdown timer
                if (timeLeftMs > 0) {
                    setFrontendTimer(timeLeftMs);
                    setTimerStartTime(Date.now());
                    logger.info('=== FRONTEND TIMER STARTED FROM GAME_TIMER_UPDATED ===', { timeLeftMs, startTime: Date.now() });
                } else {
                    setFrontendTimer(null);
                    setTimerStartTime(null);
                }

                logger.info('=== TIMER UPDATED ===', { timeLeftMs, timerObject: timer });
            }
        };

        // CRITICAL FIX: Listen to game_question for timer data (backend sends timer in this event)
        handlers.game_question = (data: any) => {
            logger.info('=== GAME QUESTION RECEIVED ===', data);

            // CRITICAL FIX: Extract timer from game_question payload (backend sends it here)
            if (data && data.timer && typeof data.timer === 'number' && data.timer > 0) {
                setFrontendTimer(data.timer);
                setTimerStartTime(Date.now());
                logger.info('=== FRONTEND TIMER STARTED FROM QUESTION ===', { timeLeftMs: data.timer, startTime: Date.now() });
            }

            // Let the unified game manager handle the question data
            // Don't extract question data here to avoid conflicts
        };

        // NOTE: We removed the game_question handler because it conflicts with unified game manager
        // The unified game manager will handle game_question and store the data in currentQuestionData
        // We'll extract that data in a separate useEffect below

        // Answer received confirmation from new backend
        handlers.answer_received = (data: any) => {
            logger.info('=== ANSWER RECEIVED ===', data);
            setAnswered(true);

            // Store the correct status for feedback display
            if (data.correct !== undefined) {
                const feedback: AnswerFeedback = {
                    correct: data.correct,
                    explanation: data.explanation,
                    points: data.points,
                    correctAnswers: data.correctAnswers,
                    questionId: data.questionId
                };
                setLastAnswerFeedback(feedback);
                logger.info('=== FEEDBACK SET FROM ANSWER_RECEIVED ===', feedback);

                // ONLY trigger immediate feedback for deferred (self-paced) mode
                // For live tournaments, wait for the backend 'feedback' event
                if (isDiffered) {
                    logger.info('🔄 PHASE CHANGE: → feedback (from answer_received - deferred mode)');
                    setGamePhase('feedback');

                    // Set a default feedback display time for deferred mode
                    if (!feedbackRemaining) {
                        setFeedbackRemaining(10); // Longer for deferred mode
                        logger.info('=== DEFERRED MODE FEEDBACK TIMER SET: 10 seconds ===');
                    }
                } else {
                    logger.info('🔄 LIVE TOURNAMENT MODE: Waiting for backend feedback event (not showing immediate feedback)');
                }
            }
        };

        // Game joined confirmation from new backend
        handlers.game_joined = (data: any) => {
            logger.debug('Game joined confirmation from new backend', data);

            if (data.gameStatus) {
                setGameStatus(data.gameStatus);
            }

            if (data.isDiffered !== undefined) {
                setIsDifferedMode(data.isDiffered);
            }

            // Extract game info
            const gameInfo = data.gameInfo || data;
            if (gameInfo.linkedQuizId) {
                setLinkedQuizId(gameInfo.linkedQuizId);
            }
            if (gameInfo.totalQuestions) {
                setTotalQuestions(gameInfo.totalQuestions);
            }

            // CRITICAL FIX: For deferred tournaments, request the first question
            if (data.isDiffered && gameManager.socket.instance && accessCode && userId) {
                logger.info('=== DEFERRED TOURNAMENT: REQUESTING FIRST QUESTION ===');
                gameManager.socket.instance.emit('request_next_question', {
                    accessCode,
                    userId,
                    currentQuestionId: null // null means request first question
                });
            }
        };

        // New backend specific events
        handlers.correct_answers = (data: any) => {
            logger.info('=== CORRECT ANSWERS EVENT ===', data);
            logger.info('🔄 PHASE CHANGE: → show_answers');
            setGamePhase('show_answers');

            // CRITICAL FIX: Get correct answers from database question data
            // Since backend hides correct answers during question phase, we need to fetch them
            setCurrentQuestion(currentQ => {
                if (!currentQ) {
                    logger.warn('=== NO CURRENT QUESTION FOR CORRECT ANSWERS ===');
                    return currentQ;
                }

                // Check if question already has correct answers populated
                if (currentQ.correctAnswers && Array.isArray(currentQ.correctAnswers) && currentQ.correctAnswers.some(answer => answer === true)) {
                    setCorrectAnswers(currentQ.correctAnswers);
                    logger.info('=== CORRECT ANSWERS SET FROM CURRENT QUESTION ===', currentQ.correctAnswers);
                }
                // Check payload for correct answers (fallback)
                else if (data.correctAnswers && Array.isArray(data.correctAnswers)) {
                    setCorrectAnswers(data.correctAnswers);
                    logger.info('=== CORRECT ANSWERS SET FROM PAYLOAD ===', data.correctAnswers);
                }
                // FALLBACK: Request correct answers from the unified game manager
                else {
                    logger.warn('=== FETCHING CORRECT ANSWERS FROM UNIFIED GAME MANAGER ===');
                    // The unified game manager should have the complete question data including correct answers
                    const questionData = gameManager.gameState.currentQuestionData;
                    if (questionData && questionData.question && questionData.question.correctAnswers) {
                        setCorrectAnswers(questionData.question.correctAnswers);
                        logger.info('=== CORRECT ANSWERS SET FROM GAME MANAGER ===', questionData.question.correctAnswers);
                    } else {
                        logger.error('=== NO CORRECT ANSWERS AVAILABLE ANYWHERE ===', {
                            currentQuestion: currentQ,
                            payloadCorrectAnswers: data.correctAnswers,
                            gameManagerQuestion: questionData?.question?.correctAnswers
                        });
                    }
                }
                return currentQ; // Return current state unchanged
            });
        };

        handlers.feedback = (data: any) => {
            logger.info('=== FEEDBACK EVENT RECEIVED ===', data);
            logger.info('🔄 PHASE CHANGE: → feedback (from feedback event)');
            setGamePhase('feedback');

            // Log all fields in the feedback event for debugging
            logger.info('=== FEEDBACK EVENT DETAILED ANALYSIS ===', {
                questionId: data.questionId,
                feedbackRemaining: data.feedbackRemaining,
                explanation: data.explanation,
                hasExplanation: !!data.explanation,
                allKeys: Object.keys(data),
                fullData: JSON.stringify(data)
            });

            // Backend sends feedbackRemaining (not feedbackWaitTime)
            if (data.feedbackRemaining && typeof data.feedbackRemaining === 'number') {
                setFeedbackRemaining(data.feedbackRemaining);
                logger.info('=== FEEDBACK TIMER SET FROM BACKEND ===', { feedbackRemaining: data.feedbackRemaining });
            } else {
                // Default feedback time if not provided
                setFeedbackRemaining(3);
                logger.info('=== FEEDBACK TIMER SET TO DEFAULT: 3 seconds ===');
            }

            // Update feedback with explanation from backend (preserve existing correctness info)
            setLastAnswerFeedback(prevFeedback => {
                const updatedFeedback: AnswerFeedback = {
                    correct: prevFeedback?.correct ?? false, // Preserve existing correct status or default to false
                    explanation: data.explanation || currentQuestion?.explanation, // Add explanation from backend or question
                    questionId: data.questionId,
                    points: prevFeedback?.points,
                    correctAnswers: prevFeedback?.correctAnswers,
                    timeSpent: prevFeedback?.timeSpent,
                    score: prevFeedback?.score
                };
                logger.info('=== FEEDBACK UPDATED WITH EXPLANATION ===', {
                    prevFeedback,
                    updatedFeedback,
                    explanationSource: data.explanation ? 'backend' : 'question'
                });
                return updatedFeedback;
            });
        };

        handlers.game_end = (data: any) => {
            logger.debug('Received game_end from backend', data);
            setGameStatus('finished');
            setGamePhase('show_answers');
            logger.info('🎯 GAME STATUS CHANGED: → finished (from game_end event)');
        };

        handlers.game_ended = (data: any) => {
            logger.debug('Received game_ended from backend', data);
            setGameStatus('finished');
            setGamePhase('show_answers');
        };

        handlers.game_error = (data: any) => {
            if (data && Object.keys(data).length > 0) {
                logger.error('Game error from new backend', data);
            } else {
                logger.warn('Received empty game_error event from backend');
            }
            // The unified game manager will handle error state
        };

        // ALTERNATIVE EVENT HANDLERS: Try different possible event names from backend
        handlers.game_answer_received = (data: any) => {
            logger.info('=== GAME_ANSWER_RECEIVED EVENT ===', data);
            setAnswered(true);

            // Store the correct status for feedback display
            if (data.correct !== undefined) {
                const feedback: AnswerFeedback = {
                    correct: data.correct,
                    explanation: data.explanation,
                    points: data.points,
                    correctAnswers: data.correctAnswers,
                    questionId: data.questionId
                };
                setLastAnswerFeedback(feedback);
                logger.info('=== FEEDBACK SET FROM GAME_ANSWER_RECEIVED ===', feedback);

                // ONLY trigger immediate feedback for deferred (self-paced) mode
                // For live tournaments, wait for the backend 'feedback' event
                if (isDiffered) {
                    logger.info('🔄 PHASE CHANGE: → feedback (from game_answer_received - deferred mode)');
                    setGamePhase('feedback');

                    // Set a default feedback display time for deferred mode
                    if (!feedbackRemaining) {
                        setFeedbackRemaining(10); // Longer for deferred mode
                        logger.info('=== DEFERRED MODE FEEDBACK TIMER SET: 10 seconds ===');
                    }
                } else {
                    logger.info('🔄 LIVE TOURNAMENT MODE: Waiting for backend feedback event (not showing immediate feedback)');
                }
            }
        };

        handlers.answer_confirmed = (data: any) => {
            logger.info('=== ANSWER_CONFIRMED EVENT ===', data);
            setAnswered(true);
            // Just confirm answer was received, feedback might come separately
        };

        // Register handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            logger.debug(`Registering handler for event: ${event}`);
            socket.on(event as any, handler);
        });

        // Cleanup
        return () => {
            logger.info('=== CLEANING UP SOCKET EVENT HANDLERS ===');

            // Remove the global event logger
            socket.offAny(logAllEvents);

            // Remove specific event handlers
            Object.entries(handlers).forEach(([event, handler]) => {
                logger.debug(`Removing handler for event: ${event}`);
                socket.off(event as any, handler);
            });
        };
    }, [gameManager.socket.instance, accessCode]); // Simplified dependencies    // Extract question data from unified game manager's currentQuestionData
    useEffect(() => {
        // Extract question data from unified game manager's currentQuestionData
        const questionData = gameManager.gameState.currentQuestionData;
        logger.info('🔍 QUESTION DATA EXTRACTION:', {
            questionData,
            gameStatus: gameManager.gameState.gameStatus,
            hasQuestionData: !!questionData,
            hasQuestion: !!(questionData?.question)
        });

        if (questionData && questionData.question && gameManager.gameState.gameStatus === 'active') {
            logger.debug('Extracting question data from unified game manager:', questionData);

            const question = questionData.question;

            // Enhanced backward compatibility - handle multiple possible field names
            const extractedAnswers = question.answerOptions || question.answers || [];

            logger.debug('Question data extraction details:', {
                questionUid: question.uid,
                answerOptions: question.answerOptions,
                answers: question.answers,
                extractedAnswers,
                questionDataStructure: questionData
            });

            const newQuestion = {
                uid: question.uid,
                text: question.text,
                questionType: question.questionType || question.type || 'multiple_choice',
                answerOptions: extractedAnswers,
                answers: extractedAnswers, // Ensure both fields are populated
                explanation: question.explanation,
                correctAnswers: question.correctAnswers,
                timeLimit: question.timeLimit
            };

            logger.info('🎯 SETTING NEW QUESTION:', newQuestion);
            setCurrentQuestion(newQuestion);

            setGamePhase('question');
            setAnswered(false);
            setLastAnswerFeedback(null);
            setCorrectAnswers(null);
            setFeedbackRemaining(null);

            // CRITICAL FIX: Reset frontend timer when new question starts and extract timer
            setFrontendTimer(null);
            setTimerStartTime(null);

            // CRITICAL FIX: Extract timer from question data
            if (questionData.timer && typeof questionData.timer === 'number' && questionData.timer > 0) {
                setFrontendTimer(questionData.timer);
                setTimerStartTime(Date.now());
                logger.info('=== FRONTEND TIMER STARTED FROM QUESTION DATA ===', { timeLeftMs: questionData.timer, startTime: Date.now() });
            } else if (newQuestion.timeLimit && typeof newQuestion.timeLimit === 'number' && newQuestion.timeLimit > 0) {
                setFrontendTimer(newQuestion.timeLimit);
                setTimerStartTime(Date.now());
                logger.info('=== FRONTEND TIMER STARTED FROM QUESTION TIME LIMIT ===', { timeLeftMs: newQuestion.timeLimit, startTime: Date.now() });
            }

            // Backend provides index and totalQuestions
            if (questionData.questionIndex !== undefined) setQuestionIndex(questionData.questionIndex);
            if (questionData.index !== undefined) setQuestionIndex(questionData.index);
            if (questionData.totalQuestions !== undefined) setTotalQuestions(questionData.totalQuestions);
        } else {
            logger.warn('❌ NOT SETTING QUESTION:', {
                hasQuestionData: !!questionData,
                hasQuestion: !!(questionData?.question),
                gameStatus: gameManager.gameState.gameStatus
            });
        }
    }, [gameManager.gameState.currentQuestionData, gameManager.gameState.gameStatus]);

    // Handle answered state from unified game manager
    useEffect(() => {
        if (gameManager.gameState.answered) {
            setAnswered(true);
        }
    }, [gameManager.gameState.answered]);

    // Also listen to answer_received directly from unified game manager
    useEffect(() => {
        // Make sure the unified game manager's answer_received state is synced
        if (gameManager.gameState.answered && !answered) {
            setAnswered(true);
        }
    }, [gameManager.gameState.answered, answered]);

    // Handle game end redirect
    useEffect(() => {
        if (gameStatus === 'finished' && accessCode) {
            logger.info('🔀 GAME FINISHED - REDIRECTING TO LEADERBOARD:', `/leaderboard/${accessCode}`);
            const redirectTimer = setTimeout(() => {
                window.location.href = `/leaderboard/${accessCode}`;
            }, 2000);
            return () => clearTimeout(redirectTimer);
        }
    }, [gameStatus, accessCode]);

    // Handle game status changes
    useEffect(() => {
        logger.info('🎮 GAME STATUS CHANGE:', {
            newStatus: gameManager.gameState.gameStatus,
            currentPhase: gamePhase
        });

        setGameStatus(gameManager.gameState.gameStatus);

        if (gameManager.gameState.gameStatus === 'finished') {
            logger.info('🏁 GAME FINISHED - Setting show_answers phase');
            setGamePhase('show_answers');
        }
    }, [gameManager.gameState.gameStatus]);

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

    // CRITICAL FIX: Frontend timer countdown using Date for precision
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (frontendTimer !== null && timerStartTime !== null && frontendTimer > 0) {
            logger.info('=== STARTING FRONTEND TIMER COUNTDOWN ===', {
                frontendTimer,
                timerStartTime
            });

            intervalId = setInterval(() => {
                const elapsed = (Date.now() - timerStartTime) / 1000;
                const remaining = Math.max(0, frontendTimer - elapsed);
                const currentSecond = Math.ceil(remaining);

                logger.debug('⏰ FRONTEND Timer countdown:', { elapsed, remaining, currentSecond, originalTimer: frontendTimer });

                // DON'T update frontendTimer here - it causes recursive useEffect calls
                // The timer display will use the calculated currentSecond value

                // Stop when timer reaches zero
                if (currentSecond <= 0) {
                    logger.info('=== FRONTEND TIMER EXPIRED ===');
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                    setFrontendTimer(0);
                    setTimerStartTime(null);
                }
            }, 1000); // Update every second

            logger.info('=== FRONTEND TIMER INTERVAL STARTED ===', { intervalId });
        }

        return () => {
            if (intervalId) {
                logger.info('=== CLEANING UP FRONTEND TIMER INTERVAL ===', { intervalId });
                clearInterval(intervalId);
            }
        };
    }, [frontendTimer, timerStartTime]);

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
        if (!gameManager.socket.instance || !accessCode) return;

        logger.info('Submitting answer', { questionId, answer, clientTimestamp });

        // New backend expects game_answer event with specific payload structure
        gameManager.socket.instance.emit('game_answer', {
            accessCode,
            userId,
            questionId,
            answer,
            timeSpent: clientTimestamp
        });
    }, [gameManager.socket.instance, accessCode, userId]);

    const requestNextQuestion = useCallback((questionId: string) => {
        if (!gameManager.socket.instance || !accessCode) return;

        logger.info('Requesting next question', { questionId });

        gameManager.socket.instance.emit('request_next_question', {
            accessCode,
            userId,
            currentQuestionId: questionId
        });
    }, [gameManager.socket.instance, accessCode, userId]);

    // Build game state with dynamic timer calculation
    const getCurrentTimer = useCallback(() => {
        if (frontendTimer !== null && timerStartTime !== null && frontendTimer > 0) {
            const elapsed = (Date.now() - timerStartTime) / 1000;
            const remaining = Math.max(0, frontendTimer - elapsed);
            return Math.ceil(remaining);
        }
        return frontendTimer;
    }, [frontendTimer, timerStartTime, timerUpdateCounter]); // Include counter to force recalculation

    const gameState: StudentGameState = {
        gameStatus: gameManager.gameState.gameStatus,
        phase: gamePhase,
        currentQuestion,
        timer: getCurrentTimer(), // Use dynamic timer calculation
        answered,
        lastAnswerFeedback,
        correctAnswers,
        feedbackRemaining,
        questionIndex,
        totalQuestions,
        gameMode,
        linkedQuizId
    };

    // Debug timer value - Optimized logging (reduced frequency)
    useEffect(() => {
        // Only log timer state changes when important values change
        const currentTimerValue = getCurrentTimer();
        const isRunning = frontendTimer !== null && frontendTimer > 0;

        // Reduced logging - only log key timer state changes
        if (frontendTimer !== null) {
            console.log('⏰ TIMER DEBUG:', {
                frontendTimer,
                currentTimerValue,
                gameStatus: gameManager.gameState.gameStatus,
                phase: gamePhase,
                isRunning
            });
        }

        // Only log detailed state when timer is actually running
        if (isRunning && frontendTimer <= 10) { // Only log last 10 seconds
            logger.debug('Timer state (final countdown):', {
                frontendTimer,
                currentTimerValue,
                gameManagerTimer: gameManager.gameState.timer?.timeLeftMs,
                isTimerRunning: gameManager.gameState.isTimerRunning
            });
        }
    }, [frontendTimer, gamePhase, gameManager.gameState.gameStatus]); // Removed getCurrentTimer from deps

    // CRITICAL FIX: Force timer display updates during active countdown
    useEffect(() => {
        let timerInterval: NodeJS.Timeout | null = null;

        // Only start interval if we have an active timer
        if (frontendTimer !== null && frontendTimer > 0 && timerStartTime !== null) {
            timerInterval = setInterval(() => {
                const elapsed = (Date.now() - timerStartTime) / 1000;
                const remaining = Math.max(0, frontendTimer - elapsed);

                // Force re-render by incrementing counter
                if (remaining > 0) {
                    setTimerUpdateCounter(prev => prev + 1);
                } else {
                    // Timer expired, clean up
                    if (timerInterval) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                    }
                }
            }, 1000); // Update every second

            logger.debug('Timer update interval started for countdown display');
        }

        // Cleanup interval when effect dependencies change or unmount
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                logger.debug('Timer update interval cleared');
            }
        };
    }, [frontendTimer, timerStartTime]); // Restart interval when timer values change

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
