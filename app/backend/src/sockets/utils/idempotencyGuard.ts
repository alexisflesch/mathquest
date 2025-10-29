/**
 * Idempotency Guard for Socket Events
 * 
 * Prevents duplicate processing of critical socket events within a time window.
 * Uses in-memory TTL cache (no Redis dependency for simplicity).
 * 
 * Key use case: JOIN_GAME events during rapid reconnects/network flaps
 */

import createLogger from '@/utils/logger';

const logger = createLogger('IdempotencyGuard');

interface IdempotencyEntry {
    timestamp: number;
    expiresAt: number;
}

/**
 * In-memory cache for idempotency keys
 * Map structure: key -> { timestamp, expiresAt }
 */
const idempotencyCache = new Map<string, IdempotencyEntry>();

/**
 * Default idempotency window in milliseconds (3 seconds)
 */
const DEFAULT_WINDOW_MS = 3000;

/**
 * Cleanup interval for expired entries (every 10 seconds)
 */
const CLEANUP_INTERVAL_MS = 10000;

/**
 * Start cleanup interval to prevent memory leaks
 */
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval(): void {
    if (cleanupInterval) return; // Already running

    cleanupInterval = setInterval(() => {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, entry] of idempotencyCache.entries()) {
            if (entry.expiresAt <= now) {
                idempotencyCache.delete(key);
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            logger.debug({ expiredCount, remainingCount: idempotencyCache.size }, 'Cleaned up expired idempotency entries');
        }
    }, CLEANUP_INTERVAL_MS);

    // Ensure cleanup stops if Node.js process exits
    cleanupInterval.unref();
}

// Start cleanup on module load
startCleanupInterval();

/**
 * Check if an operation should be allowed (idempotency check)
 * 
 * @param key - Unique identifier for the operation (e.g., "JOIN_GAME:socketId:accessCode")
 * @param windowMs - Time window in milliseconds (default: 3000ms)
 * @returns true if operation should proceed, false if duplicate within window
 */
export function shouldAllowOperation(key: string, windowMs: number = DEFAULT_WINDOW_MS): boolean {
    const now = Date.now();
    const existing = idempotencyCache.get(key);

    if (existing) {
        // Check if still within window
        if (existing.expiresAt > now) {
            logger.info(
                {
                    key,
                    age: now - existing.timestamp,
                    windowMs,
                    remainingMs: existing.expiresAt - now
                },
                'Idempotency: Blocking duplicate operation within window'
            );
            return false; // Duplicate within window, block
        }

        // Expired, remove and allow
        idempotencyCache.delete(key);
    }

    // Record this operation
    idempotencyCache.set(key, {
        timestamp: now,
        expiresAt: now + windowMs
    });

    logger.debug({ key, windowMs, cacheSize: idempotencyCache.size }, 'Idempotency: Allowing operation');
    return true; // Allow operation
}

/**
 * Manually clear an idempotency key (useful for testing or explicit cleanup)
 */
export function clearIdempotencyKey(key: string): void {
    idempotencyCache.delete(key);
    logger.debug({ key }, 'Manually cleared idempotency key');
}

/**
 * Clear all idempotency entries (useful for testing)
 */
export function clearAllIdempotencyKeys(): void {
    const count = idempotencyCache.size;
    idempotencyCache.clear();
    logger.debug({ count }, 'Cleared all idempotency keys');
}

/**
 * Get current cache size (useful for monitoring/testing)
 */
export function getIdempotencyCacheSize(): number {
    return idempotencyCache.size;
}

/**
 * Stop cleanup interval (useful for testing cleanup)
 */
export function stopCleanupInterval(): void {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        logger.debug('Stopped idempotency cleanup interval');
    }
}
