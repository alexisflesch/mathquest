/**
 * Enhanced Student Game Socket Hook with Zod Validation
 * 
 * This demonstrates how to integrate the new validation middleware
 * into existing socket hooks for better runtime type safety.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import {
    createValidatedSocket,
    SocketValidationMiddleware,
    registerValidatedEventHandlers
} from '@/utils/socketMiddleware';
import { SocketSchemas } from '@/utils/socketValidation';

// Import shared types
import type {
    JoinGamePayload,
    GameJoinedPayload,
    ErrorPayload,
    QuestionData,
    TimerUpdatePayload,
    GameAnswerPayload
} from '@shared/types/socketEvents';
import type { LiveQuestionPayload, FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { GameTimerState, PlayMode } from '@shared/types';

const logger = createLogger('useEnhancedStudentGameSocket');

// Enhanced game state interface using shared types
export interface EnhancedStudentGameUIState {
    currentQuestion: FilteredQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    timer: GameTimerState | null; // Use shared timer type
    gameStatus: 'pending' | 'active' | 'paused' | 'completed'; // Use shared status values
    answered: boolean;
    connectedToRoom: boolean;
    phase: 'question' | 'feedback' | 'show_answers';
    feedbackRemaining: number | null;
    correctAnswers: boolean[] | null;
    gameMode?: PlayMode; // Use shared type
    linkedQuizId?: string | null;
    validationStats?: Record<string, any>; // New: validation statistics
}

export interface EnhancedStudentGameSocketProps {
    accessCode: string | null;
    userId: string | null;
    username: string | null;
    avatarEmoji?: string | null;
    isDiffered?: boolean;
    enableValidation?: boolean; // New: option to enable/disable validation
    strictValidation?: boolean; // New: strict mode for validation
}

export interface EnhancedStudentGameSocketHook {
    socket: Socket | null;
    connected: boolean;
    connecting: boolean;
    error: string | null;
    gameState: EnhancedStudentGameUIState;
    joinGame: () => void;
    submitAnswer: (answer: string | number | string[] | number[]) => void;
    getValidationStats: () => Record<string, { success: number; failed: number; lastError?: string }>;
    resetValidationStats: () => void;
}

export function useEnhancedStudentGameSocket({
    accessCode,
    userId,
    username,
    avatarEmoji,
    isDiffered = false,
    enableValidation = true,
    strictValidation = false
}: EnhancedStudentGameSocketProps): EnhancedStudentGameSocketHook {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [validationMiddleware, setValidationMiddleware] = useState<SocketValidationMiddleware | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<EnhancedStudentGameUIState>({
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        timer: null,
        gameStatus: 'pending', // Use shared status values
        answered: false,
        connectedToRoom: false,
        phase: 'question',
        feedbackRemaining: null,
        correctAnswers: null
    });

    // Socket connection and validation setup
    useEffect(() => {
        if (!accessCode || !userId || !username) return;

        setConnecting(true);
        setError(null);

        const socketConfig = createSocketConfig({
            auth: {
                userId: userId || '',
                username: username || '',
                ...(avatarEmoji && { avatarEmoji })
            },
            autoConnect: false
        });

        const s = io(SOCKET_CONFIG.url, socketConfig);
        setSocket(s);

        // Initialize validation middleware if enabled
        let middleware: SocketValidationMiddleware | null = null;
        if (enableValidation) {
            middleware = createValidatedSocket(s, {
                strictMode: strictValidation,
                enableLogging: true,
                enableStats: true,
                onValidationError: (eventName, error, data) => {
                    logger.error(`Enhanced validation failed for ${eventName}:`, error);
                    setError(`Validation error: ${error.message || 'Unknown validation error'}`);
                }
            });
            setValidationMiddleware(middleware);

            logger.info('Enhanced socket validation enabled', {
                accessCode,
                userId,
                strictMode: strictValidation
            });
        }

        // Connection event handlers
        s.on('connect', () => {
            logger.info(`Enhanced student socket connected: ${s.id}`);
            setConnected(true);
            setConnecting(false);
            setError(null);
        });

        s.on('disconnect', (reason: string) => {
            logger.warn(`Enhanced student socket disconnected: ${reason}`);
            setConnected(false);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: false
            }));
        });

        s.on('connect_error', (err: Error) => {
            logger.error("Enhanced student socket connection error:", err);
            setConnecting(false);
            setError(`Connection error: ${err.message}`);
        });

        // Setup validated event handlers
        if (middleware) {
            setupValidatedEventHandlers(middleware);
        } else {
            setupStandardEventHandlers(s);
        }

        s.connect();

        return () => {
            logger.info(`Disconnecting enhanced student socket for game: ${accessCode}`);
            middleware?.cleanup();
            s.disconnect();
            setSocket(null);
            setValidationMiddleware(null);
            setConnected(false);
            setConnecting(false);
        };
    }, [accessCode, userId, username, avatarEmoji, isDiffered, enableValidation, strictValidation]);

    // Setup event handlers with validation
    const setupValidatedEventHandlers = (middleware: SocketValidationMiddleware) => {
        // Game joined event with validation
        middleware.on('game_joined', (payload: GameJoinedPayload) => {
            logger.info('✅ Validated game_joined event', payload);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'pending'
            }));
        }, SocketSchemas.gameJoined);

        // Game question event with validation
        middleware.on('game_question', (payload: QuestionData) => {
            logger.info('✅ Validated game_question event', payload);
            setGameState(prev => ({
                ...prev,
                currentQuestion: payload as FilteredQuestion,
                questionIndex: payload.currentQuestionIndex ?? 0,
                totalQuestions: payload.totalQuestions ?? 0,
                answered: false,
                phase: 'question'
            }));
        }, SocketSchemas.question);

        // Timer update with validation - keep timer state minimal for now
        middleware.on('timer_update', (payload: TimerUpdatePayload) => {
            logger.info('✅ Validated timer_update event', payload);
            // Note: This hook doesn't fully integrate with unified timer system yet
            // Timer state updates should be handled by a proper timer hook
            logger.debug('Timer update received but not processed - use unified timer system');
        }, SocketSchemas.timerUpdate);

        // Error handling with validation
        middleware.on('game_error', (payload: ErrorPayload) => {
            logger.error('✅ Validated game_error event', payload);
            setError(payload.message || 'Unknown game error');
        }, SocketSchemas.error);

        // Update validation stats in game state
        const updateValidationStats = () => {
            setGameState(prev => ({
                ...prev,
                validationStats: middleware.getStats()
            }));
        };

        // Update stats periodically
        const statsInterval = setInterval(updateValidationStats, 5000);

        return () => {
            clearInterval(statsInterval);
        };
    };

    // Fallback to standard event handlers without validation
    const setupStandardEventHandlers = (socket: Socket) => {
        logger.warn('Using standard event handlers without validation');

        socket.on(SOCKET_EVENTS.GAME.GAME_JOINED, (payload: GameJoinedPayload) => {
            logger.info('Standard game_joined event', payload);
            setGameState(prev => ({
                ...prev,
                connectedToRoom: true,
                gameStatus: payload.gameStatus === 'active' ? 'active' : 'pending'
            }));
        });

        socket.on(SOCKET_EVENTS.GAME.GAME_QUESTION, (payload: QuestionData) => {
            logger.info('Standard game_question event', payload);
            setGameState(prev => ({
                ...prev,
                currentQuestion: payload as FilteredQuestion,
                questionIndex: payload.currentQuestionIndex ?? 0,
                totalQuestions: payload.totalQuestions ?? 0,
                answered: false,
                phase: 'question'
            }));
        });

        socket.on(SOCKET_EVENTS.GAME.GAME_ERROR, (payload: ErrorPayload) => {
            logger.error('Standard game_error event', payload);
            setError(payload.message || 'Unknown game error');
        });
    };

    // Action functions
    const joinGame = useCallback(() => {
        if (!socket || !accessCode || !userId || !username) {
            logger.warn("Cannot join game: missing socket or parameters");
            return;
        }

        const payload: JoinGamePayload = {
            accessCode,
            userId,
            username,
            avatarEmoji: avatarEmoji || '🐼',
            isDiffered
        };

        if (validationMiddleware) {
            // Use validated emit
            validationMiddleware.emit(SOCKET_EVENTS.GAME.JOIN_GAME, payload, SocketSchemas.joinGame);
        } else {
            // Standard emit
            socket.emit(SOCKET_EVENTS.GAME.JOIN_GAME, payload);
        }

        logger.info(`Enhanced joining game ${accessCode}`, { userId, username, isDiffered });
    }, [socket, validationMiddleware, accessCode, userId, username, avatarEmoji, isDiffered]);

    const submitAnswer = useCallback((answer: string | number | string[] | number[]) => {
        if (!socket || !accessCode || !userId || !gameState.currentQuestion) {
            logger.warn("Cannot submit answer: missing required data");
            return;
        }

        const payload = {
            accessCode,
            userId,
            questionUid: gameState.currentQuestion.uid,
            answer,
            timeSpent: 0 // Calculate actual time spent
        };

        if (validationMiddleware) {
            // Use validated emit
            validationMiddleware.emit(SOCKET_EVENTS.GAME.GAME_ANSWER, payload, SocketSchemas.gameAnswer);
        } else {
            // Standard emit
            socket.emit(SOCKET_EVENTS.GAME.GAME_ANSWER, payload);
        }

        setGameState(prev => ({ ...prev, answered: true }));
        logger.info(`Enhanced answer submitted for question ${gameState.currentQuestion.uid}`);
    }, [socket, validationMiddleware, accessCode, userId, gameState.currentQuestion]);

    const getValidationStats = useCallback(() => {
        return validationMiddleware?.getStats() || {};
    }, [validationMiddleware]);

    const resetValidationStats = useCallback(() => {
        validationMiddleware?.resetStats();
        setGameState(prev => ({
            ...prev,
            validationStats: {}
        }));
    }, [validationMiddleware]);

    return {
        socket,
        connected,
        connecting,
        error,
        gameState,
        joinGame,
        submitAnswer,
        getValidationStats,
        resetValidationStats
    };
}
