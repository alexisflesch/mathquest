"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endGameHandler = endGameHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// Create a handler-specific logger
const logger = (0, logger_1.default)('EndGameHandler');
function endGameHandler(io, socket) {
    return async (payload, callback) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.endGamePayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid endGame payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid endGame payload',
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
        const validPayload = parseResult.data;
        const { accessCode } = validPayload;
        // Look up game instance by access code
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: true
            }
        });
        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            });
            if (callback) {
                callback({
                    success: false,
                    error: 'Game not found'
                });
            }
            return;
        }
        const gameId = gameInstance.id;
        const userId = socket.data?.userId || socket.data?.user?.userId;
        if (!userId) {
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to end the game',
            });
            if (callback) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
            }
            return;
        }
        logger.info({ gameId, userId, accessCode }, 'Game end requested');
        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const authorized = gameInstance.initiatorUserId === userId ||
                gameInstance.gameTemplate.creatorId === userId;
            if (!authorized) {
                logger.warn({ gameId, userId }, 'Not authorized for this game, aborting end game action');
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Not authorized'
                    });
                }
                return;
            }
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(accessCode);
            if (!fullState || !fullState.gameState) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Could not retrieve game state'
                    });
                }
                return;
            }
            const gameState = fullState.gameState;
            // Update game status to completed (canonical: 'completed' everywhere)
            gameState.status = 'completed';
            // Update game state in Redis
            await gameStateService_1.default.updateGameState(accessCode, gameState);
            // Update game instance in database (use 'completed' for consistency)
            await prisma_1.prisma.gameInstance.update({
                where: { id: gameId },
                data: {
                    status: 'completed',
                    endedAt: new Date()
                }
            });
            // Diagnostic: log both Redis and DB status after update
            const updatedGameInstance = await prisma_1.prisma.gameInstance.findUnique({ where: { id: gameId } });
            const updatedState = await gameStateService_1.default.getFullGameState(accessCode);
            logger.info({
                accessCode,
                dbStatus: updatedGameInstance?.status,
                redisStatus: updatedState?.gameState?.status
            }, '[DIAGNOSTIC] Post-endGame status sync check');
            const endedAt = Date.now();
            // Broadcast to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const gameRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;
            // To dashboard
            io.to(dashboardRoom).emit('dashboard_game_ended', {
                gameId,
                accessCode,
                endedAt
            });
            // To game room
            io.to(gameRoom).emit('game_ended', {
                accessCode,
                endedAt
            });
            // To projection room
            io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, {
                gameId,
                accessCode,
                endedAt
            });
            logger.info({ gameId, accessCode }, 'Game ended successfully');
            // Call the callback if provided with success
            if (callback) {
                callback({
                    success: true,
                    gameId,
                    accessCode,
                    endedAt
                });
            }
        }
        catch (error) {
            logger.error({ gameId, accessCode, error }, 'Error ending game');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'END_GAME_ERROR',
                message: 'Failed to end game',
                details: { error: error instanceof Error ? error.message : String(error) }
            });
            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to end game',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        }
    };
}
