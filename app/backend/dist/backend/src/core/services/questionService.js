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
    async createQuestion(teacherId, data) {
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
                    author: data.author || teacherId, // Default to teacherId if not specified
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
}
exports.QuestionService = QuestionService;
