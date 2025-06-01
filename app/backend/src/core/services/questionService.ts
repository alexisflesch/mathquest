import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Create a service-specific logger
const logger = createLogger('QuestionService');

export interface QuestionCreationData {
    title?: string;
    text: string;
    answerOptions: string[]; // Array of possible answers 
    correctAnswers: boolean[]; // Array of booleans indicating which answers are correct
    questionType: string;
    discipline: string;
    themes: string[];
    difficulty?: number;
    gradeLevel?: string;
    author?: string;
    explanation?: string;
    tags?: string[];
    timeLimit?: number;
    isHidden?: boolean;
}

export interface QuestionUpdateData extends Partial<QuestionCreationData> {
    uid: string;
}

/**
 * Question service class for handling question-related operations
 */
export class QuestionService {
    /**
     * Create a new question
     */
    async createQuestion(userId: string, data: QuestionCreationData) {
        try {
            // Create the question in the database
            const question = await prisma.question.create({
                data: {
                    title: data.title,
                    text: data.text,
                    answerOptions: data.answerOptions,
                    correctAnswers: data.correctAnswers,
                    questionType: data.questionType,
                    discipline: data.discipline,
                    themes: data.themes,
                    difficulty: data.difficulty,
                    gradeLevel: data.gradeLevel,
                    author: data.author || userId, // Default to userId if not specified
                    explanation: data.explanation,
                    tags: data.tags || [],
                    timeLimit: data.timeLimit,
                    isHidden: data.isHidden
                }
            });

            return question;
        } catch (error) {
            logger.error({ error }, 'Error creating question');
            throw error;
        }
    }

    /**
     * Get a question by ID
     */
    async getQuestionById(uid: string) {
        try {
            return await prisma.question.findUnique({
                where: { uid }
            });
        } catch (error) {
            logger.error({ error }, `Error fetching question with ID ${uid}`);
            throw error;
        }
    }

    /**
     * Get questions with filters
     */
    async getQuestions(filters: {
        discipline?: string;
        themes?: string[];
        difficulty?: number;
        gradeLevel?: string;
        tags?: string[];
        questionType?: string;
        includeHidden?: boolean;
    } = {}, pagination: {
        skip?: number;
        take?: number;
    } = {}) {
        try {
            const { discipline, themes, difficulty, gradeLevel, tags, questionType, includeHidden = false } = filters;
            const { skip = 0, take = 20 } = pagination;

            // Build the where clause based on filters
            const where: any = {};

            if (discipline) {
                where.discipline = discipline;
            }

            if (themes && themes.length > 0) {
                where.themes = {
                    hasSome: themes
                };
            }

            if (difficulty !== undefined) {
                where.difficulty = difficulty;
            }

            if (gradeLevel) {
                where.gradeLevel = gradeLevel;
            }

            if (tags && tags.length > 0) {
                where.tags = {
                    hasSome: tags
                };
            }

            if (questionType) {
                where.questionType = questionType;
            }

            if (!includeHidden) {
                where.isHidden = false;
            }

            const [questions, total] = await Promise.all([
                prisma.question.findMany({
                    where,
                    skip,
                    take,
                    orderBy: {
                        createdAt: 'desc' // Most recent first
                    }
                }),
                prisma.question.count({ where })
            ]);

            return {
                questions,
                total,
                page: Math.floor(skip / take) + 1,
                pageSize: take,
                totalPages: Math.ceil(total / take)
            };
        } catch (error) {
            logger.error({ error }, 'Error fetching questions');
            throw error;
        }
    }

    /**
     * Update a question
     */
    async updateQuestion(data: QuestionUpdateData) {
        try {
            const { uid, ...updateData } = data;

            // Check if the question exists
            const existingQuestion = await prisma.question.findUnique({
                where: { uid }
            });

            if (!existingQuestion) {
                throw new Error(`Question with ID ${uid} not found`);
            }

            // Update the question
            const updatedQuestion = await prisma.question.update({
                where: { uid },
                data: updateData
            });

            return updatedQuestion;
        } catch (error) {
            logger.error({ error }, 'Error updating question');
            throw error;
        }
    }

    /**
     * Delete a question
     */
    async deleteQuestion(uid: string) {
        try {
            // Check if the question exists
            const existingQuestion = await prisma.question.findUnique({
                where: { uid }
            });

            if (!existingQuestion) {
                throw new Error(`Question with ID ${uid} not found`);
            }

            // Delete the question
            await prisma.question.delete({
                where: { uid }
            });

            return { success: true };
        } catch (error) {
            logger.error({ error }, 'Error deleting question');
            throw error;
        }
    }

    /**
     * Get available filter values (unique disciplines, grade levels, themes)
     */
    async getAvailableFilters() {
        try {
            const [niveaux, disciplines, themes] = await Promise.all([
                prisma.question.findMany({
                    select: { gradeLevel: true },
                    distinct: ['gradeLevel'],
                    where: {
                        gradeLevel: { not: '' },
                        isHidden: false
                    }
                }),
                prisma.question.findMany({
                    select: { discipline: true },
                    distinct: ['discipline'],
                    where: {
                        discipline: { not: '' },
                        isHidden: false
                    }
                }),
                prisma.question.findMany({
                    select: { themes: true },
                    where: {
                        themes: { isEmpty: false },
                        isHidden: false
                    }
                })
            ]);

            // Extract unique themes from all questions
            const uniqueThemes = new Set<string>();
            themes.forEach(q => {
                if (Array.isArray(q.themes)) {
                    q.themes.forEach(theme => uniqueThemes.add(theme));
                }
            });

            return {
                niveaux: niveaux.map(n => n.gradeLevel).filter(Boolean).sort(),
                disciplines: disciplines.map(d => d.discipline).filter(Boolean).sort(),
                themes: Array.from(uniqueThemes).sort()
            };
        } catch (error) {
            logger.error({ error }, 'Error fetching available filters');
            throw error;
        }
    }
}
