import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import {
    QuestionCreationPayload,
    QuestionUpdatePayload
} from '@shared/types/core';

// Re-export types for backward compatibility
export type QuestionCreationData = QuestionCreationPayload;
export type QuestionUpdateData = QuestionUpdatePayload;

// Create a service-specific logger
const logger = createLogger('QuestionService');

/**
 * Question service class for handling question-related operations
 */
export class QuestionService {
    /**
     * Create a new question
     */
    async createQuestion(data: any): Promise<any> {
        logger.info({ data }, 'Creating question');

        // Extract type-specific data
        const { answerOptions, correctAnswers, correctAnswer, tolerance, ...questionData } = data;

        const question = await prisma.question.create({
            data: {
                ...questionData,
                timeLimit: data.durationMs / 1000,
            },
        });

        // Create type-specific data based on question type
        if (data.questionType === 'multiple-choice' && answerOptions) {
            await prisma.multipleChoiceQuestion.create({
                data: {
                    questionUid: question.uid,
                    answerOptions,
                    correctAnswers: correctAnswers || [],
                },
            });
        } else if (data.questionType === 'numeric' && correctAnswer !== undefined) {
            await prisma.numericQuestion.create({
                data: {
                    questionUid: question.uid,
                    correctAnswer,
                    tolerance: tolerance || 0,
                },
            });
        }

        // Return the question with type-specific data
        return this.getQuestionById(question.uid);
    }

