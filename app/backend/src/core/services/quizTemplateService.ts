import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Define PlayMode type to match Prisma schema
export type PlayMode = 'quiz' | 'tournament' | 'practice';

// Create a service-specific logger
const logger = createLogger('gameTemplateService');

export interface gameTemplateCreationData {
    name: string;
    gradeLevel?: string;
    themes: string[];
    discipline?: string;
    description?: string;
    defaultMode?: PlayMode;
    questions?: Array<{
        questionUid: string;
        sequence: number;
    }>;
}

export interface gameTemplateUpdateData {
    id: string;
    name?: string;
    gradeLevel?: string;
    themes?: string[];
    discipline?: string;
    description?: string;
    defaultMode?: PlayMode;
}

/**
 * gameTemplate service class for handling quiz template-related operations
 */
export class gameTemplateService {
    /**
     * Create a new quiz template
     */
    async creategameTemplate(userId: string, data: gameTemplateCreationData) {
        try {
            // Create the quiz template in the database
            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    name: data.name,
                    creatorId: userId, // Use unified creatorId
                    gradeLevel: data.gradeLevel,
                    themes: data.themes || [],
                    discipline: data.discipline,
                    description: data.description,
                    defaultMode: (data.defaultMode as any) || 'quiz',
                    // Include questions if any
                    questions: data.questions ? {
                        create: data.questions.map(q => ({
                            questionUid: q.questionUid,
                            sequence: q.sequence
                        }))
                    } : undefined
                },
                include: {
                    questions: {
                        include: {
                            question: true
                        }
                    }
                }
            });

            return gameTemplate;
        } catch (error) {
            logger.error({ error }, 'Error creating quiz template');
            throw error;
        }
    }

    /**
     * Get a quiz template by ID
     */
    async getgameTemplateById(id: string, includeQuestions: boolean = false) {
        try {
            return await prisma.gameTemplate.findUnique({
                where: { id },
                include: includeQuestions ? {
                    questions: {
                        include: {
                            question: true
                        },
                        orderBy: {
                            sequence: 'asc'
                        }
                    }
                } : undefined
            });
        } catch (error) {
            logger.error({ error }, `Error fetching quiz template with ID ${id}`);
            throw error;
        }
    }

    /**
     * Get quiz templates with filters
     */
    async getgameTemplates(userId: string, filters: {
        discipline?: string;
        themes?: string[];
        gradeLevel?: string;
    } = {}, pagination: {
        skip?: number;
        take?: number;
    } = {}) {
        try {
            const { discipline, themes, gradeLevel } = filters;
            const { skip = 0, take = 20 } = pagination;

            // Build the where clause based on filters
            const where: any = {
                creatorId: userId
            };

            if (discipline) {
                where.discipline = discipline;
            }

            if (themes && themes.length > 0) {
                where.themes = {
                    hasSome: themes
                };
            }

            if (gradeLevel) {
                where.gradeLevel = gradeLevel;
            }

            const [gameTemplates, total] = await Promise.all([
                prisma.gameTemplate.findMany({
                    where,
                    skip,
                    take,
                    orderBy: {
                        createdAt: 'desc' // Most recent first
                    },
                    include: {
                        questions: {
                            select: {
                                questionUid: true,
                                sequence: true
                            }
                        }
                    }
                }),
                prisma.gameTemplate.count({ where })
            ]);

            return {
                gameTemplates,
                total,
                page: Math.floor(skip / take) + 1,
                pageSize: take,
                totalPages: Math.ceil(total / take)
            };
        } catch (error) {
            logger.error({ error }, 'Error fetching quiz templates');
            throw error;
        }
    }

    /**
     * Update a quiz template
     */
    async updategameTemplate(userId: string, data: gameTemplateUpdateData) {
        try {
            const { id, ...updateData } = data;

            // Check if the quiz template exists and belongs to the user
            const existingTemplate = await prisma.gameTemplate.findFirst({
                where: {
                    id,
                    creatorId: userId
                }
            });

            if (!existingTemplate) {
                throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
            }

            // Patch for PlayMode enum
            if (updateData.defaultMode) {
                (updateData as any).defaultMode = updateData.defaultMode;
            }

            // Update the quiz template
            await prisma.gameTemplate.update({
                where: { id },
                data: updateData as any
            });

            // Return the updated quiz template
            return this.getgameTemplateById(id, true);
        } catch (error) {
            logger.error({ error }, 'Error updating quiz template');
            throw error;
        }
    }

    /**
     * Delete a quiz template
     */
    async deletegameTemplate(userId: string, id: string) {
        try {
            // Check if the quiz template exists and belongs to the user
            const existingTemplate = await prisma.gameTemplate.findFirst({
                where: {
                    id,
                    creatorId: userId
                }
            });

            if (!existingTemplate) {
                throw new Error(`Quiz template with ID ${id} not found or you don't have permission to delete it`);
            }

            // Delete the quiz template
            await prisma.gameTemplate.delete({
                where: { id }
            });

            return { success: true };
        } catch (error) {
            logger.error({ error }, 'Error deleting quiz template');
            throw error;
        }
    }

    /**
     * Add a question to a quiz template
     */
    async addQuestionTogameTemplate(userId: string, gameTemplateId: string, questionUid: string, sequence?: number) {
        try {
            // Check if the quiz template exists and belongs to the user
            const gameTemplate = await prisma.gameTemplate.findFirst({
                where: {
                    id: gameTemplateId,
                    creatorId: userId
                },
                include: {
                    questions: {
                        orderBy: {
                            sequence: 'desc'
                        },
                        take: 1
                    }
                }
            });

            if (!gameTemplate) {
                throw new Error(`Quiz template with ID ${gameTemplateId} not found or you don't have permission to update it`);
            }

            // Check if the question exists
            const question = await prisma.question.findUnique({
                where: { uid: questionUid }
            });

            if (!question) {
                throw new Error(`Question with ID ${questionUid} not found`);
            }

            // If no sequence is provided, add the question at the end
            let nextSequence = 1;
            if (gameTemplate.questions.length > 0) {
                nextSequence = gameTemplate.questions[0].sequence + 1;
            }

            const actualSequence = sequence || nextSequence;

            // Add the question to the quiz template
            await prisma.questionsInGameTemplate.create({
                data: {
                    gameTemplateId,
                    questionUid: questionUid,
                    sequence: actualSequence
                }
            });

            // Return the updated quiz template
            return this.getgameTemplateById(gameTemplateId, true);
        } catch (error) {
            logger.error({ error }, 'Error adding question to quiz template');
            throw error;
        }
    }

    /**
     * Remove a question from a quiz template
     */
    async removeQuestionFromgameTemplate(userId: string, gameTemplateId: string, questionUid: string) {
        try {
            // Check if the quiz template exists and belongs to the user
            const gameTemplate = await prisma.gameTemplate.findFirst({
                where: {
                    id: gameTemplateId,
                    creatorId: userId
                }
            });

            if (!gameTemplate) {
                throw new Error(`Quiz template with ID ${gameTemplateId} not found or you don't have permission to update it`);
            }

            // Delete the question from the quiz template
            await prisma.questionsInGameTemplate.delete({
                where: {
                    gameTemplateId_questionUid: {
                        gameTemplateId,
                        questionUid: questionUid
                    }
                }
            });

            // Return the updated quiz template
            return this.getgameTemplateById(gameTemplateId, true);
        } catch (error) {
            logger.error({ error }, 'Error removing question from quiz template');
            throw error;
        }
    }

    /**
     * Update the sequence of questions in a quiz template
     */
    async updateQuestionSequence(userId: string, gameTemplateId: string, updates: Array<{
        questionUid: string;
        sequence: number;
    }>) {
        try {
            // Check if the quiz template exists and belongs to the user
            const gameTemplate = await prisma.gameTemplate.findFirst({
                where: {
                    id: gameTemplateId,
                    creatorId: userId
                }
            });

            if (!gameTemplate) {
                throw new Error(`Quiz template with ID ${gameTemplateId} not found or you don't have permission to update it`);
            }

            // Update each question sequence
            for (const update of updates) {
                await prisma.questionsInGameTemplate.update({
                    where: {
                        gameTemplateId_questionUid: {
                            gameTemplateId,
                            questionUid: update.questionUid
                        }
                    },
                    data: {
                        sequence: update.sequence
                    }
                });
            }

            // Return the updated quiz template
            return this.getgameTemplateById(gameTemplateId, true);
        } catch (error) {
            logger.error({ error }, 'Error updating question sequence in quiz template');
            throw error;
        }
    }
}
