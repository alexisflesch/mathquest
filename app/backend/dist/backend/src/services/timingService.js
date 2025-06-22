"use strict";
/**
 * TimingService - Server-side question timing for secure scoring
 *
 * This service ensures that all time calculations for scoring are performed
 * server-side to prevent client-side manipulation of scores.
 *
 * Security Note: Never trust the client for timing information that affects scoring.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimingService = void 0;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('TimingService');
class TimingService {
    /**
     * Track when a user first sees a specific question
     * @param accessCode - Game access code
     * @param questionUid - Unique question identifier
     * @param userId - User identifier
     * @returns Promise<boolean> - true if tracking started, false if already tracking
     */
    static async trackQuestionStart(accessCode, questionUid, userId) {
        try {
            const key = this.getTimingKey(accessCode, questionUid, userId);
            const startTime = Date.now();
            // Only set if key doesn't exist (first time seeing this question)
            const result = await redis_1.redisClient.set(key, startTime.toString(), 'EX', this.DEFAULT_EXPIRY_SECONDS, 'NX' // Only set if key does not exist
            );
            const wasSet = result === 'OK';
            logger.info({
                accessCode, questionUid, userId, key, startTime, wasSet
            }, 'DIAGNOSTIC: trackQuestionStart called');
            if (wasSet) {
                logger.debug({
                    accessCode, questionUid, userId, startTime
                }, 'Question start time tracked');
            }
            else {
                logger.debug({
                    accessCode, questionUid, userId
                }, 'Question start time already exists');
            }
            return wasSet;
        }
        catch (error) {
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
    static async calculateAndCleanupTimeSpent(accessCode, questionUid, userId) {
        try {
            const key = this.getTimingKey(accessCode, questionUid, userId);
            const startTimeStr = await redis_1.redisClient.get(key);
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
            await redis_1.redisClient.del(key);
            logger.debug({
                accessCode, questionUid, userId,
                startTime, endTime, timeSpentMs
            }, 'Calculated server-side time spent');
            return timeSpentMs;
        }
        catch (error) {
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
    static async trackQuestionStartForUsers(accessCode, questionUid, userIds) {
        if (!userIds || userIds.length === 0) {
            return 0;
        }
        let successCount = 0;
        const startTime = Date.now().toString();
        try {
            // Use pipeline for better performance
            const pipeline = redis_1.redisClient.pipeline();
            for (const userId of userIds) {
                const key = this.getTimingKey(accessCode, questionUid, userId);
                pipeline.set(key, startTime, 'EX', this.DEFAULT_EXPIRY_SECONDS, 'NX');
            }
            const results = await pipeline.exec();
            if (results) {
                successCount = results.filter(([error, result]) => error === null && result === 'OK').length;
            }
            logger.debug({
                accessCode, questionUid,
                totalUsers: userIds.length,
                successCount
            }, 'Tracked question start time for multiple users');
        }
        catch (error) {
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
    static async cleanupQuestionTiming(accessCode, questionUid) {
        try {
            const pattern = `${this.TIMING_KEY_PREFIX}:${accessCode}:${questionUid}:*`;
            const keys = await redis_1.redisClient.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            await redis_1.redisClient.del(...keys);
            logger.debug({
                accessCode, questionUid,
                cleanedUpCount: keys.length
            }, 'Cleaned up question timing data');
            return keys.length;
        }
        catch (error) {
            logger.error({
                accessCode, questionUid, error
            }, 'Failed to cleanup question timing data');
            return 0;
        }
    }
    /**
     * Generate Redis key for question timing
     */
    static getTimingKey(accessCode, questionUid, userId) {
        return `${this.TIMING_KEY_PREFIX}:${accessCode}:${questionUid}:${userId}`;
    }
}
exports.TimingService = TimingService;
TimingService.TIMING_KEY_PREFIX = 'mathquest:game:question_start';
TimingService.DEFAULT_EXPIRY_SECONDS = 300; // 5 minutes
exports.default = TimingService;
