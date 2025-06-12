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
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('TimerActionHandler');
// Create GameInstanceService instance
const gameInstanceService = new gameInstanceService_1.GameInstanceService();
function timerActionHandler(io, socket) {
    return async (payload) => {
        logger.warn('🔥 CRITICAL DEBUG: Backend timer action received', {
            payload,
            'payload.questionUid': payload.questionUid,
            'payload.questionUid type': typeof payload.questionUid,
            'payload.questionUid length': payload.questionUid ? payload.questionUid.length : 'null/undefined',
            'payload.action': payload.action,
            'payload.gameId': payload.gameId,
            'JSON.stringify(payload)': JSON.stringify(payload)
        });
        logger.info({ payload }, 'Received quiz_timer_action event');
        // Only support gameId, do not allow quizId for timer actions
        const { gameId, action, durationMs, questionUid } = payload;
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
            socket.emit('error_dashboard', {
                code: 'GAME_ID_REQUIRED',
                message: 'gameId is required to control the timer',
            });
            return;
        }
        if (!userId) {
            logger.warn({ gameId, action }, 'No userId on socket, aborting timer action');
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control the timer',
            });
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
                socket.emit('error_dashboard', {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                });
                return;
            }
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
            if (!fullState || !fullState.gameState) {
                logger.warn({ gameId, userId, action }, 'No game state found, aborting timer action');
                socket.emit('error_dashboard', {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
                return;
            }
            const gameState = fullState.gameState;
            // Initialize timer with safe defaults if undefined
            let timer = gameState.timer ? { ...gameState.timer } : {
                startedAt: 0,
                durationMs: 30000, // Default 30 seconds
                isPaused: true
            };
            const now = Date.now();
            // Validate duration if provided (durationMs is already in milliseconds)
            const validDurationMs = durationMs && durationMs > 0 ? durationMs : undefined;
            // Update timer based on the action
            switch (action) {
                case 'start':
                    logger.info({ gameId, action, now, validDurationMs, timer }, '[TIMER_ACTION] Processing start action');
                    timer = {
                        startedAt: now,
                        durationMs: validDurationMs || (timer.durationMs || 30000), // Use durationMs directly (already in ms)
                        isPaused: false,
                        timeRemainingMs: validDurationMs || (timer.durationMs || 30000)
                    };
                    logger.info({ gameId, action, timer }, '[TIMER_ACTION] Timer object after start processing');
                    // Update game status to 'active' when starting a timer (game has started)
                    if (gameInstance.status === 'pending') {
                        logger.info({ gameId, action }, 'Setting game status to active as timer is being started');
                        await gameInstanceService.updateGameStatus(gameId, { status: 'active' });
                        // Emit game status change to dashboard
                        const dashboardRoom = `dashboard_${gameId}`;
                        io.to(dashboardRoom).emit('dashboard_game_status_changed', {
                            status: 'active',
                            ended: false
                        });
                    }
                    break;
                case 'pause':
                    if (!timer.isPaused) {
                        const elapsed = timer.startedAt ? now - timer.startedAt : 0;
                        const timeRemaining = Math.max(0, (timer.durationMs || 30000) - elapsed);
                        // 🔥 PAUSE DEBUG: Log the pause calculation
                        logger.warn('🔥 PAUSE DEBUG: Backend pause calculation', {
                            now,
                            'timer.startedAt': timer.startedAt,
                            elapsed,
                            'timer.durationMs': timer.durationMs,
                            timeRemaining,
                            'timeRemaining === 0': timeRemaining === 0,
                            'elapsed >= timer.durationMs': elapsed >= (timer.durationMs || 30000)
                        });
                        timer = {
                            ...timer,
                            isPaused: true,
                            pausedAt: now,
                            timeRemainingMs: timeRemaining
                        };
                    }
                    break;
                case 'resume':
                    // Handle resume even if timeRemaining is not defined
                    if (timer.isPaused) {
                        const remainingTime = timer.timeRemainingMs || timer.durationMs || 30000;
                        // 🔥 RESUME DEBUG: Log the resume calculation
                        logger.warn('🔥 RESUME DEBUG: Backend resume calculation', {
                            now,
                            'timer.timeRemainingMs (before)': timer.timeRemainingMs,
                            'timer.durationMs (before)': timer.durationMs,
                            remainingTime,
                            'remainingTime in seconds': remainingTime / 1000
                        });
                        timer = {
                            startedAt: now,
                            durationMs: timer.durationMs || 30000, // Keep original duration
                            isPaused: false,
                            timeRemainingMs: remainingTime // Set remaining time correctly
                        };
                        logger.warn('🔥 RESUME DEBUG: Backend resume result', {
                            'timer.startedAt (after)': timer.startedAt,
                            'timer.durationMs (after)': timer.durationMs,
                            'timer.timeRemainingMs (after)': timer.timeRemainingMs,
                            'timer.isPaused (after)': timer.isPaused
                        });
                    }
                    break;
                case 'stop':
                    timer = {
                        startedAt: 0,
                        durationMs: timer.durationMs || 30000,
                        isPaused: true,
                        timeRemainingMs: 0
                    };
                    break;
                case 'set_duration':
                    if (validDurationMs) {
                        timer = {
                            ...timer,
                            durationMs: validDurationMs, // durationMs is already in milliseconds
                            // If timer is stopped/paused, update timeRemaining to match new duration
                            timeRemainingMs: timer.isPaused ? validDurationMs : timer.timeRemainingMs
                        };
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
                        io.to(dashboardRoom).emit('dashboard_question_changed', {
                            questionUid: targetQuestionUid,
                            oldQuestionUid: currentQuestionUid,
                            timer: timer
                        });
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
            socket.emit('error_dashboard', {
                code: 'TIMER_ERROR',
                message: 'Failed to update timer',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };
}
