// Shared answer collection logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers

import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

const logger = createLogger('AnswerUtils');

/**
 * Collect all answers for a given question in a game
 * @param accessCode Game access code
 * @param questionUid Question UID
 * @returns Array of answer objects
 */
export async function collectAnswers(accessCode: string, questionUid: string) {
    const answersRaw = await redisClient.hgetall(`mathquest:game:answers:${accessCode}:${questionUid}`);
    if (!answersRaw) return [];
    return Object.values(answersRaw).map((json: any) => JSON.parse(json));
}
