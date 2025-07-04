import { redisClient } from '@/config/redis';

/**
 * Delete all Redis keys for a given accessCode (gameInstance)
 * Patterns covered: all mathquest:game:* and lobby keys for the accessCode
 */
export async function deleteAllGameInstanceRedisKeys(accessCode: string): Promise<void> {
    const redisPatterns = [
        `mathquest:game:*${accessCode}*`,
        `mathquest:explanation_sent:${accessCode}:*`,
        `mathquest:lobby:${accessCode}`
    ];
    for (const pattern of redisPatterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    }
}
