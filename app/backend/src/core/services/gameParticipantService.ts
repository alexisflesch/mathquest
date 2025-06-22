import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { ScoringService } from './scoringService';
import { redisClient } from '@/config/redis';
import type { GameParticipant, AnswerSubmissionPayload, ParticipationType } from '@shared/types/core';

// Create a service-specific logger
const logger = createLogger('GameParticipantService');

export interface JoinGameResult {
    success: boolean;
    gameInstance?: any;
    participant?: GameParticipant;
    error?: string;
}

// Use consolidated answer submission type
export type SubmitAnswerData = AnswerSubmissionPayload;

// Helper function to map Prisma participant to core GameParticipant
function mapPrismaToGameParticipant(prismaParticipant: any): GameParticipant {
    return {
        id: prismaParticipant.id,
        userId: prismaParticipant.userId,
        username: prismaParticipant.user?.username || 'Unknown',
        avatarEmoji: prismaParticipant.user?.avatarEmoji || '😀',
        score: prismaParticipant.score || 0,
        joinedAt: prismaParticipant.joinedAt?.toISOString() || new Date().toISOString(),
        participationType: prismaParticipant.participationType,
        attemptCount: prismaParticipant.attemptCount || 1,
        online: true // Default to online when mapping
    };
}

// Utility to clear or namespace answers for a new DEFERRED attempt
async function clearDeferredAnswers(gameInstanceId: string, userId: string, attemptCount: number) {
    // Canonical: Answers are stored as mathquest:game:answers:{accessCode}:{questionUid}:{attemptCount}
    // Remove all answer keys for previous attempt for this user/game
    const gameInstance = await prisma.gameInstance.findUnique({ where: { id: gameInstanceId }, select: { accessCode: true, gameTemplateId: true } });
    if (!gameInstance) return;
    const accessCode = gameInstance.accessCode;
    // Fetch all questions for this game via gameTemplate
    const questionsInTemplate = await prisma.questionsInGameTemplate.findMany({ where: { gameTemplateId: gameInstance.gameTemplateId }, select: { questionUid: true } });
    if (!questionsInTemplate.length) {
        logger.warn({ gameInstanceId, userId, attemptCount, gameTemplateId: gameInstance.gameTemplateId }, '[DEFERRED] No questions found for gameTemplate');
        return;
    }
    for (const q of questionsInTemplate) {
        const prevKey = `mathquest:game:answers:${accessCode}:${q.questionUid}:${attemptCount - 1}`;
        await redisClient.hdel(prevKey, userId);
        logger.info({ gameInstanceId, userId, prevAttempt: attemptCount - 1, prevKey }, '[DEFERRED] Cleared previous attempt answer for question');
    }
}

// Utility to clear ALL answers for a user in a game (all attempts, all questions)
async function clearAllDeferredAnswers(gameInstanceId: string, userId: string) {
    const gameInstance = await prisma.gameInstance.findUnique({ where: { id: gameInstanceId }, select: { accessCode: true, gameTemplateId: true } });
    if (!gameInstance) return;
    const accessCode = gameInstance.accessCode;
    const questionsInTemplate = await prisma.questionsInGameTemplate.findMany({ where: { gameTemplateId: gameInstance.gameTemplateId }, select: { questionUid: true } });
    if (!questionsInTemplate.length) return;
    for (const q of questionsInTemplate) {
        // Delete all answer keys for all attempts for this question
        // Use Redis SCAN to find all keys matching pattern
        const pattern = `mathquest:game:answers:${accessCode}:${q.questionUid}:*`;
        const keys = await redisClient.keys(pattern);
        for (const key of keys) {
            await redisClient.hdel(key, userId);
            logger.info({ gameInstanceId, userId, key }, '[DEFERRED] Cleared ALL previous answers for question');
        }
    }
}

/**
 * GameParticipant service class for managing game participants
 */
