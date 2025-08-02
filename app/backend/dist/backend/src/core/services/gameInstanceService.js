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
    async createGameInstance(initiatorUserId, data) {
        try {
            // Generate a unique access code
            const accessCode = await this.generateUniqueAccessCode();
            // Create the game instance in the database
            const gameInstance = await prisma_1.prisma.gameInstance.create({
                data: {
                    name: data.name,
                    gameTemplateId: data.gameTemplateId,
                    initiatorUserId: initiatorUserId,
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
     * Create a new game instance (teacher or student)
     */
    async createGameInstanceUnified(data) {
        try {
            const accessCode = await this.generateUniqueAccessCode();
            // Set status: allow override from payload, otherwise use legacy logic
            let status;
            let differedAvailableFrom = undefined;
            let differedAvailableTo = undefined;
            if (typeof data.status === 'string' && (data.status === 'pending' || data.status === 'completed')) {
                status = data.status;
            }
            else if (data.playMode === 'tournament') {
                status = 'completed';
                differedAvailableFrom = new Date();
                differedAvailableTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days window
            }
            else {
                status = 'pending';
            }
            const createData = {
                name: data.name,
                gameTemplateId: data.gameTemplateId,
                accessCode,
                status,
                playMode: data.playMode,
                settings: data.settings || {},
                currentQuestionIndex: null,
            };
            if (data.initiatorUserId)
                createData.initiatorUserId = data.initiatorUserId;
            if (differedAvailableFrom)
                createData.differedAvailableFrom = differedAvailableFrom;
            if (differedAvailableTo)
                createData.differedAvailableTo = differedAvailableTo;
            const gameInstance = await prisma_1.prisma.gameInstance.create({
                data: createData,
                include: {
                    gameTemplate: {
                        select: {
                            id: true,
                            name: true,
                            themes: true,
                            discipline: true,
                            gradeLevel: true,
                            description: true,
                            defaultMode: true,
                            createdAt: true,
                            updatedAt: true,
                            creatorId: true
                        }
                    }
                }
            });
            return gameInstance;
        }
        catch (error) {
            logger.error({ error }, 'Error creating game instance (unified)');
            throw error;
        }
    }
    /**
     * Get a game instance by access code
     */
    async getGameInstanceByAccessCode(accessCode, includeParticipants = false) {
        try {
            const result = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                include: {
                    gameTemplate: {
                        include: {
                            questions: {
                                include: {
                                    question: {
                                        include: {
                                            multipleChoiceQuestion: true,
                                            numericQuestion: true
                                        }
                                    }
                                },
                                orderBy: {
                                    sequence: 'asc' // Ensure questions are ordered by sequence
                                }
                            }
                        }
                    },
                    participants: includeParticipants ? {
                        include: {
                            user: {
                                select: {
                                    username: true,
                                    avatarEmoji: true
                                }
                            }
                        },
                        orderBy: {
                            liveScore: 'desc'
                        }
                    } : false
                }
            });
            return result;
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
                            id: true,
                            name: true,
                            themes: true,
                            discipline: true,
                            gradeLevel: true,
                            description: true,
                            defaultMode: true,
                            createdAt: true,
                            updatedAt: true,
                            creatorId: true
                        }
                    },
                    participants: includeParticipants ? {
                        include: {
                            user: {
                                select: {
                                    username: true,
                                    avatarEmoji: true
                                }
                            }
                        },
                        orderBy: {
                            liveScore: 'desc'
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
     * Get game instance by ID with full template data (including questions)
     * This is useful for editing game instances
     */
    async getGameInstanceByIdWithTemplate(id) {
        try {
            return await prisma_1.prisma.gameInstance.findUnique({
                where: { id },
                include: {
                    gameTemplate: {
                        include: {
                            questions: {
                                include: {
                                    question: {
                                        include: {
                                            multipleChoiceQuestion: true,
                                            numericQuestion: true
                                        }
                                    }
                                },
                                orderBy: {
                                    sequence: 'asc' // Ensure questions are ordered by sequence
                                }
                            }
                        }
                    }
                }
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching game instance with full template data for ID ${id}`);
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
                data: updates,
                include: {
                    gameTemplate: {
                        select: {
                            id: true,
                            name: true,
                            themes: true,
                            discipline: true,
                            gradeLevel: true,
                            description: true,
                            defaultMode: true,
                            createdAt: true,
                            updatedAt: true,
                            creatorId: true
                        }
                    }
                }
            });
            return updatedGame;
        }
        catch (error) {
            logger.error({ error }, `Error updating game status for game ID ${gameId}`);
            throw error;
        }
    }
    /**
     * Update deferred mode window for a game instance
     */
    async updateDeferredMode(gameId, opts) {
        try {
            const updates = {
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
     * Update game instance basic information (name, settings, play mode)
     */
    async updateGameInstance(gameId, updateData) {
        try {
            const updates = {};
            if (updateData.name !== undefined)
                updates.name = updateData.name;
            if (updateData.playMode !== undefined)
                updates.playMode = updateData.playMode;
            if (updateData.settings !== undefined)
                updates.settings = updateData.settings;
            const updatedGame = await prisma_1.prisma.gameInstance.update({
                where: { id: gameId },
                data: updates,
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
            return updatedGame;
        }
        catch (error) {
            logger.error({ error }, `Error updating game instance ${gameId}`);
            throw error;
        }
    }
    /**
     * Generate a unique sequential access code
     * Uses sequential numbering starting from 1 with no digit limit
     */
    async generateUniqueAccessCode() {
        try {
            // Get all game instances and find the highest numeric access code
            const allGames = await prisma_1.prisma.gameInstance.findMany({
                select: {
                    accessCode: true
                }
            });
            // Filter to only numeric codes and find the highest
            let maxCode = 0;
            for (const game of allGames) {
                const code = game.accessCode;
                // Check if it's a numeric string (any number of digits)
                if (/^\d+$/.test(code)) {
                    const numericCode = parseInt(code, 10);
                    if (numericCode > maxCode) {
                        maxCode = numericCode;
                    }
                }
            }
            // Generate next sequential code, starting from 3141
            const nextCode = maxCode > 0 ? maxCode + 1 : 3141;
            // Return as string (no padding, no digit limit)
            return nextCode.toString();
        }
        catch (error) {
            logger.error('Error generating access code:', error);
            throw new Error('Unable to generate unique access code');
        }
    }
    /**
     * Get active games created by a teacher
     */
    async getTeacherActiveGames(userId) {
        try {
            return await prisma_1.prisma.gameInstance.findMany({
                where: {
                    initiatorUserId: userId,
                    status: { in: ['pending', 'active', 'paused'] },
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
            logger.error('Error fetching teacher active games:', error);
            throw error;
        }
    }
    /**
     * Get game instances by template ID for a specific teacher
     */
    async getGameInstancesByTemplateId(templateId, teacherUserId) {
        try {
            return await prisma_1.prisma.gameInstance.findMany({
                where: {
                    gameTemplateId: templateId,
                    initiatorUserId: teacherUserId
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
            logger.error({ error }, `Error fetching game instances for template ${templateId} and teacher ${teacherUserId}`);
            throw error;
        }
    }
    /**
     * Get game instances by initiator user ID
     */
    async getGameInstanceByInitiatorUserId(userId) {
        return prisma_1.prisma.gameInstance.findMany({
            where: { initiatorUserId: userId },
            include: {
                gameTemplate: true,
                participants: true
            }
        });
    }
    /**
     * Delete a game instance
     */
    async deleteGameInstance(userId, instanceId) {
        try {
            // First check if the instance exists and the user has permission
            const existing = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: instanceId },
                include: {
                    gameTemplate: {
                        select: {
                            creatorId: true
                        }
                    }
                }
            });
            if (!existing) {
                throw new Error(`Game instance with ID ${instanceId} not found`);
            }
            // Check if user is the creator of the template or the initiator of the instance
            if (existing.gameTemplate.creatorId !== userId && existing.initiatorUserId !== userId) {
                throw new Error('You do not have permission to delete this game instance');
            }
            // Clean up Redis keys before deleting the database record
            if (existing.accessCode) {
                const { deleteAllGameInstanceRedisKeys } = await Promise.resolve().then(() => __importStar(require('./deleteAllGameInstanceRedisKeys')));
                await deleteAllGameInstanceRedisKeys(existing.accessCode);
            }
            await prisma_1.prisma.gameInstance.delete({ where: { id: instanceId } });
            logger.info({ instanceId, userId, accessCode: existing.accessCode }, 'Game instance and associated Redis keys deleted successfully');
        }
        catch (error) {
            logger.error({ error, instanceId, userId }, 'Error deleting game instance');
            throw error;
        }
    }
}
exports.GameInstanceService = GameInstanceService;
