/**
 * Socket Validation Retrofit Utility
 * 
 * Provides easy ways to add Zod-based validation to existing socket hooks
 * without requiring major rewrites.
 */

import { Socket } from 'socket.io-client';
import { z } from 'zod';
import { createLogger } from '@/clientLogger';
import { SocketSchemas, validateSocketPayload } from './socketValidation';

const logger = createLogger('SocketRetrofit');

/**
 * Validation interceptor that can be easily added to existing socket.on calls
 */
export function createValidationInterceptor<T>(
    originalHandler: (data: T) => void,
    schema: z.ZodSchema<T>,
    eventName: string,
    options: {
        logValidation?: boolean;
        onValidationError?: (error: any) => void;
    } = {}
) {
    const { logValidation = true, onValidationError } = options;

    return (data: unknown) => {
        const validation = validateSocketPayload(data, schema, eventName);

        if (validation.success && validation.data) {
            if (logValidation) {
                logger.debug(`✅ Validation passed for ${eventName}`);
            }
            originalHandler(validation.data);
        } else if (validation.error) {
            if (logValidation) {
                logger.warn(`❌ Validation failed for ${eventName}:`, validation.error);
            }

            if (onValidationError) {
                onValidationError(validation.error);
            }
        }
    };
}

/**
 * Easy wrapper for socket.on with automatic validation
 */
export function createValidatedSocketOn(socket: Socket) {
    return function validatedOn<T>(
        eventName: string,
        handler: (data: T) => void,
        schemaKey?: keyof typeof SocketSchemas,
        customSchema?: z.ZodSchema<T>
    ) {
        const schema = customSchema || (schemaKey ? SocketSchemas[schemaKey] : undefined);

        if (schema) {
            const interceptor = createValidationInterceptor(
                handler,
                schema as z.ZodSchema<T>,
                eventName,
                {
                    logValidation: true,
                    onValidationError: (error) => {
                        logger.error(`Validation error for ${eventName}:`, error);
                    }
                }
            );
            socket.on(eventName, interceptor);
        } else {
            logger.warn(`No validation schema found for event: ${eventName}`);
            socket.on(eventName, handler);
        }
    };
}

/**
 * Easy wrapper for socket.emit with automatic validation
 */
export function createValidatedSocketEmit(socket: Socket) {
    return function validatedEmit<T>(
        eventName: string,
        data: T,
        schemaKey?: keyof typeof SocketSchemas,
        customSchema?: z.ZodSchema<T>
    ): boolean {
        const schema = customSchema || (schemaKey ? SocketSchemas[schemaKey] : undefined);

        if (schema) {
            const validation = validateSocketPayload(data, schema as z.ZodSchema<T>, eventName);

            if (!validation.success) {
                logger.error(`Outgoing validation failed for ${eventName}:`, validation.error);
                return false;
            }
        }

        socket.emit(eventName, data);
        return true;
    };
}

/**
 * Validation wrapper for existing socket hooks
 * This can be used to quickly add validation to existing hooks
 */
export function addValidationToSocket(socket: Socket) {
    const originalOn = socket.on.bind(socket);
    const originalEmit = socket.emit.bind(socket);

    // Track validation stats
    const validationStats = {
        incoming: { success: 0, failed: 0 },
        outgoing: { success: 0, failed: 0 }
    };

    // Enhanced on method with optional validation
    socket.on = function (eventName: string, handler: (data: any) => void, schema?: z.ZodSchema) {
        if (schema) {
            const validatedHandler = createValidationInterceptor(
                (data) => {
                    validationStats.incoming.success++;
                    handler(data);
                },
                schema,
                eventName,
                {
                    onValidationError: () => {
                        validationStats.incoming.failed++;
                    }
                }
            );
            return originalOn(eventName, validatedHandler);
        } else {
            return originalOn(eventName, handler);
        }
    } as any;

    // Enhanced emit method with optional validation
    socket.emit = function (eventName: string, data: any, schema?: z.ZodSchema): boolean {
        if (schema) {
            const validation = validateSocketPayload(data, schema, eventName);

            if (validation.success) {
                validationStats.outgoing.success++;
                originalEmit(eventName, data);
                return true;
            } else {
                validationStats.outgoing.failed++;
                logger.error(`Outgoing validation failed for ${eventName}:`, validation.error);
                return false;
            }
        } else {
            originalEmit(eventName, data);
            return true;
        }
    } as any;

    // Add utility methods
    (socket as any).getValidationStats = () => validationStats;
    (socket as any).resetValidationStats = () => {
        validationStats.incoming.success = 0;
        validationStats.incoming.failed = 0;
        validationStats.outgoing.success = 0;
        validationStats.outgoing.failed = 0;
    };

    return socket;
}

/**
 * Decorator for socket event handlers that adds validation
 */
export function withValidation<T>(
    schema: z.ZodSchema<T>,
    eventName: string
) {
    return function decorator(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (data: unknown) {
            const validation = validateSocketPayload(data, schema, eventName);

            if (validation.success && validation.data) {
                return originalMethod.call(this, validation.data);
            } else {
                logger.error(`Validation failed for ${eventName} in ${propertyKey}:`, validation.error);
            }
        };

        return descriptor;
    };
}

/**
 * Common validation schemas mapped to event names for easy lookup
 */
export const EventValidationMap = {
    // Incoming events (server to client)
    'game_joined': 'gameJoined',
    'game_question': 'question',
    'game_error': 'error',
    'timer_update': 'timerUpdate',
    'dashboard_timer_updated': 'dashboardTimerUpdate',
    'dashboard_question_changed': 'dashboardQuestionChanged',
    'connected_count': 'connectedCount',

    // Outgoing events (client to server)
    'join_game': 'joinGame',
    'game_answer': 'gameAnswer',
    'quiz_timer_action': 'timerAction'
} as const;

/**
 * Utility to quickly add validation to a socket using the event map
 */
export function quickAddValidation(socket: Socket, eventHandlers: Record<string, (data: any) => void>) {
    const validatedOn = createValidatedSocketOn(socket);

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        const schemaKey = EventValidationMap[eventName as keyof typeof EventValidationMap] as keyof typeof SocketSchemas;

        if (schemaKey) {
            validatedOn(eventName, handler, schemaKey);
        } else {
            socket.on(eventName, handler);
            logger.warn(`No validation schema available for event: ${eventName}`);
        }
    });
}

/**
 * Hook helper to add validation to existing socket hooks with minimal changes
 */
export function useValidatedSocket(
    socket: Socket | null,
    eventHandlers: Record<string, (data: any) => void>,
    options: {
        enableValidation?: boolean;
        logErrors?: boolean;
    } = {}
) {
    const { enableValidation = true, logErrors = true } = options;

    if (!socket || !enableValidation) {
        // Standard behavior without validation
        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            socket?.on(eventName, handler);
        });
        return { validationEnabled: false };
    }

    // Add validation
    quickAddValidation(socket, eventHandlers);

    return {
        validationEnabled: true,
        getStats: () => (socket as any).getValidationStats?.() || {},
        resetStats: () => (socket as any).resetValidationStats?.()
    };
}
