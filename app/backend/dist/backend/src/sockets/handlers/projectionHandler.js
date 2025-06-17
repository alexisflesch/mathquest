"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectionHandler = projectionHandler;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const logger = (0, logger_1.default)('ProjectionHandler');
/**
 * Handler for teacher projection page to join projection room
 * Separate from dashboard to keep rooms cleanly separated
 */
function projectionHandler(io, socket) {
    /**
     * Join projection room for a specific gameId
     * This is specifically for the teacher projection page display
     */
    socket.on(events_1.SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION, async (payload) => {
        try {
            const { gameId } = payload;
            if (!gameId || typeof gameId !== 'string') {
                const errorPayload = {
                    message: 'Invalid gameId for projection join',
                    code: 'VALIDATION_ERROR',
                    details: { gameId }
                };
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }
            // Verify the game exists
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { id: true, accessCode: true, status: true }
            });
            if (!gameInstance) {
                const errorPayload = {
                    message: 'Game not found',
                    code: 'GAME_NOT_FOUND',
                    details: { gameId }
                };
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }
            // Join the projection room
            const projectionRoom = `projection_${gameId}`;
            await socket.join(projectionRoom);
            logger.info({
                socketId: socket.id,
                gameId,
                projectionRoom,
                accessCode: gameInstance.accessCode
            }, 'Projection page joined projection room');
            // Send success confirmation
            socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, {
                gameId,
                accessCode: gameInstance.accessCode,
                room: projectionRoom
            });
        }
        catch (error) {
            logger.error({ error, payload }, 'Error joining projection room');
            const errorPayload = {
                message: 'Failed to join projection room',
                code: 'JOIN_ERROR',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
            socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
        }
    });
    /**
     * Leave projection room
     */
    socket.on(events_1.SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION, async (payload) => {
        try {
            const { gameId } = payload;
            if (gameId && typeof gameId === 'string') {
                const projectionRoom = `projection_${gameId}`;
                await socket.leave(projectionRoom);
                logger.info({
                    socketId: socket.id,
                    gameId,
                    projectionRoom
                }, 'Projection page left projection room');
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_LEFT, { gameId, room: projectionRoom });
            }
        }
        catch (error) {
            logger.error({ error, payload }, 'Error leaving projection room');
        }
    });
}
