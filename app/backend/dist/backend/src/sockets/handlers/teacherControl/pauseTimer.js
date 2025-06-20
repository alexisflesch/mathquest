"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pauseTimerHandler = pauseTimerHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// Create a handler-specific logger
const logger = (0, logger_1.default)('PauseTimerHandler');
function pauseTimerHandler(io, socket) {
    return async (payload, callback) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.pauseTimerPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid pauseTimer payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid pauseTimer payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Invalid payload format'
                });
            }
            return;
        }
        const { gameId, accessCode } = parseResult.data;
        const userId = socket.data?.userId;
        // Variables that will be needed throughout the function
        let gameInstance = null;
        let gameAccessCode = null;
        if (!userId) {
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control timer',
            });
            if (callback) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
            }
            return;
        }
        logger.info({ accessCode, gameId, userId }, 'Pausing timer');
        try {
            // Find the game instance by gameId or accessCode
            if (gameId) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { id: gameId },
                    include: { gameTemplate: true }
                });
                if (gameInstance) {
                    gameAccessCode = gameInstance.accessCode;
                }
            }
            else if (accessCode) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { accessCode },
                    include: { gameTemplate: true }
                });
                if (gameInstance) {
                    gameAccessCode = accessCode;
                }
            }
            else {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'MISSING_PARAMS',
                    message: 'Either game ID or access code must be provided',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Missing parameters',
                        message: 'Either game ID or access code must be provided'
                    });
                }
                return;
            }
            if (!gameInstance) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'GAME_NOT_FOUND',
                    message: 'Game not found with the provided ID or access code',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Game not found',
                        message: 'Game not found with the provided ID or access code'
                    });
                }
                return;
            }
            // Check authorization - user must be either the game initiator or the template creator
            const isAuthorized = gameInstance.initiatorUserId === userId ||
                gameInstance.gameTemplate?.creatorId === userId;
            if (!isAuthorized) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'NOT_AUTHORIZED',
                    message: 'You are not authorized to control this game',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Not authorized',
                        message: 'You are not authorized to control this game'
                    });
                }
                return;
            }
            // Need accessCode for game state operations
            if (!gameAccessCode) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'MISSING_ACCESS_CODE',
                    message: 'Access code is required to manage game state',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Missing access code',
                        message: 'Access code is required to manage game state'
                    });
                }
                return;
            }
            // Now we know gameAccessCode is not null
            const accessCodeStr = gameAccessCode;
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(accessCodeStr);
            if (!fullState || !fullState.gameState) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'State error',
                        message: 'Could not retrieve game state'
                    });
                }
                return;
            }
            const gameState = fullState.gameState;
            // Initialize timer with safe defaults if undefined
            let timer = gameState.timer ? { ...gameState.timer } : {
                startedAt: 0,
                durationMs: 30000, // Default 30 seconds
                isPaused: true
            };
            // Skip if timer is already paused
            if (timer.isPaused) {
                // If already paused, just return current state
                socket.emit(events_1.TEACHER_EVENTS.TIMER_UPDATE_RESPONSE, {
                    success: true,
                    timer
                });
                if (callback) {
                    callback({
                        success: true,
                        timer
                    });
                }
                return;
            }
            // Calculate time remaining from current timer state
            const now = Date.now();
            let timeRemaining = 0;
            let questionUid = null;
            // Handle both old and new timer formats during transition
            if ('timeLeftMs' in timer) {
                // New format
                timeRemaining = timer.timeLeftMs || 0;
                questionUid = timer.questionUid || null;
            }
            else {
                // Old format - calculate from startedAt
                const startedAt = timer.startedAt || 0;
                const elapsed = now - startedAt;
                timeRemaining = Math.max(0, timer.durationMs - elapsed);
            }
            // Create paused timer using shared GameTimerState format
            const pausedTimer = {
                status: 'pause',
                timeLeftMs: timeRemaining,
                durationMs: timer.durationMs,
                questionUid: questionUid,
                timestamp: now,
                localTimeLeftMs: null
            };
            // Update game state
            gameState.timer = pausedTimer;
            await gameStateService_1.default.updateGameState(accessCodeStr, gameState);
            // Broadcast to all relevant rooms
            const gameRoom = `game_${accessCodeStr}`;
            const dashboardRoom = `dashboard_${gameInstance.id}`;
            const projectionRoom = `projection_${gameInstance.id}`;
            // Broadcast to game room
            io.to(gameRoom).emit('game_timer_updated', { timer: { ...pausedTimer, isPaused: true } }); // TODO: Ensure isPaused is set
            // Broadcast to dashboard room
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer: { ...pausedTimer, isPaused: true } }); // TODO: Define shared type if missing
            // Broadcast to projection room (include questionUid for proper frontend handling)
            io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, { timer: { ...pausedTimer, isPaused: true }, questionUid: pausedTimer.questionUid }); // TODO: Define shared type if missing
            // Call the callback if provided with success
            if (callback) {
                callback({
                    success: true,
                    timer
                });
            }
        }
        catch (error) {
            logger.error({ accessCode, error }, 'Error pausing timer');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'TIMER_ERROR',
                message: 'Failed to pause timer',
                details: { error: error instanceof Error ? error.message : String(error) }
            });
            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to pause timer',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        }
    };
}
exports.default = pauseTimerHandler;
