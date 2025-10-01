"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endGameHandler = endGameHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
const redisCleanup_1 = require("@/utils/redisCleanup");
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const deferredTournamentFlow_1 = require("../deferredTournamentFlow");
const sharedLeaderboard_1 = require("../sharedLeaderboard");
const helpers_1 = require("./helpers");
// Create a handler-specific logger
const logger = (0, logger_1.default)('EndGameHandler');
/**
 * Comprehensive Redis cleanup for both live games and deferred sessions
 * @param accessCode - Game access code
 * @param gameId - Game instance ID
 * @param io - Socket.IO server instance
 */
async function cleanupRedisGameData(accessCode, gameId, io) {
    try {
        // Use shared utility for comprehensive cleanup
        await (0, redisCleanup_1.cleanupGameRedisKeys)(accessCode, 'endGame');
        // Additional cleanup specific to endGame (if needed)
        // Clean up any deferred session specific keys
        (0, deferredTournamentFlow_1.cleanupDeferredSessionsForGame)(accessCode);
        logger.info({
            accessCode,
            gameId
        }, '[REDIS-CLEANUP] Completed comprehensive Redis cleanup for game end');
    }
    catch (error) {
        logger.error({
            accessCode,
            gameId,
            error: error instanceof Error ? error.message : String(error)
        }, '[REDIS-CLEANUP] Error during Redis cleanup');
        // Don't throw - cleanup errors shouldn't prevent game ending
    }
}
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
            // CRITICAL FIX: Persist final leaderboard to database BEFORE Redis cleanup
            // This ensures scores are saved when teacher manually ends the quiz
            try {
                const finalLeaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
                await (0, sharedLeaderboard_1.persistLeaderboardToGameInstance)(accessCode, finalLeaderboard);
                logger.info({
                    accessCode,
                    leaderboard: finalLeaderboard,
                    context: 'manual_endGame'
                }, '[QUIZ-SCORE-FIX] Final leaderboard persisted to database before Redis cleanup');
            }
            catch (error) {
                logger.error({
                    accessCode,
                    error,
                    context: 'manual_endGame'
                }, '[QUIZ-SCORE-FIX] Error persisting final leaderboard to database');
                // Continue with cleanup even if persistence fails to avoid hanging state
            }
            // Get the updated game control state BEFORE Redis cleanup (needs Redis data)
            const controlStateResult = await (0, helpers_1.getGameControlState)(gameId, userId, false);
            if (!controlStateResult.controlState) {
                logger.error({ gameId, errorDetails: controlStateResult.errorDetails }, 'Failed to get updated game control state after end game');
                // Continue with cleanup even if control state fails
            }
            // Clean up all Redis data for this game (live and deferred sessions)
            await cleanupRedisGameData(accessCode, gameId, io);
            // Clean up in-memory deferred session tracking
            (0, deferredTournamentFlow_1.cleanupDeferredSessionsForGame)(accessCode);
            const endedAt = Date.now();
            // Broadcast to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const gameRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;
            // Emit updated game control state to dashboard (CRITICAL: frontend needs this to update status)
            if (controlStateResult.controlState) {
                io.to(dashboardRoom).emit(events_1.SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, controlStateResult.controlState);
            }
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
            // To projection room (teacher display)
            // Use canonical event name 'game_ended' for both live and projection rooms
            io.to(projectionRoom).emit('game_ended', {
                accessCode,
                endedAt
            });
            logger.info({ gameId, accessCode }, 'Emitted game_ended to projection room');
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
