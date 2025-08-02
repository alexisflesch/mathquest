"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameTemplateService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('gameTemplateService');
/**
 * gameTemplate service class for handling quiz template-related operations
 */
class gameTemplateService {
    /**
     * Create a new quiz template
     */
    async creategameTemplate(userId, data) {
        try {
            // Create the quiz template in the database
            const gameTemplate = await prisma_1.prisma.gameTemplate.create({
                data: {
                    name: data.name,
                    creatorId: userId, // Use unified creatorId
                    gradeLevel: data.gradeLevel,
                    themes: data.themes || [],
                    discipline: data.discipline,
                    description: data.description,
                    defaultMode: data.defaultMode || 'quiz',
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
                            question: {
                                include: {
                                    multipleChoiceQuestion: true,
                                    numericQuestion: true
                                }
                            }
                        }
                    }
                }
            });
            return gameTemplate;
        }
        catch (error) {
            logger.error({ error }, 'Error creating quiz template');
            throw error;
        }
    }
    /**
     * Get a quiz template by ID
     */
    async getgameTemplateById(id, includeQuestions = false) {
        try {
            return await prisma_1.prisma.gameTemplate.findUnique({
                where: { id },
                include: includeQuestions ? {
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
                            sequence: 'asc'
                        }
                    }
                } : undefined
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching quiz template with ID ${id}`);
            throw error;
        }
    }
    /**
     * Get quiz templates with filters
     */
    async getgameTemplates(userId, filters = {}, pagination = {}) {
        try {
            const { discipline, themes, gradeLevel } = filters;
            const { skip = 0, take = 20 } = pagination;
            // Build the where clause based on filters
            const where = {
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
                prisma_1.prisma.gameTemplate.findMany({
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
                prisma_1.prisma.gameTemplate.count({ where })
            ]);
            return {
                gameTemplates,
                total,
                page: Math.floor(skip / take) + 1,
                pageSize: take,
                totalPages: Math.ceil(total / take)
            };
        }
        catch (error) {
            logger.error({ error }, 'Error fetching quiz templates');
            throw error;
        }
    }
    /**
     * Update a quiz template
     */
    async updategameTemplate(userId, data) {
        try {
            const { id, ...updateData } = data;
            // Check if the quiz template exists and belongs to the user
            const existingTemplate = await prisma_1.prisma.gameTemplate.findFirst({
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
                updateData.defaultMode = updateData.defaultMode;
            }
            // Update the quiz template
            await prisma_1.prisma.gameTemplate.update({
                where: { id },
                data: updateData
            });
            // Return the updated quiz template
            return this.getgameTemplateById(id, true);
        }
        catch (error) {
            logger.error({ error }, 'Error updating quiz template');
            throw error;
        }
    }
    /**
     * Delete a quiz template
     */
    async deletegameTemplate(userId, id) {
        try {
            // Check if the quiz template exists and belongs to the user
            const existingTemplate = await prisma_1.prisma.gameTemplate.findFirst({
                where: {
                    id,
                    creatorId: userId
                }
            });
            if (!existingTemplate) {
                throw new Error(`Quiz template with ID ${id} not found or you don't have permission to delete it`);
            }
            // Delete the quiz template
            await prisma_1.prisma.gameTemplate.delete({
                where: { id }
            });
            return { success: true };
        }
        catch (error) {
            logger.error({ error }, 'Error deleting quiz template');
            throw error;
        }
    }
    /**
     * Add a question to a quiz template
     */
    async addQuestionTogameTemplate(userId, gameTemplateId, questionUid, sequence) {
        try {
            // Check if the quiz template exists and belongs to the user
            const gameTemplate = await prisma_1.prisma.gameTemplate.findFirst({
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
            const question = await prisma_1.prisma.question.findUnique({
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
            await prisma_1.prisma.questionsInGameTemplate.create({
                data: {
                    gameTemplateId,
                    questionUid: questionUid,
                    sequence: actualSequence
                }
            });
            // Return the updated quiz template
            return this.getgameTemplateById(gameTemplateId, true);
        }
        catch (error) {
            logger.error({ error }, 'Error adding question to quiz template');
            throw error;
        }
    }
    /**
     * Remove a question from a quiz template
     */
    async removeQuestionFromgameTemplate(userId, gameTemplateId, questionUid) {
        try {
            // Check if the quiz template exists and belongs to the user
            const gameTemplate = await prisma_1.prisma.gameTemplate.findFirst({
                where: {
                    id: gameTemplateId,
                    creatorId: userId
                }
            });
            if (!gameTemplate) {
                throw new Error(`Quiz template with ID ${gameTemplateId} not found or you don't have permission to update it`);
            }
            // Delete the question from the quiz template
            await prisma_1.prisma.questionsInGameTemplate.delete({
                where: {
                    gameTemplateId_questionUid: {
                        gameTemplateId,
                        questionUid: questionUid
                    }
                }
            });
            // Return the updated quiz template
            return this.getgameTemplateById(gameTemplateId, true);
        }
        catch (error) {
            logger.error({ error }, 'Error removing question from quiz template');
            throw error;
        }
    }
    /**
     * Update the sequence of questions in a quiz template
     */
    async updateQuestionSequence(userId, gameTemplateId, updates) {
        try {
            // Check if the quiz template exists and belongs to the user
            const gameTemplate = await prisma_1.prisma.gameTemplate.findFirst({
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
                await prisma_1.prisma.questionsInGameTemplate.update({
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
        }
        catch (error) {
            logger.error({ error }, 'Error updating question sequence in quiz template');
            throw error;
        }
    }
}
exports.gameTemplateService = gameTemplateService;
