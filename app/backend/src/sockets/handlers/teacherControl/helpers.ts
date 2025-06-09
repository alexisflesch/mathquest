import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/gameStateService';
import { GameControlStatePayload, QuestionForDashboard } from './types';
import type { GameTimerState } from '@shared/types/core/timer';

// Create a handler-specific logger
const logger = createLogger('TeacherControlHelpers');

// Redis key prefixes
export const DASHBOARD_PREFIX = 'mathquest:dashboard:';
export const ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';

/**
 * Maps backend timer structure to core GameTimerState
 */
function mapBackendTimerToCore(backendTimer: any): GameTimerState {
    if (!backendTimer) {
        return {
            status: 'stop',
            timeLeft: 0,
            duration: 30,
            questionId: undefined,
            timestamp: null,
            localTimeLeft: 0
        };
    }

    // Calculate current time left if timer is running
    let timeLeft = 0;
    let status: 'play' | 'pause' | 'stop' = 'stop';

    if (backendTimer.isPaused) {
        status = 'pause';
        timeLeft = backendTimer.timeRemaining ? Math.ceil(backendTimer.timeRemaining / 1000) : 0;
    } else if (backendTimer.startedAt && backendTimer.startedAt > 0) {
        status = 'play';
        const elapsed = Date.now() - backendTimer.startedAt;
        const remaining = Math.max(0, backendTimer.duration - elapsed);
        timeLeft = Math.ceil(remaining / 1000);
    } else {
        status = 'stop';
        timeLeft = backendTimer.duration ? Math.ceil(backendTimer.duration / 1000) : 30;
    }

    return {
        status,
        timeLeft,
        duration: backendTimer.duration ? Math.ceil(backendTimer.duration / 1000) : 30,
        questionId: undefined, // Backend timer doesn't store question ID
        timestamp: Date.now(),
        localTimeLeft: timeLeft
    };
}

/**
 * Helper function to fetch and prepare the comprehensive dashboard state
 */
export async function getGameControlState(gameId: string | undefined, userId: string, isTestEnvironment = false): Promise<GameControlStatePayload | null> {
    if (!gameId) {
        logger.warn({ userId }, 'Game ID is undefined');
        return null;
    }
    try {
        logger.info({ gameId, userId, isTestEnvironment }, 'Fetching game control state');

        // Fetch the game instance
        const gameInstance = await prisma.gameInstance.findUnique({
            where: {
                id: gameId,
                ...(isTestEnvironment ? {} : { initiatorUserId: userId }) // Skip teacher ID check in test environment
            }
        });

        if (!gameInstance) {
            logger.warn({ gameId, userId }, 'Game instance not found or not authorized');
            return null;
        }

        logger.info({ gameId, gameInstanceId: gameInstance.id, accessCode: gameInstance.accessCode }, 'Found game instance');

        // Fetch the quiz template with questions
        const gameTemplate = await prisma.gameTemplate.findUnique({
            where: { id: gameInstance.gameTemplateId },
            include: {
                questions: {
                    include: {
                        question: true // Include the full question details
                    },
                    orderBy: {
                        sequence: 'asc' // Ensure questions are in correct order
                    }
                }
            }
        });

        if (!gameTemplate) {
            logger.warn({ gameId, userId }, 'Quiz template not found');
            return null;
        }

        logger.info({ gameId, templateId: gameTemplate.id, questionCount: gameTemplate.questions.length }, 'Found game template');

        // Get the game state from Redis
        const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
        if (!fullState || !fullState.gameState) {
            logger.warn({ gameId, accessCode: gameInstance.accessCode }, 'Game state not found in Redis');
            return null;
        }

        const gameState = fullState.gameState;

        // Transform questions for the dashboard
        const questions: QuestionForDashboard[] = gameTemplate.questions.map((q: any) => {
            const question = q.question;

            return {
                uid: question.uid,
                title: question.title,
                text: question.text,
                questionType: question.questionType,
                timeLimit: question.timeLimit,
                difficulty: question.difficulty,
                discipline: question.discipline,
                themes: Array.isArray(question.themes) ? question.themes : [],
                answerOptions: question.answerOptions || [], // Already using answerOptions, remove comment about responses
                correctAnswers: question.correctAnswers || [] // Add `correctAnswers`
            };
        });

        // Get participant count
        const participantCount = await redisClient.hlen(`mathquest:game:participants:${gameInstance.accessCode}`);

        // Determine current question UID
        const currentQuestionUid = gameState.currentQuestionIndex >= 0 &&
            gameState.questionIds &&
            gameState.questionIds[gameState.currentQuestionIndex]
            ? gameState.questionIds[gameState.currentQuestionIndex]
            : null;

        // Get answer stats for current question if available
        let answerStats: Record<string, number> | undefined = undefined;
        if (currentQuestionUid) {
            answerStats = await getAnswerStats(gameInstance.accessCode, currentQuestionUid);
        }

        // Construct and return the full game control state
        return {
            gameId: gameInstance.id,
            accessCode: gameInstance.accessCode,
            status: gameState.status,
            currentQuestionUid,
            questions,
            timer: mapBackendTimerToCore(gameState.timer),
            answersLocked: gameState.answersLocked ?? false,
            participantCount,
            answerStats
        };
    } catch (error) {
        logger.error({ gameId, userId, error }, 'Error preparing game control state');
        return null;
    }
}

/**
 * Helper function to get statistics of answers for a specific question
 */
export async function getAnswerStats(accessCode: string, questionUid: string): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    try {
        // Get all answers for this question from Redis
        const answersHash = await redisClient.hgetall(`${ANSWERS_KEY_PREFIX}${accessCode}:${questionUid}`);

        if (!answersHash) {
            return stats;
        }

        // Process each answer to build the statistics
        Object.values(answersHash).forEach(answerJson => {
            try {
                const answer = JSON.parse(answerJson as string);
                const selectedOption = answer.answer?.selectedOption;

                if (selectedOption) {
                    stats[selectedOption] = (stats[selectedOption] || 0) + 1;
                }
            } catch (e) {
                logger.error({ error: e }, 'Error parsing answer data');
            }
        });

        return stats;
    } catch (error) {
        logger.error({ accessCode, questionUid, error }, 'Error getting answer stats');
        return stats;
    }
}
