/**
 * Unit tests for Idempotency Guard
 * 
 * Tests the in-memory idempotency guard that prevents duplicate socket event processing
 */

// @ts-nocheck - Jest globals are available at runtime but not in editor with main tsconfig

import {
    shouldAllowOperation,
    clearIdempotencyKey,
    clearAllIdempotencyKeys,
    getIdempotencyCacheSize,
    stopCleanupInterval
} from '../idempotencyGuard';

describe('IdempotencyGuard', () => {
    beforeEach(() => {
        // Clear all keys before each test
        clearAllIdempotencyKeys();
    });

    afterAll(() => {
        // Stop cleanup interval to prevent test hanging
        stopCleanupInterval();
        clearAllIdempotencyKeys();
    });

    describe('shouldAllowOperation', () => {
        it('should allow first operation', () => {
            const key = 'TEST_KEY:socket1:game1';
            const result = shouldAllowOperation(key, 3000);

            expect(result).toBe(true);
            expect(getIdempotencyCacheSize()).toBe(1);
        });

        it('should block duplicate operation within window', () => {
            const key = 'TEST_KEY:socket1:game1';

            // First operation - should be allowed
            expect(shouldAllowOperation(key, 3000)).toBe(true);

            // Second operation immediately after - should be blocked
            expect(shouldAllowOperation(key, 3000)).toBe(false);

            // Third operation - still blocked
            expect(shouldAllowOperation(key, 3000)).toBe(false);

            // Cache should still have 1 entry
            expect(getIdempotencyCacheSize()).toBe(1);
        });

        it('should allow operation after window expires', async () => {
            const key = 'TEST_KEY:socket1:game1';
            const windowMs = 100; // Short window for testing

            // First operation
            expect(shouldAllowOperation(key, windowMs)).toBe(true);

            // Immediate duplicate - blocked
            expect(shouldAllowOperation(key, windowMs)).toBe(false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, windowMs + 50));

            // After expiration - should be allowed
            expect(shouldAllowOperation(key, windowMs)).toBe(true);
        });

        it('should handle multiple different keys independently', () => {
            const key1 = 'JOIN_GAME:socket1:game1';
            const key2 = 'JOIN_GAME:socket2:game1';
            const key3 = 'JOIN_GAME:socket1:game2';

            // All different keys should be allowed
            expect(shouldAllowOperation(key1, 3000)).toBe(true);
            expect(shouldAllowOperation(key2, 3000)).toBe(true);
            expect(shouldAllowOperation(key3, 3000)).toBe(true);

            // Duplicates of each key should be blocked
            expect(shouldAllowOperation(key1, 3000)).toBe(false);
            expect(shouldAllowOperation(key2, 3000)).toBe(false);
            expect(shouldAllowOperation(key3, 3000)).toBe(false);

            expect(getIdempotencyCacheSize()).toBe(3);
        });

        it('should use custom window duration', async () => {
            const key = 'TEST_KEY:socket1:game1';
            const shortWindow = 50;
            const longWindow = 200;

            // First with short window
            expect(shouldAllowOperation(key, shortWindow)).toBe(true);
            expect(shouldAllowOperation(key, shortWindow)).toBe(false);

            // Wait for short window to expire
            await new Promise(resolve => setTimeout(resolve, shortWindow + 20));

            // Now with long window
            expect(shouldAllowOperation(key, longWindow)).toBe(true);
            expect(shouldAllowOperation(key, longWindow)).toBe(false);

            // Short wait - should still be blocked
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(shouldAllowOperation(key, longWindow)).toBe(false);
        });
    });

    describe('clearIdempotencyKey', () => {
        it('should clear specific key', () => {
            const key1 = 'TEST_KEY:socket1:game1';
            const key2 = 'TEST_KEY:socket2:game1';

            shouldAllowOperation(key1, 3000);
            shouldAllowOperation(key2, 3000);
            expect(getIdempotencyCacheSize()).toBe(2);

            clearIdempotencyKey(key1);
            expect(getIdempotencyCacheSize()).toBe(1);

            // key1 should be allowed again
            expect(shouldAllowOperation(key1, 3000)).toBe(true);

            // key2 should still be blocked
            expect(shouldAllowOperation(key2, 3000)).toBe(false);
        });
    });

    describe('clearAllIdempotencyKeys', () => {
        it('should clear all keys', () => {
            shouldAllowOperation('KEY1', 3000);
            shouldAllowOperation('KEY2', 3000);
            shouldAllowOperation('KEY3', 3000);
            expect(getIdempotencyCacheSize()).toBe(3);

            clearAllIdempotencyKeys();
            expect(getIdempotencyCacheSize()).toBe(0);

            // All keys should be allowed again
            expect(shouldAllowOperation('KEY1', 3000)).toBe(true);
            expect(shouldAllowOperation('KEY2', 3000)).toBe(true);
            expect(shouldAllowOperation('KEY3', 3000)).toBe(true);
        });
    });

    describe('Contract test: 3 JOIN_GAME in <2s → only one executes', () => {
        it('should allow only first JOIN_GAME and block 2 duplicates within 5s', () => {
            const socketId = 'test-socket-123';
            const accessCode = 'ABC123';
            const idempotencyKey = `JOIN_GAME:${socketId}:${accessCode}`;

            // Simulate 3 rapid JOIN_GAME events (within 100ms)
            const result1 = shouldAllowOperation(idempotencyKey, 5000);
            const result2 = shouldAllowOperation(idempotencyKey, 5000);
            const result3 = shouldAllowOperation(idempotencyKey, 5000);

            // Only first should be allowed
            expect(result1).toBe(true);
            expect(result2).toBe(false);
            expect(result3).toBe(false);

            // Verify cache has single entry
            expect(getIdempotencyCacheSize()).toBe(1);
        });

        it('should block burst of 10 JOIN_GAME events', () => {
            const socketId = 'test-socket-456';
            const accessCode = 'XYZ789';
            const idempotencyKey = `JOIN_GAME:${socketId}:${accessCode}`;

            const results: boolean[] = [];

            // Simulate burst of 10 events
            for (let i = 0; i < 10; i++) {
                results.push(shouldAllowOperation(idempotencyKey, 5000));
            }

            // Only first should be allowed
            expect(results[0]).toBe(true);
            expect(results.slice(1)).toEqual(new Array(9).fill(false));

            // Count how many were allowed
            const allowedCount = results.filter(r => r).length;
            expect(allowedCount).toBe(1);
        });
    });

    describe('Memory management', () => {
        it('should automatically clean up expired entries', async () => {
            const key1 = 'EXPIRING_KEY1';
            const key2 = 'EXPIRING_KEY2';
            const key3 = 'LONG_LIVED_KEY';

            // Create entries with short TTL
            shouldAllowOperation(key1, 50);
            shouldAllowOperation(key2, 50);
            // And one with long TTL
            shouldAllowOperation(key3, 5000);

            expect(getIdempotencyCacheSize()).toBe(3);

            // Wait for short TTL entries to expire
            await new Promise(resolve => setTimeout(resolve, 100));

            // Trigger cleanup by trying to use expired keys
            shouldAllowOperation(key1, 50); // Will remove expired entry and add new one
            shouldAllowOperation(key2, 50); // Will remove expired entry and add new one

            // Long-lived key should still be in cache blocking duplicates
            expect(shouldAllowOperation(key3, 5000)).toBe(false);
        }, 10000);
    });
});
