"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOngoingDeferredSession = hasOngoingDeferredSession;
exports.setDeferredSessionActive = setDeferredSessionActive;
exports.setDeferredSessionOver = setDeferredSessionOver;
const redis_1 = require("@/config/redis");
const canonicalTimerService_1 = require("../canonicalTimerService");
const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
/**
 * Returns true if ANY timer for this user/game/attempt has timerEndDateMs > now (i.e., session in progress)
 * Only checks timerEndDateMs, not status.
 */
async function hasOngoingDeferredSession({ accessCode, userId, attemptCount }) {
    const sessionKey = `deferred_session_status:${accessCode}:${userId}:${attemptCount}`;
    const logger = require('@/utils/logger').default('DeferredTimerUtils');
    try {
        const value = await redis_1.redisClient.get(sessionKey);
        const result = value === 'active';
        logger.info({ accessCode, userId, attemptCount, sessionKey, value, result }, '[DEBUG] hasOngoingDeferredSession: session key check');
        return result;
    }
    catch (err) {
        logger.error({ accessCode, userId, attemptCount, sessionKey, err }, '[ERROR] hasOngoingDeferredSession: Redis error');
        return false;
    }
}
async function setDeferredSessionActive({ accessCode, userId, attemptCount }) {
    const sessionKey = `deferred_session_status:${accessCode}:${userId}:${attemptCount}`;
    await redis_1.redisClient.set(sessionKey, 'active');
    const logger = require('@/utils/logger').default('DeferredTimerUtils');
    logger.info({ accessCode, userId, attemptCount, sessionKey }, '[DEBUG] setDeferredSessionActive: session marked active');
}
async function setDeferredSessionOver({ accessCode, userId, attemptCount }) {
    const sessionKey = `deferred_session_status:${accessCode}:${userId}:${attemptCount}`;
    await redis_1.redisClient.set(sessionKey, 'over');
    const logger = require('@/utils/logger').default('DeferredTimerUtils');
    logger.info({ accessCode, userId, attemptCount, sessionKey }, '[DEBUG] setDeferredSessionOver: session marked over');
}
