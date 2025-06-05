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
            // Create the question in the database
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
                    timeLimit: data.timeLimit,
                    isHidden: data.isHidden
                }
            });
            return question;
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
            return await prisma_1.prisma.question.findUnique({
                where: { uid }
            });
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
            const { discipline, themes, difficulty, gradeLevel, tags, questionType, includeHidden = false } = filters;
            const { skip = 0, take = 20 } = pagination;
            // Build the where clause based on filters
            const where = {};
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
                questions,
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
            return updatedQuestion;
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
                isHidden: false
            };
            // Build different where clauses for different filter types
            const niveauxWhere = { ...baseWhere };
            const disciplinesWhere = { ...baseWhere };
            const themesWhere = { ...baseWhere };
            // Apply cascading filter logic
            if (filterCriteria?.discipline) {
                // When discipline is selected:
                // - niveaux: show niveaux that have this discipline
                // - disciplines: show only the selected discipline  
                // - themes: show themes for this discipline
                niveauxWhere.discipline = filterCriteria.discipline;
                disciplinesWhere.discipline = filterCriteria.discipline;
                themesWhere.discipline = filterCriteria.discipline;
            }
            if (filterCriteria?.gradeLevel) {
                // When niveau is selected:
                // - niveaux: show only the selected niveau
                // - disciplines: show disciplines that have this niveau
                // - themes: show themes for this niveau
                niveauxWhere.gradeLevel = filterCriteria.gradeLevel;
                disciplinesWhere.gradeLevel = filterCriteria.gradeLevel;
                themesWhere.gradeLevel = filterCriteria.gradeLevel;
            }
            const [niveaux, disciplines, themes] = await Promise.all([
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
                niveaux: niveaux.map(n => n.gradeLevel).filter(Boolean).sort(),
                disciplines: disciplines.map(d => d.discipline).filter(Boolean).sort(),
                themes: Array.from(uniqueThemes).sort()
            };
        }
        catch (error) {
            logger.error({ error }, 'Error fetching available filters');
            throw error;
        }
    }
}
exports.QuestionService = QuestionService;
