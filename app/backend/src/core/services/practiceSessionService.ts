/**
 * Practice Session Service
 * 
 * Core service for managing practice sessions independently from game instances.
 * Handles session creation, question management, answer tracking, and session lifecycle.
 */

import { redisClient } from '@/config/redis';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import {
    PracticeSession,
    PracticeSettings,
    PracticeAnswer,
    PracticeQuestionData,
    PracticeSessionStatus,
    PracticeStatistics
} from '@shared/types/practice/session';

const logger = createLogger('PracticeSessionService');

/**
 * Request interface for submitting practice answers
 */
interface SubmitAnswerRequest {
    questionUid: string;
    selectedAnswers: number[];
    timeSpentMs: number;
}

/**
 * Response interface for practice answer submission
 */
interface SubmitAnswerResult {
    isCorrect: boolean;
    correctAnswers: number[];
    numericCorrectAnswer?: {
        correctAnswer: number;
        tolerance?: number;
    };
    explanation?: string;
    pointsEarned: number;
    updatedSession: PracticeSession;
}

/**
 * Service for managing practice sessions
 */
export class PracticeSessionService {
    private static readonly SESSION_PREFIX = 'practice_session:';
    private static readonly SESSION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

    /**
     * Create a new practice session
     */
    async createSession(userId: string, settings: PracticeSettings): Promise<PracticeSession> {
        try {
            // Generate unique session ID
            const sessionId = `practice_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Fetch questions - use GameTemplate questions if available, otherwise generate new ones
            let questionPool: string[];

            if (settings.gameTemplateId) {
                // Use pre-selected questions from GameTemplate
                questionPool = await this.getGameTemplateQuestions(settings.gameTemplateId);
                logger.info({
                    sessionId,
                    gameTemplateId: settings.gameTemplateId,
                    questionCount: questionPool.length
                }, 'Using GameTemplate questions for practice session');
            } else {
                // Generate new questions based on criteria (original behavior)
                questionPool = await this.generateQuestionPool(settings);
                logger.info({
                    sessionId,
                    questionCount: questionPool.length,
                    reason: 'No gameTemplateId provided in settings.'
                }, 'Generated new question pool for practice session');
            }

            if (questionPool.length === 0) {
                throw new Error('No questions found for the specified criteria');
            }

            // Create initial statistics
            const statistics: PracticeStatistics = {
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
            const session: PracticeSession = {
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
        } catch (error) {
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
    async getSession(sessionId: string): Promise<PracticeSession | null> {
        try {
            const sessionData = await redisClient.get(`${PracticeSessionService.SESSION_PREFIX}${sessionId}`);

            if (!sessionData) {
                return null;
            }

            const session = JSON.parse(sessionData) as PracticeSession;

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
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to get practice session');
            return null;
        }
    }

    /**
     * Submit an answer for the current question
     */
    async submitAnswer(sessionId: string, answerData: SubmitAnswerRequest): Promise<SubmitAnswerResult> {
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
            const numericCorrectAnswer = await this.getNumericCorrectAnswer(session.currentQuestion.uid);

            // Create answer record
            const answer: PracticeAnswer = {
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
            } else {
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
            } else {
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
            const result: SubmitAnswerResult = {
                isCorrect,
                correctAnswers,
                numericCorrectAnswer: numericCorrectAnswer || undefined,
                explanation: undefined, // Can be added later from question data
                pointsEarned: isCorrect ? 10 : 0, // Simple scoring system
                updatedSession: session
            };

            return result;
        } catch (error) {
            logger.error({ sessionId, answerData, error }, 'Failed to submit practice answer');
            throw error;
        }
    }

    /**
     * End practice session
     */
    async endSession(sessionId: string): Promise<PracticeSession> {
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
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to end practice session');
            throw error;
        }
    }

    /**
     * Delete practice session (cleanup)
     */
    async deleteSession(sessionId: string): Promise<void> {
        try {
            await redisClient.del(`${PracticeSessionService.SESSION_PREFIX}${sessionId}`);
            logger.info({ sessionId }, 'Practice session deleted');
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to delete practice session');
            throw error;
        }
    }

    /**
     * Private helper: Store session in Redis
     */
    private async storeSession(session: PracticeSession): Promise<void> {
        const key = `${PracticeSessionService.SESSION_PREFIX}${session.sessionId}`;
        await redisClient.setex(key, PracticeSessionService.SESSION_EXPIRY, JSON.stringify(session));
    }

    /**
     * Private helper: Generate question pool based on settings
     */
    private async generateQuestionPool(settings: PracticeSettings): Promise<string[]> {
        try {
            // Build query conditions
            const whereConditions: any = {
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
            const questions = await prisma.question.findMany({
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
        } catch (error) {
            logger.error({ settings, error }, 'Failed to generate question pool');
            throw new Error('Failed to generate question pool');
        }
    }

    /**
     * Private helper: Get question data for display
     */
    private async getQuestionData(questionUid: string, settings: PracticeSettings): Promise<PracticeQuestionData> {
        try {
            const question = await prisma.question.findUnique({
                where: { uid: questionUid },
                include: {
                    multipleChoiceQuestion: true,
                    numericQuestion: true,
                }
            });

            if (!question) {
                throw new Error(`Question not found: ${questionUid}`);
            }

            // Build the polymorphic structure
            const result: PracticeQuestionData = {
                uid: question.uid,
                title: question.title || '',
                text: question.text,
                questionType: question.questionType,
                timeLimit: question.timeLimit || undefined,
                gradeLevel: question.gradeLevel || '',
                discipline: question.discipline || '',
                themes: Array.isArray(question.themes) ? question.themes as string[] : []
            };

            // Add polymorphic question data based on type
            if (question.multipleChoiceQuestion) {
                result.multipleChoiceQuestion = {
                    answerOptions: question.multipleChoiceQuestion.answerOptions
                };
                // Legacy fallback for backward compatibility
                result.answerOptions = question.multipleChoiceQuestion.answerOptions;
            }

            if (question.numericQuestion) {
                result.numericQuestion = {
                    unit: question.numericQuestion.unit || undefined
                };
            }

            return result;
        } catch (error) {
            logger.error({ questionUid, error }, 'Failed to get question data');
            throw error;
        }
    }

    /**
     * Private helper: Validate user answer against correct answers
     */
    private async validateAnswer(questionUid: string, selectedAnswers: number[]): Promise<boolean> {
        try {
            const question = await prisma.question.findUnique({
                where: { uid: questionUid },
                include: {
                    multipleChoiceQuestion: true,
                    numericQuestion: true,
                }
            });

            if (!question) {
                throw new Error(`Question not found: ${questionUid}`);
            }

            // Handle numeric questions
            if (question.numericQuestion && question.questionType === 'numeric') {
                if (selectedAnswers.length !== 1) {
                    return false; // Numeric questions should have exactly one answer
                }

                const userAnswer = selectedAnswers[0];
                const correctAnswer = question.numericQuestion.correctAnswer;
                const tolerance = question.numericQuestion.tolerance || 0;

                const difference = Math.abs(userAnswer - correctAnswer);
                return difference <= tolerance;
            }

            // Handle multiple choice questions
            if (question.multipleChoiceQuestion) {
                const correctAnswers = question.multipleChoiceQuestion.correctAnswers || [];

                // Check if selected answers match correct answers
                const correctIndices: number[] = correctAnswers
                    .map((isCorrect: boolean, index: number) => isCorrect ? index : -1)
                    .filter((index: number) => index !== -1);

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

            // Unknown question type or missing data
            logger.warn({ questionUid, questionType: question.questionType }, 'Unknown question type or missing validation data');
            return false;
        } catch (error) {
            logger.error({ questionUid, selectedAnswers, error }, 'Failed to validate answer');
            return false;
        }
    }

    /**
     * Private helper: Shuffle array (Fisher-Yates algorithm)
     */
    private shuffleArray<T>(array: T[]): T[] {
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
    async getNextQuestion(sessionId: string): Promise<PracticeQuestionData | null> {
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
    public async getCorrectAnswers(questionUid: string): Promise<number[]> {
        try {
            const question = await prisma.question.findUnique({
                where: { uid: questionUid },
                include: {
                    multipleChoiceQuestion: true,
                    numericQuestion: true,
                }
            });

            if (!question || !question.multipleChoiceQuestion?.correctAnswers) {
                throw new Error(`Question ${questionUid} not found or has no correct answers`);
            }

            // Convert boolean array to indices array
            // correctAnswers is a boolean array where true indicates the correct answer
            const correctIndices: number[] = [];
            question.multipleChoiceQuestion.correctAnswers.forEach((isCorrect: boolean, index: number) => {
                if (isCorrect) {
                    correctIndices.push(index);
                }
            });

            return correctIndices;
        } catch (error) {
            logger.error({ questionUid, error }, 'Failed to get correct answers');
            return [];
        }
    }

    /**
     * Get numeric question correct answer data
     */
    private async getNumericCorrectAnswer(questionUid: string): Promise<{
        correctAnswer: number;
        tolerance?: number;
    } | null> {
        try {
            const question = await prisma.question.findUnique({
                where: { uid: questionUid },
                include: {
                    numericQuestion: true,
                }
            });

            if (!question || !question.numericQuestion) {
                return null;
            }

            return {
                correctAnswer: question.numericQuestion.correctAnswer,
                tolerance: question.numericQuestion.tolerance || undefined
            };
        } catch (error) {
            logger.error({ questionUid, error }, 'Failed to get numeric correct answer');
            return null;
        }
    }

    /**
     * Get question details including correct answers and explanation
     * @param questionUid Question UID
     * @returns Question details with boolean[] correct answers and explanation
     */
    public async getQuestionDetails(questionUid: string): Promise<{
        correctAnswers: boolean[];
        explanation?: string;
    } | null> {
        try {
            const question = await prisma.question.findUnique({
                where: { uid: questionUid },
                include: {
                    multipleChoiceQuestion: true,
                    numericQuestion: true,
                }
            });

            if (!question) {
                return null;
            }

            return {
                correctAnswers: question.multipleChoiceQuestion?.correctAnswers || [],
                explanation: question.explanation || undefined
            };
        } catch (error) {
            logger.error({ questionUid, error }, 'Failed to get question details');
            return null;
        }
    }

    /**
     * Private helper: Get questions from GameTemplate
     */
    private async getGameTemplateQuestions(gameTemplateId: string): Promise<string[]> {
        try {
            const gameTemplate = await prisma.gameTemplate.findUnique({
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
        } catch (error) {
            logger.error({ gameTemplateId, error }, 'Failed to get GameTemplate questions');
            throw error;
        }
    }
}

// Export singleton instance
export const practiceSessionService = new PracticeSessionService();
