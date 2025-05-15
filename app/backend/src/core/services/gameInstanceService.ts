import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Create a service-specific logger
const logger = createLogger('GameInstanceService');

// Define the play mode type to match the Prisma schema
export type PlayMode = 'class' | 'tournament' | 'practice';

// Define possible game statuses
export type GameStatus = 'pending' | 'active' | 'paused' | 'completed' | 'archived';

export interface GameInstanceCreationData {
    name: string;
    quizTemplateId: string;
    playMode: PlayMode;
    settings?: Record<string, any>;
}

export interface GameStatusUpdateData {
    status: GameStatus;
    currentQuestionIndex?: number;
}

/**
 * GameInstance service class for managing game instances
 */
export class GameInstanceService {
    /**
     * Create a new game instance
     */
    async createGameInstance(teacherId: string, data: GameInstanceCreationData) {
        try {
            // Generate a unique access code
            const accessCode = await this.generateUniqueAccessCode();

            // Create the game instance in the database
            const gameInstance = await prisma.gameInstance.create({
                data: {
                    name: data.name,
                    quizTemplateId: data.quizTemplateId,
                    initiatorTeacherId: teacherId,
                    accessCode,
                    status: 'pending', // All games start in pending status
                    playMode: data.playMode,
                    settings: data.settings || {},
                    currentQuestionIndex: null, // No question shown initially
                },
                include: {
                    quizTemplate: {
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
     * Get a game instance by access code
     */
    async getGameInstanceByAccessCode(accessCode: string, includeParticipants: boolean = false) {
        try {
            return await prisma.gameInstance.findUnique({
                where: { accessCode },
                include: {
                    quizTemplate: {
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
                    quizTemplate: {
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
        } catch (error) {
            logger.error({ error }, `Error fetching game instance with ID ${id}`);
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
                data: updates
            });

            return updatedGame;
        } catch (error) {
            logger.error({ error }, `Error updating game status for game ID ${gameId}`);
            throw error;
        }
    }

    /**
     * Generate a unique 6-character access code
     * The code consists of uppercase letters and numbers, avoiding
     * easily confused characters like 0, O, 1, I
     */
    async generateUniqueAccessCode(length: number = 6): Promise<string> {
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
            const existingGame = await prisma.gameInstance.findUnique({
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
    async getTeacherActiveGames(teacherId: string) {
        try {
            return await prisma.gameInstance.findMany({
                where: {
                    initiatorTeacherId: teacherId,
                    status: { in: ['pending', 'active', 'paused'] }
                },
                include: {
                    quizTemplate: {
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
            logger.error({ error }, `Error fetching active games for teacher ${teacherId}`);
            throw error;
        }
    }
}
