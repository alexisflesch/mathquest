"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('QuestionService');
/**
 * Question service class for handling question-related operations
 */
class QuestionService {
    /**
     * Create a new question
     */
    async createQuestion(userId, data) {
        try {
            // Use durationMs (canonical, required in payload) to set timeLimit in seconds for DB
            const timeLimit = typeof data.durationMs === 'number' && data.durationMs > 0 ? Math.round(data.durationMs / 1000) : 30;
            const question = await prisma_1.prisma.question.create({
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
                    excludedFrom: data.excludedFrom || [],
                    timeLimit: timeLimit
                }
            });
            return this.normalizeQuestion(question);
        }
        catch (error) {
            logger.error({ error }, 'Error creating question');
            throw error;
        }
    }
    /**
     * Get a question by ID
     */
    async getQuestionById(uid) {
        try {
            const question = await prisma_1.prisma.question.findUnique({
                where: { uid }
            });
            return this.normalizeQuestion(question);
        }
        catch (error) {
            logger.error({ error }, `Error fetching question with ID ${uid}`);
            throw error;
        }
    }
    /**
     * Get questions with filters
     */
    async getQuestions(filters = {}, pagination = {}) {
        try {
            const { discipline, disciplines, themes, difficulty, gradeLevel, gradeLevels, author, authors, tags, questionType, includeHidden = false } = filters;
            const { skip = 0, take = 20 } = pagination;
            // Build the where clause with AND logic between filter types, OR within each filter type
            const where = {};
            // Apply discipline filters with OR logic if multiple values
            if (disciplines && disciplines.length > 0) {
                where.discipline = { in: disciplines };
            }
            else if (discipline) {
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
            }
            else if (gradeLevel) {
                where.gradeLevel = gradeLevel;
            }
            // Apply author filters with OR logic if multiple values
            if (authors && authors.length > 0) {
                where.author = { in: authors };
            }
            else if (author) {
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
                // Exclude questions that are hidden from all modes
                where.NOT = {
                    excludedFrom: {
                        hasEvery: ['quiz', 'tournament', 'practice']
                    }
                };
            }
            const [questions, total] = await Promise.all([
                prisma_1.prisma.question.findMany({
                    where,
                    skip,
                    take,
                    orderBy: {
                        createdAt: 'desc' // Most recent first
                    }
                }),
                prisma_1.prisma.question.count({ where })
            ]);
            return {
                questions: questions.map(q => this.normalizeQuestion(q)),
                total,
                page: Math.floor(skip / take) + 1,
                pageSize: take,
                totalPages: Math.ceil(total / take)
            };
        }
        catch (error) {
            logger.error({ error }, 'Error fetching questions');
            throw error;
        }
    }
    /**
     * Update a question
     */
    async updateQuestion(data) {
        try {
            const { uid, ...updateData } = data;
            // Check if the question exists
            const existingQuestion = await prisma_1.prisma.question.findUnique({
                where: { uid }
            });
            if (!existingQuestion) {
                throw new Error(`Question with ID ${uid} not found`);
            }
            // Update the question
            const updatedQuestion = await prisma_1.prisma.question.update({
                where: { uid },
                data: updateData
            });
            return this.normalizeQuestion(updatedQuestion);
        }
        catch (error) {
            logger.error({ error }, 'Error updating question');
            throw error;
        }
    }
    /**
     * Delete a question
     */
    async deleteQuestion(uid) {
        try {
            // Check if the question exists
            const existingQuestion = await prisma_1.prisma.question.findUnique({
                where: { uid }
            });
            if (!existingQuestion) {
                throw new Error(`Question with ID ${uid} not found`);
            }
            // Delete the question
            await prisma_1.prisma.question.delete({
                where: { uid }
            });
            return { success: true };
        }
        catch (error) {
            logger.error({ error }, 'Error deleting question');
            throw error;
        }
    }
    /**
     * Get available filter values (unique disciplines, grade levels, themes)
     * @param filterCriteria Optional criteria to filter the results (e.g., {gradeLevel: 'elementary'})
     */
    async getAvailableFilters(filterCriteria) {
        try {
            const baseWhere = {
                NOT: {
                    excludedFrom: {
                        hasEvery: ['quiz', 'tournament', 'practice']
                    }
                }
            };
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
            const [niveaux, disciplines, themes, authors] = await Promise.all([
                prisma_1.prisma.question.findMany({
                    select: { gradeLevel: true },
                    distinct: ['gradeLevel'],
                    where: {
                        ...niveauxWhere,
                        gradeLevel: { not: '' }
                    }
                }),
                prisma_1.prisma.question.findMany({
                    select: { discipline: true },
                    distinct: ['discipline'],
                    where: {
                        ...disciplinesWhere,
                        discipline: { not: '' }
                    }
                }),
                prisma_1.prisma.question.findMany({
                    select: { themes: true },
                    where: {
                        ...themesWhere,
                        themes: { isEmpty: false }
                    }
                }),
                prisma_1.prisma.question.findMany({
                    select: { author: true },
                    distinct: ['author'],
                    where: {
                        ...authorsWhere,
                        AND: [
                            { author: { not: null } },
                            { author: { not: '' } }
                        ]
                    }
                })
            ]);
            // Extract unique themes from all questions
            const uniqueThemes = new Set();
            themes.forEach(q => {
                if (Array.isArray(q.themes)) {
                    q.themes.forEach(theme => uniqueThemes.add(theme));
                }
            });
            return {
                gradeLevel: niveaux.map(n => n.gradeLevel).filter((v) => Boolean(v)).sort(),
                disciplines: disciplines.map(d => d.discipline).filter((v) => Boolean(v)).sort(),
                themes: Array.from(uniqueThemes).sort(),
                authors: authors.map(a => a.author).filter((v) => Boolean(v)).sort()
            };
        }
        catch (error) {
            logger.error({ error }, 'Error fetching available filters');
            throw error;
        }
    }
    /**
     * Normalize question data from database to match canonical types
     * Converts null values to undefined for optional fields
     */
    normalizeQuestion(question) {
        // Canonical: always provide durationMs in ms, never legacy timeLimit
        // DEBUG: Log question object and timeLimit before serialization
        logger.info({
            uid: question.uid,
            timeLimit: question.timeLimit,
            question: { ...question }
        }, '[DEBUG] normalizeQuestion input');
        const durationMs = question.timeLimit * 1000;
        const { timeLimit, // remove legacy
        ...rest } = question;
        const result = {
            ...rest,
            title: question.title ?? undefined,
            author: question.author ?? undefined,
            explanation: question.explanation ?? undefined,
            // Defensive: ensure all optional string fields are never null
            // Add more fields here if needed
            durationMs // canonical
        };
        logger.info({
            uid: question.uid,
            durationMs,
            result
        }, '[DEBUG] normalizeQuestion output');
        return result;
    }
}
exports.QuestionService = QuestionService;
