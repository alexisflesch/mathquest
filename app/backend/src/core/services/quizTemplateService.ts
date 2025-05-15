import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Define PlayMode type to match Prisma schema
export type PlayMode = 'class' | 'tournament' | 'practice';

// Create a service-specific logger
const logger = createLogger('QuizTemplateService');

export interface QuizTemplateCreationData {
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

export interface QuizTemplateUpdateData {
    id: string;
    name?: string;
    gradeLevel?: string;
    themes?: string[];
    discipline?: string;
    description?: string;
    defaultMode?: PlayMode;
}

/**
 * QuizTemplate service class for handling quiz template-related operations
 */
export class QuizTemplateService {
    /**
     * Create a new quiz template
     */
    async createQuizTemplate(teacherId: string, data: QuizTemplateCreationData) {
        try {
            // Create the quiz template in the database
            const quizTemplate = await prisma.quizTemplate.create({
                data: {
                    name: data.name,
                    creatorTeacherId: teacherId,
                    gradeLevel: data.gradeLevel,
                    themes: data.themes || [],
                    discipline: data.discipline,
                    description: data.description,
                    defaultMode: data.defaultMode || 'class',
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

            return quizTemplate;
        } catch (error) {
            logger.error({ error }, 'Error creating quiz template');
            throw error;
        }
    }

    /**
     * Get a quiz template by ID
     */
    async getQuizTemplateById(id: string, includeQuestions: boolean = false) {
        try {
            return await prisma.quizTemplate.findUnique({
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
    async getQuizTemplates(teacherId: string, filters: {
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
                creatorTeacherId: teacherId
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

            const [quizTemplates, total] = await Promise.all([
                prisma.quizTemplate.findMany({
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
                prisma.quizTemplate.count({ where })
            ]);

            return {
                quizTemplates,
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
    async updateQuizTemplate(teacherId: string, data: QuizTemplateUpdateData) {
        try {
            const { id, ...updateData } = data;

            // Check if the quiz template exists and belongs to the teacher
            const existingTemplate = await prisma.quizTemplate.findFirst({
                where: {
                    id,
                    creatorTeacherId: teacherId
                }
            });

            if (!existingTemplate) {
                throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
            }

            // Update the quiz template
            const updatedTemplate = await prisma.quizTemplate.update({
                where: { id },
                data: updateData,
                include: {
                    questions: {
                        include: {
                            question: true
                        },
                        orderBy: {
                            sequence: 'asc'
                        }
                    }
                }
            });

            return updatedTemplate;
        } catch (error) {
            logger.error({ error }, 'Error updating quiz template');
            throw error;
        }
    }

    /**
     * Delete a quiz template
     */
    async deleteQuizTemplate(teacherId: string, id: string) {
        try {
            // Check if the quiz template exists and belongs to the teacher
            const existingTemplate = await prisma.quizTemplate.findFirst({
                where: {
                    id,
                    creatorTeacherId: teacherId
                }
            });

            if (!existingTemplate) {
                throw new Error(`Quiz template with ID ${id} not found or you don't have permission to delete it`);
            }

            // Delete the quiz template
            await prisma.quizTemplate.delete({
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
    async addQuestionToQuizTemplate(teacherId: string, quizTemplateId: string, questionUid: string, sequence?: number) {
        try {
            // Check if the quiz template exists and belongs to the teacher
            const quizTemplate = await prisma.quizTemplate.findFirst({
                where: {
                    id: quizTemplateId,
                    creatorTeacherId: teacherId
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

            if (!quizTemplate) {
                throw new Error(`Quiz template with ID ${quizTemplateId} not found or you don't have permission to update it`);
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
            if (quizTemplate.questions.length > 0) {
                nextSequence = quizTemplate.questions[0].sequence + 1;
            }

            const actualSequence = sequence || nextSequence;

            // Add the question to the quiz template
            await prisma.questionsInQuizTemplate.create({
                data: {
                    quizTemplateId,
                    questionUid,
                    sequence: actualSequence
                }
            });

            // Return the updated quiz template
            return this.getQuizTemplateById(quizTemplateId, true);
        } catch (error) {
            logger.error({ error }, 'Error adding question to quiz template');
            throw error;
        }
    }

    /**
     * Remove a question from a quiz template
     */
    async removeQuestionFromQuizTemplate(teacherId: string, quizTemplateId: string, questionUid: string) {
        try {
            // Check if the quiz template exists and belongs to the teacher
            const quizTemplate = await prisma.quizTemplate.findFirst({
                where: {
                    id: quizTemplateId,
                    creatorTeacherId: teacherId
                }
            });

            if (!quizTemplate) {
                throw new Error(`Quiz template with ID ${quizTemplateId} not found or you don't have permission to update it`);
            }

            // Delete the question from the quiz template
            await prisma.questionsInQuizTemplate.delete({
                where: {
                    quizTemplateId_questionUid: {
                        quizTemplateId,
                        questionUid
                    }
                }
            });

            // Return the updated quiz template
            return this.getQuizTemplateById(quizTemplateId, true);
        } catch (error) {
            logger.error({ error }, 'Error removing question from quiz template');
            throw error;
        }
    }

    /**
     * Update the sequence of questions in a quiz template
     */
    async updateQuestionSequence(teacherId: string, quizTemplateId: string, updates: Array<{
        questionUid: string;
        sequence: number;
    }>) {
        try {
            // Check if the quiz template exists and belongs to the teacher
            const quizTemplate = await prisma.quizTemplate.findFirst({
                where: {
                    id: quizTemplateId,
                    creatorTeacherId: teacherId
                }
            });

            if (!quizTemplate) {
                throw new Error(`Quiz template with ID ${quizTemplateId} not found or you don't have permission to update it`);
            }

            // Update each question sequence
            for (const update of updates) {
                await prisma.questionsInQuizTemplate.update({
                    where: {
                        quizTemplateId_questionUid: {
                            quizTemplateId,
                            questionUid: update.questionUid
                        }
                    },
                    data: {
                        sequence: update.sequence
                    }
                });
            }

            // Return the updated quiz template
            return this.getQuizTemplateById(quizTemplateId, true);
        } catch (error) {
            logger.error({ error }, 'Error updating question sequence in quiz template');
            throw error;
        }
    }
}
