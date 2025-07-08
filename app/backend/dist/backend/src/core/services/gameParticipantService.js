"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameParticipantService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const scoringService_1 = require("./scoringService");
const redis_1 = require("@/config/redis");
// Create a service-specific logger
const logger = (0, logger_1.default)('GameParticipantService');
// Helper function to map Prisma participant to core GameParticipant
function mapPrismaToGameParticipant(prismaParticipant) {
    return {
        id: prismaParticipant.id,
        userId: prismaParticipant.userId,
        username: prismaParticipant.user?.username || 'Unknown',
        avatarEmoji: prismaParticipant.user?.avatarEmoji || '😀',
        score: prismaParticipant.liveScore || prismaParticipant.deferredScore || 0,
        joinedAt: prismaParticipant.joinedAt?.toISOString() || new Date().toISOString(),
        attemptCount: prismaParticipant.nbAttempts || 1,
        online: true // Default to online when mapping
    };
}
// Utility to clear or namespace answers for a new DEFERRED attempt
async function clearDeferredAnswers(gameInstanceId, userId, attemptCount) {
    // Canonical: Answers are stored as mathquest:game:answers:{accessCode}:{questionUid}:{attemptCount}
    // Remove all answer keys for previous attempt for this user/game
    const gameInstance = await prisma_1.prisma.gameInstance.findUnique({ where: { id: gameInstanceId }, select: { accessCode: true, gameTemplateId: true } });
    if (!gameInstance)
        return;
    const accessCode = gameInstance.accessCode;
    // Fetch all questions for this game via gameTemplate
    const questionsInTemplate = await prisma_1.prisma.questionsInGameTemplate.findMany({ where: { gameTemplateId: gameInstance.gameTemplateId }, select: { questionUid: true } });
    if (!questionsInTemplate.length) {
        logger.warn({ gameInstanceId, userId, attemptCount, gameTemplateId: gameInstance.gameTemplateId }, '[DEFERRED] No questions found for gameTemplate');
        return;
    }
    for (const q of questionsInTemplate) {
        const prevKey = `mathquest:game:answers:${accessCode}:${q.questionUid}:${attemptCount - 1}`;
        await redis_1.redisClient.hdel(prevKey, userId);
        logger.info({ gameInstanceId, userId, prevAttempt: attemptCount - 1, prevKey }, '[DEFERRED] Cleared previous attempt answer for question');
    }
}
// Utility to clear ALL answers for a user in a game (all attempts, all questions)
async function clearAllDeferredAnswers(gameInstanceId, userId) {
    const gameInstance = await prisma_1.prisma.gameInstance.findUnique({ where: { id: gameInstanceId }, select: { accessCode: true, gameTemplateId: true } });
    if (!gameInstance)
        return;
    const accessCode = gameInstance.accessCode;
    const questionsInTemplate = await prisma_1.prisma.questionsInGameTemplate.findMany({ where: { gameTemplateId: gameInstance.gameTemplateId }, select: { questionUid: true } });
    if (!questionsInTemplate.length)
        return;
    for (const q of questionsInTemplate) {
        // Delete all answer keys for all attempts for this question
        // Use Redis SCAN to find all keys matching pattern
        const pattern = `mathquest:game:answers:${accessCode}:${q.questionUid}:*`;
        const keys = await redis_1.redisClient.keys(pattern);
        for (const key of keys) {
            await redis_1.redisClient.hdel(key, userId);
            logger.info({ gameInstanceId, userId, key }, '[DEFERRED] Cleared ALL previous answers for question');
        }
    }
}
/**
 * GameParticipant service class for managing game participants
 */
