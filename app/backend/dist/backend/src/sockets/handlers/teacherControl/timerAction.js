"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerActionHandler = timerActionHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('TimerActionHandler');
function timerActionHandler(io, socket) {
    return async (payload) => {
        logger.info({ payload }, 'Received quiz_timer_action event');
        // Only support gameId, do not allow quizId for timer actions
        const { gameId, action, duration } = payload;
        const userId = socket.data?.userId;
        logger.info({ gameId, userId, action, duration }, 'Timer action handler entered');
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
        logger.info({ gameId, userId, action, duration }, 'Timer action requested');
        try {
            // Verify authorization
            const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    initiatorUserId: userId
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
                duration: 30000, // Default 30 seconds
                isPaused: true
            };
            const now = Date.now();
            // Validate duration if provided
            const validDuration = duration && duration > 0 ? duration : undefined;
            // Update timer based on the action
            switch (action) {
                case 'start':
                    timer = {
                        startedAt: now,
                        duration: validDuration ? validDuration * 1000 : (timer.duration || 30000), // Convert to ms if provided
                        isPaused: false
                    };
                    break;
                case 'pause':
                    if (!timer.isPaused) {
                        const elapsed = timer.startedAt ? now - timer.startedAt : 0;
                        const timeRemaining = Math.max(0, (timer.duration || 30000) - elapsed);
                        timer = {
                            ...timer,
                            isPaused: true,
                            pausedAt: now,
                            timeRemaining
                        };
                    }
                    break;
                case 'resume':
                    // Handle resume even if timeRemaining is not defined
                    if (timer.isPaused) {
                        timer = {
                            startedAt: now,
                            duration: timer.timeRemaining || timer.duration || 30000,
                            isPaused: false
                        };
                    }
                    break;
                case 'stop':
                    timer = {
                        startedAt: 0,
                        duration: timer.duration || 30000,
                        isPaused: true,
                        timeRemaining: 0
                    };
                    break;
                case 'set_duration':
                    if (validDuration) {
                        timer = {
                            ...timer,
                            duration: validDuration * 1000 // Convert to ms
                        };
                    }
                    break;
            }
            logger.info({ gameId, action, timer }, 'Timer state after action');
            // Update game state with new timer
            gameState.timer = timer;
            await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
            // Broadcast timer update to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `live_${gameInstance.accessCode}`;
            const projectionRoom = `projection_${gameId}`;
            logger.info({ gameId, action, dashboardRoom, liveRoom, projectionRoom }, 'Emitting timer updates to rooms');
            // To dashboard
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer });
            // To live room (for quiz players)
            io.to(liveRoom).emit('game_timer_updated', { timer });
            // To projection room
            io.to(projectionRoom).emit('projection_timer_updated', { timer });
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
