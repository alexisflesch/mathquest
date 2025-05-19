"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameState = initializeGameState;
exports.setCurrentQuestion = setCurrentQuestion;
exports.getFullGameState = getFullGameState;
exports.endCurrentQuestion = endCurrentQuestion;
exports.calculateScores = calculateScores;
exports.updateGameState = updateGameState;
const redis_1 = require("@/config/redis");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
;
// Create a service-specific logger
const logger = (0, logger_1.default)('GameStateService');
// Redis key prefixes
const GAME_KEY_PREFIX = 'mathquest:game:';
const GAME_PARTICIPANTS_PREFIX = 'mathquest:game:participants:';
const GAME_ANSWERS_PREFIX = 'mathquest:game:answers:';
const GAME_LEADERBOARD_PREFIX = 'mathquest:game:leaderboard:';
/**
 * Initialize game state in Redis when a game is activated
 * This should be called when a teacher starts a game
 *
 * @param gameInstanceId ID of the game instance in the database
 * @returns The initialized game state object
 */
async function initializeGameState(gameInstanceId) {
    try {
        // Fetch the game instance with quiz template and questions
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            include: {
                gameTemplate: {
                    include: {
                        questions: {
                            include: {
                                question: true
                            },
                            orderBy: {
                                sequence: 'asc'
                            }
                        }
                    }
                }
            }
        });
        if (!gameInstance) {
            logger.error({ gameInstanceId }, 'Game instance not found');
            return null;
        }
        // Extract question UIDs in order
        const questionIds = gameInstance.gameTemplate?.questions?.map(q => q.question.uid) || [];
        if (questionIds.length === 0) {
            logger.warn({ gameInstanceId }, 'No questions found in quiz template');
            return null;
        }
        // Create initial game state
        const gameState = {
            gameId: gameInstanceId,
            accessCode: gameInstance.accessCode,
            status: 'pending', // Will be set to 'active' when the first question is served
            currentQuestionIndex: -1, // No question active initially
            questionIds,
            startedAt: Date.now(),
            timer: {
                startedAt: 0,
                duration: 0,
                isPaused: true
            },
            settings: {
                timeMultiplier: typeof gameInstance.settings === 'object' && gameInstance.settings !== null
                    ? gameInstance.settings.timeMultiplier || 1.0
                    : 1.0,
                showLeaderboard: typeof gameInstance.settings === 'object' && gameInstance.settings !== null
                    ? gameInstance.settings.showLeaderboard || true
                    : true
            }
        };
        // Store in Redis with expiration (24 hours)
        await redis_1.redisClient.set(`${GAME_KEY_PREFIX}${gameInstance.accessCode}`, JSON.stringify(gameState), 'EX', 86400 // 24 hours in seconds
        );
        // Initialize empty participants set
        await redis_1.redisClient.del(`${GAME_PARTICIPANTS_PREFIX}${gameInstance.accessCode}`);
        // Log successful initialization
        logger.info({ gameInstanceId, accessCode: gameInstance.accessCode }, 'Game state initialized in Redis');
        return gameState;
    }
    catch (error) {
        logger.error({ gameInstanceId, error }, 'Error initializing game state');
        return null;
    }
}
/**
 * Set the current question for a game
 *
 * @param accessCode The game access code
 * @param questionIndex Index of the question to set
 * @returns The updated game state or null if error
 */