class GameParticipantService {
    /**
     * Create a new game participant
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the user
     * @param username Optional username for the participant
     * @param avatarEmoji Optional avatar emoji for the participant
     * @returns The created participant
     */
    async createParticipant(gameInstanceId, userId, username, avatarEmoji) {
        try {
            const participant = await prisma_1.prisma.gameParticipant.create({
                data: {
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 1,
                    status: 'ACTIVE',
                    gameInstance: { connect: { id: gameInstanceId } },
                    user: {
                        connectOrCreate: {
                            where: { id: userId },
                            create: {
                                username: username || `guest-${userId}`,
                                avatarEmoji: avatarEmoji || null,
                                role: 'STUDENT',
                                studentProfile: {
                                    create: {
                                        cookieId: `cookie-${userId}`
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return {
                success: true,
                participant: {
                    ...participant,
                    userId // Attach userId for downstream use
                }
            };
        }
        catch (error) {
            logger.error({ error, gameInstanceId, userId }, 'Error creating game participant');
            return {
                success: false,
                error: 'An error occurred while creating the participant'
            };
        }
    }
    /**
     * Submit an answer for a player in a game with proper duplicate checking and scoring
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the player
     * @param data The answer data
     * @returns The scoring result with details
     */
    async submitAnswer(gameInstanceId, userId, data, isDeferredOverride) {
        try {
            // Use the new scoring service for all answer submissions
            const scoreResult = await scoringService_1.ScoringService.submitAnswerWithScoring(gameInstanceId, userId, data, isDeferredOverride // PATCH: propagate override
            );
            if (!scoreResult.scoreUpdated && scoreResult.message === 'Participant not found') {
                return {
                    success: false,
                    error: 'Participant not found'
                };
            }
            logger.info({
                gameInstanceId,
                userId,
                questionUid: data.questionUid,
                scoreResult
            }, 'Answer submitted via ScoringService');
            return {
                success: true,
                scoreResult
            };
        }
        catch (error) {
            logger.error({ error, gameInstanceId, userId, data }, 'Error submitting answer');
            return {
                success: false,
                error: 'An error occurred while submitting answer'
            };
        }
    }
    /**
     * Get a participant by ID
     * @param participantId The ID of the participant
     * @returns The participant or null if not found
     */
    async getParticipantById(participantId) {
        try {
            const participant = await prisma_1.prisma.gameParticipant.findUnique({
                where: {
                    id: participantId
                },
                include: {
                    user: true
                }
            });
            return participant;
        }
        catch (error) {
            logger.error({ error, participantId }, 'Error getting participant');
            throw error;
        }
    }
    /**
     * Update participant score for deferred tournaments, keeping the best score
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the user
     * @param newScore The new score to potentially update
     * @returns The updated participant with best score
     */
    async updateDeferredScore(gameInstanceId, userId, newScore) {
        try {
            const existingParticipant = await prisma_1.prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstanceId,
                    userId: userId,
                    status: 'ACTIVE' // In the new schema, deferred participants are ACTIVE
                },
                include: { user: true }
            });
            if (!existingParticipant) {
                logger.error({ gameInstanceId, userId }, 'No deferred participant found for score update');
                return {
                    success: false,
                    error: 'Participant not found'
                };
            }
            // Keep the best score between existing and new
            const bestScore = Math.max(existingParticipant.deferredScore, newScore);
            logger.info({
                gameInstanceId,
                userId,
                previousScore: existingParticipant.deferredScore,
                newScore,
                bestScore,
                attemptCount: existingParticipant.nbAttempts,
                action: bestScore > existingParticipant.deferredScore ? 'updated' : 'preserved'
            }, '[DIAGNOSTIC] updateDeferredScore: Best score logic for DEFERRED');
            const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
                where: { id: existingParticipant.id },
                data: { deferredScore: bestScore },
                include: { user: true }
            });
            logger.info({
                gameInstanceId,
                userId,
                participantId: updatedParticipant.id,
                previousScore: existingParticipant.deferredScore,
                newScore,
                bestScore,
                attemptCount: updatedParticipant.nbAttempts
            }, 'Updated deferred participant with best score');
            return {
                success: true,
                participant: mapPrismaToGameParticipant(updatedParticipant),
                isNewBest: bestScore > existingParticipant.deferredScore
            };
        }
        catch (error) {
            logger.error({ error, gameInstanceId, userId, newScore }, 'Error updating deferred score');
            return {
                success: false,
                error: 'An error occurred while updating score'
            };
        }
    }
    /**
     * Finalize a deferred tournament attempt by keeping the best score
     * This should be called when a user completes a deferred tournament attempt
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the user
     * @param currentAttemptScore The score from the current attempt
     * @returns Result with the final best score
     */
    async finalizeDeferredAttempt(gameInstanceId, userId, currentAttemptScore) {
        try {
            const participant = await prisma_1.prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstanceId,
                    userId: userId,
                    status: 'ACTIVE' // In the new schema, deferred participants are ACTIVE
                },
                include: { user: true }
            });
            if (!participant) {
                logger.error({ gameInstanceId, userId }, 'No deferred participant found for finalization');
                return {
                    success: false,
                    error: 'Participant not found'
                };
            }
            // For deferred mode, we need to track the best score across all attempts
            // We'll store the best score ever achieved in a separate field or use Redis
            const redisKey = `mathquest:deferred:best_score:${gameInstanceId}:${userId}`;
            const previousBestScore = await redis_1.redisClient.get(redisKey);
            const bestScore = Math.max(currentAttemptScore, previousBestScore ? parseInt(previousBestScore) : 0, participant.deferredScore || 0);
            logger.info({
                gameInstanceId,
                userId,
                currentAttemptScore,
                previousBestScore: previousBestScore ? parseInt(previousBestScore) : 0,
                participantScore: participant.deferredScore,
                bestScore,
                attemptCount: participant.nbAttempts,
                action: bestScore > (previousBestScore ? parseInt(previousBestScore) : 0) ? 'updated' : 'preserved'
            }, '[DIAGNOSTIC] finalizeDeferredAttempt: Best score logic for DEFERRED');
            // Update Redis with the best score
            await redis_1.redisClient.set(redisKey, bestScore.toString());
            // Update the participant with the best score
            const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
                where: { id: participant.id },
                data: { deferredScore: bestScore },
                include: { user: true }
            });
            logger.info({
                gameInstanceId,
                userId,
                participantId: participant.id,
                currentAttemptScore,
                previousBestScore: previousBestScore ? parseInt(previousBestScore) : 0,
                finalBestScore: bestScore,
                attemptCount: participant.nbAttempts
            }, 'Finalized deferred tournament attempt with best score');
            return {
                success: true,
                participant: mapPrismaToGameParticipant(updatedParticipant),
                isNewBest: bestScore > (previousBestScore ? parseInt(previousBestScore) : 0),
                previousBest: previousBestScore ? parseInt(previousBestScore) : 0
            };
        }
        catch (error) {
            logger.error({ error, gameInstanceId, userId, currentAttemptScore }, 'Error finalizing deferred attempt');
            return {
                success: false,
                error: 'An error occurred while finalizing attempt'
            };
        }
    }
}
exports.GameParticipantService = GameParticipantService;
// [MODERNIZATION] All answer submission and scoring is now routed through scoringService.ts (submitAnswerWithScoring).
// No legacy or alternate scoring logic remains in this service.
