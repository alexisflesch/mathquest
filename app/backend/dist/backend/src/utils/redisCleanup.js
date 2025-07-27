"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupGameRedisKeys = cleanupGameRedisKeys;
exports.cleanupDeferredSessionRedisKeys = cleanupDeferredSessionRedisKeys;
exports.getGameRedisKeyPatterns = getGameRedisKeyPatterns;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('RedisCleanup');
/**
 * Comprehensive Redis cleanup utility for MathQuest games
 * Removes all Redis keys associated with a game session
 *
 * @param accessCode - The game access code
 * @param context - Optional context for logging (e.g., 'endGame', 'sharedGameFlow')
 */
async function cleanupGameRedisKeys(accessCode, context = 'cleanup') {
    logger.info({ accessCode, context }, 'Starting comprehensive Redis cleanup for game');
    // All possible key patterns for a game
    const gameDataKeys = [
        // Live game keys
        `mathquest:game:participants:${accessCode}`,
        `mathquest:game:leaderboard:${accessCode}`,
        `mathquest:game:answers:${accessCode}:*`,
        `mathquest:game:join_order:${accessCode}`,
        `mathquest:game:userIdToSocketId:${accessCode}`,
        `mathquest:game:socketIdToUserId:${accessCode}`,
        `mathquest:game:gameState:${accessCode}`,
        `mathquest:game:${accessCode}`,
        `mathquest:game:terminatedQuestions:${accessCode}`,
        // Deferred session keys (general patterns)
        `deferred_session:${accessCode}:*`,
        `mathquest:deferred:timer:${accessCode}:*`,
        `mathquest:game:deferred_session:${accessCode}:*`,
        // Timer and progression keys (both live and deferred)
        `mathquest:timer:${accessCode}:*`,
        `mathquest:game:question_start:${accessCode}:*`,
        // Leaderboard and projection keys
        `leaderboard:snapshot:${accessCode}`,
        `mathquest:projection:display:${accessCode}`
    ];
    await performCleanup(gameDataKeys, accessCode, context);
}
/**
 * Deferred session specific Redis cleanup utility
 * Removes Redis keys for a specific deferred session (user + attempt)
 *
 * @param accessCode - The game access code
 * @param userId - The user ID for the deferred session
 * @param attemptCount - The attempt number for this session
 * @param context - Optional context for logging
 */
async function cleanupDeferredSessionRedisKeys(accessCode, userId, attemptCount, context = 'deferredSession') {
    logger.info({ accessCode, userId, attemptCount, context }, 'Starting deferred session specific Redis cleanup');
    // Deferred session specific key patterns
    const deferredSessionKeys = [
        // Question start tracking for this specific user/attempt (with attempt count in key)
        `mathquest:game:question_start:${accessCode}:*:${userId}:${attemptCount}`,
        // Deferred session state for this specific user/attempt
        `mathquest:game:deferred_session:${accessCode}:${userId}:${attemptCount}`,
        `deferred_session:${accessCode}:${userId}:${attemptCount}`,
        // Timer keys for this specific user/attempt
        `mathquest:deferred:timer:${accessCode}:${userId}:${attemptCount}:*`,
        `mathquest:timer:${accessCode}:*:${userId}:${attemptCount}`,
        // Explanation tracking for this user
        `mathquest:explanation_sent:${accessCode}:*:${userId}`
    ];
    await performCleanup(deferredSessionKeys, accessCode, context, { userId, attemptCount });
}
/**
 * Helper function to perform the actual cleanup
 */
async function performCleanup(keyPatterns, accessCode, context, additionalInfo) {
    let totalCleaned = 0;
    const cleanedKeys = [];
    try {
        for (const key of keyPatterns) {
            if (key.includes('*')) {
                // Handle wildcard keys
                const keys = await redis_1.redisClient.keys(key);
                if (keys.length > 0) {
                    await redis_1.redisClient.del(...keys);
                    totalCleaned += keys.length;
                    cleanedKeys.push(...keys);
                }
            }
            else {
                // Handle exact keys
                const exists = await redis_1.redisClient.exists(key);
                if (exists) {
                    await redis_1.redisClient.del(key);
                    totalCleaned += 1;
                    cleanedKeys.push(key);
                }
            }
        }
        logger.info({
            accessCode,
            context,
            totalCleaned,
            ...additionalInfo,
            cleanedKeys: cleanedKeys.length > 10 ? `${cleanedKeys.slice(0, 10)}... (+${cleanedKeys.length - 10} more)` : cleanedKeys
        }, 'Redis cleanup completed successfully');
    }
    catch (error) {
        logger.error({ accessCode, context, ...additionalInfo, error }, 'Error during Redis cleanup');
        throw error;
    }
}
/**
 * Get all key patterns that would be cleaned for a given access code
 * Useful for debugging or validation
 *
 * @param accessCode - The game access code
 * @returns Array of key patterns
 */
function getGameRedisKeyPatterns(accessCode) {
    return [
        // Live game keys
        `mathquest:game:participants:${accessCode}`,
        `mathquest:game:leaderboard:${accessCode}`,
        `mathquest:game:answers:${accessCode}:*`,
        `mathquest:game:join_order:${accessCode}`,
        `mathquest:game:userIdToSocketId:${accessCode}`,
        `mathquest:game:socketIdToUserId:${accessCode}`,
        `mathquest:game:gameState:${accessCode}`,
        `mathquest:game:${accessCode}`,
        `mathquest:game:terminatedQuestions:${accessCode}`,
        // Deferred session keys
        `deferred_session:${accessCode}:*`,
        `mathquest:deferred:timer:${accessCode}:*`,
        `mathquest:game:deferred_session:${accessCode}:*`,
        // Timer and progression keys
        `mathquest:timer:${accessCode}:*`,
        `mathquest:game:question_start:${accessCode}:*`,
        // Leaderboard and projection keys
        `leaderboard:snapshot:${accessCode}`,
        `mathquest:projection:display:${accessCode}`
    ];
}
