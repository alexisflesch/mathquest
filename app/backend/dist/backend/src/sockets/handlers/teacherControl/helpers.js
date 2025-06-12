"use strict";
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
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('TeacherControlHelpers');
// Redis key prefixes
exports.DASHBOARD_PREFIX = 'mathquest:dashboard:';
exports.ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';
/**
 * Maps backend timer structure to core GameTimerState
 */
function mapBackendTimerToCore(backendTimer) {
    if (!backendTimer) {
        return {
            status: 'stop',
            timeLeftMs: 0,
            durationMs: 30000, // 30 seconds in milliseconds
            questionUid: undefined,
            timestamp: null,
            localTimeLeftMs: 0
        };
    }
    // Calculate current time left if timer is running
    // Keep all timer values in milliseconds internally
    let timeLeft = 0;
    let status = 'stop';
    if (backendTimer.isPaused) {
        status = 'pause';
        timeLeft = backendTimer.timeRemainingMs || 0; // Keep in milliseconds
    }
    else if (backendTimer.startedAt && backendTimer.startedAt > 0) {
        status = 'play';
        const elapsed = Date.now() - backendTimer.startedAt;
        const remaining = Math.max(0, backendTimer.durationMs - elapsed);
        timeLeft = remaining; // Keep in milliseconds
    }
    else {
        status = 'stop';
        timeLeft = backendTimer.durationMs || 30000; // Default 30 seconds = 30000ms
    }
    return {
        status,
        timeLeftMs: timeLeft,
        durationMs: backendTimer.durationMs || 30000, // Keep in milliseconds
        questionUid: undefined, // Backend timer doesn't store question ID
        timestamp: Date.now(),
        localTimeLeftMs: timeLeft
    };
}
/**
 * Helper function to fetch and prepare the comprehensive dashboard state
 */
async function getGameControlState(gameId, userId, isTestEnvironment = false) {
    if (!gameId) {
        logger.warn({ userId }, 'Game ID is undefined');
        return null;
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
            return null;
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
            return null;
        }
        logger.info({ gameId, templateId: gameTemplate.id, questionCount: gameTemplate.questions.length }, 'Found game template');
        // Get the game state from Redis
        const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
        if (!fullState || !fullState.gameState) {
            logger.warn({ gameId, accessCode: gameInstance.accessCode }, 'Game state not found in Redis');
            return null;
        }
        const gameState = fullState.gameState;
        // Transform questions for the dashboard
        const questions = gameTemplate.questions.map((q) => {
            const question = q.question;
            return {
                uid: question.uid,
                title: question.title,
                text: question.text,
                questionType: question.questionType,
                timeLimit: question.timeLimit ? question.timeLimit * 1000 : 30000, // Convert seconds to milliseconds (database storage → internal processing)
                difficulty: question.difficulty,
                discipline: question.discipline,
                themes: Array.isArray(question.themes) ? question.themes : [],
                answerOptions: question.answerOptions || [], // Already using answerOptions, remove comment about responses
                correctAnswers: question.correctAnswers || [] // Add `correctAnswers`
            };
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
    }
    catch (error) {
        logger.error({ gameId, userId, error }, 'Error preparing game control state');
        return null;
    }
}
/**
 * Helper function to get statistics of answers for a specific question
 */
async function getAnswerStats(accessCode, questionUid) {
    const stats = {};
    try {
        // Get all answers for this question from Redis
        const answersHash = await redis_1.redisClient.hgetall(`${exports.ANSWERS_KEY_PREFIX}${accessCode}:${questionUid}`);
        if (!answersHash) {
            return stats;
        }
        // Process each answer to build the statistics
        Object.values(answersHash).forEach(answerJson => {
            try {
                const answer = JSON.parse(answerJson);
                const selectedOption = answer.answer?.selectedOption;
                if (selectedOption) {
                    stats[selectedOption] = (stats[selectedOption] || 0) + 1;
                }
            }
            catch (e) {
                logger.error({ error: e }, 'Error parsing answer data');
            }
        });
        return stats;
    }
    catch (error) {
        logger.error({ accessCode, questionUid, error }, 'Error getting answer stats');
        return stats;
    }
}
