/**
 * Practice Session Hook
 * 
 * Modern React hook for managing practice sessions using the new socket-based
 * practice session architecture. Completely separate from game logic.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

import type {
    PracticeSession,
    PracticeQuestionData,
    PracticeSettings,
    PracticeStatistics
} from '@shared/types/practice/session';

import {
    PRACTICE_EVENTS,
    type StartPracticeSessionPayload,
    type SubmitPracticeAnswerPayload,
    type RequestPracticeFeedbackPayload,
    type GetNextPracticeQuestionPayload,
    type EndPracticeSessionPayload,
    type GetPracticeSessionStatePayload,
    type PracticeSessionCreatedPayload,
    type PracticeQuestionReadyPayload,
    type PracticeAnswerSubmittedPayload,
    type PracticeAnswerFeedbackPayload,
    type PracticeSessionCompletedPayload,
    type PracticeSessionErrorPayload,
    type PracticeSessionStatePayload
} from '@shared/types/practice/events';

// Import socket event types
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '@shared/types/socketEvents';

// Import Zod schemas for canonical events
import {
    correctAnswersPayloadSchema,
    feedbackPayloadSchema
} from '@shared/types/socketEvents.zod';
import { z } from 'zod';

// Derive types from Zod schemas for canonical events
type CorrectAnswersPayload = z.infer<typeof correctAnswersPayloadSchema>;
type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

const logger = createLogger('usePracticeSession');

// --- Hook State Types ---

export interface PracticeSessionState {
    // Connection state
    connected: boolean;
    connecting: boolean;
    error: string | null;

    // Session state
    session: PracticeSession | null;
    sessionId: string | null;

    // Current question state
    currentQuestion: PracticeQuestionData | null;
    questionProgress: {
        currentQuestionNumber: number;
        totalQuestions: number;
        questionsRemaining: number;
    } | null;

    // Answer state
    hasAnswered: boolean;
    lastFeedback: {
        isCorrect: boolean;
        correctAnswers: boolean[];
        numericCorrectAnswer?: {
            correctAnswer: number;
            tolerance?: number;
        };
        explanation?: string;
        canRetry: boolean;
        statistics: {
            questionsAnswered: number;
            correctCount: number;
            accuracyPercentage: number;
        };
    } | null;

    // Session completion
    isCompleted: boolean;
    completionSummary: {
        totalQuestions: number;
        correctAnswers: number;
        finalAccuracy: number;
        totalTimeSpent: number;
        averageTimePerQuestion: number;
    } | null;
}

export interface UsePracticeSessionOptions {
    userId: string;
    settings: PracticeSettings;
    autoStart?: boolean;
}

export interface UsePracticeSessionReturn {
    // State
    state: PracticeSessionState;

    // Actions
    startSession: () => Promise<void>;
    submitAnswer: (questionUid: string, selectedAnswers: number[], timeSpentMs: number) => Promise<void>;
    requestFeedback: (questionUid: string) => Promise<void>;
    getNextQuestion: (skipCurrent?: boolean) => Promise<void>;
    retryQuestion: (questionUid: string) => Promise<void>;
    endSession: (reason?: 'completed' | 'user_quit' | 'timeout') => Promise<void>;
    getSessionState: () => Promise<void>;

    // Utilities
    disconnect: () => void;
    reconnect: () => void;
    clearError: () => void;
}

// --- Hook Implementation ---

export function usePracticeSession({
    userId,
    settings,
    autoStart = false
}: UsePracticeSessionOptions): UsePracticeSessionReturn {

    // Socket reference
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

    // State
    const [state, setState] = useState<PracticeSessionState>({
        connected: false,
        connecting: false,
        error: null,
        session: null,
        sessionId: null,
        currentQuestion: null,
        questionProgress: null,
        hasAnswered: false,
        lastFeedback: null,
        isCompleted: false,
        completionSummary: null
    });

    // Ref to track current session state for event handlers
    const sessionRef = useRef<PracticeSession | null>(null);
    // Recovery guard to prevent autoStart from starting a new session while we try to recover
    const recoveringRef = useRef<{ inProgress: boolean; timer?: any }>({ inProgress: false });

    // Update state helper
    const updateState = useCallback((updates: Partial<PracticeSessionState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            sessionRef.current = newState.session;
            return newState;
        });
    }, []);

    // Session recovery helpers
    const SESSION_STORAGE_KEY = `practice_session_${userId}`;

    const storeSessionId = useCallback((sessionId: string) => {
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
            logger.debug('Session ID stored in localStorage', { sessionId });
        } catch (error) {
            logger.warn('Failed to store session ID in localStorage', error);
        }
    }, [SESSION_STORAGE_KEY]);

    const getStoredSessionId = useCallback((): string | null => {
        try {
            return localStorage.getItem(SESSION_STORAGE_KEY);
        } catch (error) {
            logger.warn('Failed to retrieve session ID from localStorage', error);
            return null;
        }
    }, [SESSION_STORAGE_KEY]);

    const clearStoredSessionId = useCallback(() => {
        try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            logger.debug('Session ID cleared from localStorage');
        } catch (error) {
            logger.warn('Failed to clear session ID from localStorage', error);
        }
    }, [SESSION_STORAGE_KEY]);

    // Session recovery function
    const recoverSession = useCallback(async (sessionId: string) => {
        try {
            logger.info('Attempting to recover practice session', { sessionId });

            // Mark recovery in progress to block autoStart
            recoveringRef.current.inProgress = true;

            // Request session state from backend using existing GET_PRACTICE_SESSION_STATE event
            const payload: GetPracticeSessionStatePayload = { sessionId };
            socketRef.current?.emit('GET_PRACTICE_SESSION_STATE', payload);

            // Set a timeout for recovery response: if it times out, clear recovery and stored id
            const recoveryTimeout = setTimeout(() => {
                logger.warn('Session recovery timed out', { sessionId });
                clearStoredSessionId(); // Clear invalid session ID
                recoveringRef.current.inProgress = false;
            }, 5000);
            recoveringRef.current.timer = recoveryTimeout;

            // Clear recovery guard on successful response (handled in state handler too)
            const handleRecoveryResponse = () => {
                clearTimeout(recoveryTimeout);
                recoveringRef.current.inProgress = false;
                recoveringRef.current.timer = undefined;
                logger.info('Session recovery successful', { sessionId });
            };
            if (socketRef.current) {
                socketRef.current.once(PRACTICE_EVENTS.PRACTICE_SESSION_STATE, handleRecoveryResponse);
            }

        } catch (error) {
            logger.error('Failed to recover session', { sessionId, error });
            clearStoredSessionId();
            recoveringRef.current.inProgress = false;
        }
    }, [clearStoredSessionId]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Socket event handlers
    const handleSessionCreated = useCallback((payload: PracticeSessionCreatedPayload) => {
        logger.info('Practice session created', payload);

        // Store session ID in localStorage for recovery
        if (payload.session?.sessionId) {
            storeSessionId(payload.session.sessionId);
        }

        updateState({
            session: payload.session,
            sessionId: payload.session?.sessionId || null,
            currentQuestion: payload.session?.currentQuestion || null,
            questionProgress: payload.session ? {
                currentQuestionNumber: (payload.session.currentQuestionIndex || 0) + 1,
                totalQuestions: payload.session.questionPool?.length || 0,
                questionsRemaining: (payload.session.questionPool?.length || 0) - (payload.session.currentQuestionIndex || 0)
            } : null,
            error: null
        });
    }, [updateState, storeSessionId]);

    const handleQuestionReady = useCallback((payload: PracticeQuestionReadyPayload) => {
        logger.info('Practice question ready', payload);

        updateState({
            currentQuestion: payload.question,
            questionProgress: payload.progress,
            hasAnswered: false,
            lastFeedback: null
        });
    }, [updateState]);

    const handleAnswerFeedback = useCallback((payload: PracticeAnswerFeedbackPayload) => {
        logger.info('Practice answer feedback', payload);

        // Convert feedback statistics to match PracticeStatistics interface
        const updatedStatistics = {
            questionsAttempted: payload.statistics.questionsAnswered,
            correctAnswers: payload.statistics.correctCount,
            incorrectAnswers: payload.statistics.questionsAnswered - payload.statistics.correctCount,
            accuracyPercentage: payload.statistics.accuracyPercentage,
            averageTimePerQuestion: 0, // Not provided in feedback
            totalTimeSpent: 0, // Not provided in feedback
            retriedQuestions: [] // Not provided in feedback
        };

        // Update state using updateState for consistency
        updateState({
            hasAnswered: true,
            lastFeedback: {
                isCorrect: payload.isCorrect,
                correctAnswers: payload.correctAnswers,
                numericCorrectAnswer: payload.numericCorrectAnswer,
                explanation: payload.explanation,
                canRetry: payload.canRetry,
                statistics: payload.statistics
            }
        });

        // Update session statistics separately
        setState(prevState => ({
            ...prevState,
            session: prevState.session ? {
                ...prevState.session,
                statistics: updatedStatistics
            } : null
        }));
    }, [updateState]);

    const handleSessionCompleted = useCallback((payload: PracticeSessionCompletedPayload) => {
        logger.info('Practice session completed', payload);

        // Clear stored session ID when session is completed
        clearStoredSessionId();

        updateState({
            session: payload.session,
            isCompleted: true,
            completionSummary: payload.summary,
            currentQuestion: null,
            questionProgress: null
        });
    }, [updateState, clearStoredSessionId]);

    const handleSessionError = useCallback((payload: PracticeSessionErrorPayload) => {
        // 'session_not_found' is a common, non-fatal condition during session recovery
        // (for example when a stored session expired in Redis). Treat it as INFO
        // so it doesn't spam the console as an ERROR while still clearing the
        // stale stored session id.
        if (payload.errorType === 'session_not_found') {
            logger.info('Practice session not found during recovery', payload);
            clearStoredSessionId();
            logger.info('Cleared stored session ID due to session_not_found error');

            // Do not surface this as a user-visible error; just stop connecting
            updateState({
                connecting: false,
                error: null
            });
            return;
        }

        // Other error types are unexpected and should be surfaced as errors
        logger.error('Practice session error', payload);
        updateState({
            error: payload.message,
            connecting: false
        });
    }, [updateState, clearStoredSessionId]);

    const handleSessionState = useCallback((payload: PracticeSessionStatePayload) => {
        logger.info('Practice session state recovered', payload);

        const session = payload.session;

        // Calculate current question and progress
        const currentQuestionIndex = session.currentQuestionIndex || 0;
        const totalQuestions = session.questionPool?.length || 0;
        const questionsRemaining = Math.max(0, totalQuestions - currentQuestionIndex - 1);

        // Determine if user has answered the current question
        const hasAnsweredCurrent = session.answers && session.answers.length > currentQuestionIndex;

        updateState({
            session: session,
            sessionId: payload.sessionId,
            currentQuestion: session.currentQuestion || null,
            questionProgress: totalQuestions > 0 ? {
                currentQuestionNumber: currentQuestionIndex + 1,
                totalQuestions: totalQuestions,
                questionsRemaining: questionsRemaining
            } : null,
            hasAnswered: hasAnsweredCurrent,
            error: null,
            connecting: false
        });
    }, [updateState]);

    // Socket connection - made stable by removing dependencies
    const connectSocket = useCallback(() => {
        if (socketRef.current?.connected) {
            return;
        }

        updateState({ connecting: true, error: null });

        try {
            const socketConfig = createSocketConfig({
                timeout: 10000, // 10 second timeout for practice sessions
                reconnectionAttempts: 5, // Limit reconnection attempts
                reconnectionDelay: 2000, // 2 second delay between attempts
                reconnectionDelayMax: 10000, // Max 10 second delay
            });
            socketRef.current = io(SOCKET_CONFIG.url, {
                ...socketConfig,
                path: SOCKET_CONFIG.path
            });

            const socket = socketRef.current;

            // Define event handlers inline to avoid dependency issues
            const handleConnect = () => {
                logger.info('Practice session socket connected');
                updateState({ connected: true, connecting: false });

                // Attempt to recover existing session after connection
                const storedSessionId = getStoredSessionId();
                if (storedSessionId && !sessionRef.current) {
                    logger.info('Found stored session ID, attempting recovery', { storedSessionId });
                    recoverSession(storedSessionId);
                }
            };

            const handleDisconnect = (reason: string) => {
                logger.info('Practice session socket disconnected', { reason });
                updateState({ connected: false });
            };

            const handleConnectError = (error: Error) => {
                logger.error('Practice session socket connection error', error);

                // Provide user-friendly error messages based on error type
                let errorMessage = 'Connexion impossible';
                if (error.message.includes('ECONNREFUSED') || error.message.includes('CONNECTION_REFUSED')) {
                    errorMessage = 'Le serveur n\'est pas disponible. Veuillez réessayer plus tard.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Délai de connexion dépassé. Vérifiez votre connexion internet.';
                } else if (error.message.includes('xhr poll error')) {
                    errorMessage = 'Erreur de connexion réseau. Veuillez rafraîchir la page.';
                }

                updateState({
                    connected: false,
                    connecting: false,
                    error: errorMessage
                });
            };

            // Connection events
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);

            // Practice session events - define handlers inline
            socket.on(PRACTICE_EVENTS.PRACTICE_SESSION_CREATED, (payload: any) => {
                try {
                    handleSessionCreated(payload);
                } catch (error) {
                    logger.error('Error in PRACTICE_SESSION_CREATED handler:', error);
                }
            });
            socket.on(PRACTICE_EVENTS.PRACTICE_QUESTION_READY, (payload: any) => {
                try {
                    handleQuestionReady(payload);
                } catch (error) {
                    logger.error('Error in PRACTICE_QUESTION_READY handler:', error);
                }
            });
            socket.on(PRACTICE_EVENTS.PRACTICE_ANSWER_FEEDBACK, (payload: any) => {
                try {
                    handleAnswerFeedback(payload);
                } catch (error) {
                    logger.error('Error in PRACTICE_ANSWER_FEEDBACK handler:', error);
                }
            });
            socket.on(PRACTICE_EVENTS.PRACTICE_SESSION_COMPLETED, (payload: any) => {
                try {
                    handleSessionCompleted(payload);
                } catch (error) {
                    logger.error('Error in PRACTICE_SESSION_COMPLETED handler:', error);
                }
            });
            socket.on(PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, (payload: any) => {
                try {
                    handleSessionError(payload);
                } catch (error) {
                    logger.error('Error in PRACTICE_SESSION_ERROR handler:', error);
                }
            });
            socket.on(PRACTICE_EVENTS.PRACTICE_SESSION_STATE, (payload: any) => {
                try {
                    handleSessionState(payload);
                } catch (error) {
                    logger.error('Error in PRACTICE_SESSION_STATE handler:', error);
                }
            });

            // Canonical tournament-style events (emitted by backend for practice sessions)
            socket.on(SOCKET_EVENTS.GAME.CORRECT_ANSWERS as any, (payload: CorrectAnswersPayload) => {
                try {
                    // Validate payload with Zod schema
                    const validatedPayload = correctAnswersPayloadSchema.parse(payload);

                    logger.debug('Received canonical correct_answers event', validatedPayload);
                    if (validatedPayload.correctAnswers) {
                        const correctAnswers = validatedPayload.correctAnswers;
                        setState(prevState => ({
                            ...prevState,
                            hasAnswered: true, // Set hasAnswered when correct answers are received
                            lastFeedback: prevState.lastFeedback ? {
                                ...prevState.lastFeedback,
                                correctAnswers: correctAnswers
                            } : {
                                isCorrect: false,
                                correctAnswers: correctAnswers,
                                explanation: undefined,
                                canRetry: false,
                                statistics: {
                                    questionsAnswered: 0,
                                    correctCount: 0,
                                    accuracyPercentage: 0
                                }
                            }
                        }));
                    }
                } catch (error) {
                    logger.error('Error in correct_answers handler:', error);
                }
            });

            socket.on(SOCKET_EVENTS.GAME.FEEDBACK as any, (payload: FeedbackPayload) => {
                try {
                    // Validate payload with Zod schema
                    const validatedPayload = feedbackPayloadSchema.parse(payload);

                    logger.debug('Received canonical feedback event', validatedPayload);
                    const explanation = validatedPayload.explanation as string | undefined;
                    if (explanation) {
                        setState(prevState => ({
                            ...prevState,
                            lastFeedback: prevState.lastFeedback ? {
                                ...prevState.lastFeedback,
                                explanation: explanation
                            } : null
                        }));
                    }
                } catch (error) {
                    logger.error('Error in feedback handler:', error);
                }
            });

        } catch (error) {
            logger.error('Failed to create practice session socket', error);
            updateState({
                connecting: false,
                error: error instanceof Error ? error.message : 'Connection failed'
            });
        }
    }, []); // Empty dependency array to make it stable

    // Actions
    const startSession = useCallback(async () => {
        if (!socketRef.current?.connected) {
            updateState({ error: 'Socket not connected' });
            return;
        }

        try {
            const payload: StartPracticeSessionPayload = {
                userId,
                settings
            };

            socketRef.current.emit('START_PRACTICE_SESSION', payload);
            logger.info('Starting practice session', payload);
        } catch (error) {
            logger.error('Failed to start practice session', error);
            updateState({ error: 'Failed to start session' });
        }
    }, [userId, settings, updateState]);

    const submitAnswer = useCallback(async (
        questionUid: string,
        selectedAnswers: number[],
        timeSpentMs: number
    ) => {
        if (!socketRef.current?.connected || !state.sessionId) {
            updateState({ error: 'Socket not connected or no active session' });
            return;
        }

        try {
            const payload: SubmitPracticeAnswerPayload = {
                sessionId: state.sessionId,
                questionUid,
                selectedAnswers,
                timeSpentMs
            };

            socketRef.current.emit('SUBMIT_PRACTICE_ANSWER', payload);
            logger.info('Submitting practice answer', payload);
        } catch (error) {
            logger.error('Failed to submit answer', error);
            updateState({ error: 'Failed to submit answer' });
        }
    }, [state.sessionId, updateState]);

    const getNextQuestion = useCallback(async (skipCurrent = false) => {
        if (!socketRef.current?.connected || !state.sessionId) {
            updateState({ error: 'Socket not connected or no active session' });
            return;
        }

        try {
            const payload: GetNextPracticeQuestionPayload = {
                sessionId: state.sessionId,
                skipCurrent
            };

            socketRef.current.emit('GET_NEXT_PRACTICE_QUESTION', payload);
            logger.info('Getting next practice question', payload);
        } catch (error) {
            logger.error('Failed to get next question', error);
            updateState({ error: 'Failed to get next question' });
        }
    }, [state.sessionId, updateState]);

    const retryQuestion = useCallback(async (questionUid: string) => {
        if (!socketRef.current?.connected || !state.sessionId) {
            updateState({ error: 'Socket not connected or no active session' });
            return;
        }

        try {
            const payload = {
                sessionId: state.sessionId,
                questionUid
            };

            socketRef.current.emit('RETRY_PRACTICE_QUESTION', payload);
            logger.info('Retrying practice question', payload);
        } catch (error) {
            logger.error('Failed to retry question', error);
            updateState({ error: 'Failed to retry question' });
        }
    }, [state.sessionId, updateState]);

    const endSession = useCallback(async (reason: 'completed' | 'user_quit' | 'timeout' = 'user_quit') => {
        if (!socketRef.current?.connected || !state.sessionId) {
            updateState({ error: 'Socket not connected or no active session' });
            return;
        }

        try {
            const payload: EndPracticeSessionPayload = {
                sessionId: state.sessionId,
                reason
            };

            socketRef.current.emit('END_PRACTICE_SESSION', payload);
            logger.info('Ending practice session', payload);
        } catch (error) {
            logger.error('Failed to end session', error);
            updateState({ error: 'Failed to end session' });
        }
    }, [state.sessionId, updateState]);

    const getSessionState = useCallback(async () => {
        if (!socketRef.current?.connected || !state.sessionId) {
            updateState({ error: 'Socket not connected or no active session' });
            return;
        }

        try {
            const payload: GetPracticeSessionStatePayload = {
                sessionId: state.sessionId
            };

            socketRef.current.emit('GET_PRACTICE_SESSION_STATE', payload);
            logger.info('Getting practice session state', payload);
        } catch (error) {
            logger.error('Failed to get session state', error);
            updateState({ error: 'Failed to get session state' });
        }
    }, [state.sessionId, updateState]);

    const requestFeedback = useCallback(async (questionUid: string) => {
        if (!socketRef.current?.connected || !state.sessionId) {
            updateState({ error: 'Socket not connected or no active session' });
            return;
        }

        try {
            const payload: RequestPracticeFeedbackPayload = {
                sessionId: state.sessionId,
                questionUid
            };

            socketRef.current.emit('REQUEST_PRACTICE_FEEDBACK', payload);
            logger.info('Requesting practice feedback', payload);
        } catch (error) {
            logger.error('Failed to request feedback', error);
            updateState({ error: 'Failed to request feedback' });
        }
    }, [state.sessionId, updateState]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Clear stored session ID on disconnect
        clearStoredSessionId();

        updateState({
            connected: false,
            connecting: false,
            session: null,
            sessionId: null,
            currentQuestion: null,
            questionProgress: null,
            hasAnswered: false,
            lastFeedback: null,
            isCompleted: false,
            completionSummary: null
        });
    }, [updateState, clearStoredSessionId]);

    const reconnect = useCallback(() => {
        disconnect();
        connectSocket();
    }, [disconnect, connectSocket]);

    // Effects
    useEffect(() => {
        connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []); // Empty dependency array - only run once on mount

    useEffect(() => {
        // Only auto-start when connected, no active session, not recovering,
        // and there is no stored session id to attempt recovery with.
        const storedId = getStoredSessionId();
        if (autoStart && state.connected && !state.session && !recoveringRef.current.inProgress && !storedId) {
            startSession();
        }
    }, [autoStart, state.connected, state.session, startSession, getStoredSessionId]);

    return {
        state,
        startSession,
        submitAnswer,
        requestFeedback,
        getNextQuestion,
        retryQuestion,
        endSession,
        getSessionState,
        disconnect,
        reconnect,
        clearError
    };
}

export default usePracticeSession;
