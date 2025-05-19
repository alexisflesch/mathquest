"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectorHandler = projectorHandler;
exports.broadcastProjectorState = broadcastProjectorState;
const gameStateService_1 = require("@/core/gameStateService");
const logger_1 = __importDefault(require("@/utils/logger"));
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
    socket.on('join_projector', async (gameId) => {
        const room = `projector_${gameId}`;
        await socket.join(room);
        logger.info(`Projector joined room: ${room}`);
        // Send initial state
        try {
            const gameState = await (0, gameStateService_1.getFullGameState)(gameId);
            socket.emit('projector_state', gameState);
        }
        catch (err) {
            logger.error('Error fetching game state for projector', err);
            socket.emit('projector_error', { message: 'Could not fetch game state.' });
        }
    });
    /**
     * Leave projector room
     */
    socket.on('leave_projector', (gameId) => {
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
        const gameState = await (0, gameStateService_1.getFullGameState)(gameId);
        io.to(room).emit('projector_state', gameState);
    }
    catch (err) {
        logger.error('Error broadcasting projector state', err);
    }
}
