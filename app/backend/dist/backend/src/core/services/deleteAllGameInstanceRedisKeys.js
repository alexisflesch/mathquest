"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllGameInstanceRedisKeys = deleteAllGameInstanceRedisKeys;
const redis_1 = require("@/config/redis");
const redisCleanup_1 = require("@/utils/redisCleanup");
/**
 * Delete all Redis keys for a given accessCode (gameInstance)
 * Uses the comprehensive cleanup utility to ensure all keys are properly removed
 * including new deferred session keys
 */
async function deleteAllGameInstanceRedisKeys(accessCode) {
    // Use the comprehensive cleanup utility that covers all key patterns
    await (0, redisCleanup_1.cleanupGameRedisKeys)(accessCode, 'deleteGameInstance');
    // Additional cleanup for any legacy patterns that might not be covered
    const legacyPatterns = [
        `mathquest:lobby:${accessCode}`,
        `mathquest:explanation_sent:${accessCode}:*`,
    ];
    for (const pattern of legacyPatterns) {
        const keys = await redis_1.redisClient.keys(pattern);
        if (keys.length > 0) {
            console.log(`[REDIS_CLEANUP] Deleting ${keys.length} legacy keys matching pattern: ${pattern}`);
            console.log(`[REDIS_CLEANUP] Keys: ${keys.join(', ')}`);
            await redis_1.redisClient.del(...keys);
        }
    }
}
