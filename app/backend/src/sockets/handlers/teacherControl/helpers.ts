import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import gameStateService, { getCanonicalTimer } from '@/core/services/gameStateService';
import { GameControlStatePayload, QuestionForDashboard } from './types';
import { questionService } from '@/core/services/questionServiceInstance';
import type { GameTimerState } from '@shared/types/core/timer';
import { gameControlStatePayloadSchema } from '@shared/types/socketEvents.zod.dashboard';

// Create a handler-specific logger
const logger = createLogger('TeacherControlHelpers');

// Redis key prefixes
export const DASHBOARD_PREFIX = 'mathquest:dashboard:';
export const ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';

// Legacy timer mapping removed. All timer state must use canonical contract only.
// If a mapping is needed, use the canonical helper from timerHelpers.

/**
 * Returns canonical dashboard game control state, or error details if Zod validation fails
 */
export async function getGameControlState(
    gameId: string,
    userId: string,
    isTestEnvironment: boolean
): Promise<{ controlState: GameControlStatePayload | null, errorDetails?: any }> {
    if (!gameId) {
        logger.warn({ userId }, 'Game ID is undefined');
        return { controlState: null, errorDetails: 'Game ID is undefined' };
    }
    try {
        logger.info({ gameId, userId, isTestEnvironment }, 'Fetching game control state');

        // Fetch the game instance
        const gameInstance = await prisma.gameInstance.findFirst({
            where: {
                id: gameId,
                ...(isTestEnvironment ? {} : {
                    OR: [
                        { initiatorUserId: userId },
                        { gameTemplate: { creatorId: userId } }
                    ]
                })
            },
            include: {
                gameTemplate: true
            }
        });

        if (!gameInstance) {
            logger.warn({ gameId, userId }, 'Game instance not found or not authorized');
            return { controlState: null, errorDetails: 'Game instance not found or not authorized' };
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
            return { controlState: null, errorDetails: 'Quiz template not found' };
        }

        logger.info({ gameId, templateId: gameTemplate.id, questionCount: gameTemplate.questions.length }, 'Found game template');

        // Get the game state from Redis
        const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
        if (!fullState || !fullState.gameState) {
            logger.warn({ gameId, accessCode: gameInstance.accessCode }, 'Game state not found in Redis');
            return { controlState: null, errorDetails: 'Game state not found in Redis' };
        }

        const gameState = fullState.gameState;

        // Transform questions for the dashboard using canonical normalization
        const questions = gameTemplate.questions.map((q: any) => {
            const question = q.question;
            // Use canonical normalization for all questions
            const normalized = questionService["normalizeQuestion"](question);
            logger.info({
                uid: question.uid,
                input: question,
                normalized
            }, '[DASHBOARD_NORMALIZE] Dashboard question normalization');
            return normalized;
        });

        // Get participant count
        const participantCount = await redisClient.hlen(`mathquest:game:participants:${gameInstance.accessCode}`);

        // Determine current question UID
        const currentQuestionUid = gameState.currentQuestionIndex >= 0 &&
            gameState.questionUids &&
            gameState.questionUids[gameState.currentQuestionIndex]
            ? gameState.questionUids[gameState.currentQuestionIndex]
            : null;

        // Get answer stats for current question if available
        let answerStats: Record<string, number> | undefined = undefined;
        if (currentQuestionUid) {
            answerStats = await getAnswerStats(gameInstance.accessCode, currentQuestionUid);
        }

        // --- MODERNIZATION: Use canonical timer system for controlState.timer ---
        // If no current question is selected, use the first question in the list for timer/uid
        let canonicalTimer = undefined;
        let effectiveQuestionUid = currentQuestionUid;
        if (!effectiveQuestionUid && questions.length > 0) {
            effectiveQuestionUid = questions[0].uid;
        }
        if (effectiveQuestionUid) {
            // Always use canonical timerEndDateMs from the timer object (no fallback allowed)
            const q = questions.find((q: any) => q.uid === effectiveQuestionUid);
            const rawTimer = await getCanonicalTimer(
                gameInstance.accessCode,
                effectiveQuestionUid,
                gameState.gameMode,
                gameState.status === 'completed',
                q && typeof q.durationMs === 'number' ? q.durationMs : 0,
                undefined,
                undefined
            );
            // Canonical mapping: enforce all required fields and status
            let status: 'run' | 'pause' | 'stop' = 'stop';
            if (rawTimer && typeof rawTimer.status === 'string') {
                if (rawTimer.status === 'play') status = 'run';
                else if (rawTimer.status === 'run' || rawTimer.status === 'pause' || rawTimer.status === 'stop') status = rawTimer.status;
            }
            // timerEndDateMs is always required and must be a number (never null)
            const timerEndDateMs = typeof rawTimer?.timerEndDateMs === 'number' ? rawTimer.timerEndDateMs : Date.now();
            canonicalTimer = {
                status,
                timerEndDateMs,
                questionUid: typeof rawTimer?.questionUid === 'string' ? rawTimer.questionUid : (effectiveQuestionUid ?? null)
            } as GameTimerState;
        } else {
            // No timer: provide canonical default
            canonicalTimer = {
                status: 'stop',
                timerEndDateMs: Date.now(),
                questionUid: effectiveQuestionUid ?? null
            } as GameTimerState;
        }

        const controlState = {
            gameId: gameInstance.id,
            accessCode: gameInstance.accessCode,
            templateName: gameTemplate.name,
            status: gameState.status,
            currentQuestionUid,
            questions,
            timer: canonicalTimer, // Always a valid object
            answersLocked: gameState.answersLocked,
            participantCount,
            answerStats
        };

        // Log the constructed controlState for debugging
        logger.info({ controlState }, 'Constructed controlState before Zod validation');
        // Validate with Zod (throws if invalid)
        try {
            gameControlStatePayloadSchema.parse(controlState);
            return { controlState };
        } catch (zodError) {
            logger.error({ gameId, userId, zodError }, 'Zod validation failed for game control state');
            return { controlState: null, errorDetails: zodError instanceof Error ? zodError.message : zodError };
        }
    } catch (error) {
        logger.error({ gameId, userId, error }, 'Error preparing game control state');
        return { controlState: null, errorDetails: error instanceof Error ? error.message : error };
    }
}

