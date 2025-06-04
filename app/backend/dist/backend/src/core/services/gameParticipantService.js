"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameParticipantService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('GameParticipantService');
/**
 * GameParticipant service class for managing game participants
 */
class GameParticipantService {
    /**
     * Join a game using access code
     * @param userId The ID of the user joining the game
     * @param accessCode The access code of the game to join
     * @param username Optional username to use for the user
     * @param avatarEmoji Optional avatar emoji to use for the user
     * @returns Result of the join attempt
     */
    async joinGame(userId, accessCode, username, avatarEmoji) {
        try {
            // Find the game instance
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
                const existingParticipation = await prisma_1.prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: userId
                    }
                });
                if (existingParticipation && existingParticipation.completedAt) {
                    return {
                        success: false,
                        error: 'Already played',
                        gameInstance,
                        participant: existingParticipation
                    };
                }
            }
            // Check for existing participant or create new one
            let participant;
            const existingParticipant = await prisma_1.prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstance.id,
                    userId: userId
                },
                include: {
                    user: true
                }
            });
            if (!existingParticipant) {
                // Create new user if they don't exist, or connect if they do.
                await prisma_1.prisma.user.upsert({
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
                // Create new participant, linking to the user via userId
                const newParticipant = await prisma_1.prisma.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId: userId, // Map userId to userId
                        joinedAt: new Date(),
                        score: 0,
                        answers: [],
                    }
                });
                participant = await prisma_1.prisma.gameParticipant.findUnique({
                    where: { id: newParticipant.id },
                    include: { user: true }
                });
                if (!participant) {
                    logger.error('Failed to fetch participant immediately after creation');
                    return { success: false, error: 'Failed to create or find participant' };
                }
            }
            else {
                participant = await prisma_1.prisma.gameParticipant.update({
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
            }
            return {
                success: true,
                gameInstance,
                participant: {
                    ...participant,
                    userId // Attach userId for downstream use
                }
            };
        }
        catch (error) {
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
    async createParticipant(gameInstanceId, userId, username, avatarEmoji) {
        try {
            const participant = await prisma_1.prisma.gameParticipant.create({
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
     * Submit an answer for a player in a game
     * @param gameInstanceId The ID of the game instance
     * @param userId The ID of the player
     * @param data The answer data
     * @returns The updated participant
     */
    async submitAnswer(gameInstanceId, userId, data) {
        try {
            // Find the participant
            const participant = await prisma_1.prisma.gameParticipant.findFirst({
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
                    questionUid: data.questionUid,
                    answer: data.answer,
                    timeTakenMs: data.timeTakenMs,
                    timestamp: new Date().toISOString()
                }];
            // Update the participant
            const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
                where: {
                    id: participant.id
                },
                data: {
                    answers
                }
            });
            // --- Write answer to Redis for scoring ---
            // Find the game instance to get the access code
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({ where: { id: gameInstanceId } });
            if (gameInstance) {
                // Use the same structure as scoring expects
                const redisKey = `mathquest:game:answers:${gameInstance.accessCode}:${data.questionUid}`;
                // Use userId as the field (or socketId if available, but userId is unique per participant)
                await Promise.resolve().then(() => __importStar(require('@/config/redis'))).then(({ redisClient }) => redisClient.hset(redisKey, userId, JSON.stringify({
                    userId,
                    answer: data.answer,
                    timeSpent: data.timeTakenMs,
                    submittedAt: Date.now()
                })));
            }
            return {
                success: true,
                participant: updatedParticipant
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
}
exports.GameParticipantService = GameParticipantService;
