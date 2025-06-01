"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectorHandler = projectorHandler;
exports.broadcastProjectorState = broadcastProjectorState;
const gameStateService_1 = require("@/core/gameStateService");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const logger = (0, logger_1.default)('ProjectorHandler');
/**
 * Handles projector mode socket events for a given gameId.
 * Projector clients join the `projector_${gameId}` room and receive real-time game state updates.
 */
function projectorHandler(io, socket) {
    /**
     * Join projector room for a specific gameId
     * @param gameId - The database ID of the GameInstance
     */
    socket.on(events_1.PROJECTOR_EVENTS.JOIN_PROJECTOR, async (gameId) => {
        const room = `projector_${gameId}`;
        await socket.join(room);
        logger.info(`Projector joined room: ${room}`);
        // Send initial state
        try {
            // First, get the accessCode from the gameId
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { accessCode: true }
            });
            if (!gameInstance) {
                logger.error(`Game instance not found for gameId: ${gameId}`);
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Game not found.' });
                return;
            }
            const gameStateResult = await (0, gameStateService_1.getFullGameState)(gameInstance.accessCode);
            socket.emit(events_1.PROJECTOR_EVENTS.PROJECTOR_STATE, { accessCode: gameInstance.accessCode, ...gameStateResult });
        }
        catch (err) {
            logger.error('Error fetching game state for projector', err);
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Could not fetch game state.' });
        }
    });
    /**
     * Leave projector room
     */
    socket.on(events_1.PROJECTOR_EVENTS.LEAVE_PROJECTOR, (gameId) => {
        const room = `projector_${gameId}`;
        socket.leave(room);
        logger.info(`Projector left room: ${room}`);
    });
    // Handle disconnects gracefully (optional: clean up if needed)
    socket.on('disconnect', () => {
        // No-op for now; projector is read-only
    });
}
// Utility: Broadcast projector state update to all clients in the room
async function broadcastProjectorState(io, gameId) {
    const room = `projector_${gameId}`;
    try {
        // First, get the accessCode from the gameId
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { id: gameId },
            select: { accessCode: true }
        });
        if (!gameInstance) {
            logger.error(`Game instance not found for gameId: ${gameId}`);
            return;
        }
        const gameStateResult = await (0, gameStateService_1.getFullGameState)(gameInstance.accessCode);
        io.to(room).emit(events_1.PROJECTOR_EVENTS.PROJECTOR_STATE, { accessCode: gameInstance.accessCode, ...gameStateResult });
    }
    catch (err) {
        logger.error('Error broadcasting projector state', err);
    }
}