/**
 * Helper function to get statistics of answers for a specific question
 * Properly handles both single choice and multiple choice questions
 */
export async function getAnswerStats(accessCode: string, questionUid: string): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    try {
        // Get all answers for this question from Redis
        const answersHash = await redisClient.hgetall(`${ANSWERS_KEY_PREFIX}${accessCode}:${questionUid}`);

        if (!answersHash) {
            return stats;
        }

        // Get the question to understand its type and structure
        const question = await prisma.question.findUnique({ where: { uid: questionUid } });
        if (!question) {
            logger.error({ questionUid }, 'Question not found for stats calculation');
            return stats;
        }

        const isMultipleChoice = question.questionType === 'multiple_choice_multiple_answers' ||
            question.questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS';

        // Track which users selected which options (for percentage calculation)
        const userSelections = new Map<string, Set<string>>(); // userId -> Set of selected options

        // Process each answer to build the statistics
        Object.values(answersHash).forEach(answerJson => {
            try {
                const answerData = JSON.parse(answerJson as string);
                const userId = answerData.userId;

                if (!userId) return;

                // Initialize user's selections if not exists
                if (!userSelections.has(userId)) {
                    userSelections.set(userId, new Set());
                }

                const userOptionSet = userSelections.get(userId)!;

                // Handle different answer structures
                let selectedOptions = answerData.answer?.selectedOption || answerData.answer;

                logger.debug({
                    accessCode,
                    questionUid,
                    userId,
                    rawAnswer: answerData.answer,
                    selectedOptions,
                    selectedOptionsType: typeof selectedOptions,
                    isArray: Array.isArray(selectedOptions),
                    isMultipleChoice
                }, 'Processing answer for stats - DETAILED');

                // Always handle as an array for consistency
                let optionsArray: any[];
                if (Array.isArray(selectedOptions)) {
                    optionsArray = selectedOptions;
                } else if (selectedOptions !== undefined && selectedOptions !== null) {
                    optionsArray = [selectedOptions];
                } else {
                    optionsArray = [];
                }

                // Add each option to the user's set
                optionsArray.forEach(option => {
                    if (option !== undefined && option !== null) {
                        userOptionSet.add(option.toString());
                    }
                });

                logger.debug({
                    accessCode,
                    questionUid,
                    userId,
                    optionsArray,
                    userSelections: Array.from(userOptionSet)
                }, 'User selections after processing');

            } catch (e) {
                logger.error({ error: e }, 'Error parsing answer data');
            }
        });

        // Now count how many users selected each option
        const optionCounts: Record<string, number> = {};
        userSelections.forEach((optionSet, userId) => {
            optionSet.forEach(option => {
                optionCounts[option] = (optionCounts[option] || 0) + 1;
            });
        });

        logger.debug({
            accessCode,
            questionUid,
            optionCounts,
            totalUsers: userSelections.size
        }, 'Option counts before percentage conversion');

        // Convert user counts to percentages
        const totalUsers = userSelections.size;
        if (totalUsers > 0) {
            Object.keys(optionCounts).forEach(optionKey => {
                const userCount = optionCounts[optionKey];
                stats[optionKey] = Math.round((userCount / totalUsers) * 100);
            });
        }

        logger.debug({
            accessCode,
            questionUid,
            isMultipleChoice,
            totalUsers: userSelections.size,
            finalStats: stats
        }, 'Answer stats calculated');

        return stats;
    } catch (error) {
        logger.error({ accessCode, questionUid, error }, 'Error getting answer stats');
        return stats;
    }
}
