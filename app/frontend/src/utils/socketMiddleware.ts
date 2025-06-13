/**
 * Socket Event Validation Middleware
 * 
 * Provides a higher-level middleware system for socket event validation
 * that can be easily integrated into existing socket hooks.
 */

import { Socket } from 'socket.io-client';
import { z } from 'zod';
import { createLogger } from '@/clientLogger';
import {
    validateSocketPayload,
    createEnhancedSafeEventHandler,
    SocketSchemas,
    validationStats
} from './socketValidation';

const logger = createLogger('SocketMiddleware');

/**
 * Configuration for socket validation middleware
 */
export interface SocketValidationConfig {
    /** Enable strict mode - throws errors on validation failures */
    strictMode?: boolean;
    /** Enable detailed logging of validation results */
    enableLogging?: boolean;
    /** Enable validation statistics tracking */
    enableStats?: boolean;
    /** Custom error handler for validation failures */
    onValidationError?: (eventName: string, error: any, data: unknown) => void;
}

/**
 * Middleware class for socket event validation
 */
export class SocketValidationMiddleware {
    private config: Required<SocketValidationConfig>;
    private socket: Socket;
    private originalHandlers = new Map<string, Function>();

    constructor(socket: Socket, config: SocketValidationConfig = {}) {
        this.socket = socket;
        this.config = {
            strictMode: false,
            enableLogging: true,
            enableStats: true,
            onValidationError: this.defaultErrorHandler.bind(this),
            ...config
        };

        if (this.config.enableLogging) {
            logger.info('Socket validation middleware initialized', {
                socketId: socket.id,
                config: this.config
            });
        }
    }

    private defaultErrorHandler(eventName: string, error: any, data: unknown) {
        logger.error(`Socket validation failed for event: ${eventName}`, {
            error,
            data,
            socketId: this.socket.id
        });
    }

    /**
     * Wraps socket.on with validation middleware
     */
    public on<T>(
        eventName: string,
        handler: (data: T) => void,
        schema?: z.ZodSchema<T>
    ): void {
        // Store original handler
        this.originalHandlers.set(eventName, handler);

        if (schema) {
            // Use Zod validation
            const validatedHandler = createEnhancedSafeEventHandler(
                handler,
                schema,
                eventName,
                {
                    trackStats: this.config.enableStats,
                    onValidationError: (error) => {
                        this.config.onValidationError(eventName, error, undefined);
                    }
                }
            );

            this.socket.on(eventName, validatedHandler);
        } else {
            // No validation, use original handler
            this.socket.on(eventName, handler);

            if (this.config.enableLogging) {
                logger.warn(`No validation schema provided for event: ${eventName}`);
            }
        }
    }

    /**
     * Wraps socket.emit with validation middleware
     */
    public emit<T>(
        eventName: string,
        data: T,
        schema?: z.ZodSchema<T>
    ): boolean {
        if (schema) {
            const validation = validateSocketPayload(data, schema, eventName);

            if (!validation.success) {
                this.config.onValidationError(eventName, validation.error, data);

                if (this.config.strictMode) {
                    throw new Error(`Validation failed for outgoing event ${eventName}`);
                }

                return false;
            }
        }

        this.socket.emit(eventName, data);
        return true;
    }

    /**
     * Get validation statistics
     */
    public getStats() {
        return this.config.enableStats ? validationStats.getStats() : {};
    }

    /**
     * Reset validation statistics
     */
    public resetStats() {
        if (this.config.enableStats) {
            validationStats.reset();
        }
    }

    /**
     * Remove all event listeners and clean up
     */
    public cleanup() {
        this.originalHandlers.clear();

        if (this.config.enableLogging) {
            logger.info('Socket validation middleware cleaned up', {
                socketId: this.socket.id
            });
        }
    }
}

/**
 * Convenience function to create a validated socket wrapper
 */
export function createValidatedSocket(
    socket: Socket,
    config?: SocketValidationConfig
): SocketValidationMiddleware {
    return new SocketValidationMiddleware(socket, config);
}

/**
 * Higher-order function to add validation to an existing socket hook
 */
export function withSocketValidation<T extends (...args: any[]) => any>(
    hookFunction: T,
    validationConfig?: SocketValidationConfig
): T {
    return ((...args: Parameters<T>) => {
        const result = hookFunction(...args);

        // If the hook returns a socket or has a socket property, wrap it
        if (result && typeof result === 'object') {
            if ('socket' in result && result.socket) {
                const middleware = new SocketValidationMiddleware(result.socket, validationConfig);
                return {
                    ...result,
                    validatedSocket: middleware,
                    getValidationStats: () => middleware.getStats(),
                    resetValidationStats: () => middleware.resetStats()
                };
            }
        }

        return result;
    }) as T;
}

/**
 * Event handler registry for common socket events with their schemas
 */
export const ValidationRegistry = {
    // Game events
    'game_joined': SocketSchemas.gameJoined,
    'game_question': SocketSchemas.question,
    'game_error': SocketSchemas.error,

    // Timer events
    'timer_update': SocketSchemas.timerUpdate,
    'dashboard_timer_updated': SocketSchemas.dashboardTimerUpdate,

    // Dashboard events
    'dashboard_question_changed': SocketSchemas.dashboardQuestionChanged,
    'connected_count': SocketSchemas.connectedCount,

    // Outgoing events
    'join_game': SocketSchemas.joinGame,
    'game_answer': SocketSchemas.gameAnswer,
    'quiz_timer_action': SocketSchemas.timerAction
} as const;

/**
 * Utility to register common event handlers with validation
 */
export function registerValidatedEventHandlers(
    middleware: SocketValidationMiddleware,
    handlers: Record<string, (data: any) => void>
) {
    Object.entries(handlers).forEach(([eventName, handler]) => {
        const schema = ValidationRegistry[eventName as keyof typeof ValidationRegistry];
        middleware.on(eventName, handler, schema);
    });
}
