"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDifferedParticipation = exports.DifferedScoreService = exports.DifferedParticipationSchema = void 0;
const zod_1 = require("zod");
const scoringService_1 = require("../scoringService");
const logger_1 = __importDefault(require("@/utils/logger"));
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const logger = (0, logger_1.default)('GameParticipantScoreService');
/**
 * Zod schema for validating participation creation and update payloads.
 */
exports.DifferedParticipationSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    tournamentId: zod_1.z.string(),
    mode: zod_1.z.literal('tournament'),
    attempt: zod_1.z.number().int().min(1),
    score: zod_1.z.number().int().min(0),
    bestScore: zod_1.z.number().int().min(0),
});
/**
 * Service for managing differed tournament participations.
 * Ensures only one live and one differed participation per user/tournament.
 * Tracks best score and attempt count. Resets score for each new attempt.
 */
class DifferedScoreService {
    /**
     * Get or create a differed participation for a user/tournament.
     * If a new attempt, resets score and increments attempt count.
     */
    static async getOrCreateParticipation({ userId, gameInstanceId }) {
        // Find existing DEFERRED participant for this user/gameInstance
        let participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId,
                userId,
                participationType: 'DEFERRED'
            }
        });
        if (!participant) {
            // Create new DEFERRED participant
            participant = await prisma_1.prisma.gameParticipant.create({
                data: {
                    gameInstanceId,
                    userId,
                    score: 0,
                    participationType: 'DEFERRED',
                    attemptCount: 1
                }
            });
        }
        else {
            // New attempt: increment attemptCount, reset score
            participant = await prisma_1.prisma.gameParticipant.update({
                where: { id: participant.id },
                data: {
                    attemptCount: { increment: 1 },
                    score: 0
                }
            });
        }
        return participant;
    }
    /**
     * Update the score for a differed participation. If new score is higher, update score.
     */
    static async updateScore({ userId, gameInstanceId, score }) {
        let participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId,
                userId,
                participationType: 'DEFERRED'
            }
        });
        if (!participant)
            throw new Error('Participant not found');
        // Always replace score for DEFERRED, but you can keep best in Redis if needed
        participant = await prisma_1.prisma.gameParticipant.update({
            where: { id: participant.id },
            data: { score }
        });
        return participant;
    }
    /**
     * Get the best score and attempt count for leaderboard display.
     */
    static async getLeaderboardEntry({ userId, gameInstanceId }) {
        const participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId,
                userId,
                participationType: 'DEFERRED'
            }
        });
        if (!participant)
            throw new Error('Participant not found');
        return { score: participant.score, attemptCount: participant.attemptCount };
    }
    /**
     * Submit an answer and update score for a participant (delegates to ScoringService)
     * Handles both LIVE and DEFERRED scoring logic.
     */
    static async submitAnswer({ gameInstanceId, userId, answerData }) {
        return await scoringService_1.ScoringService.submitAnswerWithScoring(gameInstanceId, userId, answerData);
    }
    /**
     * Finalize a deferred tournament attempt by keeping the best score
     * This should be called when a user completes a deferred tournament attempt
     */
    static async finalizeDeferredAttempt({ gameInstanceId, userId, currentAttemptScore }) {
        try {
            const participant = await prisma_1.prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId,
                    userId,
                    participationType: 'DEFERRED'
                },
                include: { user: true }
            });
            if (!participant) {
                logger.error({ gameInstanceId, userId }, 'No deferred participant found for finalization');
                return { success: false, error: 'Participant not found' };
            }
            const redisKey = `mathquest:deferred:best_score:${gameInstanceId}:${userId}`;
            const previousBestScore = await redis_1.redisClient.get(redisKey);
            const bestScore = Math.max(currentAttemptScore, previousBestScore ? parseInt(previousBestScore) : 0, participant.score || 0);
            await redis_1.redisClient.set(redisKey, bestScore.toString());
            const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
                where: { id: participant.id },
                data: { score: bestScore },
                include: { user: true }
            });
            logger.info({
                gameInstanceId,
                userId,
                participantId: participant.id,
                currentAttemptScore,
                previousBestScore: previousBestScore ? parseInt(previousBestScore) : 0,
                finalBestScore: bestScore,
                attemptCount: participant.attemptCount
            }, 'Finalized deferred tournament attempt with best score');
            return {
                success: true,
                participant: updatedParticipant,
                isNewBest: bestScore > (previousBestScore ? parseInt(previousBestScore) : 0),
                previousBest: previousBestScore ? parseInt(previousBestScore) : 0
            };
        }
        catch (error) {
            logger.error({ error, gameInstanceId, userId, currentAttemptScore }, 'Error finalizing deferred attempt');
            return { success: false, error: 'An error occurred while finalizing attempt' };
        }
    }
    /**
     * For DEFERRED: get or update the best score for a user in Redis (for leaderboard)
     */
    static async updateBestScoreInRedis({ gameInstanceId, userId, score }) {
        const redisKey = `mathquest:deferred:best_score:${gameInstanceId}:${userId}`;
        const previousBestScore = await redis_1.redisClient.get(redisKey);
        const bestScore = Math.max(score, previousBestScore ? parseInt(previousBestScore) : 0);
        await redis_1.redisClient.set(redisKey, bestScore.toString());
        return bestScore;
    }
    /**
     * For DEFERRED: get the best score for a user from Redis
     */
    static async getBestScoreFromRedis({ gameInstanceId, userId }) {
        const redisKey = `mathquest:deferred:best_score:${gameInstanceId}:${userId}`;
        const bestScore = await redis_1.redisClient.get(redisKey);
        return bestScore ? parseInt(bestScore) : 0;
    }
}
exports.DifferedScoreService = DifferedScoreService;
// All API boundaries must validate with Zod
const validateDifferedParticipation = (data) => {
    return exports.DifferedParticipationSchema.parse(data);
};
exports.validateDifferedParticipation = validateDifferedParticipation;
