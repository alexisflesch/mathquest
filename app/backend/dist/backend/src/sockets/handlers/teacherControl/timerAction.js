"use strict";
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
exports.timerActionHandler = timerActionHandler;
exports.clearAllTimers = clearAllTimers;
exports.clearTimerForGame = clearTimerForGame;
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// Create a handler-specific logger
const logger = (0, logger_1.default)('TimerActionHandler');
// Redis key prefix for game state
const GAME_KEY_PREFIX = 'mathquest:game:';
// Create GameInstanceService instance
const gameInstanceService = new gameInstanceService_1.GameInstanceService();
// Timer management for automatic expiry
const activeTimers = new Map();
/**
 * Clear an existing timer for a game
 */
function clearGameTimer(gameId) {
    const existingTimer = activeTimers.get(gameId);
    if (existingTimer) {
        clearTimeout(existingTimer);
        activeTimers.delete(gameId);
        logger.info({ gameId }, '[TIMER_EXPIRY] Cleared existing timer');
    }
}
/**
 * Start automatic timer expiry for a game
 */
function startGameTimer(io, gameId, accessCode, durationMs, questionUid) {
    // Clear any existing timer first
    clearGameTimer(gameId);
    logger.info({ gameId, accessCode, durationMs, questionUid }, '[TIMER_EXPIRY] Starting automatic timer expiry');
    const timeout = setTimeout(async () => {
        try {
            logger.info({ gameId, accessCode, questionUid }, '[TIMER_EXPIRY] Timer expired, auto-stopping');
            // Remove from active timers
            activeTimers.delete(gameId);
            // Get current game state
            const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
            if (!gameStateRaw) {
                logger.warn({ gameId, accessCode }, '[TIMER_EXPIRY] Game state not found when timer expired');
                return;
            }
            const gameState = JSON.parse(gameStateRaw);
            // Update timer to stopped state
            const now = Date.now();
            const expiredTimer = {
                status: 'stop',
                timeLeftMs: 0,
                durationMs: gameState.timer?.durationMs || durationMs,
                questionUid: questionUid || gameState.timer?.questionUid || null,
                timestamp: now,
                localTimeLeftMs: null
            };
            // Update game state
            gameState.timer = expiredTimer;
            await gameStateService_1.default.updateGameState(accessCode, gameState);
            // Broadcast timer expiry to all rooms using same structure as manual actions
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;
            logger.info({ gameId, accessCode, dashboardRoom, liveRoom, projectionRoom, timer: expiredTimer }, '[TIMER_EXPIRY] Broadcasting timer expiry to all rooms');
            // To dashboard (include questionUid to match frontend validation)
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer: expiredTimer, questionUid: expiredTimer.questionUid });
            logger.info({ gameId, dashboardRoom, timer: expiredTimer }, '[TIMER_EXPIRY] Emitted expiry to dashboardRoom');
            // To live room (for quiz players)
            io.to(liveRoom).emit('game_timer_updated', { timer: expiredTimer });
            logger.info({ gameId, liveRoom, timer: expiredTimer }, '[TIMER_EXPIRY] Emitted expiry to liveRoom');
            // To projection room
            io.to(projectionRoom).emit('projection_timer_updated', { timer: expiredTimer });
            logger.info({ gameId, projectionRoom, timer: expiredTimer }, '[TIMER_EXPIRY] Emitted expiry to projectionRoom');
        }
        catch (error) {
            logger.error({ gameId, accessCode, error }, '[TIMER_EXPIRY] Error handling timer expiry');
        }
    }, durationMs);
    activeTimers.set(gameId, timeout);
}
function timerActionHandler(io, socket) {
    return async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.timerActionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid timerAction payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid timerAction payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }
        const validPayload = parseResult.data;
        logger.warn('🔥 CRITICAL DEBUG: Backend timer action received', {
            payload: validPayload,
            'payload.questionUid': validPayload.questionUid,
            'payload.questionUid type': typeof validPayload.questionUid,
            'payload.questionUid length': validPayload.questionUid ? validPayload.questionUid.length : 'null/undefined',
            'payload.action': validPayload.action,
            'payload.accessCode': validPayload.accessCode,
            'JSON.stringify(payload)': JSON.stringify(validPayload)
        });
        logger.info({ payload: validPayload }, 'Received quiz_timer_action event');
        // Look up game instance by access code
        const { accessCode, action, duration, questionUid } = validPayload;
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode }
        });
        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            });
            return;
        }
        const gameId = gameInstance.id;
        const durationMs = duration; // Use duration from schema
        const userId = socket.data?.userId || socket.data?.user?.userId;
        logger.warn('🔥 CRITICAL DEBUG: Destructured backend values', {
            gameId,
            action,
            durationMs,
            questionUid,
            'questionUid type': typeof questionUid,
            'questionUid length': questionUid ? questionUid.length : 'null/undefined',
            userId
        });
        logger.info({ gameId, userId, action, durationMs, questionUid }, 'Timer action handler entered');
        if (!gameId) {
            logger.warn({ action }, 'No gameId provided in payload, aborting timer action');
            const errorPayload = {
                message: 'gameId is required to control the timer',
                code: 'GAME_ID_REQUIRED'
            };
            socket.emit('error_dashboard', errorPayload);
            return;
        }
        if (!userId) {
            logger.warn({ gameId, action }, 'No userId on socket, aborting timer action');
            const errorPayload = {
                message: 'Authentication required to control the timer',
                code: 'AUTHENTICATION_REQUIRED'
            };
            socket.emit('error_dashboard', errorPayload);
            return;
        }
        logger.info({ gameId, userId, action, durationMs }, 'Timer action requested');
        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    OR: [
                        { initiatorUserId: userId },
                        { gameTemplate: { creatorId: userId } }
                    ]
                },
                include: {
                    gameTemplate: true
                }
            });
            if (!gameInstance) {
                logger.warn({ gameId, userId, action }, 'Not authorized for this game, aborting timer action');
                const errorPayload = {
                    message: 'Not authorized to control this game',
                    code: 'NOT_AUTHORIZED'
                };
                socket.emit('error_dashboard', errorPayload);
                return;
            }
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
            if (!fullState || !fullState.gameState) {
                logger.warn({ gameId, userId, action }, 'No game state found, aborting timer action');
                const errorPayload = {
                    message: 'Could not retrieve game state',
                    code: 'STATE_ERROR'
                };
                socket.emit('error_dashboard', errorPayload);
                return;
            }
            const gameState = fullState.gameState;
            // Initialize timer with safe defaults using shared type structure
            let timer = gameState.timer ? { ...gameState.timer } : {
                status: 'stop',
                timeLeftMs: 30000,
                durationMs: 30000,
                questionUid: null,
                timestamp: Date.now(),
                localTimeLeftMs: null
            };
            const now = Date.now();
            // Validate duration if provided (durationMs is already in milliseconds)
            const validDurationMs = durationMs && durationMs > 0 ? durationMs : undefined;
            // Update timer based on the action
            switch (action) {
                case 'start':
                    logger.info({ gameId, action, now, validDurationMs, timer }, '[TIMER_ACTION] Processing start action');
                    const startDuration = validDurationMs || (timer.durationMs || 30000);
                    timer = {
                        status: 'play',
                        timeLeftMs: startDuration,
                        durationMs: startDuration,
                        questionUid: timer.questionUid,
                        timestamp: now,
                        localTimeLeftMs: null
                    };
                    logger.info({ gameId, action, timer }, '[TIMER_ACTION] Timer object after start processing');
                    // Update game status to 'active' when starting a timer (game has started)
                    if (gameInstance.status === 'pending') {
                        logger.info({ gameId, action }, 'Setting game status to active as timer is being started');
                        await gameInstanceService.updateGameStatus(gameId, { status: 'active' });
                        // Emit game status change to dashboard
                        const dashboardRoom = `dashboard_${gameId}`;
                        const statusPayload = {
                            status: 'active',
                            ended: false
                        };
                        io.to(dashboardRoom).emit('dashboard_game_status_changed', statusPayload);
                    }
                    // Start the automatic timer expiry mechanism
                    if (startDuration > 0) {
                        startGameTimer(io, gameId, gameInstance.accessCode, startDuration, questionUid || null);
                    }
                    break;
                case 'pause':
                    // Clear any running timer when pausing
                    clearGameTimer(gameId);
                    if (timer.status !== 'pause') {
                        // Use the frontend-provided duration (remaining time) if available,
                        // otherwise fall back to stored timeLeftMs
                        const timeRemaining = validDurationMs !== undefined
                            ? Math.max(0, validDurationMs)
                            : Math.max(0, timer.timeLeftMs);
                        // 🔥 PAUSE DEBUG: Log the pause calculation
                        logger.warn('🔥 PAUSE DEBUG: Backend pause calculation', {
                            now,
                            'validDurationMs (from frontend)': validDurationMs,
                            'timer.timeLeftMs (stored)': timer.timeLeftMs,
                            'timer.durationMs': timer.durationMs,
                            timeRemaining,
                            'timeRemaining === 0': timeRemaining === 0,
                            'using frontend duration': validDurationMs !== undefined
                        });
                        timer = {
                            ...timer,
                            status: 'pause',
                            timeLeftMs: timeRemaining,
                            timestamp: now
                        };
                    }
                    break;
                case 'resume':
                    // Handle resume even if timeRemaining is not defined
                    if (timer.status === 'pause') {
                        const remainingTime = timer.timeLeftMs || timer.durationMs || 30000;
                        // 🔥 RESUME DEBUG: Log the resume calculation
                        logger.warn('🔥 RESUME DEBUG: Backend resume calculation', {
                            now,
                            'timer.timeLeftMs (before)': timer.timeLeftMs,
                            'timer.durationMs (before)': timer.durationMs,
                            remainingTime,
                            'remainingTime in seconds': remainingTime / 1000
                        });
                        timer = {
                            ...timer,
                            status: 'play',
                            timeLeftMs: remainingTime,
                            timestamp: now
                        };
                        logger.warn('🔥 RESUME DEBUG: Backend resume result', {
                            'timer.status (after)': timer.status,
                            'timer.durationMs (after)': timer.durationMs,
                            'timer.timeLeftMs (after)': timer.timeLeftMs,
                            'timer.timestamp (after)': timer.timestamp
                        });
                        // Restart automatic timer expiry when resuming
                        if (remainingTime > 0) {
                            startGameTimer(io, gameId, gameInstance.accessCode, remainingTime, questionUid || null);
                        }
                    }
                    break;
                case 'stop':
                    // Clear any running timer when stopping
                    clearGameTimer(gameId);
                    timer = {
                        ...timer,
                        status: 'stop',
                        timeLeftMs: 0,
                        timestamp: now
                    };
                    break;
                case 'set_duration':
                    if (validDurationMs) {
                        const wasPlaying = timer.status === 'play';
                        timer = {
                            ...timer,
                            durationMs: validDurationMs, // durationMs is already in milliseconds
                            // If timer is stopped/paused, update timeLeftMs to match new duration
                            timeLeftMs: timer.status !== 'play' ? validDurationMs : timer.timeLeftMs,
                            timestamp: now
                        };
                        // If timer was playing and duration changed, restart the timer
                        if (wasPlaying) {
                            clearGameTimer(gameId);
                            const newTimeLeft = timer.timeLeftMs;
                            if (newTimeLeft > 0) {
                                startGameTimer(io, gameId, gameInstance.accessCode, newTimeLeft, questionUid || null);
                            }
                        }
                    }
                    break;
            }
            logger.info({ gameId, action, timer }, 'Timer state after action');
            // Update game state with new timer
            gameState.timer = timer;
            await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
            // Get the current question UID for timer updates
            // If questionUid is provided in the payload, use it; otherwise use current question
            let targetQuestionUid = questionUid;
            logger.warn('🔥 CRITICAL DEBUG: Question UID logic', {
                'payload questionUid': questionUid,
                'targetQuestionUid': targetQuestionUid,
                'gameState.currentQuestionIndex': gameState.currentQuestionIndex,
                'gameState.questionUids': gameState.questionUids,
                'gameState.questionUids length': gameState.questionUids ? gameState.questionUids.length : 'null'
            });
            if (targetQuestionUid) {
                // Check if this is a different question than currently active
                const currentQuestionUid = gameState.currentQuestionIndex >= 0 &&
                    gameState.questionUids &&
                    gameState.questionUids[gameState.currentQuestionIndex]
                    ? gameState.questionUids[gameState.currentQuestionIndex] || null
                    : null;
                logger.warn('🔥 CRITICAL DEBUG: Current vs target question comparison', {
                    currentQuestionUid,
                    targetQuestionUid,
                    'are they different': currentQuestionUid !== targetQuestionUid,
                    'gameState.currentQuestionIndex': gameState.currentQuestionIndex,
                    'questionUids at currentIndex': gameState.questionUids?.[gameState.currentQuestionIndex]
                });
                if (currentQuestionUid !== targetQuestionUid) {
                    // Switch to the new question
                    const targetQuestionIndex = gameState.questionUids?.indexOf(targetQuestionUid);
                    if (targetQuestionIndex !== undefined && targetQuestionIndex >= 0) {
                        logger.info({ gameId, action, oldQuestion: currentQuestionUid, newQuestion: targetQuestionUid }, '[TIMER_ACTION] Switching to new question for timer action');
                        // Update current question index
                        gameState.currentQuestionIndex = targetQuestionIndex;
                        // Reset answersLocked to false for the new question
                        gameState.answersLocked = false;
                        // Update game state with the new current question
                        await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
                        // Get the question data to send to players (without correct answers)
                        const question = await prisma_1.prisma.question.findUnique({
                            where: { uid: targetQuestionUid }
                        });
                        if (question) {
                            // Send question to live room
                            const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/quiz/liveQuestion')));
                            const filteredQuestion = filterQuestionForClient(question);
                            const gameQuestionPayload = {
                                question: filteredQuestion,
                                timer: timer,
                                questionIndex: targetQuestionIndex,
                                totalQuestions: gameState.questionUids.length
                            };
                            // Send the question to the live room
                            const liveRoom = `game_${gameInstance.accessCode}`;
                            io.to(liveRoom).emit('game_question', gameQuestionPayload);
                            logger.info({ gameId, targetQuestionUid, liveRoom }, '[TIMER_ACTION] Sent new question to live room');
                        }
                        // Broadcast question change to dashboard
                        const dashboardRoom = `dashboard_${gameId}`;
                        const questionChangedPayload = {
                            questionUid: targetQuestionUid,
                            oldQuestionUid: currentQuestionUid,
                            timer: timer
                        };
                        io.to(dashboardRoom).emit('dashboard_question_changed', questionChangedPayload);
                        logger.info({ gameId, targetQuestionUid, targetQuestionIndex }, '[TIMER_ACTION] Question switched and dashboard notified');
                    }
                    else {
                        logger.warn({ gameId, targetQuestionUid, availableQuestions: gameState.questionUids }, '[TIMER_ACTION] Target question UID not found in game questions');
                        // Continue with timer action but don't switch questions
                    }
                }
            }
            else {
                // No specific question requested, use current question
                const currentQuestionFromState = gameState.currentQuestionIndex >= 0 &&
                    gameState.questionUids &&
                    gameState.questionUids[gameState.currentQuestionIndex]
                    ? gameState.questionUids[gameState.currentQuestionIndex]
                    : null;
                targetQuestionUid = currentQuestionFromState || undefined;
            }
            // Update timer object with resolved questionUid before broadcasting
            if (targetQuestionUid) {
                timer = {
                    ...timer,
                    questionUid: targetQuestionUid
                };
            }
            // Broadcast timer update to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `game_${gameInstance.accessCode}`; // Ensure gameInstance.accessCode is correct
            const projectionRoom = `projection_${gameId}`;
            logger.info({ gameId, action, dashboardRoom, liveRoom, projectionRoom, timer, targetQuestionUid }, '[TIMER_ACTION] Emitting timer updates to rooms');
            // To dashboard (include questionUid to match frontend validation)
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer, questionUid: targetQuestionUid });
            logger.info({ gameId, action, dashboardRoom, timer, targetQuestionUid }, '[TIMER_ACTION] Emitted to dashboardRoom');
            // To live room (for quiz players)
            io.to(liveRoom).emit('game_timer_updated', { timer });
            logger.info({ gameId, action, liveRoom, timer }, '[TIMER_ACTION] Emitted to liveRoom');
            // To projection room
            io.to(projectionRoom).emit('projection_timer_updated', { timer });
            logger.info({ gameId, action, projectionRoom, timer }, '[TIMER_ACTION] Emitted to projectionRoom');
            logger.info({ gameId, action }, 'Timer updated successfully');
        }
        catch (error) {
            logger.error({ gameId, action, error }, 'Error updating timer');
            const errorPayload = {
                message: 'Failed to update timer',
                code: 'TIMER_ERROR'
            };
            socket.emit('error_dashboard', errorPayload);
        }
    };
}
/**
 * Clean up all timers (for cleanup when server shuts down or games end)
 */
function clearAllTimers() {
    logger.info({ activeTimersCount: activeTimers.size }, '[TIMER_EXPIRY] Clearing all active timers');
    for (const [gameId, timeout] of activeTimers.entries()) {
        clearTimeout(timeout);
        logger.debug({ gameId }, '[TIMER_EXPIRY] Cleared timer for game');
    }
    activeTimers.clear();
}
/**
 * Clear timer for a specific game (useful when game ends)
 */
function clearTimerForGame(gameId) {
    clearGameTimer(gameId);
}
