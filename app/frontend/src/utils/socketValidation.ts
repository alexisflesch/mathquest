/**
 * Enhanced Socket Event Validation
 * 
 * Provides Zod-based runtime validation for socket events with comprehensive error handling
 * and logging. This builds upon the existing type guard system to add stronger validation.
 */

import { z } from 'zod';
import { createLogger } from '@/clientLogger';

// Import existing Zod schemas from shared types
import {
    joinGamePayloadSchema,
    gameAnswerPayloadSchema,
    errorPayloadSchema,
    gameJoinedPayloadSchema,
    participantDataSchema,
    questionDataSchema,
    leaderboardEntryDataSchema
} from '@shared/types/socketEvents.zod';

const logger = createLogger('SocketValidation');

/**
 * Enhanced validation result with detailed error information
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        issues: Array<{
            path: string;
            message: string;
        }>;
    };
}

/**
 * Validates socket event payload using Zod schema with enhanced error reporting
 */
export function validateSocketPayload<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    eventName: string
): ValidationResult<T> {
    try {
        const result = schema.safeParse(data);

        if (result.success) {
            logger.debug(`✅ Validation passed for event: ${eventName}`);
            return {
                success: true,
                data: result.data
            };
        } else {
            const issues = result.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }));

            logger.warn(`❌ Validation failed for event: ${eventName}`, {
                issues,
                receivedData: data
            });

            return {
                success: false,
                error: {
                    message: `Invalid payload for event ${eventName}`,
                    issues
                }
            };
        }
    } catch (error) {
        logger.error(`💥 Validation error for event: ${eventName}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            receivedData: data
        });

        return {
            success: false,
            error: {
                message: `Validation failed for event ${eventName}`,
                issues: [{ path: '', message: 'Validation threw an exception' }]
            }
        };
    }
}

/**
 * Creates a Zod-validated event handler with comprehensive error handling
 */
export function createZodValidatedHandler<T>(
    handler: (data: T) => void,
    schema: z.ZodSchema<T>,
    eventName: string,
    options: {
        onValidationError?: (error: ValidationResult<T>['error']) => void;
        strictMode?: boolean; // If true, throws errors instead of just logging
    } = {}
) {
    return (data: unknown) => {
        const validation = validateSocketPayload(data, schema, eventName);

        if (validation.success && validation.data) {
            handler(validation.data);
        } else if (validation.error) {
            // Call custom error handler if provided
            if (options.onValidationError) {
                options.onValidationError(validation.error);
            }

            // In strict mode, throw the error
            if (options.strictMode) {
                throw new Error(`Socket validation failed for ${eventName}: ${validation.error.message}`);
            }
        }
    };
}

/**
 * Common socket event schemas for validation
 */
export const SocketSchemas = {
    // Incoming events (from server to client)
    gameJoined: gameJoinedPayloadSchema,
    error: errorPayloadSchema,
    participant: participantDataSchema,
    question: questionDataSchema,
    leaderboard: leaderboardEntryDataSchema,

    // Outgoing events (from client to server)
    joinGame: joinGamePayloadSchema,
    gameAnswer: gameAnswerPayloadSchema,

    // Timer-related schemas
    timerUpdate: z.object({
        timeLeftMs: z.number().nullable(),
        running: z.boolean(),
        status: z.enum(['play', 'pause', 'stop']).optional(),
        questionUid: z.string().optional()
    }),

    timerAction: z.object({
        accessCode: z.string().min(1),
        action: z.enum(['start', 'pause', 'resume', 'stop', 'set_duration']),
        durationMs: z.number().positive().optional(),
        questionUid: z.string().optional()
    }),

    // Dashboard-specific schemas
    dashboardQuestionChanged: z.object({
        questionUid: z.string().min(1),
        questionIndex: z.number().int().nonnegative()
    }),

    dashboardTimerUpdate: z.object({
        timeRemainingMs: z.number().nonnegative(),
        durationMs: z.number().positive(),
        isPaused: z.boolean(),
        questionUid: z.string().optional()
    }),

    connectedCount: z.object({
        count: z.number().int().nonnegative()
    })
} as const;

/**
 * Convenience function to create a validated handler using common schemas
 */
export function createValidatedHandler<K extends keyof typeof SocketSchemas>(
    handler: (data: any) => void,
    schemaKey: K,
    eventName: string,
    options?: Parameters<typeof createZodValidatedHandler>[3]
) {
    return createZodValidatedHandler(
        handler,
        SocketSchemas[schemaKey] as z.ZodSchema<any>,
        eventName,
        options
    );
}

/**
 * Validation stats tracking for debugging and monitoring
 */
class ValidationStats {
    private stats = new Map<string, { success: number; failed: number; lastError?: string }>();

    recordSuccess(eventName: string) {
        const current = this.stats.get(eventName) || { success: 0, failed: 0 };
        current.success++;
        this.stats.set(eventName, current);
    }

    recordFailure(eventName: string, error: string) {
        const current = this.stats.get(eventName) || { success: 0, failed: 0 };
        current.failed++;
        current.lastError = error;
        this.stats.set(eventName, current);
    }

    getStats() {
        return Object.fromEntries(this.stats.entries());
    }

    reset() {
        this.stats.clear();
    }
}

export const validationStats = new ValidationStats();

/**
 * Enhanced createSafeEventHandler that uses Zod validation and tracks stats
 */
export function createEnhancedSafeEventHandler<T>(
    handler: (data: T) => void,
    schema: z.ZodSchema<T>,
    eventName: string,
    options: {
        onValidationError?: (error: ValidationResult<T>['error']) => void;
        trackStats?: boolean;
    } = {}
) {
    const { trackStats = true } = options;

    return createZodValidatedHandler(
        (data: T) => {
            if (trackStats) {
                validationStats.recordSuccess(eventName);
            }
            handler(data);
        },
        schema,
        eventName,
        {
            ...options,
            onValidationError: (error) => {
                if (trackStats) {
                    validationStats.recordFailure(eventName, error?.message || 'Unknown error');
                }
                options.onValidationError?.(error);
            }
        }
    );
}
