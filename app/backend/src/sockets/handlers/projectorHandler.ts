import { Server, Socket } from 'socket.io';
import { getFullGameState } from '@/core/gameStateService';
import createLogger from '@/utils/logger';

const logger = createLogger('ProjectorHandler');

/**
 * Handles projector mode socket events for a given gameId.
 * Projector clients join the `projector_${gameId}` room and receive real-time game state updates.
 */
export function projectorHandler(io: Server, socket: Socket) {
    /**
     * Join projector room for a specific gameId
     * @param gameId - The database ID of the GameInstance
     */
    socket.on('join_projector', async (gameId: string) => {
        const room = `projector_${gameId}`;
        await socket.join(room);
        logger.info(`Projector joined room: ${room}`);
        // Send initial state
        try {
            const gameState = await getFullGameState(gameId);
            socket.emit('projector_state', gameState);
        } catch (err) {
            logger.error('Error fetching game state for projector', err);
            socket.emit('projector_error', { message: 'Could not fetch game state.' });
        }
    });

    /**
     * Leave projector room
     */
    socket.on('leave_projector', (gameId: string) => {
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
export async function broadcastProjectorState(io: Server, gameId: string) {
    const room = `projector_${gameId}`;
    try {
        const gameState = await getFullGameState(gameId);
        io.to(room).emit('projector_state', gameState);
    } catch (err) {
        logger.error('Error broadcasting projector state', err);
    }
}