export class GameParticipantService {
    /**
     * Join a game using access code
     * @param userId The ID of the user joining the game
     * @param accessCode The access code of the game to join
     * @param username Optional username to use for the user
     * @param avatarEmoji Optional avatar emoji to use for the user
     * @returns Result of the join attempt
     */
    async joinGame(userId: string, accessCode: string, username?: string, avatarEmoji?: string): Promise<JoinGameResult> {
        try {
            // Find the game instance
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    playMode: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    gameTemplate: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (!gameInstance) {
                return {
                    success: false,
                    error: 'Game not found'
                };
            }

            // If completed, check deferred access rules based on playMode
            if (gameInstance.status === 'completed') {
                // Tournaments are always available for deferred play (within time window)
                // Quiz mode should not allow deferred access
                const allowDeferred = gameInstance.playMode === 'tournament';

                if (!allowDeferred) {
                    logger.info({ userId, accessCode, playMode: gameInstance.playMode }, 'Attempt to join completed game - deferred mode not allowed for this playMode');
                    return {
                        success: false,
                        error: 'Game is already completed'
                    };
                }

                // For tournaments, check time window if set
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;

                if (from && now < from) {
                    return {
                        success: false,
                        error: 'Tournament not available yet'
                    };
                }
                if (to && now > to) {
                    return {
                        success: false,
                        error: 'Tournament no longer available'
                    };
                }
            }

            // Determine participation type based on game status
            const participationType = gameInstance.status === 'completed' ? 'DEFERRED' : 'LIVE';

            let participant;

            if (participationType === 'LIVE') {
                // Check for existing participant for this user/game
                const existingLiveParticipant = await prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: userId,
                        participationType: 'LIVE'
                    },
                    include: { user: true }
                });
                if (existingLiveParticipant) {
                    logger.info({
                        userId,
                        accessCode,
                        participantId: existingLiveParticipant.id,
                        participationType: 'LIVE',
                        reused: true
                    }, 'Reusing existing LIVE participant, preventing duplicate');
                    participant = existingLiveParticipant;
                } else {
                    // Create new user if they don't exist, or connect if they do.
                    await prisma.user.upsert({
                        where: { id: userId },
                        update: {
                            username: username || `guest-${userId.substring(0, 8)}`,
                            avatarEmoji: avatarEmoji || null,
                        },
                        create: {
                            id: userId,
                            username: username || `guest-${userId.substring(0, 8)}`,
                            role: 'STUDENT',
                            avatarEmoji: avatarEmoji || null,
                            studentProfile: { create: { cookieId: `cookie-${userId}` } }
                        }
                    });
                    // Create new participant for live play
                    const newParticipant = await prisma.gameParticipant.create({
                        data: {
                            gameInstanceId: gameInstance.id,
                            userId: userId,
                            joinedAt: new Date(),
                            score: 0,
                            participationType: 'LIVE',
                            attemptCount: 1
                        }
                    });
                    participant = await prisma.gameParticipant.findUnique({
                        where: { id: newParticipant.id },
                        include: { user: true }
                    });
                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant?.id,
                        participationType: 'LIVE',
                        reused: false
                    }, 'Created new LIVE participant');
                }
            } else {
                // For DEFERRED tournaments, handle existing records differently
                logger.info({
                    userId,
                    accessCode,
                    gameInstanceId: gameInstance.id
                }, 'BUG INVESTIGATION: Looking for existing DEFERRED participant');

                const existingDeferredParticipant = await prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: userId,
                        participationType: 'DEFERRED'
                    },
                    include: { user: true }
                });

                logger.info({
                    userId,
                    accessCode,
                    existingParticipantFound: !!existingDeferredParticipant,
                    existingParticipantId: existingDeferredParticipant?.id,
                    existingScore: existingDeferredParticipant?.score,
                    existingAttemptCount: existingDeferredParticipant?.attemptCount
                }, 'BUG INVESTIGATION: DEFERRED participant search result');

                // Create new user if they don't exist, or connect if they do.
                await prisma.user.upsert({
                    where: { id: userId },
                    update: {
                        username: username || `guest-${userId.substring(0, 8)}`,
                        avatarEmoji: avatarEmoji || null,
                    },
                    create: {
                        id: userId,
                        username: username || `guest-${userId.substring(0, 8)}`,
                        role: 'STUDENT',
                        avatarEmoji: avatarEmoji || null,
                        studentProfile: { create: { cookieId: `cookie-${userId}` } }
                    }
                });

                if (existingDeferredParticipant) {
                    // [MODERNIZATION] On new DEFERRED attempt, do NOT reset score in DB; keep best score in DB.
                    // Instead, track current attempt's score separately (e.g., in Redis), and clear/namespace answers for this attempt.
                    logger.info({
                        userId,
                        accessCode,
                        participantId: existingDeferredParticipant.id,
                        currentScore: existingDeferredParticipant.score,
                        currentAttemptCount: existingDeferredParticipant.attemptCount
                    }, '[DEFERRED] Starting new attempt: preserving best score, isolating answers');

                    // Only increment attemptCount if this is a true new attempt (not a reconnect or duplicate join)
                    // [MODERNIZATION] Add diagnostic log for attemptCount increment
                    const prevAttemptCount = existingDeferredParticipant.attemptCount;
                    const participant = await prisma.gameParticipant.update({
                        where: { id: existingDeferredParticipant.id },
                        data: {
                            joinedAt: new Date(),
                            attemptCount: { increment: 1 }
                        },
                        include: { user: true }
                    });
                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant.id,
                        prevAttemptCount,
                        newAttemptCount: participant.attemptCount
                    }, '[DIAGNOSTIC] Incremented attemptCount for DEFERRED participant');

                    // Clear answers for previous attempt (isolation)
                    await clearDeferredAnswers(gameInstance.id, userId, participant.attemptCount);

                    // Clear ALL answers for previous attempts (isolation)
                    await clearAllDeferredAnswers(gameInstance.id, userId);

                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant.id,
                        participationType: participant.participationType,
                        attemptCount: participant.attemptCount,
                        preservedScore: participant.score
                    }, '[DEFERRED] Updated existing DEFERRED participant for new attempt (score preserved)');
                } else {
                    // Create new deferred participant
                    const newParticipant = await prisma.gameParticipant.create({
                        data: {
                            gameInstanceId: gameInstance.id,
                            userId: userId,
                            joinedAt: new Date(),
                            score: 0,
                            participationType: 'DEFERRED',
                            attemptCount: 1
                        }
                    });

                    participant = await prisma.gameParticipant.findUnique({
                        where: { id: newParticipant.id },
                        include: { user: true }
                    });

                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant?.id,
                        participationType: 'DEFERRED'
                    }, 'Created new DEFERRED participant');
                }
            }

            return {
                success: true,
                gameInstance,
                participant: mapPrismaToGameParticipant(participant)
            };
        } catch (error) {
            logger.error({ error, userId, accessCode }, 'Error joining game');
            return {
                success: false,
                error: 'An error occurred while joining the game'
            };
        }
    }

    /**
     * Create a new game participant
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the user
     * @param username Optional username for the participant
     * @param avatarEmoji Optional avatar emoji for the participant
     * @returns The created participant
     */
    async createParticipant(gameInstanceId: string, userId: string, username?: string, avatarEmoji?: string) {
        try {
            const participant = await prisma.gameParticipant.create({
                data: {
                    score: 0,
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
        } catch (error) {
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
    async submitAnswer(gameInstanceId: string, userId: string, data: SubmitAnswerData) {
        try {
            // Use the new scoring service for all answer submissions
            const scoreResult = await ScoringService.submitAnswerWithScoring(
                gameInstanceId,
                userId,
                data
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
        } catch (error) {
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
    async getParticipantById(participantId: string) {
        try {
            const participant = await prisma.gameParticipant.findUnique({
                where: {
                    id: participantId
                },
                include: {
                    user: true
                }
            });

            return participant;
        } catch (error) {
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
    async updateDeferredScore(gameInstanceId: string, userId: string, newScore: number) {
        try {
            const existingParticipant = await prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstanceId,
                    userId: userId,
                    participationType: 'DEFERRED'
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
            const bestScore = Math.max(existingParticipant.score, newScore);

            logger.info({
                gameInstanceId,
                userId,
                previousScore: existingParticipant.score,
                newScore,
                bestScore,
                attemptCount: existingParticipant.attemptCount,
                action: bestScore > existingParticipant.score ? 'updated' : 'preserved'
            }, '[DIAGNOSTIC] updateDeferredScore: Best score logic for DEFERRED');

            const updatedParticipant = await prisma.gameParticipant.update({
                where: { id: existingParticipant.id },
                data: { score: bestScore },
                include: { user: true }
            });

            logger.info({
                gameInstanceId,
                userId,
                participantId: updatedParticipant.id,
                previousScore: existingParticipant.score,
                newScore,
                bestScore,
                attemptCount: updatedParticipant.attemptCount
            }, 'Updated deferred participant with best score');

            return {
                success: true,
                participant: mapPrismaToGameParticipant(updatedParticipant),
                isNewBest: bestScore > existingParticipant.score
            };
        } catch (error) {
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
    async finalizeDeferredAttempt(gameInstanceId: string, userId: string, currentAttemptScore: number) {
        try {
            const participant = await prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstanceId,
                    userId: userId,
                    participationType: 'DEFERRED'
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
            const previousBestScore = await redisClient.get(redisKey);
            const bestScore = Math.max(
                currentAttemptScore,
                previousBestScore ? parseInt(previousBestScore) : 0,
                participant.score || 0
            );

            logger.info({
                gameInstanceId,
                userId,
                currentAttemptScore,
                previousBestScore: previousBestScore ? parseInt(previousBestScore) : 0,
                participantScore: participant.score,
                bestScore,
                attemptCount: participant.attemptCount,
                action: bestScore > (previousBestScore ? parseInt(previousBestScore) : 0) ? 'updated' : 'preserved'
            }, '[DIAGNOSTIC] finalizeDeferredAttempt: Best score logic for DEFERRED');

            // Update Redis with the best score
            await redisClient.set(redisKey, bestScore.toString());

            // Update the participant with the best score
            const updatedParticipant = await prisma.gameParticipant.update({
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
                participant: mapPrismaToGameParticipant(updatedParticipant),
                isNewBest: bestScore > (previousBestScore ? parseInt(previousBestScore) : 0),
                previousBest: previousBestScore ? parseInt(previousBestScore) : 0
            };
        } catch (error) {
            logger.error({ error, gameInstanceId, userId, currentAttemptScore }, 'Error finalizing deferred attempt');
            return {
                success: false,
                error: 'An error occurred while finalizing attempt'
            };
        }
    }
}

// [MODERNIZATION] All answer submission and scoring is now routed through scoringService.ts (submitAnswerWithScoring).
// No legacy or alternate scoring logic remains in this service.