/**
 * Practice Service
 *
 * Service for managing practice sessions with a simplified interface.
 * Wraps the PracticeSessionService to provide the expected API for tests.
 */

import { PracticeSessionService } from './practiceSessionService';
import { PracticeSettings } from '@shared/types/practice/session';
import createLogger from '@/utils/logger';

const logger = createLogger('PracticeService');

/**
 * Practice service class for managing practice sessions
 */
export class PracticeService {
    private practiceSessionService: PracticeSessionService;

    constructor() {
        this.practiceSessionService = new PracticeSessionService();
    }

    /**
     * Start a new practice session
     * @param userId The user ID
     * @param settings The practice settings
     * @returns The created practice session
     */
    async startPracticeSession(userId: string, settings: PracticeSettings): Promise<any> {
        try {
            const session = await this.practiceSessionService.createSession(userId, settings);
            logger.info({ sessionId: session.sessionId, userId }, 'Practice session started');
            return session;
        } catch (error) {
            logger.error({ userId, settings, error }, 'Failed to start practice session');
            throw error;
        }
    }

    /**
     * End a practice session
     * @param sessionId The session ID
     * @returns The ended practice session
     */
    async endPracticeSession(sessionId: string): Promise<any> {
        try {
            const session = await this.practiceSessionService.endSession(sessionId);
            logger.info({ sessionId }, 'Practice session ended');
            return session;
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to end practice session');
            throw error;
        }
    }

    /**
     * Get the next question for a practice session
     * @param sessionId The session ID
     * @returns The next question data or null if no more questions
     */
    async getNextQuestion(sessionId: string): Promise<any> {
        try {
            const question = await this.practiceSessionService.getNextQuestion(sessionId);
            logger.debug({ sessionId, hasQuestion: !!question }, 'Retrieved next question');
            return question;
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to get next question');
            throw error;
        }
    }

    /**
     * Submit an answer for a practice session
     * @param sessionId The session ID
     * @param answerData The answer data
     * @returns The result of submitting the answer
     */
    async submitAnswer(sessionId: string, answerData: any): Promise<any> {
        try {
            const result = await this.practiceSessionService.submitAnswer(sessionId, answerData);
            logger.debug({ sessionId, isCorrect: result.isCorrect }, 'Answer submitted');
            return result;
        } catch (error) {
            logger.error({ sessionId, answerData, error }, 'Failed to submit answer');
            throw error;
        }
    }

    /**
     * Get practice progress for a session
     * @param sessionId The session ID
     * @returns The practice progress
     */
    async getPracticeProgress(sessionId: string): Promise<any> {
        try {
            const session = await this.practiceSessionService.getSession(sessionId);
            if (!session) {
                throw new Error('Practice session not found');
            }

            const progress = {
                currentQuestion: session.currentQuestionIndex + 1,
                totalQuestions: session.questionPool.length,
                correctAnswers: session.statistics.correctAnswers,
                incorrectAnswers: session.statistics.incorrectAnswers,
                accuracyPercentage: session.statistics.accuracyPercentage,
                completed: session.status === 'completed'
            };

            logger.debug({ sessionId, progress }, 'Retrieved practice progress');
            return progress;
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to get practice progress');
            throw error;
        }
    }

    /**
     * Clean up expired practice sessions
     */
    async cleanupExpiredSessions(): Promise<void> {
        try {
            // This would need to be implemented in PracticeSessionService
            // For now, we'll just log that cleanup was requested
            logger.info('Practice session cleanup requested');
            // In a real implementation, this would find and delete expired sessions
        } catch (error) {
            logger.error({ error }, 'Failed to cleanup expired sessions');
            throw error;
        }
    }
}

// Export a singleton instance
export const practiceService = new PracticeService();