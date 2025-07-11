import { redisClient } from '@/config/redis';

/**
 * Delete all Redis keys for a given accessCode (gameInstance)
 * Patterns covered: all mathquest:game:* and lobby keys for the accessCode
 */
export async function deleteAllGameInstanceRedisKeys(accessCode: string): Promise<void> {
    const redisPatterns = [
        `mathquest:game:*${accessCode}*`,
        `mathquest:timer:${accessCode}:*`,
        `mathquest:projection:display:${accessCode}`,
        `mathquest:explanation_sent:${accessCode}:*`,
        `mathquest:lobby:${accessCode}`,
        `leaderboard:snapshot:${accessCode}`,
        `*${accessCode}*` // Catch any other patterns we might have missed
    ];

    for (const pattern of redisPatterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            console.log(`[REDIS_CLEANUP] Deleting ${keys.length} keys matching pattern: ${pattern}`);
            console.log(`[REDIS_CLEANUP] Keys: ${keys.join(', ')}`);
            await redisClient.del(...keys);
        }
    }
}
