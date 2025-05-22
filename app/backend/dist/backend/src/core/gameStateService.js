"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattedLeaderboard = getFormattedLeaderboard;
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
 * Get formatted leaderboard data for a game
 *
 * @param accessCode The game access code
 * @returns The formatted leaderboard data
 */
async function getFormattedLeaderboard(accessCode) {
    try {
        const participantsHash = await redis_1.redisClient.hgetall(`${GAME_PARTICIPANTS_PREFIX}${accessCode}`);
        const participantsFromRedis = participantsHash
            ? Object.values(participantsHash).map(p => JSON.parse(p))
            : [];
        const leaderboardRaw = await redis_1.redisClient.zrevrange(`${GAME_LEADERBOARD_PREFIX}${accessCode}`, 0, -1, 'WITHSCORES');
        const leaderboardPromises = [];
        for (let i = 0; i < leaderboardRaw.length; i += 2) {
            const userId = leaderboardRaw[i];
            const score = parseInt(leaderboardRaw[i + 1], 10);
            let playerInfo = participantsFromRedis.find(p => p.userId === userId);
            if (playerInfo) {
                leaderboardPromises.push(Promise.resolve({
                    userId,
                    username: playerInfo.username,
                    avatarUrl: playerInfo.avatarUrl,
                    score
                }));
            }
            else {
                // Participant not in Redis hash (e.g., disconnected)
                // Try to fetch from User table in DB as a fallback for username/avatar
                logger.warn({ accessCode, userId }, "Participant info not found in Redis for leaderboard. Attempting DB lookup for user details.");
                const userPromise = prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true, avatarUrl: true }
                }).then(user => {
                    if (user) {
                        return {
                            userId,
                            username: user.username || 'Unknown Player',
                            avatarUrl: user.avatarUrl || undefined,
                            score
                        };
                    }
                    logger.warn({ accessCode, userId }, "User details not found in DB for leaderboard entry.");
                    return {
                        userId,
                        username: 'Unknown Player',
                        avatarUrl: undefined,
                        score
                    };
                });
                leaderboardPromises.push(userPromise);
            }
        }
        let leaderboard = await Promise.all(leaderboardPromises);
        // Sort by score descending, then by username ascending as a tie-breaker
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return (a.username || '').localeCompare(b.username || '');
        });
        // Add rank after sorting
        leaderboard = leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));
        logger.info({ accessCode, count: leaderboard.length }, "Formatted leaderboard from Redis/DB.");
        return leaderboard;
    }
    catch (error) {
        logger.error({ accessCode, error }, 'Error fetching formatted leaderboard');
        return []; // Return empty array on error
    }
}
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
        // Use the new schema fields but don't expose correct answers to players
        // Create options from answerOptions
        const options = question.answerOptions.map((content, index) => ({
            id: index.toString(), // Use index as ID
            content
        }));
        const questionData = {
            uid: question.uid,
            title: question.title || undefined,
            text: question.text,
            answerOptions: question.answerOptions,
            correctAnswers: new Array(question.answerOptions.length).fill(false), // Hide correct answers
            questionType: question.questionType,
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
            const userId = leaderboardRaw[i];
            const score = parseInt(leaderboardRaw[i + 1], 10);
            // Find player info from participants
            const player = participants.find(p => p.userId === userId);
            if (player) {
                leaderboard.push({
                    userId,
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
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: questionId }
        });
        if (!question) {
            logger.warn({ accessCode, questionId }, 'Question not found for scoring');
            return false;
        }
        const participantsKey = `${GAME_PARTICIPANTS_PREFIX}${accessCode}`;
        const leaderboardKey = `${GAME_LEADERBOARD_PREFIX}${accessCode}`; // Definition of leaderboardKey
        const participantsHash = await redis_1.redisClient.hgetall(participantsKey);
        if (!participantsHash || Object.keys(participantsHash).length === 0) {
            logger.warn({ accessCode }, 'No participants found for this game. Cannot calculate scores.');
            return true; // No participants, so no scores to calculate, not an error.
        }
        let correctAnswerValues = [];
        // Correctly determine correctAnswerValues based on question.questionType and question.correctAnswers
        // This logic needs to be robust for different question types.
        if (question.questionType === 'multiple_choice_single_answer' || question.questionType === 'single_correct') {
            const correctIndex = question.correctAnswers.findIndex(ca => ca === true);
            if (correctIndex !== -1 && question.answerOptions[correctIndex] !== undefined) {
                correctAnswerValues = [question.answerOptions[correctIndex]];
            }
        }
        else if (question.questionType === 'multiple_choice_multiple_answers') {
            correctAnswerValues = question.answerOptions.filter((_, index) => question.correctAnswers[index] === true);
        }
        else if (question.questionType === 'number') {
            // Assuming correctAnswers for number type stores the number itself or an index
            // For this example, let's assume correctAnswers[0] is the correct numeric string if answerOptions are not direct numbers
            const correctIndex = question.correctAnswers.findIndex(ca => ca === true);
            if (correctIndex !== -1 && question.answerOptions[correctIndex] !== undefined) {
                correctAnswerValues = [question.answerOptions[correctIndex]]; // Store the string value
            }
        }
        else {
            // Fallback or other types
            correctAnswerValues = question.answerOptions.filter((_, index) => question.correctAnswers[index] === true);
        }
        if (correctAnswerValues.length === 0) {
            logger.warn({ accessCode, questionId, questionType: question.questionType }, 'No correct answers defined for question during scoring. No points will be awarded for this question.');
        }
        for (const userId of Object.keys(participantsHash)) {
            let participant;
            try {
                const participantJson = participantsHash[userId];
                if (!participantJson) {
                    logger.warn({ accessCode, userId }, 'Participant JSON data not found in hash for scoring. Skipping.');
                    continue;
                }
                participant = JSON.parse(participantJson);
                if (!participant || !participant.answers || !Array.isArray(participant.answers)) {
                    // logger.info({ accessCode, userId }, 'Participant has no answers array or is invalid. Skipping for scoring.');
                    continue;
                }
                const answerData = participant.answers.find((ans) => ans.questionId === questionId);
                if (!answerData) {
                    // logger.info({ accessCode, userId, questionId }, 'No answer submitted by this participant for this question.');
                    continue;
                }
                let isCorrect = false;
                const submittedAnswer = answerData.answer; // This is typically the index for single_correct
                if (question.questionType === 'multiple_choice_multiple_answers') {
                    const submittedAnswersSet = new Set(Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer]);
                    const correctAnswersSet = new Set(correctAnswerValues);
                    isCorrect = submittedAnswersSet.size === correctAnswersSet.size && [...submittedAnswersSet].every(val => correctAnswersSet.has(val));
                }
                else if (question.questionType === 'number') {
                    // For number questions, direct comparison of the value
                    // Ensure both are treated as strings for comparison if that's how they are stored
                    isCorrect = correctAnswerValues.includes(String(submittedAnswer));
                }
                else { // single_correct, multiple_choice_single_answer
                    if (typeof submittedAnswer === 'number' && submittedAnswer >= 0 && submittedAnswer < question.answerOptions.length) {
                        const submittedOptionValue = question.answerOptions[submittedAnswer];
                        isCorrect = correctAnswerValues.includes(submittedOptionValue);
                    }
                    else if (typeof submittedAnswer === 'string') {
                        // Accept string answers matching the correct value
                        isCorrect = correctAnswerValues.includes(submittedAnswer);
                    }
                }
                let points = 0;
                if (isCorrect) {
                    const timeSpent = Math.max(0, answerData.timeSpent || (question.timeLimit || 30));
                    points = Math.max(100, 1000 - Math.floor(timeSpent * 10));
                }
                participant.score = (participant.score || 0) + points;
                participant.lastAnswerAt = answerData.timestamp || Date.now();
                await redis_1.redisClient.hset(participantsKey, userId, JSON.stringify(participant));
                logger.debug({ userId, totalScore: participant.score, accessCode }, `[GameStateService] Updated participant ${userId} in Redis.`);
                // Add/Update participant in the leaderboard sorted set
                const scoreForZadd = participant.score;
                const userIdForZadd = userId;
                logger.debug({ accessCode, questionId, userId, scoreForZadd, leaderboardKey }, `[GameStateService] Attempting ZADD to leaderboard for user ${userIdForZadd} with score ${scoreForZadd}.`);
                try {
                    const zaddResult = await redis_1.redisClient.zadd(leaderboardKey, scoreForZadd, userIdForZadd);
                    logger.debug({ accessCode, questionId, userId, totalScore: scoreForZadd, zaddResult, leaderboardKey }, `[GameStateService] ZADD result for user ${userIdForZadd}: ${zaddResult}. Added/Updated in leaderboard ZSET.`);
                }
                catch (err) {
                    logger.error({ accessCode, questionId, userId, scoreForZadd, leaderboardKey, error: err }, `[GameStateService] ERROR during ZADD for user ${userIdForZadd}.`);
                }
                // logger.info({ accessCode, userId, questionId, points, newScore: participant.score, isCorrect }, 'Score calculated and updated for participant');
            }
            catch (e) {
                logger.error({ accessCode, userId, questionId, error: e.message, participantData: participant, stack: e.stack }, 'Error processing score for a single participant');
            }
        }
        logger.info({ accessCode, questionId }, 'Scores calculated for question');
        return true;
    }
    catch (error) {
        logger.error({ accessCode, questionId, error: error.message, stack: error.stack }, 'Error calculating scores for question');
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
    updateGameState,
    getFormattedLeaderboard // Add new function to default export
};
