"use strict";
/**
 * Join Order Bonus Utility
 *
 * Provides micro-score bonuses to early joiners for better UX on the projection leaderboard.
 * Students get tiny bonuses based on join order, ensuring they appear on leaderboard immediately.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignJoinOrderBonus = assignJoinOrderBonus;
exports.getJoinOrder = getJoinOrder;
exports.clearJoinOrder = clearJoinOrder;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('JoinOrderBonus');
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
};
/**
 * Calculate and assign join order bonus for a student joining a game
 *
 * @param accessCode - Game access code
 * @param userId - Student's user ID
 * @returns Promise<number> - The bonus score assigned (0 if no bonus)
 */
async function assignJoinOrderBonus(accessCode, userId) {
    logger.info({
        accessCode,
        userId
    }, '🎯 [JOIN-ORDER-BONUS] Starting join order bonus assignment');
    try {
        const joinOrderKey = `mathquest:game:join_order:${accessCode}`;
        // Get current join count using Redis LLEN (list length)
        const currentJoinCount = await redis_1.redisClient.llen(joinOrderKey);
        logger.debug({
            accessCode,
            userId,
            joinOrderKey,
            currentJoinCount
        }, '📊 [JOIN-ORDER-BONUS] Current join count retrieved');
        // Check if this user already has a join order (prevent duplicates)
        const existingJoinOrders = await redis_1.redisClient.lrange(joinOrderKey, 0, -1);
        if (existingJoinOrders.includes(userId)) {
            logger.debug({
                accessCode,
                userId,
                currentJoinCount,
                existingJoinOrders
            }, '⏭️ [JOIN-ORDER-BONUS] User already has join order bonus');
            logger.info({
                accessCode,
                userId,
                returnValue: 0
            }, '✅ [JOIN-ORDER-BONUS] Returning 0 for duplicate user');
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
            logger.info({
                accessCode,
                userId,
                returnValue: 0
            }, '✅ [JOIN-ORDER-BONUS] Returning 0 for bonus limit reached');
            return 0;
        }
        // Add user to join order list
        await redis_1.redisClient.rpush(joinOrderKey, userId);
        // Set expiration for join order tracking (24 hours)
        await redis_1.redisClient.expire(joinOrderKey, 24 * 60 * 60);
        // Calculate bonus: starts at BASE_BONUS, decreases by BONUS_DECREMENT for each position
        const joinPosition = currentJoinCount; // 0-indexed (first joiner = position 0)
        const bonusScore = Math.max(JOIN_ORDER_CONFIG.MIN_BONUS, JOIN_ORDER_CONFIG.BASE_BONUS - (joinPosition * JOIN_ORDER_CONFIG.BONUS_DECREMENT));
        logger.info({
            accessCode,
            userId,
            joinPosition: joinPosition + 1, // 1-indexed for logging
            bonusScore,
            totalJoinersWithBonus: currentJoinCount + 1,
            config: JOIN_ORDER_CONFIG
        }, '✅ [JOIN-ORDER-BONUS] Assigned join order bonus');
        logger.info({
            accessCode,
            userId,
            returnValue: bonusScore
        }, '✅ [JOIN-ORDER-BONUS] Returning bonus score');
        return bonusScore;
    }
    catch (error) {
        logger.error({
            error,
            accessCode,
            userId
        }, '❌ [JOIN-ORDER-BONUS] Error in assignJoinOrderBonus');
        logger.info({
            accessCode,
            userId,
            returnValue: 0
        }, '✅ [JOIN-ORDER-BONUS] Returning 0 on error');
        return 0; // Return 0 on error to prevent undefined
    }
}
/**
 * Get the current join order for debugging/admin purposes
 *
 * @param accessCode - Game access code
 * @returns Promise<string[]> - Array of user IDs in join order
 */
async function getJoinOrder(accessCode) {
    try {
        const joinOrderKey = `mathquest:game:join_order:${accessCode}`;
        return await redis_1.redisClient.lrange(joinOrderKey, 0, -1);
    }
    catch (error) {
        logger.error({ error, accessCode }, 'Error getting join order');
        return [];
    }
}
/**
 * Clear join order tracking for a game (useful for testing/cleanup)
 *
 * @param accessCode - Game access code
 */
async function clearJoinOrder(accessCode) {
    try {
        const joinOrderKey = `mathquest:game:join_order:${accessCode}`;
        await redis_1.redisClient.del(joinOrderKey);
        logger.info({ accessCode }, 'Cleared join order tracking');
    }
    catch (error) {
        logger.error({ error, accessCode }, 'Error clearing join order');
    }
}
