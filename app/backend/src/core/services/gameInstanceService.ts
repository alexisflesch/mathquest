import { prisma } from '@/db/prisma';
import { Prisma } from '@/db/generated/client';
import createLogger from '@/utils/logger';
import { PlayMode, GameInstanceCreationData, GameState, GameStatus } from '@shared/types/core';

// Re-export for backward compatibility
export { GameInstanceCreationData } from '@shared/types/core';

// Create a service-specific logger
const logger = createLogger('GameInstanceService');

export interface GameStatusUpdateData {
    status: GameStatus;
    currentQuestionIndex?: number;
}

export interface GameInstanceUnifiedCreationData {
    name: string;
    gameTemplateId: string;
    playMode: PlayMode;
    settings?: Record<string, any>;
    initiatorUserId?: string; // Unified field for user ID (teacher or student)
    status?: 'pending' | 'completed';
}

/**
 * GameInstance service class for managing game instances
 */
export class GameInstanceService {
    /**
     * Create a new game instance
     */
    async createGameInstance(initiatorUserId: string, data: GameInstanceCreationData) {
        try {
            // Generate a unique access code
            const accessCode = await this.generateUniqueAccessCode();

            // Create the game instance in the database
            const gameInstance = await prisma.gameInstance.create({
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
        } catch (error) {
            logger.error({ error }, 'Error creating game instance');
            throw error;
        }
    }

    /**
     * Create a new game instance (teacher or student)
     */
    async createGameInstanceUnified(data: GameInstanceUnifiedCreationData) {
        try {
            const accessCode = await this.generateUniqueAccessCode();

            // Always clear Redis for this accessCode before creating a new game instance
            const { clearGameRedisKeys } = await import('./redisCleanupUtil');
            await clearGameRedisKeys(accessCode);

            // Set status: allow override from payload, otherwise use legacy logic
            let status: 'pending' | 'completed';
            let differedAvailableFrom: Date | undefined = undefined;
            let differedAvailableTo: Date | undefined = undefined;
            if (typeof data.status === 'string' && (data.status === 'pending' || data.status === 'completed')) {
                status = data.status;
            } else if (data.playMode === 'tournament') {
                status = 'completed';
                differedAvailableFrom = new Date();
                differedAvailableTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days window
            } else {
                status = 'pending';
            }

            const createData: any = {
                name: data.name,
                gameTemplateId: data.gameTemplateId,
                accessCode,
                status,
                playMode: data.playMode,
                settings: data.settings || {},
                currentQuestionIndex: null,
            };
            if (data.initiatorUserId) createData.initiatorUserId = data.initiatorUserId;
            if (differedAvailableFrom) createData.differedAvailableFrom = differedAvailableFrom;
            if (differedAvailableTo) createData.differedAvailableTo = differedAvailableTo;
            const gameInstance = await prisma.gameInstance.create({
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
        } catch (error: any) {
            logger.error({ error }, 'Error creating game instance (unified)');
            throw error;
        }
    }

    /**
     * Get a game instance by access code
     */
    async getGameInstanceByAccessCode(accessCode: string, includeParticipants: boolean = false) {
        try {
            const result = await prisma.gameInstance.findUnique({
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
        } catch (error) {
            logger.error({ error }, `Error fetching game instance with access code ${accessCode}`);
            throw error;
        }
    }

    /**
     * Get a game instance by ID
     */
    async getGameInstanceById(id: string, includeParticipants: boolean = false) {
        try {
            return await prisma.gameInstance.findUnique({
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
        } catch (error) {
            logger.error({ error }, `Error fetching game instance with ID ${id}`);
            throw error;
        }
    }

    /**
     * Get game instance by ID with full template data (including questions)
     * This is useful for editing game instances
     */
    async getGameInstanceByIdWithTemplate(id: string) {
        try {
            return await prisma.gameInstance.findUnique({
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
        } catch (error) {
            logger.error({ error }, `Error fetching game instance with full template data for ID ${id}`);
            throw error;
        }
    }

    /**
     * Update game status
     */
    async updateGameStatus(gameId: string, updateData: GameStatusUpdateData) {
        try {
            const updates: Record<string, any> = {
                status: updateData.status
            };

            // Add timestamp based on status
            if (updateData.status === 'active' && updateData.currentQuestionIndex === 0) {
                // Only set startedAt when the game is first activated
                const existingGame = await prisma.gameInstance.findUnique({
                    where: { id: gameId },
                    select: { startedAt: true }
                });

                if (!existingGame?.startedAt) {
                    updates.startedAt = new Date();
                }
            } else if (updateData.status === 'completed' || updateData.status === 'archived') {
                updates.endedAt = new Date();
            }

            // Update current question index if provided
            if (updateData.currentQuestionIndex !== undefined) {
                updates.currentQuestionIndex = updateData.currentQuestionIndex;
            }

            // Update the game instance
            const updatedGame = await prisma.gameInstance.update({
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
        } catch (error) {
            logger.error({ error }, `Error updating game status for game ID ${gameId}`);
            throw error;
        }
    }

    /**
     * Update deferred mode window for a game instance
     */
    async updateDeferredMode(gameId: string, opts: { differedAvailableFrom?: Date, differedAvailableTo?: Date }) {
        try {
            const updates: Record<string, any> = {
                differedAvailableFrom: opts.differedAvailableFrom,
                differedAvailableTo: opts.differedAvailableTo
            };
            const updatedGame = await prisma.gameInstance.update({
                where: { id: gameId },
                data: updates
            });
            return updatedGame;
        } catch (error) {
            logger.error({ error }, `Error updating differed mode for game ID ${gameId}`);
            throw error;
        }
    }

    /**
     * Update game instance basic information (name, settings, play mode)
     */
    async updateGameInstance(gameId: string, updateData: {
        name?: string;
        playMode?: PlayMode;
        settings?: Record<string, any>;
    }) {
        try {
            const updates: Record<string, any> = {};

            if (updateData.name !== undefined) updates.name = updateData.name;
            if (updateData.playMode !== undefined) updates.playMode = updateData.playMode;
            if (updateData.settings !== undefined) updates.settings = updateData.settings;

            const updatedGame = await prisma.gameInstance.update({
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
        } catch (error) {
            logger.error({ error }, `Error updating game instance ${gameId}`);
            throw error;
        }
    }

    /**
     * Generate a unique sequential access code
     * Uses sequential numbering starting from 1 with no digit limit
     */
    async generateUniqueAccessCode(): Promise<string> {
        try {
            // Get all game instances and find the highest numeric access code
            const allGames = await prisma.gameInstance.findMany({
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
        } catch (error) {
            logger.error('Error generating access code:', error);
            throw new Error('Unable to generate unique access code');
        }
    }

    /**
     * Get active games created by a teacher
     */
    async getTeacherActiveGames(userId: string) {
        try {
            return await prisma.gameInstance.findMany({
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
        } catch (error) {
            logger.error('Error fetching teacher active games:', error);
            throw error;
        }
    }

    /**
     * Get game instances by template ID for a specific teacher
     */
    async getGameInstancesByTemplateId(templateId: string, teacherUserId: string) {
        try {
            return await prisma.gameInstance.findMany({
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
        } catch (error) {
            logger.error({ error }, `Error fetching game instances for template ${templateId} and teacher ${teacherUserId}`);
            throw error;
        }
    }

    /**
     * Get game instances by initiator user ID
     */
    async getGameInstanceByInitiatorUserId(userId: string) {
        return prisma.gameInstance.findMany({
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
    async deleteGameInstance(userId: string, instanceId: string) {
        try {
            // First check if the instance exists and the user has permission
            const existing = await prisma.gameInstance.findUnique({
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
                const { deleteAllGameInstanceRedisKeys } = await import('./deleteAllGameInstanceRedisKeys');
                await deleteAllGameInstanceRedisKeys(existing.accessCode);
            }

            await prisma.gameInstance.delete({ where: { id: instanceId } });

            logger.info({ instanceId, userId, accessCode: existing.accessCode }, 'Game instance and associated Redis keys deleted successfully');
        } catch (error) {
            logger.error({ error, instanceId, userId }, 'Error deleting game instance');
            throw error;
        }
    }
}
