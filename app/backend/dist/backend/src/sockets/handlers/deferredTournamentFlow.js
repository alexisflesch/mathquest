"use strict";
// Deferred tournament game flow logic
// Handles individual player sessions for asynchronous tournament replay
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
exports.cleanupDeferredSessionsForGame = cleanupDeferredSessionsForGame;
exports.startDeferredTournamentSession = startDeferredTournamentSession;
exports.hasDeferredSession = hasDeferredSession;
exports.getDeferredSessionAccessCode = getDeferredSessionAccessCode;
exports.cleanupDeferredSession = cleanupDeferredSession;
exports.getDeferredAttemptCount = getDeferredAttemptCount;
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const redis_1 = require("@/config/redis");
const liveQuestion_1 = require("@shared/types/quiz/liveQuestion");
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const prisma_1 = require("@/db/prisma");
const canonicalTimerService_1 = require("@/core/services/canonicalTimerService");
const gameTimings_1 = require("@shared/constants/gameTimings");
const socketEvents_zod_2 = require("@shared/types/socketEvents.zod");
const logger = (0, logger_1.default)('DeferredTournamentFlow');
/**
 * Restore the session state for a reconnecting user in a deferred tournament
 */
async function restoreDeferredSessionState(io, socket, accessCode, userId, attemptCount, playerRoom) {
    try {
        logger.info({ accessCode, userId, attemptCount }, 'Restoring deferred session state for reconnection');
        // Join the player room and ensure it's completed
        await socket.join(playerRoom);
        logger.info({ accessCode, userId, attemptCount, playerRoom, socketId: socket.id }, 'Socket joined player room for reconnection');
        // Get the current session state from Redis
        const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
        // Get game state (contains questionUids and currentQuestionIndex) from Redis
        const gameStateRaw = await redis_1.redisClient.get(`mathquest:game:${sessionStateKey}`);
        let gameState = null;
        let questionUids = [];
        if (gameStateRaw) {
            try {
                gameState = JSON.parse(gameStateRaw);
                questionUids = gameState.questionUids || [];
                logger.info({
                    accessCode,
                    userId,
                    attemptCount,
                    sessionStateKey,
                    gameStateFound: true,
                    currentQuestionIndex: gameState.currentQuestionIndex,
                    questionUidsCount: questionUids.length
                }, 'Successfully retrieved game state from Redis');
            }
            catch (parseError) {
                logger.error({ accessCode, userId, attemptCount, parseError }, 'Failed to parse game state from Redis');
            }
        }
        else {
            logger.warn({ accessCode, userId, attemptCount, sessionStateKey }, 'Game state not found in Redis');
        }
        // Get additional session data (score, etc.) stored as hash
        const sessionData = await redis_1.redisClient.hgetall(sessionStateKey);
        if (!gameState || questionUids.length === 0) {
            logger.warn({ accessCode, userId, attemptCount, sessionStateKey, gameState }, 'No valid game state or questionUids found in Redis for reconnection');
            return;
        }
        // Get current question from game state
        const currentQuestionIndex = gameState.currentQuestionIndex || 0;
        let currentQuestionUid = null;
        if (questionUids.length > currentQuestionIndex) {
            currentQuestionUid = questionUids[currentQuestionIndex];
            logger.info({
                accessCode,
                userId,
                attemptCount,
                currentQuestionIndex,
                derivedUid: currentQuestionUid,
                totalQuestions: questionUids.length
            }, 'Successfully derived currentQuestionUid from game state');
        }
        else {
            logger.error({
                accessCode,
                userId,
                attemptCount,
                currentQuestionIndex,
                questionUidsLength: questionUids.length
            }, 'Current question index is out of bounds for questionUids array');
            return;
        }
        if (!currentQuestionUid) {
            logger.warn({ accessCode, userId, attemptCount, sessionData }, 'No current question found in session state');
            return;
        }
        // Get the question data from the database
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: {
                    include: {
                        questions: {
                            include: {
                                question: {
                                    include: {
                                        multipleChoiceQuestion: true,
                                        numericQuestion: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!gameInstance?.gameTemplate?.questions) {
            logger.error({ accessCode, userId }, 'Could not find game questions for reconnection');
            return;
        }
        const questions = gameInstance.gameTemplate.questions;
        const currentQuestionData = questions.find(q => q.question?.uid === currentQuestionUid);
        if (!currentQuestionData?.question) {
            logger.error({ accessCode, userId, currentQuestionUid }, 'Could not find current question data for reconnection');
            return;
        }
        // Filter question for client (remove correct answers)
        const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@shared/types/quiz/liveQuestion')));
        const filteredQuestion = filterQuestionForClient(currentQuestionData.question);
        // Find question index in the questions array
        const questionIndex = questions.findIndex(q => q.question?.uid === currentQuestionUid);
        const totalQuestions = questions.length;
        // Create canonical question payload
        const canonicalPayload = {
            uid: filteredQuestion.uid,
            text: filteredQuestion.text,
            questionType: filteredQuestion.questionType,
            timeLimit: filteredQuestion.timeLimit,
            currentQuestionIndex: questionIndex,
            totalQuestions: totalQuestions,
            // Include polymorphic question data
            ...(filteredQuestion.multipleChoiceQuestion && { multipleChoiceQuestion: filteredQuestion.multipleChoiceQuestion }),
            ...(filteredQuestion.numericQuestion && { numericQuestion: filteredQuestion.numericQuestion })
        };
        // Emit the current question to restore frontend state
        logger.info({
            accessCode,
            userId,
            attemptCount,
            playerRoom,
            questionUid: canonicalPayload.uid,
            questionIndex: canonicalPayload.currentQuestionIndex
        }, 'Emitting game_question to restore frontend state');
        io.to(playerRoom).emit('game_question', canonicalPayload);
        // Get timer state and emit timer update if exists
        const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
        const questionDuration = currentQuestionData.question.timeLimit * 1000;
        const timer = await canonicalTimerService.getTimer(accessCode, currentQuestionUid, 'tournament', true, userId, attemptCount, questionDuration);
        if (timer) {
            io.to(playerRoom).emit('game_timer_updated', {
                accessCode,
                questionUid: currentQuestionUid,
                timer: timer,
                serverTime: Date.now()
            });
        }
        // Emit current score/leaderboard
        const currentScore = sessionData.score ? parseFloat(sessionData.score) : 0;
        const participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: { gameInstanceId: gameInstance.id, userId },
            include: { user: true }
        });
        if (participant?.user) {
            const singleUserLeaderboard = [{
                    userId: participant.userId,
                    username: participant.user.username || 'Unknown',
                    score: currentScore,
                    avatarEmoji: participant.user.avatarEmoji || '🐼',
                    rank: 1
                }];
            io.to(playerRoom).emit('leaderboard_update', { leaderboard: singleUserLeaderboard });
        }
        logger.info({
            accessCode,
            userId,
            attemptCount,
            currentQuestionUid,
            questionIndex,
            currentScore
        }, 'Successfully restored deferred session state for reconnection');
    }
    catch (error) {
        logger.error({ accessCode, userId, error }, 'Error restoring deferred session state');
    }
}
// Track running deferred tournament sessions by userId
const runningDeferredSessions = new Map(); // userId -> accessCode
/**
 * Clean up deferred sessions for a specific access code when game ends
 * @param accessCode - The game access code
 */
function cleanupDeferredSessionsForGame(accessCode) {
    const sessionsToRemove = [];
    // Find all user IDs with sessions for this access code
    runningDeferredSessions.forEach((sessionAccessCode, userId) => {
        if (sessionAccessCode === accessCode) {
            sessionsToRemove.push(userId);
        }
    });
    // Remove the sessions
    for (const userId of sessionsToRemove) {
        runningDeferredSessions.delete(userId);
    }
    if (sessionsToRemove.length > 0) {
        logger.info({
            accessCode,
            removedUserIds: sessionsToRemove,
            remainingSessions: runningDeferredSessions.size
        }, 'Cleaned up deferred sessions for ended game');
    }
}
/**
 * Start an individual deferred tournament session for a player
 * This creates a separate game flow for the individual player with proper timer initialization
 *
 * @param io - Socket.IO server instance
 * @param socket - Player's socket connection
 * @param accessCode - Tournament access code
 * @param userId - Player's user ID
 * @param questions - Array of tournament questions
 */
async function startDeferredTournamentSession(io, socket, accessCode, userId, questions, currentAttemptNumber) {
    logger.info({
        accessCode,
        userId,
        questionCount: questions.length,
        socketId: socket.id,
        stack: new Error().stack
    }, '🔥 DEFERRED FLOW DEBUG: startDeferredTournamentSession called (with stack trace for call origin)');
    const sessionKey = `${accessCode}_${userId}`;
    // Create unique room for this player's session
    const playerRoom = `deferred_${accessCode}_${userId}`;
    // Prevent duplicate sessions for the same user, BUT allow reconnection if Redis state is inconsistent
    if (runningDeferredSessions.has(userId)) {
        const currentAccessCode = runningDeferredSessions.get(userId);
        if (currentAccessCode === accessCode) {
            // Check if session is actually active in Redis
            const { hasOngoingDeferredSession } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/deferredTimerUtils')));
            // Use the passed currentAttemptNumber parameter for consistency
            const attemptCount = currentAttemptNumber || await getDeferredAttemptCount(accessCode, userId);
            const hasRedisSession = await hasOngoingDeferredSession({ accessCode, userId, attemptCount });
            if (hasRedisSession) {
                logger.info({ accessCode, userId, stack: new Error().stack }, 'Deferred tournament session reconnection detected - restoring session state');
                // This is a reconnection - restore the session state for the frontend
                await restoreDeferredSessionState(io, socket, accessCode, userId, attemptCount, playerRoom);
                return;
            }
            else {
                // Session is orphaned in memory but not in Redis - clean up and continue
                logger.info({ accessCode, userId }, 'Cleaning up orphaned deferred session and restarting');
                runningDeferredSessions.delete(userId);
            }
        }
        else {
            logger.warn({ accessCode, userId, currentAccessCode, stack: new Error().stack }, 'User has session for different access code - cleaning up');
            runningDeferredSessions.delete(userId);
        }
    }
    await socket.join(playerRoom);
    logger.info({
        accessCode,
        userId,
        playerRoom,
        socketId: socket.id
    }, '🔥 DEFERRED FLOW DEBUG: Player joined deferred tournament room');
    // Note: Game event handlers (GAME_ANSWER, REQUEST_NEXT_QUESTION) are already registered
    // when the socket connects, so we don't need to register them again here.
    logger.info({ accessCode, userId }, '🔥 DEFERRED FLOW DEBUG: Using existing game event handlers for deferred player');
    runningDeferredSessions.set(userId, accessCode);
    logger.info({
        accessCode,
        userId,
        playerRoom,
        questionCount: questions.length
    }, 'Starting deferred tournament session');
    // [MODERNIZATION] Redis cleanup at deferred session start is now disabled to prevent participant/score loss.
    // If you need to clear Redis for a new session, do it at session end only.
    // Catch-all entry log
    // Place entry log after accessCode and userId are defined
    logger.info({ accessCode, userId, logPoint: 'DEFERRED_SESSION_ENTRY' }, '[DEBUG] Entered startDeferredTournamentSession');
    try {
        // Initialize individual game state for this player
        const playerGameState = {
            gameId: accessCode, // Use accessCode as gameId for consistency
            accessCode,
            status: 'active',
            currentQuestionIndex: 0,
            questionUids: questions.map(q => q.uid),
            answersLocked: false,
            gameMode: 'tournament',
            // [MODERNIZATION] timer field removed. All timer state is managed by CanonicalTimerService.
            settings: {
                timeMultiplier: 1.0,
                showLeaderboard: true
            }
        };
        // Store individual session state with unique key (include attemptCount for full isolation)
        const attemptCount = currentAttemptNumber || await getDeferredAttemptCount(accessCode, userId);
        // Store attemptCount on socket for this session
        socket.data.deferredAttemptCount = attemptCount;
        const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
        await gameStateService_1.default.updateGameState(sessionStateKey, playerGameState);
        // Initialize session score to 0 (isolated from global leaderboard)
        await redis_1.redisClient.hset(sessionStateKey, 'score', '0');
        logger.info({
            accessCode,
            userId,
            attemptCount,
            sessionStateKey,
            note: 'Initialized deferred session with score 0'
        }, '[DEFERRED] Session state initialized');
        // Set session as active in Redis
        const { setDeferredSessionActive } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/deferredTimerUtils')));
        await setDeferredSessionActive({ accessCode, userId, attemptCount });
        // Always ensure participant exists for deferred mode at session start
        const { joinGame } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/joinService')));
        // Get the actual user data instead of hardcoding guest username
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, avatarEmoji: true }
        });
        let username = user?.username || `guest-${userId.substring(0, 8)}`;
        let avatarEmoji = user?.avatarEmoji || undefined;
        logger.info({
            accessCode,
            userId,
            username,
            avatarEmoji,
            logPoint: 'PRE_JOIN_GAME_CALL',
            stack: new Error().stack
        }, '[DEBUG] Calling joinGame from startDeferredTournamentSession');
        const joinResult = await joinGame({ userId, accessCode, username, avatarEmoji });
        logger.info({
            accessCode,
            userId,
            joinResult,
            logPoint: 'POST_JOIN_GAME_CALL',
            stack: new Error().stack
        }, '[DEBUG] joinGame returned in startDeferredTournamentSession');
        if (!joinResult.success || !joinResult.participant) {
            logger.error({ accessCode, userId, error: joinResult.error }, 'Failed to create/join participant at deferred session start');
            return;
        }
        // Start the question progression for this individual player
        await runDeferredQuestionSequence(io, socket, {
            userId,
            accessCode,
            questions,
            currentQuestionIndex: 0,
            playerRoom,
            sessionStartTime: Date.now(),
            attemptCount // Pass fixed attemptCount
        });
    }
    catch (error) {
        logger.error({ accessCode, userId, error }, 'Error in deferred tournament session');
        // Clean up on error
        runningDeferredSessions.delete(userId);
        socket.leave(playerRoom);
        // Emit error to player
        const errorPayload = {
            message: 'Error starting deferred tournament session'
        };
        try {
            socketEvents_zod_1.errorPayloadSchema.parse(errorPayload);
            socket.emit(events_1.SOCKET_EVENTS.GAME.ERROR, errorPayload);
        }
        catch (error) {
            logger.error('Invalid game_error payload:', error);
        }
    }
}
/**
 * Run the question sequence for an individual deferred tournament session
 */
