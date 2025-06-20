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

    // Update state helper
    const updateState = useCallback((updates: Partial<PracticeSessionState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Socket event handlers
    const handleSessionCreated = useCallback((payload: PracticeSessionCreatedPayload) => {
        logger.info('Practice session created', payload);

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
    }, [updateState]);

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

        // Update state and merge statistics into session
        setState(prevState => ({
            ...prevState,
            hasAnswered: true,
            lastFeedback: {
                isCorrect: payload.isCorrect,
                correctAnswers: payload.correctAnswers,
                explanation: payload.explanation,
                canRetry: payload.canRetry,
                statistics: payload.statistics
            },
            session: prevState.session ? {
                ...prevState.session,
                statistics: updatedStatistics
            } : null
        }));
    }, []);

    const handleSessionCompleted = useCallback((payload: PracticeSessionCompletedPayload) => {
        logger.info('Practice session completed', payload);

        updateState({
            session: payload.session,
            isCompleted: true,
            completionSummary: payload.summary,
            currentQuestion: null,
            questionProgress: null
        });
    }, [updateState]);

    const handleSessionError = useCallback((payload: PracticeSessionErrorPayload) => {
        logger.error('Practice session error', payload);

        updateState({
            error: payload.message,
            connecting: false
        });
    }, [updateState]);

    const handleSessionState = useCallback((payload: PracticeSessionStatePayload) => {
        logger.info('Practice session state', payload);

        updateState({
            session: payload.session,
            sessionId: payload.sessionId
        });
    }, [updateState]);

    // Socket connection
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

            // Connection events
            socket.on('connect', () => {
                logger.info('Practice session socket connected');
                updateState({ connected: true, connecting: false });
            });

            socket.on('disconnect', (reason: string) => {
                logger.info('Practice session socket disconnected', { reason });
                updateState({ connected: false });
            });

            socket.on('connect_error', (error: Error) => {
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
            });

            // Practice session events - use constants and add validation
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
            socket.on('correct_answers', (payload: { questionUid: string; correctAnswers?: boolean[] }) => {
                try {
                    logger.debug('Received canonical correct_answers event', payload);
                    if (payload.correctAnswers) {
                        const correctAnswers = payload.correctAnswers;
                        setState(prevState => ({
                            ...prevState,
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

            socket.on('feedback', (payload: { questionUid: string; feedbackRemaining: number;[key: string]: any }) => {
                try {
                    logger.debug('Received canonical feedback event', payload);
                    const explanation = payload.explanation as string | undefined;
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
    }, [updateState, handleSessionCreated, handleQuestionReady, handleAnswerFeedback,
        handleSessionCompleted, handleSessionError, handleSessionState]);

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
    }, [updateState]);

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
    }, [connectSocket]);

    useEffect(() => {
        if (autoStart && state.connected && !state.session) {
            startSession();
        }
    }, [autoStart, state.connected, state.session, startSession]);

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
