"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameInstanceService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('GameInstanceService');
/**
 * GameInstance service class for managing game instances
 */
class GameInstanceService {
    /**
     * Create a new game instance
     */
    async createGameInstance(teacherId, data) {
        try {
            // Generate a unique access code
            const accessCode = await this.generateUniqueAccessCode();
            // Create the game instance in the database
            const gameInstance = await prisma_1.prisma.gameInstance.create({
                data: {
                    name: data.name,
                    gameTemplateId: data.gameTemplateId,
                    : teacherId,
                accessCode,
                status: 'pending', // All games start in pending status
                    playMode: data.playMode,
                        settings: data.settings || {},
                            currentQuestionIndex: null, // No question shown initially
                },
        include: {
            gameTemplate: {
                select: {
                    name: true,
                        themes: true,
                            discipline: true,
                                gradeLevel: true,
                        }
            }
        }
    });
            return gameInstance;
        }
        catch (error) {
    logger.error({ error }, 'Error creating game instance');
    throw error;
}
    }
    /**
     * Get a game instance by access code
     */
    async getGameInstanceByAccessCode(accessCode, includeParticipants = false) {
    try {
        return await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: {
                    select: {
                        name: true,
                        themes: true,
                        discipline: true,
                        gradeLevel: true,
                    }
                },
                participants: includeParticipants ? {
                    include: {
                        player: {
                            select: {
                                username: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: {
                        score: 'desc'
                    }
                } : false
            }
        });
    }
    catch (error) {
        logger.error({ error }, `Error fetching game instance with access code ${accessCode}`);
        throw error;
    }
}
    /**
     * Get a game instance by ID
     */
    async getGameInstanceById(id, includeParticipants = false) {
    try {
        return await prisma_1.prisma.gameInstance.findUnique({
            where: { id },
            include: {
                gameTemplate: {
                    select: {
                        name: true,
                        themes: true,
                        discipline: true,
                        gradeLevel: true,
                    }
                },
                participants: includeParticipants ? {
                    include: {
                        player: {
                            select: {
                                username: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: {
                        score: 'desc'
                    }
                } : false
            }
        });
    }
    catch (error) {
        logger.error({ error }, `Error fetching game instance with ID ${id}`);
        throw error;
    }
}
    /**
     * Update game status
     */
    async updateGameStatus(gameId, updateData) {
    try {
        const updates = {
            status: updateData.status
        };
        // Add timestamp based on status
        if (updateData.status === 'active' && updateData.currentQuestionIndex === 0) {
            // Only set startedAt when the game is first activated
            const existingGame = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { startedAt: true }
            });
            if (!existingGame?.startedAt) {
                updates.startedAt = new Date();
            }
        }
        else if (updateData.status === 'completed' || updateData.status === 'archived') {
            updates.endedAt = new Date();
        }
        // Update current question index if provided
        if (updateData.currentQuestionIndex !== undefined) {
            updates.currentQuestionIndex = updateData.currentQuestionIndex;
        }
        // Update the game instance
        const updatedGame = await prisma_1.prisma.gameInstance.update({
            where: { id: gameId },
            data: updates
        });
        return updatedGame;
    }
    catch (error) {
        logger.error({ error }, `Error updating game status for game ID ${gameId}`);
        throw error;
    }
}
    /**
     * Update differed mode and window for a game instance
     */
    async updateDifferedMode(gameId, opts) {
    try {
        const updates = {
            isDiffered: opts.isDiffered,
            differedAvailableFrom: opts.differedAvailableFrom,
            differedAvailableTo: opts.differedAvailableTo
        };
        const updatedGame = await prisma_1.prisma.gameInstance.update({
            where: { id: gameId },
            data: updates
        });
        return updatedGame;
    }
    catch (error) {
        logger.error({ error }, `Error updating differed mode for game ID ${gameId}`);
        throw error;
    }
}
    /**
     * Generate a unique 6-character access code
     * The code consists of uppercase letters and numbers, avoiding
     * easily confused characters like 0, O, 1, I
     */
    async generateUniqueAccessCode(length = 6) {
    // Characters to use in access code (avoid confusing characters)
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    // Maximum attempts to prevent infinite loop
    const maxAttempts = 10;
    let attempts = 0;
    while (attempts < maxAttempts) {
        let accessCode = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            accessCode += characters.charAt(randomIndex);
        }
        // Check if this code is already in use
        const existingGame = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode }
        });
        if (!existingGame) {
            return accessCode;
        }
        attempts++;
    }
    // If we couldn't generate a unique code after max attempts
    throw new Error('Unable to generate unique access code after multiple attempts');
}
    /**
     * Get active games created by a teacher
     */
    async getTeacherActiveGames(teacherId) {
    try {
        return await prisma_1.prisma.gameInstance.findMany({
            where: {
                    : teacherId,
                status: { in: ['pending', 'active', 'paused'] }
            },
            include: {
                gameTemplate: {
                    select: {
                        name: true
                    }
                },
                participants: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    catch (error) {
        logger.error({ error }, `Error fetching active games for teacher ${teacherId}`);
        throw error;
    }
}
}
exports.GameInstanceService = GameInstanceService;
