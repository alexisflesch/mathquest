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
const questionTypes_1 = require("@shared/constants/questionTypes");
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
        // If Redis leaderboard is empty, try to get from database
        if (leaderboardRaw.length === 0) {
            logger.info({ accessCode }, "Redis leaderboard empty, checking database");
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { leaderboard: true }
            });
            if (gameInstance?.leaderboard && Array.isArray(gameInstance.leaderboard)) {
                logger.info({ accessCode, count: gameInstance.leaderboard.length }, "Using database leaderboard");
                return gameInstance.leaderboard.map((entry, index) => ({
                    ...entry,
                    avatarEmoji: entry.avatarEmoji || entry.avatar, // Ensure consistent field name
                    rank: index + 1
                }));
            }
            else {
                logger.warn({ accessCode }, "No leaderboard found in database either");
                return [];
            }
        }
        const leaderboardPromises = [];
        for (let i = 0; i < leaderboardRaw.length; i += 2) {
            const userId = leaderboardRaw[i];
            const score = parseInt(leaderboardRaw[i + 1], 10);
            let playerInfo = participantsFromRedis.find(p => p.userId === userId);
            if (playerInfo) {
                leaderboardPromises.push(Promise.resolve({
                    userId,
                    username: playerInfo.username,
                    avatarEmoji: playerInfo.avatarEmoji, // Use canonical avatarEmoji field name
                    score
                }));
            }
            else {
                // Participant not in Redis hash (e.g., disconnected)
                // Try to fetch from User table in DB as a fallback for username/avatar
                logger.warn({ accessCode, userId }, "Participant info not found in Redis for leaderboard. Attempting DB lookup for user details.");
                const userPromise = prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true, avatarEmoji: true }
                }).then(user => {
                    if (user) {
                        return {
                            userId,
                            username: user.username || 'Unknown Player',
                            avatarEmoji: user.avatarEmoji || undefined, // Use canonical avatarEmoji field name
                            score
                        };
                    }
                    logger.warn({ accessCode, userId }, "User details not found in DB for leaderboard entry.");
                    return {
                        userId,
                        username: 'Unknown Player',
                        avatarEmoji: undefined, // Use canonical avatarEmoji field name
                        score
                    };
                });
                leaderboardPromises.push(userPromise);
            }
        }
        let finalLeaderboard = await Promise.all(leaderboardPromises);
        // Sort by score descending, then by username ascending as a tie-breaker
        finalLeaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return (a.username || '').localeCompare(b.username || '');
        });
        // Add rank after sorting
        finalLeaderboard = finalLeaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));
        logger.info({ accessCode, count: finalLeaderboard.length }, "Formatted leaderboard from Redis/DB.");
        return finalLeaderboard;
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
        const questionUids = gameInstance.gameTemplate?.questions?.map(q => q.question.uid) || [];
        if (questionUids.length === 0) {
            logger.warn({ gameInstanceId }, 'No questions found in quiz template');
            return null;
        }
        // Create initial game state
        const gameState = {
            gameId: gameInstanceId,
            accessCode: gameInstance.accessCode,
            status: 'pending', // Will be set to 'active' when the first question is served
            currentQuestionIndex: -1, // No question active initially
            questionUids,
            startedAt: Date.now(),
            answersLocked: false, // Default to unlocked
            gameMode: gameInstance.playMode, // Use the playMode from the game instance
            linkedQuizId: gameInstance.gameTemplateId, // Link to the template
            timer: {
                status: 'stop',
                timeLeftMs: 0,
                durationMs: 0,
                questionUid: null,
                timestamp: Date.now(),
                localTimeLeftMs: null
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
        if (questionIndex < 0 || questionIndex >= gameState.questionUids.length) {
            logger.warn({ accessCode, questionIndex, totalQuestions: gameState.questionUids.length }, 'Invalid question index');
            return null;
        }
        // Get question details from the database
        const questionUid = gameState.questionUids[questionIndex];
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: questionUid }
        });
        if (!question) {
            logger.warn({ accessCode, questionUid }, 'Question not found');
            return null;
        }
        // Modify game state - set both currentQuestionIndex and timer.questionUid
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
        // Reset and start the timer - ENSURE questionUid is properly set
        const durationMs = (question.timeLimit || 30) * 1000 * (gameState.settings.timeMultiplier || 1);
        gameState.timer = {
            status: 'play',
            timeLeftMs: durationMs,
            durationMs: durationMs,
            questionUid: questionUid, // This is the key fix - ensure this is set correctly
            timestamp: Date.now(),
            localTimeLeftMs: null
        };
        // Initialize answer collection for this question
        await redis_1.redisClient.del(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionUid}`);
        // Update game state in Redis
        await redis_1.redisClient.set(`${GAME_KEY_PREFIX}${accessCode}`, JSON.stringify(gameState), 'EX', 86400 // 24 hours
        );
        logger.info({ accessCode, questionUid, questionIndex }, 'Current question set successfully');
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
            const currentQuestionUid = gameState.questionUids[gameState.currentQuestionIndex];
            const answersHash = await redis_1.redisClient.hgetall(`${GAME_ANSWERS_PREFIX}${accessCode}:${currentQuestionUid}`);
            if (answersHash) {
                const answerArray = Object.values(answersHash).map(a => JSON.parse(a));
                answers[currentQuestionUid] = answerArray;
            }
            else {
                answers[currentQuestionUid] = [];
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
                    avatarEmoji: player.avatarEmoji,
                    score
                });
            }
        }
        // Debug logging to see what game state is being returned
        logger.debug({
            accessCode,
            gameStateStatus: gameState.status,
            timerStatus: gameState.timer?.status,
            timerQuestionUid: gameState.timer?.questionUid,
            questionData: gameState.questionData ? 'present' : 'missing',
            questionDataUid: gameState.questionData?.uid,
            participantsCount: participants.length,
            answersKeys: Object.keys(answers),
            leaderboardCount: leaderboard.length
        }, 'Full game state prepared for projection');
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
        gameState.timer.status = 'pause';
        gameState.timer.timestamp = Date.now();
        // Keep timeLeftMs as is when pausing
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
 * @param questionUid The ID of the question
 * @returns True if successful, false if error
 */
async function calculateScores(accessCode, questionUid) {
    try {
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: questionUid }
        });
        if (!question) {
            logger.warn({ accessCode, questionUid }, 'Question not found for scoring');
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
        if (question.questionType === questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER || question.questionType === 'single_correct') {
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
            logger.warn({ accessCode, questionUid, questionType: question.questionType }, 'No correct answers defined for question during scoring. No points will be awarded for this question.');
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
                const answerData = participant.answers.find((ans) => ans.questionUid === questionUid);
                if (!answerData) {
                    // logger.info({ accessCode, userId, questionUid }, 'No answer submitted by this participant for this question.');
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
                    // Fix timeSpent calculation - if it's a large timestamp, treat it as such
                    let actualTimeSpent;
                    if (answerData.timeSpent > 1000000000000) { // If it's a timestamp (> year 2001 in ms)
                        // This is likely a timestamp, we need the actual time spent
                        // For now, we'll use a default reasonable time or try to calculate from timestamp
                        actualTimeSpent = question.timeLimit || 30; // Default to question time limit
                        logger.warn({ accessCode, userId, questionUid, originalTimeSpent: answerData.timeSpent }, 'Received timestamp instead of time spent, using question time limit');
                    }
                    else {
                        // Convert to seconds if it was in milliseconds
                        actualTimeSpent = answerData.timeSpent > 1000 ? answerData.timeSpent / 1000 : answerData.timeSpent;
                    }
                    // Calculate points: base score 1000, minus time penalty, minimum 100 points
                    const timePenalty = Math.floor(actualTimeSpent * 10);
                    points = Math.max(100, 1000 - timePenalty);
                    logger.debug({ accessCode, userId, questionUid, actualTimeSpent, timePenalty, points }, 'Score calculation details');
                }
                participant.score = (participant.score || 0) + points;
                participant.lastAnswerAt = answerData.timestamp || Date.now();
                await redis_1.redisClient.hset(participantsKey, userId, JSON.stringify(participant));
                logger.debug({ userId, totalScore: participant.score, accessCode }, `[GameStateService] Updated participant ${userId} in Redis.`);
                // Add/Update participant in the leaderboard sorted set
                const scoreForZadd = participant.score;
                const userIdForZadd = userId;
                logger.debug({ accessCode, questionUid, userId, scoreForZadd, leaderboardKey }, `[GameStateService] Attempting ZADD to leaderboard for user ${userIdForZadd} with score ${scoreForZadd}.`);
                try {
                    const zaddResult = await redis_1.redisClient.zadd(leaderboardKey, scoreForZadd, userIdForZadd);
                    logger.debug({ accessCode, questionUid, userId, totalScore: scoreForZadd, zaddResult, leaderboardKey }, `[GameStateService] ZADD result for user ${userIdForZadd}: ${zaddResult}. Added/Updated in leaderboard ZSET.`);
                }
                catch (err) {
                    logger.error({ accessCode, questionUid, userId, scoreForZadd, leaderboardKey, error: err }, `[GameStateService] ERROR during ZADD for user ${userIdForZadd}.`);
                }
                // logger.info({ accessCode, userId, questionUid, points, newScore: participant.score, isCorrect }, 'Score calculated and updated for participant');
            }
            catch (e) {
                logger.error({ accessCode, userId, questionUid, error: e.message, participantData: participant, stack: e.stack }, 'Error processing score for a single participant');
            }
        }
        logger.info({ accessCode, questionUid }, 'Scores calculated for question');
        return true;
    }
    catch (error) {
        logger.error({ accessCode, questionUid, error: error.message, stack: error.stack }, 'Error calculating scores for question');
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
