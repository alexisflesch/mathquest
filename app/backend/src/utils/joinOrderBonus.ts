/**
 * Join Order Bonus Utility
 * 
 * Provides micro-score bonuses to early joiners for better UX on the projection leaderboard.
 * Students get tiny bonuses based on join order, ensuring they appear on leaderboard immediately.
 */

import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

const logger = createLogger('JoinOrderBonus');

// Configuration for join order bonuses
const JOIN_ORDER_CONFIG = {
    // Maximum number of students who get join order bonuses
    MAX_BONUS_RECIPIENTS: 20,

    // Base bonus for first joiner (0.01 points)
    BASE_BONUS: 0.01,

    // How much the bonus decreases for each subsequent joiner
    BONUS_DECREMENT: 0.001,

    // Minimum bonus (last eligible joiner gets this much)
    MIN_BONUS: 0.001
} as const;

/**
 * Calculate and assign join order bonus for a student joining a game
 * 
 * @param accessCode - Game access code
 * @param userId - Student's user ID
 * @returns Promise<number> - The bonus score assigned (0 if no bonus)
 */
export async function assignJoinOrderBonus(accessCode: string, userId: string): Promise<number> {
    logger.info({
        accessCode,
        userId
    }, '🎯 [JOIN-ORDER-BONUS] Starting join order bonus assignment');

    try {
        const joinOrderKey = `mathquest:game:join_order:${accessCode}`;

        // Get current join count using Redis LLEN (list length)
        const currentJoinCount = await redisClient.llen(joinOrderKey);

        logger.debug({
            accessCode,
            userId,
            joinOrderKey,
            currentJoinCount
        }, '📊 [JOIN-ORDER-BONUS] Current join count retrieved');

        // Check if this user already has a join order (prevent duplicates)
        const existingJoinOrders = await redisClient.lrange(joinOrderKey, 0, -1);
        if (existingJoinOrders.includes(userId)) {
            logger.debug({
                accessCode,
                userId,
                currentJoinCount,
                existingJoinOrders
            }, '⏭️ [JOIN-ORDER-BONUS] User already has join order bonus');
            return 0;
        }

        // Only first MAX_BONUS_RECIPIENTS get bonuses
        if (currentJoinCount >= JOIN_ORDER_CONFIG.MAX_BONUS_RECIPIENTS) {
            logger.debug({
                accessCode,
                userId,
                currentJoinCount,
                maxRecipients: JOIN_ORDER_CONFIG.MAX_BONUS_RECIPIENTS
            }, '🚫 [JOIN-ORDER-BONUS] Join order bonus limit reached');
            return 0;
        }

        // Add user to join order list
        await redisClient.rpush(joinOrderKey, userId);

        // Set expiration for join order tracking (24 hours)
        await redisClient.expire(joinOrderKey, 24 * 60 * 60);

        // Calculate bonus: starts at BASE_BONUS, decreases by BONUS_DECREMENT for each position
        const joinPosition = currentJoinCount; // 0-indexed (first joiner = position 0)
        const bonusScore = Math.max(
            JOIN_ORDER_CONFIG.MIN_BONUS,
            JOIN_ORDER_CONFIG.BASE_BONUS - (joinPosition * JOIN_ORDER_CONFIG.BONUS_DECREMENT)
        );

        logger.info({
            accessCode,
            userId,
            joinPosition: joinPosition + 1, // 1-indexed for logging
            bonusScore,
            totalJoinersWithBonus: currentJoinCount + 1,
            config: JOIN_ORDER_CONFIG
        }, '✅ [JOIN-ORDER-BONUS] Assigned join order bonus');

        return bonusScore;

    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            accessCode,
            userId
        }, '❌ [JOIN-ORDER-BONUS] Error assigning join order bonus');
        return 0;
    }
}

/**
 * Get the current join order for debugging/admin purposes
 * 
 * @param accessCode - Game access code
 * @returns Promise<string[]> - Array of user IDs in join order
 */
export async function getJoinOrder(accessCode: string): Promise<string[]> {
    try {
        const joinOrderKey = `mathquest:game:join_order:${accessCode}`;
        return await redisClient.lrange(joinOrderKey, 0, -1);
    } catch (error) {
        logger.error({ error, accessCode }, 'Error getting join order');
        return [];
    }
}

/**
 * Clear join order tracking for a game (useful for testing/cleanup)
 * 
 * @param accessCode - Game access code
 */
export async function clearJoinOrder(accessCode: string): Promise<void> {
    try {
        const joinOrderKey = `mathquest:game:join_order:${accessCode}`;
        await redisClient.del(joinOrderKey);
        logger.info({ accessCode }, 'Cleared join order tracking');
    } catch (error) {
        logger.error({ error, accessCode }, 'Error clearing join order');
    }
}