    /**
     * Get a question by ID
     */
    async getQuestionById(uid: string): Promise<any> {
        logger.info({ uid }, 'Getting question by ID');
        const question = await prisma.question.findUnique({
            where: { uid },
            include: {
                multipleChoiceQuestion: true,
                numericQuestion: true,
            },
        });

        if (!question) {
            throw new Error(`Question with uid ${uid} not found`);
        }

        return this.normalizeQuestion(question);
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
        mode?: 'tournament' | 'practice' | 'quiz';
    } = {}, pagination: {
        skip?: number;
        take?: number;
    } = {}) {
        try {
            logger.info({ filters, pagination }, 'Starting getQuestions with filters and pagination');
            logger.info(`getQuestions called with filters: ${JSON.stringify(filters)}`);
            logger.info(`getQuestions called with pagination: ${JSON.stringify(pagination)}`);

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
                includeHidden = false,
                mode
            } = filters;
            const { skip = 0, take = 20 } = pagination;

            // Build the where clause with AND logic between filter types, OR within each filter type
            const where: any = {};

            // Exclude questions based on mode
            if (mode === 'tournament') {
                where.NOT = {
                    ...(where.NOT || {}),
                    excludedFrom: {
                        has: 'tournament'
                    }
                };
            } else if (mode === 'practice') {
                where.NOT = {
                    ...(where.NOT || {}),
                    excludedFrom: {
                        has: 'practice'
                    }
                };
            }

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
                // Exclude questions that are explicitly hidden (isHidden field)
                where.isHidden = { not: true };
            }

            const [questions, total] = await Promise.all([
                prisma.question.findMany({
                    where,
                    skip,
                    take,
                    orderBy: {
                        createdAt: 'desc' // Most recent first
                    },
                    include: {
                        multipleChoiceQuestion: true,
                        numericQuestion: true,
                    },
                }),
                prisma.question.count({ where })
            ]);

            return {
                questions: questions.map(q => this.normalizeQuestion(q)),
                total,
                page: Math.floor(skip / take) + 1,
                pageSize: take,
                totalPages: Math.ceil(total / take)
            };
        } catch (error) {
            logger.error({
                error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
                filters,
                pagination
            }, 'Error fetching questions');
            throw error;
        }
    }

    /**
     * Update a question
     */
    async updateQuestion(data: QuestionUpdatePayload) {
        try {
            const { uid, ...updateData } = data;

            // Extract type-specific data if present
            const answerOptions = (data as any).answerOptions;
            const correctAnswers = (data as any).correctAnswers;
            const correctAnswer = (data as any).correctAnswer;
            const tolerance = (data as any).tolerance;

            // Check if the question exists
            const existingQuestion = await prisma.question.findUnique({
                where: { uid },
                include: {
                    multipleChoiceQuestion: true,
                    numericQuestion: true,
                }
            });

            if (!existingQuestion) {
                throw new Error(`Question with ID ${uid} not found`);
            }

            // Convert durationMs to timeLimit for database storage
            const questionUpdateData: any = { ...updateData };
            if (questionUpdateData.durationMs) {
                questionUpdateData.timeLimit = questionUpdateData.durationMs / 1000;
                delete questionUpdateData.durationMs;
            }

            // Update the main question
            const updatedQuestion = await prisma.question.update({
                where: { uid },
                data: questionUpdateData
            });

            // Update type-specific data based on questionType field
            if (updatedQuestion.questionType === 'multiple-choice') {
                if (existingQuestion.multipleChoiceQuestion) {
                    // Update existing multiple choice data
                    if (answerOptions !== undefined || correctAnswers !== undefined) {
                        await prisma.multipleChoiceQuestion.update({
                            where: { questionUid: uid },
                            data: {
                                ...(answerOptions !== undefined && { answerOptions }),
                                ...(correctAnswers !== undefined && { correctAnswers }),
                            },
                        });
                    }
                } else if (answerOptions !== undefined) {
                    // Create new multiple choice data
                    await prisma.multipleChoiceQuestion.create({
                        data: {
                            questionUid: uid,
                            answerOptions,
                            correctAnswers: correctAnswers || [],
                        },
                    });
                }
            } else if (updatedQuestion.questionType === 'numeric') {
                if (existingQuestion.numericQuestion) {
                    // Update existing numeric data
                    if (correctAnswer !== undefined || tolerance !== undefined) {
                        await prisma.numericQuestion.update({
                            where: { questionUid: uid },
                            data: {
                                ...(correctAnswer !== undefined && { correctAnswer }),
                                ...(tolerance !== undefined && { tolerance }),
                            },
                        });
                    }
                } else if (correctAnswer !== undefined) {
                    // Create new numeric data
                    await prisma.numericQuestion.create({
                        data: {
                            questionUid: uid,
                            correctAnswer,
                            tolerance: tolerance || 0,
                        },
                    });
                }
            }

            // Return the updated question with type-specific data
            return this.getQuestionById(uid);
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
     * @param filterCriteria Optional criteria to filter the results (e.g., {gradeLevel: 'elementary', mode: 'tournament'})
     */
    async getAvailableFilters(filterCriteria?: any) {
        try {
            const baseWhere: any = {
                // Exclude questions that are hidden from all modes
                NOT: {
                    excludedFrom: {
                        hasEvery: ['quiz', 'tournament', 'practice']
                    }
                }
            };

            // Add mode-specific exclusions
            if (filterCriteria?.mode) {
                if (filterCriteria.mode === 'tournament') {
                    baseWhere.NOT = {
                        ...baseWhere.NOT,
                        excludedFrom: {
                            has: 'tournament'
                        }
                    };
                } else if (filterCriteria.mode === 'practice') {
                    baseWhere.NOT = {
                        ...baseWhere.NOT,
                        excludedFrom: {
                            has: 'practice'
                        }
                    };
                }
            }

            // Exclude questions with isHidden = true (unless explicitly including hidden)
            if (!filterCriteria?.includeHidden) {
                baseWhere.isHidden = { not: true };
            }

            // Build different where clauses for different filter types
            const niveauxWhere = { ...baseWhere };
            const disciplinesWhere = { ...baseWhere };
            const themesWhere = { ...baseWhere };
            const authorsWhere = { ...baseWhere };

            // Apply cascading filter logic
            if (filterCriteria?.discipline) {
                // When discipline(s) is selected: use OR logic with 'in' operator
                const disciplineFilter = Array.isArray(filterCriteria.discipline)
                    ? { in: filterCriteria.discipline }
                    : filterCriteria.discipline;

                niveauxWhere.discipline = disciplineFilter;
                disciplinesWhere.discipline = disciplineFilter;
                themesWhere.discipline = disciplineFilter;
                authorsWhere.discipline = disciplineFilter;
            }

            if (filterCriteria?.gradeLevel) {
                // When niveau(s) is selected: use OR logic with 'in' operator
                const gradeLevelFilter = Array.isArray(filterCriteria.gradeLevel)
                    ? { in: filterCriteria.gradeLevel }
                    : filterCriteria.gradeLevel;

                niveauxWhere.gradeLevel = gradeLevelFilter;
                disciplinesWhere.gradeLevel = gradeLevelFilter;
                themesWhere.gradeLevel = gradeLevelFilter;
                authorsWhere.gradeLevel = gradeLevelFilter;
            }

            if (filterCriteria?.theme) {
                // When theme(s) is selected: use array contains logic
                const themeFilter = Array.isArray(filterCriteria.theme)
                    ? { hasSome: filterCriteria.theme }
                    : { has: filterCriteria.theme };

                niveauxWhere.themes = themeFilter;
                disciplinesWhere.themes = themeFilter;
                themesWhere.themes = themeFilter;
                authorsWhere.themes = themeFilter;
            }

            if (filterCriteria?.author) {
                // When author(s) is selected: use OR logic with 'in' operator
                const authorFilter = Array.isArray(filterCriteria.author)
                    ? { in: filterCriteria.author }
                    : filterCriteria.author;

                niveauxWhere.author = authorFilter;
                disciplinesWhere.author = authorFilter;
                themesWhere.author = authorFilter;
                authorsWhere.author = authorFilter;
            }

            if (filterCriteria?.tag) {
                // When tag(s) is selected: use array contains logic
                const tagFilter = Array.isArray(filterCriteria.tag)
                    ? { hasSome: filterCriteria.tag }
                    : { has: filterCriteria.tag };

                niveauxWhere.tags = tagFilter;
                disciplinesWhere.tags = tagFilter;
                themesWhere.tags = tagFilter;
                authorsWhere.tags = tagFilter;
            }

            const [niveaux, disciplines, themes, authors, tagsData] = await Promise.all([
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
                }),
                prisma.question.findMany({
                    select: { author: true },
                    distinct: ['author'],
                    where: {
                        ...authorsWhere,
                        AND: [
                            { author: { not: null } },
                            { author: { not: '' } }
                        ]
                    }
                }),
                prisma.question.findMany({
                    select: { tags: true },
                    where: {
                        ...authorsWhere, // Using authorsWhere as the base filter criteria for tags
                        tags: { isEmpty: false }
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

            // Extract unique tags from all questions
            const uniqueTags = new Set<string>();
            tagsData.forEach(q => {
                if (Array.isArray(q.tags)) {
                    q.tags.forEach(tag => uniqueTags.add(tag));
                }
            });

            return {
                gradeLevel: niveaux.map(n => n.gradeLevel).filter((v): v is string => Boolean(v)).sort(),
                disciplines: disciplines.map(d => d.discipline).filter((v): v is string => Boolean(v)).sort(),
                themes: Array.from(uniqueThemes).sort(),
                authors: authors.map(a => a.author).filter((v): v is string => Boolean(v)).sort(),
                tags: Array.from(uniqueTags).sort()
            };
        } catch (error) {
            logger.error({ error }, 'Error fetching available filters');
            throw error;
        }
    }

    /**
     * Normalize question data from database to match canonical types
     * Converts null values to undefined for optional fields
     * Handles polymorphic question structure
     */
    private normalizeQuestion(question: any): any {
        // Canonical: always provide durationMs in ms, never legacy timeLimit
        logger.info({
            uid: question.uid,
            timeLimit: question.timeLimit,
            question: { ...question }
        }, '[DEBUG] normalizeQuestion input');

        const durationMs = question.timeLimit * 1000;
        const {
            timeLimit, // remove legacy
            multipleChoiceQuestion,
            numericQuestion,
            ...rest
        } = question;

        // Keep polymorphic structure - don't flatten type-specific data
        const result = {
            ...rest,
            title: question.title ?? undefined,
            author: question.author ?? undefined,
            explanation: question.explanation ?? undefined,
            durationMs, // canonical
            // Keep polymorphic structure
            multipleChoiceQuestion: multipleChoiceQuestion || undefined,
            numericQuestion: numericQuestion || undefined,
        };

        logger.info({
            uid: question.uid,
            durationMs,
            result
        }, '[DEBUG] normalizeQuestion output');
        return result;
    }
}
