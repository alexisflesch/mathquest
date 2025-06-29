"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANSWERS_KEY_PREFIX = exports.DASHBOARD_PREFIX = void 0;
exports.getGameControlState = getGameControlState;
exports.getAnswerStats = getAnswerStats;
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = __importStar(require("@/core/services/gameStateService"));
const questionServiceInstance_1 = require("@/core/services/questionServiceInstance");
const socketEvents_zod_dashboard_1 = require("@shared/types/socketEvents.zod.dashboard");
// Create a handler-specific logger
const logger = (0, logger_1.default)('TeacherControlHelpers');
// Redis key prefixes
exports.DASHBOARD_PREFIX = 'mathquest:dashboard:';
exports.ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';
// Legacy timer mapping removed. All timer state must use canonical contract only.
// If a mapping is needed, use the canonical helper from timerHelpers.
/**
 * Returns canonical dashboard game control state, or error details if Zod validation fails
 */
async function getGameControlState(gameId, userId, isTestEnvironment) {
    if (!gameId) {
        logger.warn({ userId }, 'Game ID is undefined');
        return { controlState: null, errorDetails: 'Game ID is undefined' };
    }
    try {
        logger.info({ gameId, userId, isTestEnvironment }, 'Fetching game control state');
        // Fetch the game instance
        const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
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
        const gameTemplate = await prisma_1.prisma.gameTemplate.findUnique({
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
        const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
        if (!fullState || !fullState.gameState) {
            logger.warn({ gameId, accessCode: gameInstance.accessCode }, 'Game state not found in Redis');
            return { controlState: null, errorDetails: 'Game state not found in Redis' };
        }
        const gameState = fullState.gameState;
        // Transform questions for the dashboard using canonical normalization
        const questions = gameTemplate.questions.map((q) => {
            const question = q.question;
            // Use canonical normalization for all questions
            const normalized = questionServiceInstance_1.questionService["normalizeQuestion"](question);
            logger.info({
                uid: question.uid,
                input: question,
                normalized
            }, '[DASHBOARD_NORMALIZE] Dashboard question normalization');
            return normalized;
        });
        // Get participant count
        const participantCount = await redis_1.redisClient.hlen(`mathquest:game:participants:${gameInstance.accessCode}`);
        // Determine current question UID
        const currentQuestionUid = gameState.currentQuestionIndex >= 0 &&
            gameState.questionUids &&
            gameState.questionUids[gameState.currentQuestionIndex]
            ? gameState.questionUids[gameState.currentQuestionIndex]
            : null;
        // Get answer stats for current question if available
        let answerStats = undefined;
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
            const q = questions.find((q) => q.uid === effectiveQuestionUid);
            const rawTimer = await (0, gameStateService_1.getCanonicalTimer)(gameInstance.accessCode, effectiveQuestionUid, gameState.gameMode, gameState.status === 'completed', q && typeof q.durationMs === 'number' ? q.durationMs : 0, undefined, undefined);
            // Canonical mapping: enforce all required fields and status
            let status = 'stop';
            if (rawTimer && typeof rawTimer.status === 'string') {
                if (rawTimer.status === 'play')
                    status = 'run';
                else if (rawTimer.status === 'run' || rawTimer.status === 'pause' || rawTimer.status === 'stop')
                    status = rawTimer.status;
            }
            // timerEndDateMs is always required and must be a number (never null)
            const timerEndDateMs = typeof rawTimer?.timerEndDateMs === 'number' ? rawTimer.timerEndDateMs : Date.now();
            canonicalTimer = {
                status,
                timerEndDateMs,
                questionUid: typeof rawTimer?.questionUid === 'string' ? rawTimer.questionUid : (effectiveQuestionUid ?? null)
            };
        }
        else {
            // No timer: provide canonical default
            canonicalTimer = {
                status: 'stop',
                timerEndDateMs: Date.now(),
                questionUid: effectiveQuestionUid ?? null
            };
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
            socketEvents_zod_dashboard_1.gameControlStatePayloadSchema.parse(controlState);
            return { controlState };
        }
        catch (zodError) {
            logger.error({ gameId, userId, zodError }, 'Zod validation failed for game control state');
            return { controlState: null, errorDetails: zodError instanceof Error ? zodError.message : zodError };
        }
    }
    catch (error) {
        logger.error({ gameId, userId, error }, 'Error preparing game control state');
        return { controlState: null, errorDetails: error instanceof Error ? error.message : error };
    }
}
/**
 * Helper function to get statistics of answers for a specific question
 * Properly handles both single choice and multiple choice questions
 */
async function getAnswerStats(accessCode, questionUid) {
    const stats = {};
    try {
        // Get all answers for this question from Redis
        const answersHash = await redis_1.redisClient.hgetall(`${exports.ANSWERS_KEY_PREFIX}${accessCode}:${questionUid}`);
        if (!answersHash) {
            return stats;
        }
        // Get the question to understand its type and structure
        const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionUid } });
        if (!question) {
            logger.error({ questionUid }, 'Question not found for stats calculation');
            return stats;
        }
        const isMultipleChoice = question.questionType === 'multiple_choice_multiple_answers' ||
            question.questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS';
        // Track which users selected which options (for percentage calculation)
        const userSelections = new Map(); // userId -> Set of selected options
        // Process each answer to build the statistics
        Object.values(answersHash).forEach(answerJson => {
            try {
                const answerData = JSON.parse(answerJson);
                const userId = answerData.userId;
                if (!userId)
                    return;
                // Initialize user's selections if not exists
                if (!userSelections.has(userId)) {
                    userSelections.set(userId, new Set());
                }
                const userOptionSet = userSelections.get(userId);
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
                let optionsArray;
                if (Array.isArray(selectedOptions)) {
                    optionsArray = selectedOptions;
                }
                else if (selectedOptions !== undefined && selectedOptions !== null) {
                    optionsArray = [selectedOptions];
                }
                else {
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
            }
            catch (e) {
                logger.error({ error: e }, 'Error parsing answer data');
            }
        });
        // Now count how many users selected each option
        const optionCounts = {};
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
    }
    catch (error) {
        logger.error({ accessCode, questionUid, error }, 'Error getting answer stats');
        return stats;
    }
}
