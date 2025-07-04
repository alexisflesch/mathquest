"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllGameInstanceRedisKeys = deleteAllGameInstanceRedisKeys;
const redis_1 = require("@/config/redis");
/**
 * Delete all Redis keys for a given accessCode (gameInstance)
 * Patterns covered: all mathquest:game:* and lobby keys for the accessCode
 */
async function deleteAllGameInstanceRedisKeys(accessCode) {
    const redisPatterns = [
        `mathquest:game:*${accessCode}*`,
        `mathquest:explanation_sent:${accessCode}:*`,
        `mathquest:lobby:${accessCode}`
    ];
    for (const pattern of redisPatterns) {
        const keys = await redis_1.redisClient.keys(pattern);
        if (keys.length > 0) {
            await redis_1.redisClient.del(...keys);
        }
    }
}
