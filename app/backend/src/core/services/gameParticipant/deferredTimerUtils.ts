import { redisClient } from '@/config/redis';
import { CanonicalTimerService } from '../canonicalTimerService';
import type { PlayMode } from '@shared/types/core/game';

const canonicalTimerService = new CanonicalTimerService(redisClient);

/**
 * Returns true if ANY timer for this user/game/attempt has timerEndDateMs > now (i.e., session in progress)
 * Only checks timerEndDateMs, not status.
 */
export async function hasOngoingDeferredSession({
    accessCode,
    userId,
    attemptCount
}: {
    accessCode: string;
    userId: string;
    attemptCount: number;
}): Promise<boolean> {
    const sessionKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
    const logger = require('@/utils/logger').default('DeferredTimerUtils');
    try {
        const value = await redisClient.get(sessionKey);
        logger.info({ accessCode, userId, attemptCount, sessionKey, value }, '[DEBUG] hasOngoingDeferredSession: session key check');
        return value === 'active';
    } catch (err) {
        logger.error({ accessCode, userId, attemptCount, sessionKey, err }, '[ERROR] hasOngoingDeferredSession: Redis error');
        return false;
    }
}

export async function setDeferredSessionActive({ accessCode, userId, attemptCount }: { accessCode: string; userId: string; attemptCount: number; }) {
    const sessionKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
    await redisClient.set(sessionKey, 'active');
    const logger = require('@/utils/logger').default('DeferredTimerUtils');
    logger.info({ accessCode, userId, attemptCount, sessionKey }, '[DEBUG] setDeferredSessionActive: session marked active');
}

export async function setDeferredSessionOver({ accessCode, userId, attemptCount }: { accessCode: string; userId: string; attemptCount: number; }) {
    const sessionKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
    await redisClient.set(sessionKey, 'over');
    const logger = require('@/utils/logger').default('DeferredTimerUtils');
    logger.info({ accessCode, userId, attemptCount, sessionKey }, '[DEBUG] setDeferredSessionOver: session marked over');
}
