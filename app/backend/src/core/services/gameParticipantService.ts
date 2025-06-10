import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import type { GameParticipant, AnswerSubmissionPayload } from '@shared/types/core';

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
        avatar: prismaParticipant.user?.avatarEmoji || '😀',
        score: prismaParticipant.score || 0,
        joinedAt: prismaParticipant.joinedAt?.toISOString() || new Date().toISOString(),
        online: true // Default to online when mapping
    };
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

            // If completed, only block if not deferred or not in window
            if (gameInstance.status === 'completed') {
                const isDiffered = !!gameInstance.isDiffered;
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
                if (!isDiffered || (from && (now < from)) || (to && (now > to))) {
                    logger.info({ userId, accessCode }, 'Attempt to join a completed game (not allowed)');
                    return {
                        success: false,
                        error: 'Game is already completed'
                    };
                }
            }

            const now = new Date();
            const isDiffered = !!gameInstance.isDiffered;
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;

            if (isDiffered && from) {
                if (now < from) {
                    return {
                        success: false,
                        error: 'Game not available yet'
                    };
                }
                if (to && now > to) {
                    return {
                        success: false,
                        error: 'Game no longer available'
                    };
                }
            }

            // Check if user has already played this differed game
            if (isDiffered) {
                const existingParticipation = await prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: userId
                    },
                    include: {
                        user: true // Include user data for mapping
                    }
                });
                if (existingParticipation && existingParticipation.completedAt) {
                    return {
                        success: false,
                        error: 'Already played',
                        gameInstance,
                        participant: mapPrismaToGameParticipant(existingParticipation)
                    };
                }
            }

            // Check for existing participant or create new one
            let participant;
            const existingParticipant = await prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstance.id,
                    userId: userId
                },
                include: {
                    user: true
                }
            });

            if (existingParticipant) {
                // Update existing participant's join time
                participant = await prisma.gameParticipant.update({
                    where: {
                        id: existingParticipant.id
                    },
                    data: {
                        joinedAt: new Date()
                    },
                    include: {
                        user: true
                    }
                });
                logger.info({ userId, accessCode, participantId: participant.id }, 'Updated existing participant join time');
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

                // Create new participant with unique constraint handling
                try {
                    const newParticipant = await prisma.gameParticipant.create({
                        data: {
                            gameInstanceId: gameInstance.id,
                            userId: userId,
                            joinedAt: new Date(),
                            score: 0,
                            answers: [],
                        }
                    });
                    participant = await prisma.gameParticipant.findUnique({
                        where: { id: newParticipant.id },
                        include: { user: true }
                    });
                } catch (createError: any) {
                    // Handle unique constraint violation (P2002)
                    if (createError.code === 'P2002') {
                        logger.warn({ userId, accessCode, error: createError.message }, 'Participant already exists, fetching existing participant');
                        // Fetch the existing participant instead
                        participant = await prisma.gameParticipant.findUnique({
                            where: {
                                gameInstanceId_userId: {
                                    gameInstanceId: gameInstance.id,
                                    userId: userId
                                }
                            },
                            include: { user: true }
                        });
                        if (!participant) {
                            logger.error({ userId, accessCode }, 'Failed to fetch existing participant after constraint violation');
                            throw new Error('Failed to join game: participant creation failed');
                        }
                    } else {
                        logger.error({ userId, accessCode, error: createError }, 'Unexpected error creating participant');
                        throw createError;
                    }
                }

                if (!participant) {
                    logger.error('Failed to fetch participant immediately after creation');
                    return { success: false, error: 'Failed to create or find participant' };
                }
                logger.info({ userId, accessCode, participantId: participant.id }, 'Created new participant');
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
                    answers: [],
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
     * Submit an answer for a player in a game
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the player
     * @param data The answer data
     * @returns The updated participant
     */
    async submitAnswer(gameInstanceId: string, userId: string, data: SubmitAnswerData) {
        try {
            // Find the participant
            const participant = await prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId,
                    userId
                }
            });

            if (!participant) {
                return {
                    success: false,
                    error: 'Participant not found'
                };
            }

            // Parse answers as an array if it's a JSON object
            const currentAnswers = Array.isArray(participant.answers) ? participant.answers : [];

            // Update the answers
            const answers = [...currentAnswers, {
                questionUid: data.questionId, // Map questionId to questionUid for DB storage
                answer: data.answer,
                timeTakenMs: data.timeSpent, // Map timeSpent to timeTakenMs for DB storage
                timestamp: new Date().toISOString()
            }];

            // Update the participant
            const updatedParticipant = await prisma.gameParticipant.update({
                where: {
                    id: participant.id
                },
                data: {
                    answers
                }
            });

            // --- Write answer to Redis for scoring ---
            // Find the game instance to get the access code
            const gameInstance = await prisma.gameInstance.findUnique({ where: { id: gameInstanceId } });
            if (gameInstance) {
                // Use the same structure as scoring expects
                const redisKey = `mathquest:game:answers:${gameInstance.accessCode}:${data.questionId}`; // Use questionId
                // Use userId as the field (or socketId if available, but userId is unique per participant)
                await import('@/config/redis').then(({ redisClient }) =>
                    redisClient.hset(
                        redisKey,
                        userId,
                        JSON.stringify({
                            userId,
                            answer: data.answer,
                            timeSpent: data.timeSpent, // Use timeSpent
                            submittedAt: Date.now()
                        })
                    )
                );
            }

            return {
                success: true,
                participant: updatedParticipant
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
}