/**
 * TimingService - Server-side question timing for secure scoring
 * 
 * This service ensures that all time calculations for scoring are performed
 * server-side to prevent client-side manipulation of scores.
 * 
 * Security Note: Never trust the client for timing information that affects scoring.
 */

import { redisClient as redis } from '@/config/redis';
import createLogger from '@/utils/logger';

const logger = createLogger('TimingService');

export interface QuestionTimingData {
    questionUid: string;
    userId: string;
    accessCode: string;
    startTime: number;
    endTime?: number;
    timeSpentMs?: number;
}

export class TimingService {
    private static readonly TIMING_KEY_PREFIX = 'mathquest:game:question_start';
    private static readonly DEFAULT_EXPIRY_SECONDS = 300; // 5 minutes

    /**
     * Track when a user first sees a specific question
     * @param accessCode - Game access code
     * @param questionUid - Unique question identifier
     * @param userId - User identifier
     * @returns Promise<boolean> - true if tracking started, false if already tracking
     */
    static async trackQuestionStart(
        accessCode: string,
        questionUid: string,
        userId: string
    ): Promise<boolean> {
        try {
            const key = this.getTimingKey(accessCode, questionUid, userId);
            const startTime = Date.now();

            // Only set if key doesn't exist (first time seeing this question)
            const result = await redis.set(
                key,
                startTime.toString(),
                'EX',
                this.DEFAULT_EXPIRY_SECONDS,
                'NX' // Only set if key does not exist
            );

            const wasSet = result === 'OK';

            logger.info({
                accessCode, questionUid, userId, key, startTime, wasSet
            }, 'DIAGNOSTIC: trackQuestionStart called');

            if (wasSet) {
                logger.debug({
                    accessCode, questionUid, userId, startTime
                }, 'Question start time tracked');
            } else {
                logger.debug({
                    accessCode, questionUid, userId
                }, 'Question start time already exists');
            }

            return wasSet;
        } catch (error) {
            logger.error({
                accessCode, questionUid, userId, error
            }, 'Failed to track question start time');
            return false;
        }
    }

    /**
     * Calculate time spent on a question and clean up tracking data
     * @param accessCode - Game access code
     * @param questionUid - Unique question identifier
     * @param userId - User identifier
     * @returns Promise<number> - Time spent in milliseconds (0 if no start time found)
     */
    static async calculateAndCleanupTimeSpent(
        accessCode: string,
        questionUid: string,
        userId: string
    ): Promise<number> {
        try {
            const key = this.getTimingKey(accessCode, questionUid, userId);
            const startTimeStr = await redis.get(key);

            logger.info({
                accessCode, questionUid, userId, key, startTimeStr
            }, 'DIAGNOSTIC: calculateAndCleanupTimeSpent called');

            if (!startTimeStr) {
                logger.warn({
                    accessCode, questionUid, userId
                }, 'No question start time found for user');
                return 0;
            }

            const startTime = parseInt(startTimeStr);
            const endTime = Date.now();
            const timeSpentMs = Math.max(0, endTime - startTime);

            // Clean up the timing record
            await redis.del(key);

            logger.debug({
                accessCode, questionUid, userId,
                startTime, endTime, timeSpentMs
            }, 'Calculated server-side time spent');

            return timeSpentMs;
        } catch (error) {
            logger.error({
                accessCode, questionUid, userId, error
            }, 'Failed to cleanup question timing data');
            return 0;
        }
    }

    /**
     * Track question start time for multiple users at once
     * Useful when broadcasting questions to all users in a room
     * @param accessCode - Game access code
     * @param questionUid - Unique question identifier
     * @param userIds - Array of user identifiers
     * @returns Promise<number> - Number of users successfully tracked
     */
    static async trackQuestionStartForUsers(
        accessCode: string,
        questionUid: string,
        userIds: string[]
    ): Promise<number> {
        if (!userIds || userIds.length === 0) {
            return 0;
        }

        let successCount = 0;
        const startTime = Date.now().toString();

        try {
            // Use pipeline for better performance
            const pipeline = redis.pipeline();

            for (const userId of userIds) {
                const key = this.getTimingKey(accessCode, questionUid, userId);
                pipeline.set(key, startTime, 'EX', this.DEFAULT_EXPIRY_SECONDS, 'NX');
            }

            const results = await pipeline.exec();

            if (results) {
                successCount = results.filter(([error, result]) =>
                    error === null && result === 'OK'
                ).length;
            }

            logger.debug({
                accessCode, questionUid,
                totalUsers: userIds.length,
                successCount
            }, 'Tracked question start time for multiple users');

        } catch (error) {
            logger.error({
                accessCode, questionUid,
                userCount: userIds.length, error
            }, 'Failed to track question start time for multiple users');
        }

        return successCount;
    }

    /**
     * Clean up timing data for a specific question (e.g., when question ends)
     * @param accessCode - Game access code
     * @param questionUid - Unique question identifier
     * @returns Promise<number> - Number of timing records cleaned up
     */
    static async cleanupQuestionTiming(
        accessCode: string,
        questionUid: string
    ): Promise<number> {
        try {
            const pattern = `${this.TIMING_KEY_PREFIX}:${accessCode}:${questionUid}:*`;
            const keys = await redis.keys(pattern);

            if (keys.length === 0) {
                return 0;
            }

            await redis.del(...keys);

            logger.debug({
                accessCode, questionUid,
                cleanedUpCount: keys.length
            }, 'Cleaned up question timing data');

            return keys.length;
        } catch (error) {
            logger.error({
                accessCode, questionUid, error
            }, 'Failed to cleanup question timing data');
            return 0;
        }
    }

    /**
     * Generate Redis key for question timing
     */
    private static getTimingKey(
        accessCode: string,
        questionUid: string,
        userId: string
    ): string {
        return `${this.TIMING_KEY_PREFIX}:${accessCode}:${questionUid}:${userId}`;
    }
}

export default TimingService;
