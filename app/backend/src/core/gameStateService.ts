import { redisClient } from '@/config/redis';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Define game state interface
export interface GameState {
    gameId: string;              // Database ID of the game instance
    accessCode: string;          // Access code for joining
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionIndex: number; // Index of the current question
    questionIds: string[];       // IDs of questions in the quiz
    questionData?: any;          // Data of the current question (sent to clients)
    startedAt?: number;          // Timestamp when game started
    answersLocked?: boolean;     // Whether answers are locked
    timer: {
        startedAt: number;       // When the timer started
        duration: number;        // Total duration in milliseconds
        isPaused: boolean;       // Whether timer is paused
        pausedAt?: number;       // When it was paused
        timeRemaining?: number;  // Time remaining when paused
    };
    settings: {                  // Game settings
        timeMultiplier: number;  // Multiplier for question time limits
        showLeaderboard: boolean; // Whether to show leaderboard between questions
    };
};

// Create a service-specific logger
const logger = createLogger('GameStateService');

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
export async function initializeGameState(gameInstanceId: string): Promise<GameState | null> {
    try {
        // Fetch the game instance with quiz template and questions
        const gameInstance = await prisma.gameInstance.findUnique({
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
        const gameState: GameState = {
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
                    ? (gameInstance.settings as any).timeMultiplier || 1.0
                    : 1.0,
                showLeaderboard: typeof gameInstance.settings === 'object' && gameInstance.settings !== null
                    ? (gameInstance.settings as any).showLeaderboard || true
                    : true
            }
        };

        // Store in Redis with expiration (24 hours)
        await redisClient.set(
            `${GAME_KEY_PREFIX}${gameInstance.accessCode}`,
            JSON.stringify(gameState),
            'EX',
            86400 // 24 hours in seconds
        );

        // Initialize empty participants set
        await redisClient.del(`${GAME_PARTICIPANTS_PREFIX}${gameInstance.accessCode}`);

        // Log successful initialization
        logger.info({ gameInstanceId, accessCode: gameInstance.accessCode }, 'Game state initialized in Redis');

        return gameState;
    } catch (error) {
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
export async function setCurrentQuestion(accessCode: string, questionIndex: number): Promise<GameState | null> {
    try {
        // Get current game state
        const gameStateRaw = await redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
        if (!gameStateRaw) {
            logger.warn({ accessCode }, 'Game state not found in Redis');
            return null;
        }

        const gameState: GameState = JSON.parse(gameStateRaw);

        // Validate question index
        if (questionIndex < 0 || questionIndex >= gameState.questionIds.length) {
            logger.warn({ accessCode, questionIndex, totalQuestions: gameState.questionIds.length },
                'Invalid question index');
            return null;
        }

        // Get question details from the database
        const questionId = gameState.questionIds[questionIndex];
        const question = await prisma.question.findUnique({
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
        await redisClient.del(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionId}`);

        // Update game state in Redis
        await redisClient.set(
            `${GAME_KEY_PREFIX}${accessCode}`,
            JSON.stringify(gameState),
            'EX',
            86400 // 24 hours
        );

        logger.info({ accessCode, questionIndex }, 'Current question set successfully');
        return gameState;
    } catch (error) {
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
export async function getFullGameState(accessCode: string): Promise<{
    gameState: GameState;
    participants: any[];
    answers: Record<string, any[]>;
    leaderboard: any[];
} | null> {
    try {
        // Get basic game state
        const gameStateRaw = await redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
        if (!gameStateRaw) {
            logger.warn({ accessCode }, 'Game state not found in Redis');
            return null;
        }

        const gameState: GameState = JSON.parse(gameStateRaw);

        // Get participants
        const participantsHash = await redisClient.hgetall(`${GAME_PARTICIPANTS_PREFIX}${accessCode}`);
        const participants = participantsHash
            ? Object.values(participantsHash).map(p => JSON.parse(p as string))
            : [];

        // Get answers for the current question
        const answers: Record<string, any[]> = {};
        if (gameState.currentQuestionIndex >= 0) {
            const currentQuestionId = gameState.questionIds[gameState.currentQuestionIndex];
            const answersHash = await redisClient.hgetall(`${GAME_ANSWERS_PREFIX}${accessCode}:${currentQuestionId}`);

            if (answersHash) {
                const answerArray = Object.values(answersHash).map(a => JSON.parse(a as string));
                answers[currentQuestionId] = answerArray;
            } else {
                answers[currentQuestionId] = [];
            }
        }

        // Get leaderboard
        const leaderboardRaw = await redisClient.zrevrange(
            `${GAME_LEADERBOARD_PREFIX}${accessCode}`,
            0,
            -1,
            'WITHSCORES'
        );

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
    } catch (error) {
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
export async function endCurrentQuestion(accessCode: string): Promise<GameState | null> {
    try {
        // Get current game state
        const gameStateRaw = await redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
        if (!gameStateRaw) {
            logger.warn({ accessCode }, 'Game state not found in Redis');
            return null;
        }

        const gameState: GameState = JSON.parse(gameStateRaw);

        // Pause the timer
        gameState.timer.isPaused = true;
        gameState.timer.pausedAt = Date.now();
        gameState.timer.timeRemaining = Math.max(0,
            gameState.timer.duration - (gameState.timer.pausedAt - gameState.timer.startedAt));

        // Update game state in Redis
        await redisClient.set(
            `${GAME_KEY_PREFIX}${accessCode}`,
            JSON.stringify(gameState),
            'EX',
            86400 // 24 hours
        );

        logger.info({ accessCode, questionIndex: gameState.currentQuestionIndex }, 'Question timer ended');
        return gameState;
    } catch (error) {
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
export async function calculateScores(accessCode: string, questionId: string): Promise<boolean> {
    try {
        // Get the question from the database to check correct answers
        const question = await prisma.question.findUnique({
            where: { uid: questionId }
        });

        if (!question) {
            logger.warn({ accessCode, questionId }, 'Question not found');
            return false;
        }

        // Get all answers for this question
        const answersHash = await redisClient.hgetall(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionId}`);
        if (!answersHash) {
            logger.warn({ accessCode, questionId }, 'No answers found for this question');
            return true; // Not an error, just no answers
        }

        // Get all participants
        const participantsHash = await redisClient.hgetall(`${GAME_PARTICIPANTS_PREFIX}${accessCode}`);
        if (!participantsHash) {
            logger.warn({ accessCode }, 'No participants found for this game');
            return false;
        }

        // Determine correct answers based on question type
        let correctAnswerValues: any[] = [];

        // Process the new answerOptions and correctAnswers fields
        if (question.questionType === 'multiple_choice_single_answer' ||
            question.questionType === 'multiple_choice_multiple_answers') {
            // For multiple choice, get the indices of correct answers
            correctAnswerValues = question.answerOptions.filter((_, index) =>
                question.correctAnswers[index]
            );
        } else if (question.questionType === 'number') {
            // For number questions, there should be only one correct answer
            // Find the index of the correct answer
            const correctIndex = question.correctAnswers.findIndex(isCorrect => isCorrect);
            if (correctIndex >= 0) {
                correctAnswerValues = [question.answerOptions[correctIndex]];
            }
        } else {
            // For other question types, use all marked as correct
            correctAnswerValues = question.answerOptions.filter((_, index) =>
                question.correctAnswers[index]
            );
        }

        if (correctAnswerValues.length === 0) {
            logger.warn({ accessCode, questionId, questionType: question.questionType },
                'No correct answers found');
        }

        // Calculate and update scores for each answer
        for (const [socketId, answerJson] of Object.entries(answersHash)) {
            try {
                const answerData = JSON.parse(answerJson as string);
                const participant = JSON.parse(participantsHash[socketId] || 'null' as string);

                if (!participant) {
                    logger.warn({ accessCode, socketId }, 'Participant not found for answer');
                    continue;
                }

                // Check if answer is correct based on question type
                let isCorrect = false;
                let scoreForAnswer = 0;

                if (question.questionType === 'multiple_choice_single_answer' || question.questionType === 'multiple_choice_multiple_answers') {
                    isCorrect = correctAnswerValues.includes(answerData.answer);
                } else if (question.questionType === 'number') {
                    isCorrect = parseFloat(answerData.answer) === parseFloat(correctAnswerValues[0]);
                } else {
                    // For other question types (e.g., text)
                    isCorrect = correctAnswerValues.includes(answerData.answer);
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
                await redisClient.hset(
                    `${GAME_PARTICIPANTS_PREFIX}${accessCode}`,
                    socketId,
                    JSON.stringify(participant)
                );

                // Update the sorted set leaderboard
                await redisClient.zadd(
                    `${GAME_LEADERBOARD_PREFIX}${accessCode}`,
                    participant.score,
                    participant.userId
                );

                // Update answer with correctness and score
                answerData.isCorrect = isCorrect;
                answerData.score = scoreForAnswer;
                await redisClient.hset(
                    `${GAME_ANSWERS_PREFIX}${accessCode}:${questionId}`,
                    socketId,
                    JSON.stringify(answerData)
                );

                logger.debug({
                    accessCode,
                    questionId,
                    userId: participant.userId,
                    isCorrect,
                    score: scoreForAnswer
                }, 'Score calculated for player answer');
            } catch (error) {
                logger.error({ accessCode, questionId, socketId, error }, 'Error processing answer for scoring');
            }
        }

        logger.info({ accessCode, questionId }, 'Scores calculated and updated successfully');
        return true;
    } catch (error) {
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
export async function updateGameState(accessCode: string, gameState: GameState): Promise<GameState> {
    try {
        // Store in Redis with expiration (24 hours)
        await redisClient.set(
            `${GAME_KEY_PREFIX}${accessCode}`,
            JSON.stringify(gameState),
            'EX',
            86400 // 24 hours in seconds
        );

        logger.info({ accessCode }, 'Game state updated');
        return gameState;
    } catch (error) {
        logger.error({ accessCode, error }, 'Failed to update game state');
        throw new Error(`Failed to update game state: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export default {
    initializeGameState,
    setCurrentQuestion,
    getFullGameState,
    endCurrentQuestion,
    calculateScores,
    updateGameState
};
