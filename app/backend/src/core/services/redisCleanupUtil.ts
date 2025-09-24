import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

const logger = createLogger('RedisCleanupUtil');

/**
 * Utility function to clear all Redis keys for a given game accessCode
 * @param accessCode The game access code
 */
export async function clearGameRedisKeys(accessCode: string): Promise<void> {
    const redisPatterns = [
        `mathquest:game:*${accessCode}*`,           // Game state and participants
        `mathquest:timer:${accessCode}:*`,          // Timer states for all questions
        `mathquest:projection:display:${accessCode}`,
        `mathquest:explanation_sent:${accessCode}:*`,
        `mathquest:lobby:${accessCode}`,
        `leaderboard:snapshot:${accessCode}`,
        `*${accessCode}*`                           // Catch any remaining keys with accessCode
    ];
    for (const pattern of redisPatterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            logger.info({ pattern, keys, accessCode }, 'Deleting Redis keys for game cleanup');
            await redisClient.del(...keys);
        }
    }
}
