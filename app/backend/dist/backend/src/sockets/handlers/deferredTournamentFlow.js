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
exports.startDeferredTournamentSession = startDeferredTournamentSession;
exports.hasDeferredSession = hasDeferredSession;
exports.getDeferredSessionAccessCode = getDeferredSessionAccessCode;
exports.cleanupDeferredSession = cleanupDeferredSession;
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const redis_1 = require("@/config/redis");
const liveQuestion_1 = require("@shared/types/quiz/liveQuestion");
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const prisma_1 = require("@/db/prisma");
const canonicalTimerService_1 = require("@/core/services/canonicalTimerService");
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
        socketId: socket.id,
        stack: new Error().stack
    }, '🔥 DEFERRED FLOW DEBUG: startDeferredTournamentSession called (with stack trace for call origin)');
    const sessionKey = `${accessCode}_${userId}`;
    // Prevent duplicate sessions for the same user
    if (runningDeferredSessions.has(userId)) {
        logger.warn({ accessCode, userId, stack: new Error().stack }, 'Deferred tournament session already running for this user (with stack trace)');
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
        const attemptCount = await getDeferredAttemptCount(accessCode, userId);
        // Store attemptCount on socket for this session
        socket.data.deferredAttemptCount = attemptCount;
        const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
        await gameStateService_1.default.updateGameState(sessionStateKey, playerGameState);
        // Set session as active in Redis
        const { setDeferredSessionActive } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/deferredTimerUtils')));
        await setDeferredSessionActive({ accessCode, userId, attemptCount });
        // Always ensure participant exists for deferred mode at session start
        const { joinGame } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/joinService')));
        let username = `guest-${userId.substring(0, 8)}`;
        let avatarEmoji = undefined;
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
    const isDiffered = true;
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
            await canonicalTimerService.resetTimer(accessCode, question.uid, playMode, isDiffered, userId, attemptCount);
            await canonicalTimerService.startTimer(accessCode, question.uid, playMode, isDiffered, userId, attemptCount);
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                logPoint: 'DEFERRED_TIMER_STARTED',
            }, '[DEBUG] Timer started for deferred tournament question');
            // --- END UNIFIED TIMER LOGIC ---
            // Retrieve timer state from canonical service (optional, for emitting to client)
            // const timer = await canonicalTimerService.getTimer(accessCode, question.uid, playMode, isDiffered, userId);
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
            let canonicalPayload = {
                ...(0, liveQuestion_1.filterQuestionForClient)(question),
                currentQuestionIndex: i,
                totalQuestions: questions.length
            };
            if (canonicalPayload.timeLimit == null) {
                const { timeLimit, ...rest } = canonicalPayload;
                canonicalPayload = rest;
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
            // Handle feedback if available
            if (question.explanation) {
                // Check if explanation was already sent (e.g., via ANSWER_RECEIVED)
                const explanationSentKey = `mathquest:explanation_sent:${accessCode}:${question.uid}:${userId}`;
                const alreadySent = await redis_1.redisClient.get(explanationSentKey);
                if (!alreadySent) {
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
        logger.info({
            accessCode,
            userId,
            totalQuestions: questions.length
        }, 'Deferred tournament session completed and session marked over');
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
    const gameInstance = await prisma_1.prisma.gameInstance.findUnique({ where: { accessCode }, select: { id: true } });
    if (!gameInstance)
        return 1;
    const participant = await prisma_1.prisma.gameParticipant.findFirst({
        where: { gameInstanceId: gameInstance.id, userId, participationType: 'DEFERRED' },
        select: { attemptCount: true }
    });
    return participant?.attemptCount || 1;
}
