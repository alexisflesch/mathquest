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
        const { gameId, action, duration } = payload;
        const teacherId = socket.data?.teacherId;
        if (!teacherId) {
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control the timer',
            });
            return;
        }
        logger.info({ gameId, teacherId, action, duration }, 'Timer action requested');
        try {
            // Verify authorization
            const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    : teacherId
        }
            });
    if (!gameInstance) {
        socket.emit('error_dashboard', {
            code: 'NOT_AUTHORIZED',
            message: 'Not authorized to control this game',
        });
        return;
    }
    // Get current game state
    const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
    if (!fullState || !fullState.gameState) {
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
    // Update game state with new timer
    gameState.timer = timer;
    await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
    // Broadcast timer update to all relevant rooms
    const dashboardRoom = `dashboard_${gameId}`;
    const gameRoom = `game_${gameInstance.accessCode}`;
    const projectionRoom = `projection_${gameId}`;
    // To dashboard
    io.to(dashboardRoom).emit('dashboard_timer_updated', { timer });
    // To game room
    io.to(gameRoom).emit('game_timer_updated', { timer });
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
