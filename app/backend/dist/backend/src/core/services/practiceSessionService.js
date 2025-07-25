"use strict";
/**
 * Practice Session Service
 *
 * Core service for managing practice sessions independently from game instances.
 * Handles session creation, question management, answer tracking, and session lifecycle.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.practiceSessionService = exports.PracticeSessionService = void 0;
const redis_1 = require("@/config/redis");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('PracticeSessionService');
/**
 * Service for managing practice sessions
 */
class PracticeSessionService {
    /**
     * Create a new practice session
     */
    async createSession(userId, settings) {
        try {
            // Generate unique session ID
            const sessionId = `practice_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Fetch questions - use GameTemplate questions if available, otherwise generate new ones
            let questionPool;
            if (settings.gameTemplateId) {
                // Use pre-selected questions from GameTemplate
                questionPool = await this.getGameTemplateQuestions(settings.gameTemplateId);
                logger.info({
                    sessionId,
                    gameTemplateId: settings.gameTemplateId,
                    questionCount: questionPool.length
                }, 'Using GameTemplate questions for practice session');
            }
            else {
                // Generate new questions based on criteria (original behavior)
                questionPool = await this.generateQuestionPool(settings);
                logger.info({
                    sessionId,
                    questionCount: questionPool.length
                }, 'Generated new question pool for practice session');
            }
            if (questionPool.length === 0) {
                throw new Error('No questions found for the specified criteria');
            }
            // Create initial statistics
            const statistics = {
                questionsAttempted: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                accuracyPercentage: 0,
                averageTimePerQuestion: 0,
                totalTimeSpent: 0,
                retriedQuestions: []
            };
            // Create practice session
            const now = new Date();
            const session = {
                sessionId,
                userId,
                settings,
                status: 'active',
                questionPool: questionPool.slice(0, settings.questionCount),
                currentQuestionIndex: 0,
                answers: [],
                statistics,
                createdAt: now,
                startedAt: now,
                expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
            };
            logger.info({
                sessionId,
                totalQuestionsFound: questionPool.length,
                questionPoolUsed: session.questionPool,
                requestedCount: settings.questionCount,
                actualPoolSize: session.questionPool.length
            }, 'DEBUG: Practice session question pool created');
            // Set current question
            if (session.questionPool.length > 0) {
                session.currentQuestion = await this.getQuestionData(session.questionPool[0], settings);
            }
            // Store session in Redis
            await this.storeSession(session);
            logger.info({ sessionId, userId, questionCount: session.questionPool.length }, 'Practice session created');
            return session;
        }
        catch (error) {
            logger.error({
                userId,
                settings,
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : String(error)
            }, 'Failed to create practice session');
            throw new Error(`Failed to create practice session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get practice session by ID
     */
    async getSession(sessionId) {
        try {
            const sessionData = await redis_1.redisClient.get(`${PracticeSessionService.SESSION_PREFIX}${sessionId}`);
            if (!sessionData) {
                return null;
            }
            const session = JSON.parse(sessionData);
            // Convert date strings back to Date objects
            session.createdAt = new Date(session.createdAt);
            session.expiresAt = new Date(session.expiresAt);
            if (session.startedAt) {
                session.startedAt = new Date(session.startedAt);
            }
            if (session.completedAt) {
                session.completedAt = new Date(session.completedAt);
            }
            return session;
        }
        catch (error) {
            logger.error({ sessionId, error }, 'Failed to get practice session');
            return null;
        }
    }
    /**
     * Submit an answer for the current question
     */
    async submitAnswer(sessionId, answerData) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('Practice session not found');
            }
            if (session.status !== 'active') {
                throw new Error('Practice session is not active');
            }
            if (!session.currentQuestion) {
                throw new Error('No current question available');
            }
            // Validate answer and get correct answers for feedback
            const isCorrect = await this.validateAnswer(session.currentQuestion.uid, answerData.selectedAnswers);
            const correctAnswers = await this.getCorrectAnswers(session.currentQuestion.uid);
            // Create answer record
            const answer = {
                questionUid: session.currentQuestion.uid,
                selectedAnswers: answerData.selectedAnswers,
                isCorrect,
                submittedAt: new Date(),
                timeSpentMs: answerData.timeSpentMs,
                attemptNumber: 1 // For now, always 1 (retry functionality can be added later)
            };
            // Add answer to session
            session.answers.push(answer);
            // Update statistics
            session.statistics.questionsAttempted += 1;
            if (isCorrect) {
                session.statistics.correctAnswers += 1;
            }
            else {
                session.statistics.incorrectAnswers += 1;
            }
            session.statistics.accuracyPercentage =
                (session.statistics.correctAnswers / session.statistics.questionsAttempted) * 100;
            session.statistics.totalTimeSpent += answerData.timeSpentMs;
            session.statistics.averageTimePerQuestion =
                session.statistics.totalTimeSpent / session.statistics.questionsAttempted;
            // Move to next question or complete session
            if (session.currentQuestionIndex + 1 >= session.questionPool.length) {
                session.status = 'completed';
                session.completedAt = new Date();
                session.currentQuestion = undefined;
            }
            else {
                session.currentQuestionIndex += 1;
                const nextQuestionUid = session.questionPool[session.currentQuestionIndex];
                session.currentQuestion = await this.getQuestionData(nextQuestionUid, session.settings);
            }
            // Update session in Redis
            await this.storeSession(session);
            logger.info({
                sessionId,
                questionUid: answer.questionUid,
                isCorrect,
                currentIndex: session.currentQuestionIndex,
                status: session.status
            }, 'Practice answer submitted');
            // Return structured feedback result
            const result = {
                isCorrect,
                correctAnswers,
                explanation: undefined, // Can be added later from question data
                pointsEarned: isCorrect ? 10 : 0, // Simple scoring system
                updatedSession: session
            };
            return result;
        }
        catch (error) {
            logger.error({ sessionId, answerData, error }, 'Failed to submit practice answer');
            throw error;
        }
    }
    /**
     * End practice session
     */
    async endSession(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('Practice session not found');
            }
            // Mark as completed if not already
            if (session.status === 'active') {
                session.status = 'completed';
                session.completedAt = new Date();
                session.currentQuestion = undefined;
                await this.storeSession(session);
            }
            logger.info({ sessionId, statistics: session.statistics }, 'Practice session ended');
            return session;
        }
        catch (error) {
            logger.error({ sessionId, error }, 'Failed to end practice session');
            throw error;
        }
    }
    /**
     * Delete practice session (cleanup)
     */
    async deleteSession(sessionId) {
        try {
            await redis_1.redisClient.del(`${PracticeSessionService.SESSION_PREFIX}${sessionId}`);
            logger.info({ sessionId }, 'Practice session deleted');
        }
        catch (error) {
            logger.error({ sessionId, error }, 'Failed to delete practice session');
            throw error;
        }
    }
    /**
     * Private helper: Store session in Redis
     */
    async storeSession(session) {
        const key = `${PracticeSessionService.SESSION_PREFIX}${session.sessionId}`;
        await redis_1.redisClient.setex(key, PracticeSessionService.SESSION_EXPIRY, JSON.stringify(session));
    }
    /**
     * Private helper: Generate question pool based on settings
     */
    async generateQuestionPool(settings) {
        try {
            // Build query conditions
            const whereConditions = {
                gradeLevel: settings.gradeLevel,
                discipline: settings.discipline,
                isHidden: { not: true } // Exclude hidden questions
            };
            // Add themes filter if specified
            if (settings.themes && settings.themes.length > 0) {
                whereConditions.themes = {
                    hasSome: settings.themes
                };
            }
            logger.info({
                settings,
                whereConditions,
                requestedCount: settings.questionCount
            }, 'Generating question pool with filters');
            // Fetch questions from database
            const questions = await prisma_1.prisma.question.findMany({
                where: whereConditions,
                select: {
                    uid: true,
                    gradeLevel: true,
                    discipline: true,
                    themes: true
                },
                take: Math.max(settings.questionCount * 3, 100) // Fetch more for better randomization
            });
            logger.info({
                settings,
                questionsFound: questions.length,
                questionDetails: questions.map(q => ({ uid: q.uid, gradeLevel: q.gradeLevel, discipline: q.discipline, themes: q.themes })),
                requestedCount: settings.questionCount
            }, 'Question pool generation result - DETAILED DEBUG');
            if (questions.length < settings.questionCount) {
                logger.warn({
                    questionsFound: questions.length,
                    questionsRequested: settings.questionCount,
                    criteria: { gradeLevel: settings.gradeLevel, discipline: settings.discipline, themes: settings.themes }
                }, 'WARNING: Not enough questions found for requested criteria');
            }
            // Extract UIDs and randomize
            const questionUids = questions.map(q => q.uid);
            return this.shuffleArray(questionUids);
        }
        catch (error) {
            logger.error({ settings, error }, 'Failed to generate question pool');
            throw new Error('Failed to generate question pool');
        }
    }
    /**
     * Private helper: Get question data for display
     */
    async getQuestionData(questionUid, settings) {
        try {
            const question = await prisma_1.prisma.question.findUnique({
                where: { uid: questionUid },
                select: {
                    uid: true,
                    title: true,
                    text: true,
                    answerOptions: true,
                    questionType: true,
                    timeLimit: true,
                    gradeLevel: true,
                    discipline: true,
                    themes: true
                }
            });
            if (!question) {
                throw new Error(`Question not found: ${questionUid}`);
            }
            return {
                uid: question.uid,
                title: question.title || '',
                text: question.text,
                answerOptions: Array.isArray(question.answerOptions) ? question.answerOptions : [],
                questionType: question.questionType,
                timeLimit: question.timeLimit || undefined,
                gradeLevel: question.gradeLevel || '',
                discipline: question.discipline || '',
                themes: Array.isArray(question.themes) ? question.themes : []
            };
        }
        catch (error) {
            logger.error({ questionUid, error }, 'Failed to get question data');
            throw error;
        }
    }
    /**
     * Private helper: Validate user answer against correct answers
     */
    async validateAnswer(questionUid, selectedAnswers) {
        try {
            const question = await prisma_1.prisma.question.findUnique({
                where: { uid: questionUid },
                select: { correctAnswers: true }
            });
            if (!question) {
                throw new Error(`Question not found: ${questionUid}`);
            }
            const correctAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
            // Check if selected answers match correct answers
            const correctIndices = correctAnswers
                .map((isCorrect, index) => isCorrect ? index : -1)
                .filter((index) => index !== -1);
            // Compare arrays (order doesn't matter for multiple choice)
            const selectedSet = new Set(selectedAnswers);
            const correctSet = new Set(correctIndices);
            if (selectedSet.size !== correctSet.size) {
                return false;
            }
            // Convert Set to Array for iteration
            for (const correct of Array.from(correctSet)) {
                if (!selectedSet.has(correct)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            logger.error({ questionUid, selectedAnswers, error }, 'Failed to validate answer');
            return false;
        }
    }
    /**
     * Private helper: Shuffle array (Fisher-Yates algorithm)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /**
     * Get the next question for a practice session
     * @param sessionId Practice session ID
     * @returns Next question data or null if no more questions
     */
    async getNextQuestion(sessionId) {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Practice session ${sessionId} not found`);
        }
        // Check if session is completed or if we've reached the end
        if (session.status === 'completed' || session.currentQuestionIndex >= session.questionPool.length) {
            return null;
        }
        // Get the current question UID from the pool
        const questionUid = session.questionPool[session.currentQuestionIndex];
        if (!questionUid) {
            return null;
        }
        // Get question data
        const questionData = await this.getQuestionData(questionUid, session.settings);
        // Set the question index for reference
        questionData.questionIndex = session.currentQuestionIndex;
        logger.debug({
            sessionId,
            questionUid,
            questionIndex: session.currentQuestionIndex,
            totalQuestions: session.questionPool.length
        }, 'Retrieved next practice question');
        return questionData;
    }
    /**
     * Get correct answers for a question
     * @param questionUid Question unique identifier
     * @returns Array of correct answer indices
     */
    async getCorrectAnswers(questionUid) {
        try {
            const question = await prisma_1.prisma.question.findUnique({
                where: { uid: questionUid },
                select: { correctAnswers: true }
            });
            if (!question || !question.correctAnswers) {
                throw new Error(`Question ${questionUid} not found or has no correct answers`);
            }
            // Convert boolean array to indices array
            // correctAnswers is a boolean array where true indicates the correct answer
            const correctIndices = [];
            question.correctAnswers.forEach((isCorrect, index) => {
                if (isCorrect) {
                    correctIndices.push(index);
                }
            });
            return correctIndices;
        }
        catch (error) {
            logger.error({ questionUid, error }, 'Failed to get correct answers');
            return [];
        }
    }
    /**
     * Get question details including correct answers and explanation
     * @param questionUid Question UID
     * @returns Question details with boolean[] correct answers and explanation
     */
    async getQuestionDetails(questionUid) {
        try {
            const question = await prisma_1.prisma.question.findUnique({
                where: { uid: questionUid },
                select: {
                    correctAnswers: true,
                    explanation: true
                }
            });
            if (!question) {
                return null;
            }
            return {
                correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers : [],
                explanation: question.explanation || undefined
            };
        }
        catch (error) {
            logger.error({ questionUid, error }, 'Failed to get question details');
            return null;
        }
    }
    /**
     * Private helper: Get questions from GameTemplate
     */
    async getGameTemplateQuestions(gameTemplateId) {
        try {
            const gameTemplate = await prisma_1.prisma.gameTemplate.findUnique({
                where: { id: gameTemplateId },
                include: {
                    questions: {
                        orderBy: { sequence: 'asc' },
                        include: { question: true }
                    }
                }
            });
            if (!gameTemplate) {
                throw new Error(`GameTemplate not found: ${gameTemplateId}`);
            }
            // Extract question UIDs in correct sequence order
            const questionUids = gameTemplate.questions.map(qtq => qtq.questionUid);
            logger.info({
                gameTemplateId,
                questionCount: questionUids.length,
                questionUids
            }, 'Retrieved questions from GameTemplate');
            return questionUids;
        }
        catch (error) {
            logger.error({ gameTemplateId, error }, 'Failed to get GameTemplate questions');
            throw error;
        }
    }
}
exports.PracticeSessionService = PracticeSessionService;
PracticeSessionService.SESSION_PREFIX = 'practice_session:';
PracticeSessionService.SESSION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
// Export singleton instance
exports.practiceSessionService = new PracticeSessionService();