async function setCurrentQuestion(accessCode, questionIndex) {
    try {
        // Get current game state
        const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
        if (!gameStateRaw) {
            logger.warn({ accessCode }, 'Game state not found in Redis');
            return null;
        }
        const gameState = JSON.parse(gameStateRaw);
        // Validate question index
        if (questionIndex < 0 || questionIndex >= gameState.questionIds.length) {
            logger.warn({ accessCode, questionIndex, totalQuestions: gameState.questionIds.length }, 'Invalid question index');
            return null;
        }
        // Get question details from the database
        const questionId = gameState.questionIds[questionIndex];
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: questionId }
        });
        if (!question) {
            logger.warn({ accessCode, questionId }, 'Question not found');
            return null;
        }
        // Modify game state
        gameState.status = 'active';
        gameState.currentQuestionIndex = questionIndex;
        // Create a sanitized question data object for the client
        // Remove correct answers to prevent cheating
        // Parse responses from JSON if needed
        let responses = [];
        if (typeof question.responses === 'string') {
            try {
                responses = JSON.parse(question.responses);
            }
            catch (e) {
                logger.error({ questionId, error: e }, 'Failed to parse question responses');
                responses = [];
            }
        }
        else {
            responses = question.responses || [];
        }
        const questionData = {
            id: question.uid,
            content: question.text,
            type: question.questionType,
            options: Array.isArray(responses)
                ? responses.map((opt) => ({
                    id: opt.id,
                    content: opt.content
                    // Note: we omit isCorrect field here
                }))
                : [],
            timeLimit: (question.timeLimit || 30) * (gameState.settings.timeMultiplier || 1)
        };
        gameState.questionData = questionData;
        // Reset and start the timer
        gameState.timer = {
            startedAt: Date.now(),
            duration: (question.timeLimit || 30) * 1000 * (gameState.settings.timeMultiplier || 1), // Default to 30s if timeLimit is null
            isPaused: false
        };
        // Initialize answer collection for this question
        await redis_1.redisClient.del(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionId}`);
        // Update game state in Redis
        await redis_1.redisClient.set(`${GAME_KEY_PREFIX}${accessCode}`, JSON.stringify(gameState), 'EX', 86400 // 24 hours
        );
        logger.info({ accessCode, questionIndex }, 'Current question set successfully');
        return gameState;
    }
    catch (error) {
        logger.error({ accessCode, questionIndex, error }, 'Error setting current question');
        return null;
    }
}
/**
 * Get the full game state including participants, answers, and leaderboard
 *
 * @param accessCode The game access code
 * @returns The complete game state or null if error
 */
async function getFullGameState(accessCode) {
    try {
        // Get basic game state
        const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
        if (!gameStateRaw) {
            logger.warn({ accessCode }, 'Game state not found in Redis');
            return null;
        }
        const gameState = JSON.parse(gameStateRaw);
        // Get participants
        const participantsHash = await redis_1.redisClient.hgetall(`${GAME_PARTICIPANTS_PREFIX}${accessCode}`);
        const participants = participantsHash
            ? Object.values(participantsHash).map(p => JSON.parse(p))
            : [];
        // Get answers for the current question
        const answers = {};
        if (gameState.currentQuestionIndex >= 0) {
            const currentQuestionId = gameState.questionIds[gameState.currentQuestionIndex];
            const answersHash = await redis_1.redisClient.hgetall(`${GAME_ANSWERS_PREFIX}${accessCode}:${currentQuestionId}`);
            if (answersHash) {
                const answerArray = Object.values(answersHash).map(a => JSON.parse(a));
                answers[currentQuestionId] = answerArray;
            }
            else {
                answers[currentQuestionId] = [];
            }
        }
        // Get leaderboard
        const leaderboardRaw = await redis_1.redisClient.zrevrange(`${GAME_LEADERBOARD_PREFIX}${accessCode}`, 0, -1, 'WITHSCORES');
        const leaderboard = [];
        for (let i = 0; i < leaderboardRaw.length; i += 2) {
            const playerId = leaderboardRaw[i];
            const score = parseInt(leaderboardRaw[i + 1], 10);
            // Find player info from participants
            const player = participants.find(p => p.playerId === playerId);
            if (player) {
                leaderboard.push({
                    playerId,
                    username: player.username,
                    avatarUrl: player.avatarUrl,
                    score
                });
            }
        }
        return {
            gameState,
            participants,
            answers,
            leaderboard
        };
    }
    catch (error) {
        logger.error({ accessCode, error }, 'Error getting full game state');
        return null;
    }
}
/**
 * End a question's timer and process all answers
 *
 * @param accessCode The game access code
 * @returns The updated game state or null if error
 */
async function endCurrentQuestion(accessCode) {
    try {
        // Get current game state
        const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
        if (!gameStateRaw) {
            logger.warn({ accessCode }, 'Game state not found in Redis');
            return null;
        }
        const gameState = JSON.parse(gameStateRaw);
        // Pause the timer
        gameState.timer.isPaused = true;
        gameState.timer.pausedAt = Date.now();
        gameState.timer.timeRemaining = Math.max(0, gameState.timer.duration - (gameState.timer.pausedAt - gameState.timer.startedAt));
        // Update game state in Redis
        await redis_1.redisClient.set(`${GAME_KEY_PREFIX}${accessCode}`, JSON.stringify(gameState), 'EX', 86400 // 24 hours
        );
        logger.info({ accessCode, questionIndex: gameState.currentQuestionIndex }, 'Question timer ended');
        return gameState;
    }
    catch (error) {
        logger.error({ accessCode, error }, 'Error ending current question');
        return null;
    }
}
/**
 * Calculate and update scores for all players for a question
 *
 * @param accessCode The game access code
 * @param questionId The ID of the question
 * @returns True if successful, false if error
 */
async function calculateScores(accessCode, questionId) {
    try {
        // Get the question from the database to check correct answers
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: questionId }
        });
        if (!question) {
            logger.warn({ accessCode, questionId }, 'Question not found');
            return false;
        }
        // Get all answers for this question
        const answersHash = await redis_1.redisClient.hgetall(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionId}`);
        if (!answersHash) {
            logger.warn({ accessCode, questionId }, 'No answers found for this question');
            return true; // Not an error, just no answers
        }
        // Get all participants
        const participantsHash = await redis_1.redisClient.hgetall(`${GAME_PARTICIPANTS_PREFIX}${accessCode}`);
        if (!participantsHash) {
            logger.warn({ accessCode }, 'No participants found for this game');
            return false;
        }
        // Determine correct answers based on question type
        let correctAnswers = [];
        try {
            // Parse question responses
            let responses = [];
            if (typeof question.responses === 'string') {
                responses = JSON.parse(question.responses);
            }
            else {
                responses = question.responses;
            }
            if (question.questionType === 'multiple_choice_single_answer' ||
                question.questionType === 'multiple_choice_multiple_answers') {
                correctAnswers = responses
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.id);
            }
            else if (question.questionType === 'number') {
                // For number questions, find the correct answer value
                const correctResponse = responses.find(r => r.isCorrect);
                correctAnswers = correctResponse ? [correctResponse.value] : [];
            }
            else {
                // For other question types, extract correct answer from responses
                // This is a fallback for any other question types
                correctAnswers = responses
                    .filter(r => r.isCorrect)
                    .map(r => r.value || r.id);
                // If no correct answers found in the responses, use an empty array
                if (correctAnswers.length === 0) {
                    logger.warn({ accessCode, questionId, questionType: question.questionType }, 'No correct answers found in responses');
                }
            }
        }
        catch (error) {
            logger.error({ accessCode, questionId, error }, 'Error parsing correct answers');
            return false;
        }
        // Calculate and update scores for each answer
        for (const [socketId, answerJson] of Object.entries(answersHash)) {
            try {
                const answerData = JSON.parse(answerJson);
                const participant = JSON.parse(participantsHash[socketId] || 'null');
                if (!participant) {
                    logger.warn({ accessCode, socketId }, 'Participant not found for answer');
                    continue;
                }
                // Check if answer is correct based on question type
                let isCorrect = false;
                let scoreForAnswer = 0;
                if (question.questionType === 'multiple_choice_single_answer' || question.questionType === 'multiple_choice_multiple_answers') {
                    isCorrect = correctAnswers.includes(answerData.answer);
                }
                else if (question.questionType === 'number') {
                    isCorrect = parseFloat(answerData.answer) === parseFloat(correctAnswers[0]);
                }
                else {
                    // For other question types (e.g., text)
                    isCorrect = correctAnswers.includes(answerData.answer);
                }
                // Calculate score based on time spent and correctness
                if (isCorrect) {
                    // Base points for correct answer
                    const maxPoints = 1000;
                    // Time factor: earlier answers get more points
                    const timeSpent = answerData.timeSpent ||
                        (answerData.timestamp - (participant.lastAnswerAt || participant.joinedAt));
                    const timeFactor = Math.max(0, 1 - (timeSpent / ((question.timeLimit || 30) * 1000)));
                    // Calculate final score
                    scoreForAnswer = Math.round(maxPoints * timeFactor);
                }
                // Update participant score
                participant.score = (participant.score || 0) + scoreForAnswer;
                await redis_1.redisClient.hset(`${GAME_PARTICIPANTS_PREFIX}${accessCode}`, socketId, JSON.stringify(participant));
                // Update the sorted set leaderboard
                await redis_1.redisClient.zadd(`${GAME_LEADERBOARD_PREFIX}${accessCode}`, participant.score, participant.playerId);
                // Update answer with correctness and score
                answerData.isCorrect = isCorrect;
                answerData.score = scoreForAnswer;
                await redis_1.redisClient.hset(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionId}`, socketId, JSON.stringify(answerData));
                logger.debug({
                    accessCode,
                    questionId,
                    playerId: participant.playerId,
                    isCorrect,
                    score: scoreForAnswer
                }, 'Score calculated for player answer');
            }
            catch (error) {
                logger.error({ accessCode, questionId, socketId, error }, 'Error processing answer for scoring');
            }
        }
        logger.info({ accessCode, questionId }, 'Scores calculated and updated successfully');
        return true;
    }
    catch (error) {
        logger.error({ accessCode, questionId, error }, 'Error calculating scores');
        return false;
    }
}
/**
 * Updates the game state in Redis
 *
 * @param accessCode Access code of the game
 * @param gameState Updated game state object
 * @returns The updated game state object
 */
async function updateGameState(accessCode, gameState) {
    try {
        // Store in Redis with expiration (24 hours)
        await redis_1.redisClient.set(`${GAME_KEY_PREFIX}${accessCode}`, JSON.stringify(gameState), 'EX', 86400 // 24 hours in seconds
        );
        logger.info({ accessCode }, 'Game state updated');
        return gameState;
    }
    catch (error) {
        logger.error({ accessCode, error }, 'Failed to update game state');
        throw new Error(`Failed to update game state: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.default = {
    initializeGameState,
    setCurrentQuestion,
    getFullGameState,
    endCurrentQuestion,
    calculateScores,
    updateGameState
};
