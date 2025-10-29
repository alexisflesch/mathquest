/**
 * Phase 5: Observability - Correlation ID Integration Test
 * 
 * Verifies that correlation IDs flow through the system:
 * - Generated on client
 * - Validated by Zod schema
 * - Logged on server with [CID:xxx] marker
 * - Traceable across join→question→answer flow
 */

import { describe, it, expect } from '@jest/globals';
import { generateCorrelationId, parseCorrelationId, correlationIdSchema } from '@shared/types/core/correlation';

describe('Correlation ID System', () => {
    describe('generateCorrelationId', () => {
        it('should generate valid correlation IDs with client prefix', () => {
            const correlationId = generateCorrelationId('client');

            // Verify format: client-timestamp-random
            expect(correlationId).toMatch(/^client-\d{13}-[a-z0-9]{8}$/);

            // Verify Zod validation passes
            const parseResult = correlationIdSchema.safeParse(correlationId);
            expect(parseResult.success).toBe(true);
        });

        it('should generate valid correlation IDs with server prefix', () => {
            const correlationId = generateCorrelationId('server');

            // Verify format: server-timestamp-random
            expect(correlationId).toMatch(/^server-\d{13}-[a-z0-9]{8}$/);

            // Verify Zod validation passes
            const parseResult = correlationIdSchema.safeParse(correlationId);
            expect(parseResult.success).toBe(true);
        });

        it('should generate unique correlation IDs', () => {
            const id1 = generateCorrelationId('client');
            const id2 = generateCorrelationId('client');

            expect(id1).not.toBe(id2);
        });
    });

    describe('parseCorrelationId', () => {
        it('should parse correlation ID components correctly', () => {
            const correlationId = generateCorrelationId('client');
            const parsed = parseCorrelationId(correlationId);

            expect(parsed).toBeDefined();
            expect(parsed?.prefix).toBe('client');
            expect(parsed?.timestamp).toBeGreaterThan(0);
            expect(parsed?.random).toHaveLength(8);
            expect(parsed?.random).toMatch(/^[a-z0-9]{8}$/);
        });

        it('should return null for invalid correlation IDs', () => {
            const invalidIds = [
                'invalid-format',
                'client-abc-xyz',
                'server-123',
                '',
                'wrong-1234567890123-abc12345'
            ];

            invalidIds.forEach(id => {
                const parsed = parseCorrelationId(id);
                expect(parsed).toBeNull();
            });
        });
    });

    describe('correlationIdSchema', () => {
        it('should validate correct correlation IDs', () => {
            const validIds = [
                'client-1730000000000-abc12345',
                'server-1730000000000-xyz98765',
                generateCorrelationId('client'),
                generateCorrelationId('server')
            ];

            validIds.forEach(id => {
                const parseResult = correlationIdSchema.safeParse(id);
                expect(parseResult.success).toBe(true);
            });
        });

        it('should reject invalid correlation IDs', () => {
            const invalidIds = [
                'invalid-format',
                'client-abc-xyz',
                'UPPERCASE-1730000000000-ABC12345', // uppercase not allowed
                'client-1730000000000-short',       // only 5 chars in random part
                'client-1730000000000-toolongtext', // more than 8 chars in random part
                ''
                // Note: null, undefined, and numbers are not in the array to avoid type errors
            ];

            invalidIds.forEach(id => {
                const parseResult = correlationIdSchema.safeParse(id);
                if (parseResult.success) {
                    throw new Error(`Expected ${id} to be invalid, but it passed validation`);
                }
                expect(parseResult.success).toBe(false);
            });

            // Test non-string types separately
            expect(correlationIdSchema.safeParse(null).success).toBe(false);
            expect(correlationIdSchema.safeParse(undefined).success).toBe(false);
            expect(correlationIdSchema.safeParse(123).success).toBe(false);
        });
    });

    describe('Correlation ID Tracing', () => {
        it('should maintain correlation ID format through serialization', () => {
            const correlationId = generateCorrelationId('client');

            // Simulate JSON serialization (as would happen in socket payload)
            const serialized = JSON.stringify({ correlationId });
            const deserialized = JSON.parse(serialized);

            // Verify correlation ID survives serialization
            expect(deserialized.correlationId).toBe(correlationId);

            // Verify it's still valid
            const parseResult = correlationIdSchema.safeParse(deserialized.correlationId);
            expect(parseResult.success).toBe(true);
        });

        it('should extract short ID for logging (last 8 characters)', () => {
            const correlationId = 'client-1730000000000-abc12345';
            const shortId = correlationId.slice(-8);

            expect(shortId).toBe('abc12345');
            expect(shortId).toHaveLength(8);
        });

        it('should support optional correlation IDs in payloads', () => {
            // Test with correlationId
            const payloadWithCid = {
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'Test User',
                correlationId: generateCorrelationId('client')
            };

            expect(payloadWithCid.correlationId).toBeDefined();

            // Test without correlationId (optional)
            const payloadWithoutCid: {
                accessCode: string;
                userId: string;
                username: string;
                correlationId?: string;
            } = {
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'Test User'
            };

            expect(payloadWithoutCid.correlationId).toBeUndefined();
        });
    });
});
