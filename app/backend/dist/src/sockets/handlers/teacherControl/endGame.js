"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endGameHandler = endGameHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('EndGameHandler');
function endGameHandler(io, socket) {
    return async (payload, callback) => {
        const { gameId } = payload;
        const teacherId = socket.data?.teacherId;
        if (!teacherId) {
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to end the game',
            });
            return;
        }
        logger.info({ gameId, teacherId }, 'Game end requested');
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
    // Update game status
    gameState.status = 'completed';
    // Update game state in Redis
    await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
    // Update the database record
    await prisma_1.prisma.gameInstance.update({
        where: { id: gameId },
        data: {
            status: 'completed',
            endedAt: new Date()
        }
    });
    // Broadcast to all relevant rooms
    const dashboardRoom = `dashboard_${gameId}`;
    const gameRoom = `game_${gameInstance.accessCode}`;
    const projectionRoom = `projection_${gameId}`;
    // To dashboard
    io.to(dashboardRoom).emit('dashboard_game_status_changed', {
        status: 'completed'
    });
    // To game room
    io.to(gameRoom).emit('game_status_changed', {
        status: 'completed',
        reason: 'teacher_ended',
        message: 'The teacher has ended the game.'
    });
    // To projection room
    io.to(projectionRoom).emit('projection_game_status_changed', {
        status: 'completed'
    });
    logger.info({ gameId }, 'Game ended successfully');
}
        catch (error) {
    logger.error({ gameId, error }, 'Error ending game');
    socket.emit('error_dashboard', {
        code: 'END_GAME_ERROR',
        message: 'Failed to end the game',
        details: error instanceof Error ? error.message : String(error)
    });
    // Call the callback with error if provided
    if (callback) {
        callback({
            success: false,
            error: 'Failed to end the game',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
// Call the callback if provided with success
if (callback) {
    callback({
        success: true,
        gameId
    });
}
    };
}
