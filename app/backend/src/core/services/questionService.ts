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
        disciplines?: string[];
        themes?: string[];
        difficulty?: number;
        gradeLevel?: string;
        gradeLevels?: string[];
        author?: string;
        authors?: string[];
        tags?: string[];
        questionType?: string;
        includeHidden?: boolean;
    } = {}, pagination: {
        skip?: number;
        take?: number;
    } = {}) {
        try {
            const {
                discipline,
                disciplines,
                themes,
                difficulty,
                gradeLevel,
                gradeLevels,
                author,
                authors,
                tags,
                questionType,
                includeHidden = false
            } = filters;
            const { skip = 0, take = 20 } = pagination;

            // Build the where clause with AND logic between filter types, OR within each filter type
            const where: any = {};

            // Apply discipline filters with OR logic if multiple values
            if (disciplines && disciplines.length > 0) {
                where.discipline = { in: disciplines };
            } else if (discipline) {
                where.discipline = discipline;
            }

            if (themes && themes.length > 0) {
                // OR logic within themes: question must match at least one theme
                where.themes = {
                    hasSome: themes
                };
            }

            if (difficulty !== undefined) {
                where.difficulty = difficulty;
            }

            // Apply grade level filters with OR logic if multiple values
            if (gradeLevels && gradeLevels.length > 0) {
                where.gradeLevel = { in: gradeLevels };
            } else if (gradeLevel) {
                where.gradeLevel = gradeLevel;
            }

            // Apply author filters with OR logic if multiple values
            if (authors && authors.length > 0) {
                where.author = { in: authors };
            } else if (author) {
                where.author = author;
            }

            if (tags && tags.length > 0) {
                // OR logic within tags: question must match at least one tag
                where.tags = {
                    hasSome: tags
                };
            }

            if (questionType) {
                where.questionType = questionType;
            }

            // Always apply hidden filter (AND with other conditions)
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
     * @param filterCriteria Optional criteria to filter the results (e.g., {gradeLevel: 'elementary'})
     */
    async getAvailableFilters(filterCriteria?: any) {
        try {
            const baseWhere: any = {
                isHidden: false
            };

            // Build different where clauses for different filter types
            const niveauxWhere = { ...baseWhere };
            const disciplinesWhere = { ...baseWhere };
            const themesWhere = { ...baseWhere };

            // Apply cascading filter logic
            if (filterCriteria?.discipline) {
                // When discipline is selected:
                // - gradeLevel: show niveaux that have this discipline
                // - disciplines: show only the selected discipline  
                // - themes: show themes for this discipline
                niveauxWhere.discipline = filterCriteria.discipline;
                disciplinesWhere.discipline = filterCriteria.discipline;
                themesWhere.discipline = filterCriteria.discipline;
            }

            if (filterCriteria?.gradeLevel) {
                // When niveau is selected:
                // - gradeLevel: show only the selected niveau
                // - disciplines: show disciplines that have this niveau
                // - themes: show themes for this niveau
                niveauxWhere.gradeLevel = filterCriteria.gradeLevel;
                disciplinesWhere.gradeLevel = filterCriteria.gradeLevel;
                themesWhere.gradeLevel = filterCriteria.gradeLevel;
            }

            const [niveaux, disciplines, themes] = await Promise.all([
                prisma.question.findMany({
                    select: { gradeLevel: true },
                    distinct: ['gradeLevel'],
                    where: {
                        ...niveauxWhere,
                        gradeLevel: { not: '' }
                    }
                }),
                prisma.question.findMany({
                    select: { discipline: true },
                    distinct: ['discipline'],
                    where: {
                        ...disciplinesWhere,
                        discipline: { not: '' }
                    }
                }),
                prisma.question.findMany({
                    select: { themes: true },
                    where: {
                        ...themesWhere,
                        themes: { isEmpty: false }
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
                gradeLevel: niveaux.map(n => n.gradeLevel).filter(Boolean).sort(),
                disciplines: disciplines.map(d => d.discipline).filter(Boolean).sort(),
                themes: Array.from(uniqueThemes).sort()
            };
        } catch (error) {
            logger.error({ error }, 'Error fetching available filters');
            throw error;
        }
    }
}
