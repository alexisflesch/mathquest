"use strict";
// Deferred tournament game flow logic
// Handles individual player sessions for asynchronous tournament replay
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDeferredTournamentSession = startDeferredTournamentSession;
exports.hasDeferredSession = hasDeferredSession;
exports.getDeferredSessionAccessCode = getDeferredSessionAccessCode;
exports.cleanupDeferredSession = cleanupDeferredSession;
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const redis_1 = require("@/config/redis");
const liveQuestion_1 = require("@shared/types/quiz/liveQuestion");
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const logger = (0, logger_1.default)('DeferredTournamentFlow');
// Track running deferred tournament sessions by userId
const runningDeferredSessions = new Map(); // userId -> accessCode
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
async function startDeferredTournamentSession(io, socket, accessCode, userId, questions) {
    logger.info({
        accessCode,
        userId,
        questionCount: questions.length,
        socketId: socket.id
    }, '🔥 DEFERRED FLOW DEBUG: startDeferredTournamentSession called');
    const sessionKey = `${accessCode}_${userId}`;
    // Prevent duplicate sessions for the same user
    if (runningDeferredSessions.has(userId)) {
        logger.warn({ accessCode, userId }, 'Deferred tournament session already running for this user');
        return;
    }
    // Create unique room for this player's session
    const playerRoom = `deferred_${accessCode}_${userId}`;
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
            timer: {
                status: 'pause', // Start paused, will be activated with first question
                timeLeftMs: 0,
                durationMs: 0,
                questionUid: null,
                timestamp: Date.now(),
                localTimeLeftMs: null
            },
            settings: {
                timeMultiplier: 1.0,
                showLeaderboard: true
            }
        };
        // Store individual session state with unique key
        const sessionStateKey = `deferred_session:${accessCode}:${userId}`;
        await gameStateService_1.default.updateGameState(sessionStateKey, playerGameState);
        // Start the question progression for this individual player
        await runDeferredQuestionSequence(io, socket, {
            userId,
            accessCode,
            questions,
            currentQuestionIndex: 0,
            playerRoom,
            sessionStartTime: Date.now()
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
    const { userId, accessCode, questions, playerRoom } = session;
    logger.info({
        accessCode,
        userId,
        questionCount: questions.length
    }, 'Starting deferred question sequence');
    try {
        // Process each question sequentially
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const timeLimitSec = question.timeLimit || 30;
            const durationMs = timeLimitSec * 1000;
            logger.info({
                accessCode,
                userId,
                questionIndex: i,
                questionUid: question.uid,
                timeLimit: timeLimitSec
            }, 'Starting deferred tournament question');
            // Create fresh timer for this question
            const timer = {
                status: 'play',
                timeLeftMs: durationMs,
                durationMs: durationMs,
                questionUid: question.uid,
                timestamp: Date.now(),
                localTimeLeftMs: null
            };
            // Update session state
            const sessionStateKey = `deferred_session:${accessCode}:${userId}`;
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
            const filteredQuestion = (0, liveQuestion_1.filterQuestionForClient)(question);
            const gameQuestionPayload = {
                question: filteredQuestion,
                questionIndex: i,
                totalQuestions: questions.length,
                feedbackWaitTime: question.feedbackWaitTime || 1.5,
                timer: timer
            };
            logger.info({
                accessCode,
                userId,
                playerRoom,
                questionIndex: i,
                timer: timer
            }, 'Emitting game_question for deferred session');
            // Emit to individual player room
            io.to(playerRoom).emit('game_question', gameQuestionPayload);
            // Emit timer update
            const timerUpdatePayload = {
                questionUid: question.uid,
                timer: timer
            };
            io.to(playerRoom).emit('game_timer_updated', timerUpdatePayload);
            // Track question start time for this user
            try {
                const questionStartKey = `mathquest:game:question_start:${accessCode}:${question.uid}:${userId}`;
                await redis_1.redisClient.set(questionStartKey, Date.now().toString(), 'EX', 300);
            }
            catch (error) {
                logger.error({ accessCode, userId, questionUid: question.uid, error }, 'Failed to track question start time');
            }
            // Wait for question duration
            await new Promise(resolve => setTimeout(resolve, durationMs));
            // Send correct answers
            const correctAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: question.correctAnswers || []
            };
            io.to(playerRoom).emit('correct_answers', correctAnswersPayload);
            // Calculate score for this player's answer (if any)
            try {
                await gameStateService_1.default.calculateScores(accessCode, question.uid);
            }
            catch (error) {
                logger.error({ accessCode, userId, questionUid: question.uid, error }, 'Error calculating scores for deferred session');
            }
            // Handle feedback if available
            if (question.explanation) {
                // Small delay before feedback
                await new Promise(resolve => setTimeout(resolve, 1500));
                const feedbackDisplayDuration = (typeof question.feedbackWaitTime === 'number' && question.feedbackWaitTime > 0)
                    ? question.feedbackWaitTime
                    : 5;
                const feedbackPayload = {
                    questionUid: question.uid,
                    feedbackRemaining: feedbackDisplayDuration,
                    explanation: question.explanation
                };
                io.to(playerRoom).emit('feedback', feedbackPayload);
                // Wait for feedback duration
                await new Promise(resolve => setTimeout(resolve, feedbackDisplayDuration * 1000));
            }
        }
        // Tournament completed for this player
        const gameEndedPayload = {
            accessCode,
            totalQuestions: questions.length
        };
        io.to(playerRoom).emit('game_ended', gameEndedPayload);
        logger.info({
            accessCode,
            userId,
            totalQuestions: questions.length
        }, 'Deferred tournament session completed');
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
