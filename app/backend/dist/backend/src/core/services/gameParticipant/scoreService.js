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
    static async getOrCreateParticipation({ userId, tournamentId }) {
        // TODO: Replace with actual DB logic
        // Example pseudo-logic:
        // 1. Find existing participation for user/tournament/mode=DIFFERED
        // 2. If not found, create with attempt=1, score=0, bestScore=0
        // 3. If found, increment attempt, reset score
        // 4. Return participation
        throw new Error('Not implemented: getOrCreateParticipation');
    }
    /**
     * Update the score for a differed participation. If new score is higher, update bestScore.
     */
    static async updateScore({ userId, tournamentId, score }) {
        // TODO: Replace with actual DB logic
        // 1. Find participation
        // 2. Update score
        // 3. If score > bestScore, update bestScore
        // 4. Return updated participation
        throw new Error('Not implemented: updateScore');
    }
    /**
     * Get the best score and attempt count for leaderboard display.
     */
    static async getLeaderboardEntry({ userId, tournamentId }) {
        // TODO: Replace with actual DB logic
        throw new Error('Not implemented: getLeaderboardEntry');
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
}
exports.DifferedScoreService = DifferedScoreService;
// All API boundaries must validate with Zod
const validateDifferedParticipation = (data) => {
    return exports.DifferedParticipationSchema.parse(data);
};
exports.validateDifferedParticipation = validateDifferedParticipation;
