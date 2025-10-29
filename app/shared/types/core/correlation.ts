/**
 * Correlation ID Types
 * 
 * Phase 5: Observability
 * Provides correlation IDs for tracing requests across client/server boundaries
 */

import { z } from 'zod';

/**
 * Correlation ID format: {prefix}-{timestamp}-{random}
 * Example: "client-1730000000000-a1b2c3d4"
 */
export const correlationIdSchema = z.string().regex(
    /^(client|server)-\d{13}-[a-z0-9]{8}$/,
    'Invalid correlation ID format'
);

export type CorrelationId = z.infer<typeof correlationIdSchema>;

/**
 * Generate a new correlation ID
 * @param prefix - Either 'client' or 'server'
 */
export function generateCorrelationId(prefix: 'client' | 'server' = 'client'): CorrelationId {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${timestamp}-${random}` as CorrelationId;
}

/**
 * Parse correlation ID to extract metadata
 */
export function parseCorrelationId(correlationId: CorrelationId): {
    prefix: 'client' | 'server';
    timestamp: number;
    random: string;
} | null {
    const match = correlationId.match(/^(client|server)-(\d{13})-([a-z0-9]{8})$/);
    if (!match) return null;

    return {
        prefix: match[1] as 'client' | 'server',
        timestamp: parseInt(match[2], 10),
        random: match[3]
    };
}

/**
 * Mixin for payloads that include correlation ID
 */
export interface WithCorrelationId {
    correlationId?: CorrelationId;
}

/**
 * Log entry envelope with correlation ID
 */
export const logEntrySchema = z.object({
    timestamp: z.number(),
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
    message: z.string(),
    correlationId: correlationIdSchema.optional(),
    metadata: z.record(z.any()).optional()
});

export type LogEntry = z.infer<typeof logEntrySchema>;
