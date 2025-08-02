"use strict";
// Shared game flow logic for quiz and tournament modes
// Place all core progression, timer, answer reveal, feedback, and leaderboard logic here
// This module should be imported by both quiz and tourname
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
exports.runGameFlow = runGameFlow;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const redisCleanup_1 = require("@/utils/redisCleanup");
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const liveQuestion_1 = require("@shared/types/quiz/liveQuestion");
const prisma_1 = require("@/db/prisma");
const emitQuestionHandler_1 = require("./game/emitQuestionHandler");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const sharedLeaderboard_1 = require("./sharedLeaderboard");
const leaderboardSnapshotService_1 = require("@/core/services/gameParticipant/leaderboardSnapshotService");
const gameTimings_1 = require("@shared/constants/gameTimings");
const logger = (0, logger_1.default)('SharedGameFlow');
// Track running game flows to prevent duplicates
const runningGameFlows = new Set();
/**
 * Shared function to orchestrate the game/tournament flow
 * Handles question progression, timers, answer reveal, feedback, and leaderboard
 * @param io Socket.IO server
 * @param accessCode Game access code (room)
 * @param questions Array of questions
 * @param options GameFlowOptions for mode-specific hooks
 */
async function runGameFlow(io, accessCode, questions, options) {
    logger.info({ accessCode }, `[SharedGameFlow] runGameFlow entry`);
    // Prevent duplicate game flows for the same access code
    if (runningGameFlows.has(accessCode)) {
        logger.warn({ accessCode }, `[SharedGameFlow] Game flow already running for this access code. Skipping duplicate.`);
        return;
    }
    runningGameFlows.add(accessCode);
    logger.info({ accessCode, playMode: options.playMode, questionCount: questions.length }, `[SharedGameFlow] Starting game flow. Initial delay removed as countdown is now handled by caller.`);
    try {
        // [MODERNIZATION] Redis cleanup at game start is now disabled to prevent participant/score loss.
        // If you need to clear Redis for a new game, do it at game end only.
        // Update all PENDING participants to ACTIVE when game starts
        // This prevents them from being removed when they disconnect
        await prisma_1.prisma.gameParticipant.updateMany({
            where: {
                gameInstance: { accessCode },
                status: 'PENDING'
            },
            data: {
                status: 'ACTIVE'
            }
        });
        logger.info({ accessCode }, '[SharedGameFlow] Updated all PENDING participants to ACTIVE status');
        logger.info({ accessCode }, `[SharedGameFlow] Proceeding with first question immediately.`);
        for (let i = 0; i < questions.length; i++) {
            // Set and persist timer in game state before emitting question
            const timeLimitSec = questions[i].timeLimit || 30;
            const durationMs = timeLimitSec * 1000;
            const timerEndDateMs = Date.now() + durationMs;
            const timer = {
                status: 'run',
                timerEndDateMs,
                questionUid: typeof questions[i].uid === 'string' && questions[i].uid ? questions[i].uid : 'unknown',
            };
            // Fetch and update game state
            const currentState = await gameStateService_1.default.getFullGameState(accessCode);
            if (currentState && currentState.gameState) {
                const updatedState = {
                    ...currentState.gameState,
                    currentQuestionIndex: i,
                    timer
                };
                await gameStateService_1.default.updateGameState(accessCode, updatedState);
            }
            if (i === 0) {
                const room = io.sockets.adapter.rooms.get(`game_${accessCode}`);
                const socketIds = room ? Array.from(room) : [];
                logger.info({ accessCode, room: `game_${accessCode}`, socketIds }, '[DEBUG] Sockets in live room before emitting first game_question');
            }
            logger.info({ accessCode, questionIndex: i, questionUid: questions[i].uid }, '[DEBUG] Preparing to emit game_question');
            // Modernized: Canonical, flat payload for game_question
            const { questionDataForStudentSchema } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/socketEvents.zod')));
            let filteredQuestion = (0, liveQuestion_1.filterQuestionForClient)(questions[i]);
            // Ensure timeLimit is present and valid (schema requires positive integer)
            if (filteredQuestion.timeLimit == null || filteredQuestion.timeLimit <= 0) {
                logger.warn(`Question ${questions[i].uid} has invalid timeLimit: ${filteredQuestion.timeLimit}, using default 30s`);
                filteredQuestion.timeLimit = 30; // Default to 30 seconds
            }
            const canonicalPayload = {
                ...filteredQuestion,
                currentQuestionIndex: i,
                totalQuestions: questions.length
            };
            // Define liveRoom and projectionRoom before use
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${currentState?.gameState?.gameId || ''}`;
            // Validate with Zod before emitting
            const parseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
            if (!parseResult.success) {
                logger.error({
                    errors: parseResult.error.errors,
                    canonicalPayload,
                    questionUid: questions[i].uid,
                    questionType: questions[i].questionType,
                    timeLimit: questions[i].timeLimit,
                    filteredQuestion
                }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting - THIS IS THE CAUSE OF TIMER ISSUES');
                // This validation failure prevents the question from being sent to frontend!
                throw new Error(`Question payload validation failed for ${questions[i].uid}: ${JSON.stringify(parseResult.error.errors)}`);
            }
            else {
                io.to([liveRoom, projectionRoom]).emit('game_question', canonicalPayload);
                logger.info({ rooms: [liveRoom, projectionRoom], event: 'game_question', questionUid: questions[i].uid, canonicalPayload }, '[MODERNIZATION] Emitted canonical GAME_QUESTION to live and projection rooms');
            }
            logger.info({ accessCode }, '[DEBUG] About to call emitQuestion for all sockets in room');
            // Fetch all sockets in the room
            const roomName = `game_${accessCode}`;
            const socketsInRoom = await io.in(roomName).fetchSockets();
            // Map userIds to real Socket instances (not RemoteSocket)
            const allSockets = Array.from(io.sockets.sockets.values());
            logger.info({ accessCode, socketsInRoomCount: socketsInRoom.length, allSocketsCount: allSockets.length }, '[DEBUG] Socket counts before emitQuestion loop');
            for (const remoteSocket of socketsInRoom) {
                const userId = remoteSocket.data.userId;
                if (!userId) {
                    logger.warn({ accessCode, socketId: remoteSocket.id }, '[DEBUG] Socket has no userId, skipping');
                    continue;
                }
                // Find a real Socket instance for this userId
                const realSocket = allSockets.find(s => s.data && s.data.userId === userId);
                if (realSocket) {
                    try {
                        logger.info({ accessCode, userId }, '[DEBUG] About to call emitQuestion for user');
                        const emitQuestion = (0, emitQuestionHandler_1.emitQuestionHandler)(io, realSocket);
                        await emitQuestion({
                            accessCode,
                            userId,
                            questionUid: questions[i].uid
                        });
                        logger.info({ accessCode, userId }, '[DEBUG] emitQuestion completed successfully for user');
                    }
                    catch (emitQuestionError) {
                        logger.error({ accessCode, userId, error: emitQuestionError }, '[DEBUG] Error in emitQuestion for user');
                        throw emitQuestionError;
                    }
                }
                else {
                    logger.warn({ accessCode, userId }, '[DEBUG] Could not find real socket for userId');
                }
            }
            logger.info({ accessCode, event: 'game_question', questionUid: questions[i].uid }, '[TRACE] Emitted game_question');
            logger.info({ accessCode }, '[DEBUG] About to track question start times');
            // Track question start time for all users currently in the room for server-side timing
            try {
                const roomName = `game_${accessCode}`;
                const socketsInRoom = await io.in(roomName).fetchSockets();
                const currentTime = Date.now();
                for (const socket of socketsInRoom) {
                    if (socket.data.userId) {
                        const questionStartKey = `mathquest:game:question_start:${accessCode}:${questions[i].uid}:${socket.data.userId}`;
                        // Only set if not already set (in case of reconnections)
                        const existingStartTime = await redis_1.redisClient.get(questionStartKey);
                        if (!existingStartTime) {
                            await redis_1.redisClient.set(questionStartKey, currentTime.toString(), 'EX', 300); // Expire after 5 minutes
                        }
                    }
                }
                logger.debug({
                    accessCode,
                    questionUid: questions[i].uid,
                    userCount: socketsInRoom.length
                }, 'Tracked question start time for all users in room');
            }
            catch (error) {
                logger.error({
                    accessCode,
                    questionUid: questions[i].uid,
                    error
                }, 'Failed to track question start times for users');
            }
            // --- Timer is already started in emitQuestionHandler, no need to start again ---
            // Note: Removed redundant timer start that was causing conflicts
            logger.info({ accessCode }, '[DEBUG] About to emit timer events');
            // Emit timer update to start frontend countdown
            try {
                logger.info({ accessCode, timer }, '[DEBUG] Creating canonical timer from timer object');
                const canonicalTimer = toCanonicalTimer({ ...timer, questionUid: typeof questions[i].uid === 'string' && questions[i].uid.length > 0 ? questions[i].uid : '' });
                logger.info({ accessCode, canonicalTimer }, '[DEBUG] Canonical timer created successfully');
                logger.info({ accessCode, currentStateAnswersLocked: currentState?.gameState?.answersLocked }, '[DEBUG] About to call emitCanonicalTimerEvents');
                emitCanonicalTimerEvents(io, [
                    { room: `game_${accessCode}`, event: 'game_timer_updated', extra: {} },
                    { room: liveRoom, event: 'game_timer_updated', extra: {} },
                    { room: projectionRoom, event: 'game_timer_updated', extra: {} }
                ], {
                    accessCode,
                    timer: canonicalTimer,
                    questionUid: canonicalTimer.questionUid,
                    questionIndex: i,
                    totalQuestions: questions.length,
                    answersLocked: currentState?.gameState?.answersLocked
                });
                logger.info({ accessCode }, '[DEBUG] emitCanonicalTimerEvents call completed');
            }
            catch (timerError) {
                const errorMessage = timerError instanceof Error ? timerError.message : 'Unknown error';
                const errorStack = timerError instanceof Error ? timerError.stack : 'No stack trace';
                logger.error({ accessCode, error: timerError, errorMessage, errorStack }, '[DEBUG] Error in timer events emission - DETAILED');
                throw timerError;
            }
            logger.info({ accessCode }, '[DEBUG] Timer events emitted, about to call onQuestionStart');
            try {
                options.onQuestionStart?.(i);
                logger.info({ accessCode }, '[DEBUG] onQuestionStart called successfully, about to wait for timer');
            }
            catch (onQuestionStartError) {
                logger.error({ accessCode, error: onQuestionStartError }, '[DEBUG] Error in onQuestionStart callback');
                throw onQuestionStartError;
            }
            logger.info({ accessCode, timerDuration: questions[i].timeLimit * 1000 }, '[DEBUG] Starting timer wait');
            try {
                await new Promise((resolve) => setTimeout(resolve, questions[i].timeLimit * 1000));
                logger.info({ accessCode }, '[DEBUG] Timer wait completed successfully');
            }
            catch (timerWaitError) {
                logger.error({ accessCode, error: timerWaitError }, '[DEBUG] Error during timer wait');
                throw timerWaitError;
            }
            logger.info({ room: `game_${accessCode}`, event: 'correct_answers', questionUid: questions[i].uid }, '[DEBUG] Emitting correct_answers');
            // Extract correct answers based on question type (polymorphic structure)
            let correctAnswers = [];
            if ((questions[i].questionType === 'multipleChoice' || questions[i].questionType === 'singleChoice') && questions[i].multipleChoiceQuestion) {
                correctAnswers = questions[i].multipleChoiceQuestion.correctAnswers || [];
            }
            else if (questions[i].questionType === 'numeric' && questions[i].numericQuestion) {
                correctAnswers = [questions[i].numericQuestion.correctAnswer];
            }
            else {
                // Fallback to legacy structure for backward compatibility
                correctAnswers = questions[i].correctAnswers || [];
            }
            // Send correct answers with the event (not filtered out like in game_question)
            const correctAnswersPayload = {
                questionUid: questions[i].uid,
                correctAnswers: correctAnswers
            };
            io.to(`game_${accessCode}`).emit('correct_answers', correctAnswersPayload);
            logger.info({ accessCode, event: 'correct_answers', questionUid: questions[i].uid, correctAnswers: correctAnswers }, '[TRACE] Emitted correct_answers');
            options.onQuestionEnd?.(i);
            // 🔒 SECURITY: Emit leaderboard only after question ends (timer expired)
            // This prevents students from determining answer correctness during submission
            try {
                // First, sync the snapshot with current live data
                const syncedSnapshot = await (0, leaderboardSnapshotService_1.syncSnapshotWithLiveData)(accessCode);
                // Then emit the leaderboard from the snapshot (source of truth)
                await (0, leaderboardSnapshotService_1.emitLeaderboardFromSnapshot)(io, accessCode, [`game_${accessCode}`], 'after_question_end');
                logger.info({
                    accessCode,
                    event: 'leaderboard_update',
                    questionUid: questions[i].uid,
                    leaderboardCount: syncedSnapshot.length,
                    timing: 'after_question_end'
                }, '[SECURITY] Emitted secure leaderboard_update after question timer expired using snapshot');
            }
            catch (leaderboardError) {
                logger.error({
                    accessCode,
                    questionUid: questions[i].uid,
                    error: leaderboardError
                }, '[SECURITY] Error emitting secure leaderboard update');
            }
            // [MODERNIZATION] Removed legacy call to gameStateService.calculateScores.
            // All scoring is now handled via ScoringService.submitAnswerWithScoring or canonical participant service.
            // If batch scoring is needed, refactor to use canonical logic per participant/answer.
            // Two separate timing concerns:
            // 1. Delay between correct answers and feedback event (1.5s for all modes)
            const correctAnswersToFeedbackDelay = (0, gameTimings_1.getCorrectAnswersDisplayTime)(options.playMode);
            // 2. Feedback display duration (from question or default to 5s)
            const feedbackDisplayDuration = (0, gameTimings_1.getFeedbackDisplayTime)(questions[i].feedbackWaitTime);
            // Wait for the delay between correct answers and feedback
            await new Promise((resolve) => setTimeout(resolve, correctAnswersToFeedbackDelay * 1000));
            // Only emit feedback event if there's an explanation to show
            if (questions[i].explanation) {
                // Emit feedback event with the full feedback display duration and explanation
                logger.info({ room: `game_${accessCode}`, event: 'feedback', questionUid: questions[i].uid, feedbackDisplayDuration }, '[DEBUG] Emitting feedback');
                // DETAILED LOGGING: Debug explanation transmission
                const feedbackPayload = {
                    questionUid: questions[i].uid,
                    feedbackRemaining: feedbackDisplayDuration,
                    explanation: questions[i].explanation // Include explanation in feedback event
                };
                logger.info('=== BACKEND FEEDBACK PAYLOAD DEBUG ===', {
                    accessCode,
                    questionIndex: i,
                    questionUid: questions[i].uid,
                    questionExplanation: questions[i].explanation,
                    explanationLength: questions[i].explanation.length,
                    explanationExists: true,
                    payloadExplanation: feedbackPayload.explanation,
                    fullPayload: JSON.stringify(feedbackPayload)
                });
                io.to(`game_${accessCode}`).emit('feedback', feedbackPayload);
                logger.info({ accessCode, event: 'feedback', questionUid: questions[i].uid, feedbackDisplayDuration, hasExplanation: true }, '[TRACE] Emitted feedback');
                options.onFeedback?.(i);
                // Wait for feedback display duration before proceeding to next question
                await new Promise((resolve) => setTimeout(resolve, feedbackDisplayDuration * 1000));
            }
            else {
                // No explanation - skip feedback phase and proceed directly
                logger.info({ accessCode, questionUid: questions[i].uid }, '[DEBUG] Skipping feedback phase - no explanation available');
                options.onFeedback?.(i); // Still call the callback for consistency
            }
        }
        // Game completed - persist final leaderboard to database
        try {
            const finalLeaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
            await (0, sharedLeaderboard_1.persistLeaderboardToGameInstance)(accessCode, finalLeaderboard);
            logger.info({ accessCode, leaderboard: finalLeaderboard }, '[SharedGameFlow] Final leaderboard persisted to database');
            // Clear Redis game data after persisting scores to database
            // This ensures clean state and prevents old scores from contaminating future sessions
            await (0, redisCleanup_1.cleanupGameRedisKeys)(accessCode, 'sharedGameFlow');
        }
        catch (error) {
            logger.error({ accessCode, error }, '[SharedGameFlow] Error persisting final leaderboard');
        }
        // Update tournament database fields when game ends
        try {
            const endedAt = new Date();
            const differedAvailableFrom = endedAt;
            const differedAvailableTo = new Date(endedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
            await prisma_1.prisma.gameInstance.update({
                where: { accessCode },
                data: {
                    status: 'completed',
                    endedAt: endedAt,
                    differedAvailableFrom: differedAvailableFrom,
                    differedAvailableTo: differedAvailableTo
                }
            });
            // --- MODERNIZATION: Ensure Redis game state is also marked as completed ---
            const redisState = await gameStateService_1.default.getFullGameState(accessCode);
            if (redisState && redisState.gameState) {
                if (redisState.gameState.status !== 'completed') {
                    logger.warn({ accessCode, redisStatus: redisState.gameState.status }, '[MODERNIZATION] Redis game state was not marked completed when DB was. Forcing sync.');
                    const updatedRedisState = {
                        ...redisState.gameState,
                        status: 'completed',
                        endedAt: endedAt.getTime()
                    };
                    await gameStateService_1.default.updateGameState(accessCode, updatedRedisState);
                }
            }
            logger.info({
                accessCode,
                status: 'completed',
                endedAt: endedAt.toISOString(),
                differedAvailableFrom: differedAvailableFrom.toISOString(),
                differedAvailableTo: differedAvailableTo.toISOString()
            }, '[SharedGameFlow] Tournament database fields updated on completion');
        }
        catch (error) {
            logger.error({ accessCode, error }, '[SharedGameFlow] Error updating tournament database fields');
        }
        // Game completed, emit game_ended with stats for navigation
        const latestState = await gameStateService_1.default.getFullGameState(accessCode);
        const projectionRoom = `projection_${latestState?.gameState?.gameId || ''}`;
        const liveRoom = `game_${accessCode}`;
        const gameEndedPayload = {
            accessCode,
            totalQuestions: questions.length
        };
        io.to([liveRoom, projectionRoom]).emit('game_ended', gameEndedPayload);
        logger.info({ rooms: [liveRoom, projectionRoom], event: 'game_ended', payload: gameEndedPayload }, '[TRACE] Emitted game_ended to live and projection rooms');
        options.onGameEnd?.();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';
        const errorName = error instanceof Error ? error.name : 'Unknown error type';
        logger.error({
            accessCode,
            error,
            errorMessage,
            errorStack,
            errorName,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name
        }, '[SharedGameFlow] DETAILED Error in game flow');
    }
    finally {
        // Clean up running game flow tracking
        runningGameFlows.delete(accessCode);
        logger.info({ accessCode }, '[SharedGameFlow] Game flow completed and cleaned up');
    }
}
function toCanonicalTimer(timer) {
    const status = timer && typeof timer.status === 'string' && ['run', 'pause', 'stop'].includes(timer.status) ? timer.status : 'run';
    const canonical = {
        ...timer,
        status,
        questionUid: typeof timer?.questionUid === 'string' && timer.questionUid.length > 0 ? timer.questionUid : 'unknown',
    };
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer input:', timer);
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer output:', canonical);
    return canonical;
}
function emitCanonicalTimerEvents(io, rooms, payloadBase) {
    const canonicalPayload = {
        ...payloadBase,
        timer: toCanonicalTimer(payloadBase.timer),
        questionUid: typeof payloadBase.questionUid === 'string' && payloadBase.questionUid ? payloadBase.questionUid : 'unknown',
        questionIndex: typeof payloadBase.questionIndex === 'number' ? payloadBase.questionIndex : 0,
        totalQuestions: typeof payloadBase.totalQuestions === 'number' ? payloadBase.totalQuestions : 1,
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false,
        serverTime: Date.now()
    };
    const validation = socketEvents_zod_1.dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
    if (!validation.success) {
        logger.error({
            error: validation.error.format(),
            payload: canonicalPayload,
            payloadTimer: canonicalPayload.timer,
            validationErrors: validation.error.errors
        }, '[TIMER] Invalid canonical timer payload, not emitting - THIS IS LIKELY THE CAUSE OF THE GAME FLOW ERROR');
        // Don't throw here, just return to prevent emission
        return;
    }
    for (const { room, event, extra } of rooms) {
        io.to(room).emit(event, { ...canonicalPayload, ...extra });
    }
}
