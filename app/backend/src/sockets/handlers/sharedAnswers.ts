// Shared answer collection logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers

import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

const logger = createLogger('AnswerUtils');

/**
 * Collect all answers for a given question in a game, optionally for a specific attempt (DEFERRED mode)
 * Canonical: For DEFERRED mode, always use attemptCount-based answer keys.
 * @param accessCode Game access code
 * @param questionUid Question UID
 * @param attemptCount Optional attempt number (for DEFERRED mode)
 * @param playMode Optional play mode (for logging)
 * @returns Array of answer objects
 */
export async function collectAnswers(accessCode: string, questionUid: string, attemptCount?: number, playMode?: string) {
    let key = `mathquest:game:answers:${accessCode}:${questionUid}`;
    if (typeof attemptCount === 'number' && playMode === 'tournament') {
        key = `mathquest:game:answers:${accessCode}:${questionUid}:${attemptCount}`;
    }
    logger.info({ accessCode, questionUid, attemptCount, playMode, key }, '[DIAGNOSTIC] collectAnswers using key (canonical, attempt-based for DEFERRED)');
    const answersRaw = await redisClient.hgetall(key);
    if (!answersRaw) return [];
    return Object.values(answersRaw).map((json: any) => JSON.parse(json));
}
