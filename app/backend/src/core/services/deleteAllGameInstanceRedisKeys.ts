import { redisClient } from '@/config/redis';
import { cleanupGameRedisKeys } from '@/utils/redisCleanup';

/**
 * Delete all Redis keys for a given accessCode (gameInstance)
 * Uses the comprehensive cleanup utility to ensure all keys are properly removed
 * including new deferred session keys
 */
export async function deleteAllGameInstanceRedisKeys(accessCode: string): Promise<void> {
    // Use the comprehensive cleanup utility that covers all key patterns
    await cleanupGameRedisKeys(accessCode, 'deleteGameInstance');

    // Additional cleanup for any legacy patterns that might not be covered
    const legacyPatterns = [
        `mathquest:lobby:${accessCode}`,
        `mathquest:explanation_sent:${accessCode}:*`,
    ];

    for (const pattern of legacyPatterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            console.log(`[REDIS_CLEANUP] Deleting ${keys.length} legacy keys matching pattern: ${pattern}`);
            console.log(`[REDIS_CLEANUP] Keys: ${keys.join(', ')}`);
            await redisClient.del(...keys);
        }
    }
}
