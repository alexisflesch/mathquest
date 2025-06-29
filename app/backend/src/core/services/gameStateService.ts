import { redisClient } from '@/config/redis';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
import { GameState, LeaderboardEntry, ParticipationType } from '@shared/types/core';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';

// Re-export GameState for backward compatibility
export { GameState } from '@shared/types/core';

// Create a service-specific logger
const logger = createLogger('GameStateService');

// Redis key prefixes
const GAME_KEY_PREFIX = 'mathquest:game:';
const GAME_PARTICIPANTS_PREFIX = 'mathquest:game:participants:';
const GAME_ANSWERS_PREFIX = 'mathquest:game:answers:';
const GAME_LEADERBOARD_PREFIX = 'mathquest:game:leaderboard:';
const PROJECTION_DISPLAY_PREFIX = 'mathquest:projection:display:';

/**
 * Get formatted leaderboard data for a game showing ALL participations
 * 
 * @param accessCode The game access code
 * @returns The formatted leaderboard data with all participations
 */
export async function getFormattedLeaderboard(accessCode: string): Promise<LeaderboardEntry[]> {
    try {
        logger.info({ accessCode }, "Fetching all participations for leaderboard");

        // Get ALL participants directly from the database to show all participations
        const participants = await prisma.gameParticipant.findMany({
            where: {
                gameInstance: { accessCode }
            },
            include: {
                user: {
                    select: { username: true, avatarEmoji: true }
                }
            },
            orderBy: [
                { score: 'desc' },
                { joinedAt: 'asc' }  // Secondary sort by join time for consistent ordering
            ]
        });

        if (participants.length === 0) {
            logger.warn({ accessCode }, "No participants found for leaderboard");
            return [];
        }

        logger.info({
            accessCode,
            totalParticipations: participants.length,
            uniqueUsers: new Set(participants.map(p => p.userId)).size
        }, "Found participations for leaderboard");

        // Map all participations to leaderboard entries
        const leaderboard = participants.map((participant, index) => ({
            userId: participant.userId,
            username: participant.user?.username || 'Unknown Player',
            avatarEmoji: participant.user?.avatarEmoji || undefined,
            score: participant.score || 0,
            rank: index + 1,
            participationType: participant.participationType as ParticipationType,
            attemptCount: participant.attemptCount || 1,
            participationId: participant.id  // Add unique ID for each participation
        }));

        logger.info({
            accessCode,
            count: leaderboard.length,
            liveCount: leaderboard.filter(p => p.participationType === 'LIVE').length,
            deferredCount: leaderboard.filter(p => p.participationType === 'DEFERRED').length
        }, "Formatted leaderboard with all participations");

        return leaderboard;

    } catch (error) {
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
        const questionUids = gameInstance.gameTemplate?.questions?.map(q => q.question.uid) || [];

        if (questionUids.length === 0) {
            logger.warn({ gameInstanceId }, 'No questions found in quiz template');
            return null;
        }

        // Create initial game state
        const gameState: GameState = {
            gameId: gameInstanceId,
            accessCode: gameInstance.accessCode,
            status: 'pending', // Will be set to 'active' when the first question is served
            currentQuestionIndex: -1, // No question active initially
            questionUids,
            startedAt: Date.now(),
            answersLocked: false, // Default to unlocked
            gameMode: gameInstance.playMode, // Use the playMode from the game instance
            linkedQuizId: gameInstance.gameTemplateId, // Link to the template
            settings: {
                timeMultiplier: typeof gameInstance.settings === 'object' && gameInstance.settings !== null
                    ? (gameInstance.settings as any).timeMultiplier || 1.0
                    : 1.0,
                showLeaderboard: typeof gameInstance.settings === 'object' && gameInstance.settings !== null
                    ? (gameInstance.settings as any).showLeaderboard || true
                    : true
            }
            // [MODERNIZATION] Legacy timer field fully removed. All timer logic is handled by CanonicalTimerService.
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
        if (questionIndex < 0 || questionIndex >= gameState.questionUids.length) {
            logger.warn({ accessCode, questionIndex, totalQuestions: gameState.questionUids.length },
                'Invalid question index');
            return null;
        }

        // Get question details from the database
        const questionUid = gameState.questionUids[questionIndex];
        const question = await prisma.question.findUnique({
            where: { uid: questionUid }
        });

        if (!question) {
            logger.warn({ accessCode, questionUid }, 'Question not found');
            return null;
        }

        // Move isDeferred assignment BEFORE status change to avoid type error
        const isDeferred = gameState.status === 'completed'; // Business rule: treat completed as deferred
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

        // Canonical timer system:
        await canonicalTimerService.startTimer(accessCode, questionUid, gameState.gameMode as any, isDeferred);

        // Initialize answer collection for this question
        await redisClient.del(`${GAME_ANSWERS_PREFIX}${accessCode}:${questionUid}`);

        // Clear projection display state for new question
        await updateProjectionDisplayState(accessCode, {
            showStats: false,
            currentStats: {},
            statsQuestionUid: null,
            showCorrectAnswers: false,
            correctAnswersData: null
        });

        // Update game state in Redis
        await redisClient.set(
            `${GAME_KEY_PREFIX}${accessCode}`,
            JSON.stringify(gameState),
            'EX',
            86400 // 24 hours
        );

        logger.info({ accessCode, questionUid, questionIndex }, 'Current question set successfully');
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
    leaderboard: LeaderboardEntry[];
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

        // DEBUG: Log participants state for getFullGameState
        logger.info({
            accessCode,
            participantsHashKeys: participantsHash ? Object.keys(participantsHash) : null,
            participantsCount: participants.length,
            participants: participants.map(p => ({ userId: p.userId, username: p.username, avatarEmoji: p.avatarEmoji }))
        }, '🔍 [DEBUG-FULLGAMESTATE] Participants loaded in getFullGameState');

        // Get answers for the current question
        const answers: Record<string, any[]> = {};
        if (gameState.currentQuestionIndex >= 0) {
            const currentQuestionUid = gameState.questionUids[gameState.currentQuestionIndex];
            let answersKey = `${GAME_ANSWERS_PREFIX}${accessCode}:${currentQuestionUid}`;
            let attemptCount: number | undefined = undefined;
            if (gameState.gameMode === 'tournament' && gameState.status === 'active') {
                // Try to get attemptCount from participants (assume single user for DEFERRED, or pass as param in future)
                // For now, log and use default key
                logger.info({ accessCode, currentQuestionUid, gameMode: gameState.gameMode, status: gameState.status }, '[DIAGNOSTIC] getFullGameState: using default answers key (no attemptCount param)');
            }
            const answersHash = await redisClient.hgetall(answersKey);
            if (answersHash) {
                const answerArray = Object.values(answersHash).map(a => JSON.parse(a as string));
                answers[currentQuestionUid] = answerArray;
            } else {
                answers[currentQuestionUid] = [];
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

        // DEBUG: Log leaderboard raw data before processing
        logger.info({
            accessCode,
            leaderboardRawLength: leaderboardRaw.length,
            leaderboardRaw: leaderboardRaw.slice(0, 10) // First 10 items (5 users)
        }, '🔍 [DEBUG-FULLGAMESTATE] Raw leaderboard data in getFullGameState');

        for (let i = 0; i < leaderboardRaw.length; i += 2) {
            const userId = leaderboardRaw[i];
            const score = parseInt(leaderboardRaw[i + 1], 10);

            // Find player info from participants
            const player = participants.find(p => p.userId === userId);

            logger.debug({
                accessCode,
                userId,
                score,
                playerFound: !!player,
                playerInfo: player ? { username: player.username, avatarEmoji: player.avatarEmoji } : null
            }, '🔍 [DEBUG-FULLGAMESTATE] Processing leaderboard entry in getFullGameState');

            if (player) {
                leaderboard.push({
                    userId,
                    username: player.username, // 🔧 FIXED: Add missing username field
                    avatarEmoji: player.avatarEmoji,
                    score
                });
            } else {
                // Player not found in participants - this should not happen ideally
                logger.warn({
                    accessCode,
                    userId,
                    score
                }, '⚠️ [FULLGAMESTATE] Player not found in participants for leaderboard entry');

                leaderboard.push({
                    userId,
                    username: 'Unknown Player', // Fallback
                    avatarEmoji: undefined,
                    score
                });
            }
        }

        // Debug logging to see what game state is being returned
        // LEGACY-TIMER-MIGRATION: timerStatus and timerQuestionUid are deprecated. Use CanonicalTimerService for timer state.
        // logger.debug({
        //     accessCode,
        //     gameStateStatus: gameState.status,
        //     timerStatus: gameState.timer?.status,
        //     timerQuestionUid: gameState.timer?.questionUid,
        //     questionData: gameState.questionData ? 'present' : 'missing',
        //     questionDataUid: gameState.questionData?.uid,
        //     participantsCount: participants.length,
        //     answersKeys: Object.keys(answers),
        //     leaderboardCount: leaderboard.length
        // }, 'Full game state prepared for projection');
        logger.debug({
            accessCode,
            gameStateStatus: gameState.status,
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
        // gameState.timer.status = 'pause';
        // gameState.timer.timestamp = Date.now();
        // Canonical timer system:
        const isDeferredEnd = gameState.status === 'completed'; // Business rule: treat completed as deferred
        await canonicalTimerService.pauseTimer(accessCode, gameState.questionUids[gameState.currentQuestionIndex], gameState.gameMode as any, isDeferredEnd);

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
 * DEPRECATED: Legacy scoring logic. All scoring and answer submission must use scoringService.ts exclusively.
 * This function is no longer used and will be removed in a future cleanup. See plan.md for details.
 * 
 * Calculate and update scores for all players for a question
 * 
 * @param accessCode The game access code
 * @param questionUid The ID of the question
 * @returns True if successful, false if error
 */
export async function calculateScores(accessCode: string, questionUid: string): Promise<boolean> {
    // [DIAGNOSTIC] LEGACY SCORING FUNCTION CALLED
    logger.error({
        accessCode,
        questionUid,
        stack: new Error().stack
    }, '[CRITICAL] Legacy calculateScores called! This is deprecated and must not be used.');
    try {
        const question = await prisma.question.findUnique({
            where: { uid: questionUid }
        });

        if (!question) {
            logger.warn({ accessCode, questionUid }, 'Question not found for scoring');
            return false;
        }

        const participantsKey = `${GAME_PARTICIPANTS_PREFIX}${accessCode}`;
        const leaderboardKey = `${GAME_LEADERBOARD_PREFIX}${accessCode}`; // Definition of leaderboardKey

        const participantsHash = await redisClient.hgetall(participantsKey);

        if (!participantsHash || Object.keys(participantsHash).length === 0) {
            logger.warn({ accessCode }, 'No participants found for this game. Cannot calculate scores.');
            return true; // No participants, so no scores to calculate, not an error.
        }

        let correctAnswerValues: any[] = [];
        // Correctly determine correctAnswerValues based on question.questionType and question.correctAnswers
        // This logic needs to be robust for different question types.
        if (question.questionType === QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER || question.questionType === 'single_correct') {
            const correctIndex = question.correctAnswers.findIndex(ca => ca === true);
            if (correctIndex !== -1 && question.answerOptions[correctIndex] !== undefined) {
                correctAnswerValues = [question.answerOptions[correctIndex]];
            }
        } else if (question.questionType === 'multiple_choice_multiple_answers') {
            correctAnswerValues = question.answerOptions.filter((_, index) => question.correctAnswers[index] === true);
        } else if (question.questionType === 'number') {
            // Assuming correctAnswers for number type stores the number itself or an index
            // For this example, let's assume correctAnswers[0] is the correct numeric string if answerOptions are not direct numbers
            const correctIndex = question.correctAnswers.findIndex(ca => ca === true);
            if (correctIndex !== -1 && question.answerOptions[correctIndex] !== undefined) {
                correctAnswerValues = [question.answerOptions[correctIndex]]; // Store the string value
            }
        } else {
            // Fallback or other types
            correctAnswerValues = question.answerOptions.filter((_, index) => question.correctAnswers[index] === true);
        }

        if (correctAnswerValues.length === 0) {
            logger.warn({ accessCode, questionUid, questionType: question.questionType },
                'No correct answers defined for question during scoring. No points will be awarded for this question.');
        }

        for (const userId of Object.keys(participantsHash)) {
            let participant;
            // Declare variables for scoring
            let actualTimeSpent = 0;
            let points = 0;
            try {
                const participantJson = participantsHash[userId];
                if (!participantJson) {
                    logger.warn({ accessCode, userId }, 'Participant JSON data not found in hash for scoring. Skipping.');
                    continue;
                }
                participant = JSON.parse(participantJson as string);

                if (!participant || !participant.answers || !Array.isArray(participant.answers)) {
                    // logger.info({ accessCode, userId }, 'Participant has no answers array or is invalid. Skipping for scoring.');
                    continue;
                }

                const answerData = participant.answers.find((ans: any) => ans.questionUid === questionUid);

                if (!answerData) {
                    // logger.info({ accessCode, userId, questionUid }, 'No answer submitted by this participant for this question.');
                    continue;
                }

                let isCorrect = false;
                // let actualTimeSpent = 0;
                // let points = 0;
                const submittedAnswer = answerData.answer; // This is typically the index for single_correct

                if (question.questionType === 'multiple_choice_multiple_answers') {
                    const submittedAnswersSet = new Set(Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer]);
                    const correctAnswersSet = new Set(correctAnswerValues);
                    isCorrect = submittedAnswersSet.size === correctAnswersSet.size && [...submittedAnswersSet].every(val => correctAnswersSet.has(val));
                } else if (question.questionType === 'number') {
                    // For number questions, direct comparison of the value
                    // Ensure both are treated as strings for comparison if that's how they are stored
                    isCorrect = correctAnswerValues.includes(String(submittedAnswer));
                } else { // single_correct, multiple_choice_single_answer
                    if (typeof submittedAnswer === 'number' && submittedAnswer >= 0 && submittedAnswer < question.answerOptions.length) {
                        const submittedOptionValue = question.answerOptions[submittedAnswer];
                        isCorrect = correctAnswerValues.includes(submittedOptionValue);
                    } else if (typeof submittedAnswer === 'string') {
                        // Accept string answers matching the correct value
                        // For now, we'll use a default reasonable time or try to calculate from timestamp
                        actualTimeSpent = question.timeLimit || 30; // Default to question time limit
                    } else {
                        // Convert to seconds if it was in milliseconds
                        actualTimeSpent = answerData.timeSpent > 1000 ? answerData.timeSpent / 1000 : answerData.timeSpent;
                    }

                    // Calculate points: base score 1000, minus time penalty, minimum 100 points
                    if (answerData.timeSpent !== undefined) {
                        actualTimeSpent = answerData.timeSpent > 1000 ? answerData.timeSpent / 1000 : answerData.timeSpent;
                    } else {
                        actualTimeSpent = question.timeLimit || 30;
                    }
                    const timePenalty = Math.floor(actualTimeSpent * 10);
                    points = Math.max(100, 1000 - timePenalty);

                    logger.debug({ accessCode, userId, questionUid, actualTimeSpent, timePenalty, points },
                        'Score calculation details');
                }

                participant.score = (participant.score || 0) + points;
                participant.lastAnswerAt = answerData.timestamp || Date.now();

                await redisClient.hset(participantsKey, userId, JSON.stringify(participant));
                logger.debug({ userId, totalScore: participant.score, accessCode }, `[GameStateService] Updated participant ${userId} in Redis.`);

                // Add/Update participant in the leaderboard sorted set
                const scoreForZadd = participant.score;
                const userIdForZadd = userId;
                logger.debug({ accessCode, questionUid, userId, scoreForZadd, leaderboardKey }, `[GameStateService] Attempting ZADD to leaderboard for user ${userIdForZadd} with score ${scoreForZadd}.`);
                try {
                    const zaddResult = await redisClient.zadd(leaderboardKey, scoreForZadd, userIdForZadd);
                    logger.debug({ accessCode, questionUid, userId, totalScore: scoreForZadd, zaddResult, leaderboardKey }, `[GameStateService] ZADD result for user ${userIdForZadd}: ${zaddResult}. Added/Updated in leaderboard ZSET.`);
                } catch (err) {
                    logger.error({ accessCode, questionUid, userId, scoreForZadd, leaderboardKey, error: err }, `[GameStateService] ERROR during ZADD for user ${userIdForZadd}.`);
                }

                // logger.info({ accessCode, userId, questionUid, points, newScore: participant.score, isCorrect }, 'Score calculated and updated for participant');

            } catch (e: any) {
                logger.error({ accessCode, userId, questionUid, error: e.message, participantData: participant, stack: e.stack }, 'Error processing score for a single participant');
            }
        }

        logger.info({ accessCode, questionUid }, 'Scores calculated for question');
        return true;

    } catch (error: any) {
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

/**
 * Get projection display state for a game
 * 
 * @param accessCode The game access code
 * @returns The projection display state
 */
export async function getProjectionDisplayState(accessCode: string): Promise<{
    showStats: boolean;
    currentStats: Record<string, number>;
    statsQuestionUid: string | null;
    showCorrectAnswers: boolean;
    correctAnswersData: any | null;
} | null> {
    try {
        const stateRaw = await redisClient.get(`${PROJECTION_DISPLAY_PREFIX}${accessCode}`);
        if (!stateRaw) {
            // Return default state if none exists
            return {
                showStats: false,
                currentStats: {},
                statsQuestionUid: null,
                showCorrectAnswers: false,
                correctAnswersData: null
            };
        }

        return JSON.parse(stateRaw);
    } catch (error) {
        logger.error({ accessCode, error }, 'Error getting projection display state');
        return null;
    }
}

/**
 * Update projection display state for a game
 * 
 * @param accessCode The game access code  
 * @param state The projection display state to set
 */
export async function updateProjectionDisplayState(accessCode: string, state: {
    showStats?: boolean;
    currentStats?: Record<string, number>;
    statsQuestionUid?: string | null;
    showCorrectAnswers?: boolean;
    correctAnswersData?: any | null;
}): Promise<void> {
    try {
        // Get existing state or use defaults
        const existing = await getProjectionDisplayState(accessCode) || {
            showStats: false,
            currentStats: {},
            statsQuestionUid: null,
            showCorrectAnswers: false,
            correctAnswersData: null
        };

        // Merge with new state
        const newState = {
            ...existing,
            ...state
        };

        await redisClient.set(
            `${PROJECTION_DISPLAY_PREFIX}${accessCode}`,
            JSON.stringify(newState),
            'EX',
            86400 // 24 hours
        );

        logger.debug({ accessCode, newState }, 'Updated projection display state');
    } catch (error) {
        logger.error({ accessCode, state, error }, 'Error updating projection display state');
    }
}

/**
 * Get the canonical timer for a given game and questionUid
 * @param accessCode The game access code
 * @param questionUid The question UID
 * @param playMode The play mode (from game state)
 * @param isDeferred Whether the game is deferred (from game state)
 * @param userId Optional userId (for deferred mode)
 * @param attemptCount Optional attemptCount (for deferred mode)
 * @returns The canonical timer object or null if not found
 */

/**
 * Get the canonical timer for a given game and questionUid, REQUIRING canonical durationMs from the question.
 * @param accessCode The game access code
 * @param questionUid The question UID
 * @param playMode The play mode (from game state)
 * @param isDeferred Whether the game is deferred (from game state)
 * @param durationMs The canonical duration in ms (REQUIRED, from question)
 * @param userId Optional userId (for deferred mode)
 * @param attemptCount Optional attemptCount (for deferred mode)
 * @returns The canonical timer object or null if not found
 */
export async function getCanonicalTimer(
    accessCode: string,
    questionUid: string,
    playMode: string,
    isDeferred: boolean,
    durationMs: number,
    userId?: string,
    attemptCount?: number
): Promise<any | null> {
    try {
        return await canonicalTimerService.getTimer(accessCode, questionUid, playMode as any, isDeferred, userId, attemptCount, durationMs);
    } catch (err) {
        logger.error({ accessCode, questionUid, err }, '[getCanonicalTimer] Failed to get canonical timer');
        return null;
    }
}

// CanonicalTimerService instance (ensure redisClient is passed)
const canonicalTimerService = new CanonicalTimerService(redisClient);

export default {
    initializeGameState,
    setCurrentQuestion,
    getFullGameState,
    endCurrentQuestion,
    updateGameState,
    getFormattedLeaderboard,
    getProjectionDisplayState,
    updateProjectionDisplayState // Do NOT include getCanonicalTimer in default export
};