async function runDeferredQuestionSequence(io, socket, session) {
    const { userId, accessCode, questions, playerRoom, attemptCount } = session;
    logger.info({
        accessCode,
        userId,
        questionCount: questions.length
    }, 'Starting deferred question sequence');
    // Instantiate canonical timer service
    const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
    const playMode = 'tournament';
    // For deferred tournaments, use isolated timers per player
    const isDeferred = true;
    try {
        // Process each question sequentially
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            // Use fixed attemptCount for all questions in this session
            logger.info({ accessCode, userId, attemptCount, questionUid: question.uid, logPoint: 'DEFERRED_QUESTION_LOOP_ENTRY' }, '[DEBUG] Entered deferred tournament question loop');
            // Log question object and time limit calculation
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                questionFull: question,
                timeLimitRaw: question.timeLimit,
                logPoint: 'DEFERRED_TIMER_START_ATTEMPT',
            }, '[DEBUG] About to start timer for deferred tournament question');
            const timeLimitSec = typeof question.timeLimit === 'number' && question.timeLimit > 0 ? question.timeLimit : 30;
            const durationMs = timeLimitSec * 1000;
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                timeLimitSec,
                durationMs,
                logPoint: 'DEFERRED_TIMER_DURATION_CALC',
            }, '[DEBUG] Timer duration calculated for deferred tournament question');
            // --- UNIFIED TIMER LOGIC ---
            // Always use CanonicalTimerService with correct key (userId and attemptCount for deferred)
            // Use the fixed attemptCount for the entire session (do NOT increment)
            await canonicalTimerService.resetTimer(accessCode, question.uid, playMode, isDeferred, userId, attemptCount);
            await canonicalTimerService.startTimer(accessCode, question.uid, playMode, isDeferred, userId, attemptCount);
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                logPoint: 'DEFERRED_TIMER_STARTED',
            }, '[DEBUG] Timer started for deferred tournament question');
            // --- END UNIFIED TIMER LOGIC ---
            // Retrieve timer state from canonical service (optional, for emitting to client)
            // const timer = await canonicalTimerService.getTimer(accessCode, question.uid, playMode, isDeferred, userId);
            // For now, keep timer object as before for payload
            const timerEndDateMs = Date.now() + durationMs;
            const timer = {
                status: 'run',
                timerEndDateMs,
                questionUid: question.uid
            };
            // Update session state
            const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
            const currentState = await gameStateService_1.default.getFullGameState(sessionStateKey);
            if (currentState && currentState.gameState) {
                const updatedState = {
                    ...currentState.gameState,
                    currentQuestionIndex: i,
                    timer
                };
                await gameStateService_1.default.updateGameState(sessionStateKey, updatedState);
            }
            // Send question to player
            // Modernization: Use canonical, flat payload for game_question
            const { questionDataForStudentSchema } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/socketEvents.zod')));
            const filteredQuestion = (0, liveQuestion_1.filterQuestionForClient)(question);
            let canonicalPayload = {
                uid: filteredQuestion.uid,
                text: filteredQuestion.text,
                questionType: filteredQuestion.questionType,
                timeLimit: filteredQuestion.timeLimit,
                currentQuestionIndex: i,
                totalQuestions: questions.length,
                // Include polymorphic question data
                ...(filteredQuestion.multipleChoiceQuestion && { multipleChoiceQuestion: filteredQuestion.multipleChoiceQuestion }),
                ...(filteredQuestion.numericQuestion && { numericQuestion: filteredQuestion.numericQuestion })
            };
            // Ensure timeLimit is present and valid (schema requires positive integer)
            if (canonicalPayload.timeLimit == null || canonicalPayload.timeLimit <= 0) {
                logger.warn(`Question ${question.uid} has invalid timeLimit: ${canonicalPayload.timeLimit}, using default 30s`);
                canonicalPayload.timeLimit = 30; // Default to 30 seconds
            }
            const parseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
            if (!parseResult.success) {
                logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
            }
            else {
                logger.info({
                    accessCode,
                    userId,
                    playerRoom,
                    questionIndex: i,
                    canonicalPayload
                }, 'Emitting canonical game_question for deferred session');
                io.to(playerRoom).emit('game_question', canonicalPayload);
            }
            // Emit timer update
            const timerUpdatePayload = {
                questionUid: question.uid,
                timer: timer,
                serverTime: Date.now()
            };
            io.to(playerRoom).emit('game_timer_updated', timerUpdatePayload);
            // Track question start time for this user (include attempt count for deferred session isolation)
            try {
                const questionStartKey = `mathquest:game:question_start:${accessCode}:${question.uid}:${userId}:${attemptCount}`;
                await redis_1.redisClient.set(questionStartKey, Date.now().toString(), 'EX', 300);
                logger.debug({
                    accessCode,
                    userId,
                    attemptCount,
                    questionUid: question.uid,
                    questionStartKey
                }, '[REDIS-KEY] Created question start tracking key for deferred session');
            }
            catch (error) {
                logger.error({ accessCode, userId, questionUid: question.uid, error }, 'Failed to track question start time');
            }
            // Wait for question duration
            await new Promise(resolve => setTimeout(resolve, durationMs));
            // Send correct answers using canonical payload structure
            // Extract correct answers based on question type (polymorphic structure)
            let correctAnswers = [];
            let numericAnswer;
            if ((question.questionType === 'multipleChoice' || question.questionType === 'singleChoice') && question.multipleChoiceQuestion) {
                correctAnswers = question.multipleChoiceQuestion.correctAnswers || [];
            }
            else if (question.questionType === 'numeric' && question.numericQuestion) {
                // For numeric questions, DON'T include correctAnswers array - only use numericAnswer
                numericAnswer = {
                    correctAnswer: question.numericQuestion.correctAnswer,
                    tolerance: question.numericQuestion.tolerance || 0
                };
            }
            else {
                // Fallback to legacy structure for backward compatibility
                correctAnswers = question.correctAnswers || [];
            }
            // Create canonical payload with proper schema validation
            const correctAnswersPayload = {
                questionUid: question.uid,
                ...(correctAnswers.length > 0 && { correctAnswers }),
                ...(numericAnswer && { numericAnswer })
            };
            // Validate the payload using the canonical schema
            const correctAnswersParseResult = socketEvents_zod_2.correctAnswersPayloadSchema.safeParse(correctAnswersPayload);
            if (!correctAnswersParseResult.success) {
                logger.error({
                    errors: correctAnswersParseResult.error.errors,
                    payload: correctAnswersPayload,
                    questionUid: question.uid
                }, '[DEFERRED] Invalid correct_answers payload, skipping emission');
            }
            else {
                io.to(playerRoom).emit('correct_answers', correctAnswersParseResult.data);
                logger.info({
                    accessCode,
                    userId,
                    event: 'correct_answers',
                    questionUid: question.uid,
                    questionType: question.questionType,
                    correctAnswers: correctAnswers.length > 0 ? correctAnswers : undefined,
                    numericAnswer: numericAnswer
                }, '[DEFERRED] Emitted canonical correct_answers with validation');
            }
            // Wait for correct answers display duration before proceeding
            const correctAnswersDisplayTime = (0, gameTimings_1.getCorrectAnswersDisplayTime)('tournament'); // 1.5s for all modes
            await new Promise(resolve => setTimeout(resolve, correctAnswersDisplayTime * 1000));
            // 🔒 SECURITY: Emit leaderboard only after question ends (timer expired)
            // This prevents students from determining answer correctness during submission
            try {
                // DEFERRED SESSION FIX: Send single-user leaderboard using session state (isolated score)
                // Get current participant data from database
                const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { accessCode },
                    select: { id: true }
                });
                if (!gameInstance) {
                    logger.error({ accessCode, userId }, '[DEFERRED] Could not find game instance for leaderboard update');
                    return;
                }
                const participant = await prisma_1.prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: userId
                    },
                    include: {
                        user: true
                    }
                });
                if (participant) {
                    // Get the session state score (isolated from global leaderboard)
                    const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
                    const sessionData = await redis_1.redisClient.hgetall(sessionStateKey);
                    const currentScore = sessionData?.score ? parseFloat(sessionData.score) : 0;
                    // Create a single-entry leaderboard with just this user's data
                    const singleUserLeaderboard = [{
                            userId: participant.userId,
                            username: participant.user?.username || 'Unknown',
                            score: currentScore, // Use session score (isolated from global leaderboard)
                            avatarEmoji: participant.user?.avatarEmoji || '🐼',
                            rank: 1 // Always rank 1 since it's just them
                        }];
                    // Emit directly to the player's room
                    io.to(playerRoom).emit('leaderboard_update', { leaderboard: singleUserLeaderboard });
                    logger.info({
                        accessCode,
                        userId,
                        score: currentScore,
                        sessionStateKey,
                        username: participant.user?.username,
                        event: 'leaderboard_update',
                        questionUid: question.uid,
                        timing: 'after_question_end',
                        playerRoom
                    }, '[DEFERRED] Sent single-user leaderboard after question end (using session state)');
                }
                else {
                    logger.warn({
                        accessCode,
                        userId,
                        questionUid: question.uid
                    }, '[DEFERRED] Could not find participant for leaderboard update');
                }
            }
            catch (leaderboardError) {
                logger.error({
                    accessCode,
                    userId,
                    questionUid: question.uid,
                    error: leaderboardError
                }, '[DEFERRED] Error emitting secure leaderboard update');
            }
            // Handle feedback if available
            if (question.explanation) {
                // Check if explanation was already sent (e.g., via ANSWER_RECEIVED)
                const explanationSentKey = `mathquest:explanation_sent:${accessCode}:${question.uid}:${userId}`;
                const alreadySent = await redis_1.redisClient.get(explanationSentKey);
                if (!alreadySent) {
                    // No additional delay needed here - correct answers already displayed for 1.5s above
                    const feedbackDisplayDuration = (0, gameTimings_1.getFeedbackDisplayTime)(question.feedbackWaitTime);
                    const feedbackPayload = {
                        questionUid: question.uid,
                        feedbackRemaining: feedbackDisplayDuration,
                        explanation: question.explanation
                    };
                    io.to(playerRoom).emit('feedback', feedbackPayload);
                    await new Promise(resolve => setTimeout(resolve, feedbackDisplayDuration * 1000));
                }
            }
        }
        // Tournament completed for this player
        const gameEndedPayload = {
            accessCode,
            totalQuestions: questions.length
        };
        io.to(playerRoom).emit('game_ended', gameEndedPayload);
        // Mark session as over in Redis
        const { setDeferredSessionOver } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/deferredTimerUtils')));
        await setDeferredSessionOver({ accessCode, userId, attemptCount });
        // Clean up Redis keys for this specific deferred session using deferred-specific utility
        // TEMPORARILY COMMENTED OUT FOR TESTING - to verify key format consistency
        /*
        try {
            await cleanupDeferredSessionRedisKeys(accessCode, userId, attemptCount, 'deferredSessionComplete');
            
            logger.info({
                accessCode,
                userId,
                attemptCount
            }, '[REDIS-CLEANUP] Cleaned up Redis keys for completed deferred session using deferred-specific utility');

        } catch (cleanupError) {
            logger.error({
                accessCode,
                userId,
                attemptCount,
                error: cleanupError
            }, '[REDIS-CLEANUP] Error cleaning up deferred session Redis keys');
            // Don't throw - cleanup errors shouldn't prevent session completion
        }
        */
        logger.info({
            accessCode,
            userId,
            attemptCount
        }, '[TEST] Redis cleanup DISABLED for testing - keys should remain for verification');
        logger.info({
            accessCode,
            userId,
            totalQuestions: questions.length
        }, 'Deferred tournament session completed and session marked over');
        // ANTI-CHEATING: Persist final deferred scores to database
        try {
            logger.info({
                accessCode,
                userId,
                note: 'ANTI-CHEATING: Persisting final deferred scores to database'
            }, '[ANTI-CHEATING] Starting deferred score persistence');
            // Get the game instance
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { id: true }
            });
            if (gameInstance) {
                // Get the participant's final score from Redis
                const participantKey = `mathquest:game:participants:${accessCode}`;
                const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
                if (redisParticipantData) {
                    const participantData = JSON.parse(redisParticipantData);
                    const finalScore = participantData.score || 0;
                    // Find the participant in the database
                    const dbParticipant = await prisma_1.prisma.gameParticipant.findFirst({
                        where: {
                            gameInstanceId: gameInstance.id,
                            userId: userId
                        },
                        orderBy: {
                            joinedAt: 'desc'
                        }
                    });
                    if (dbParticipant) {
                        // For deferred mode, keep the maximum between current DB score and new session score
                        const currentDeferredScore = dbParticipant.deferredScore || 0;
                        const bestScore = Math.max(currentDeferredScore, finalScore);
                        await prisma_1.prisma.gameParticipant.update({
                            where: { id: dbParticipant.id },
                            data: { deferredScore: bestScore }
                        });
                        logger.info({
                            accessCode,
                            userId,
                            participantId: dbParticipant.id,
                            sessionScore: finalScore,
                            currentDeferredScore,
                            bestScore,
                            note: 'ANTI-CHEATING: Successfully persisted best deferred score to database (Math.max logic)'
                        }, '[ANTI-CHEATING] Deferred score persisted to database (best score kept)');
                    }
                    else {
                        logger.error({ accessCode, userId }, '[ANTI-CHEATING] Participant not found in database for deferred score persistence');
                    }
                }
                else {
                    logger.warn({ accessCode, userId }, '[ANTI-CHEATING] No Redis participant data found for deferred score persistence');
                }
            }
            else {
                logger.error({ accessCode }, '[ANTI-CHEATING] Game instance not found for deferred score persistence');
            }
        }
        catch (error) {
            logger.error({
                accessCode,
                userId,
                error: error instanceof Error ? error.message : String(error)
            }, '[ANTI-CHEATING] Error persisting deferred scores to database');
        }
        // Note: Redis cleanup already performed above using shared utility after session completion
    }
    catch (error) {
        logger.error({ accessCode, userId, error }, 'Error in deferred question sequence');
        // Emit error to player
        const errorPayload = {
            message: 'Error during tournament question sequence'
        };
        try {
            socketEvents_zod_1.errorPayloadSchema.parse(errorPayload);
            io.to(playerRoom).emit('game_error', errorPayload);
        }
        catch (validationError) {
            logger.error('Invalid game_error payload:', validationError);
        }
    }
    finally {
        // Clean up session tracking
        runningDeferredSessions.delete(userId);
        logger.info({ accessCode, userId }, 'Deferred tournament session cleaned up');
    }
}
/**
 * Check if a user already has a running deferred tournament session
 */
function hasDeferredSession(userId) {
    return runningDeferredSessions.has(userId);
}
/**
 * Get the access code for a user's running deferred session
 */
function getDeferredSessionAccessCode(userId) {
    return runningDeferredSessions.get(userId);
}
/**
 * Clean up a deferred session (for disconnections, etc.)
 */
function cleanupDeferredSession(userId) {
    runningDeferredSessions.delete(userId);
    logger.info({ userId }, 'Deferred session cleaned up');
}
// Utility to get current attemptCount for a user in a deferred tournament
async function getDeferredAttemptCount(accessCode, userId) {
    // Look for existing deferred session state keys to determine the current attempt number
    const pattern = `deferred_session:${accessCode}:${userId}:*`;
    const keys = await redis_1.redisClient.keys(pattern);
    if (keys.length > 0) {
        // Extract attempt numbers from the keys and find the highest one
        const attemptNumbers = keys.map(key => {
            const parts = key.split(':');
            return parseInt(parts[parts.length - 1], 10);
        }).filter(num => !isNaN(num));
        if (attemptNumbers.length > 0) {
            return Math.max(...attemptNumbers);
        }
    }
    // If no active session, return 1 for the first attempt
    return 1;
}
