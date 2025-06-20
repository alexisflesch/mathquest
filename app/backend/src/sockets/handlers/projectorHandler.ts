import { Server, Socket } from 'socket.io';
import { getFullGameState } from '@/core/gameStateService';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { PROJECTOR_EVENTS, GAME_EVENTS } from '@shared/types/socket/events';
import { joinProjectorPayloadSchema, leaveProjectorPayloadSchema } from '@shared/types/socketEvents.zod';
import type { ErrorPayload, JoinProjectorPayload, LeaveProjectorPayload } from '@shared/types/socketEvents';

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
    socket.on(PROJECTOR_EVENTS.JOIN_PROJECTION, async (payload: JoinProjectorPayload) => {
        // Runtime validation with Zod
        const parseResult = joinProjectorPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid joinProjector payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid joinProjector payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit('projector_error', errorPayload);
            return;
        }

        const { gameId } = parseResult.data;
        const room = `projector_${gameId}`;
        await socket.join(room);
        logger.info(`Projector joined room: ${room}`);

        // Send initial state
        try {
            // First, get the accessCode from the gameId
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { accessCode: true }
            });

            if (!gameInstance) {
                logger.error(`Game instance not found for gameId: ${gameId}`);
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game not found.' });
                return;
            }

            const gameStateResult = await getFullGameState(gameInstance.accessCode);
            socket.emit(PROJECTOR_EVENTS.PROJECTION_STATE, { accessCode: gameInstance.accessCode, ...gameStateResult });
        } catch (err) {
            logger.error('Error fetching game state for projector', err);
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Could not fetch game state.' });
        }
    });

    /**
     * Leave projector room
     */
    socket.on(PROJECTOR_EVENTS.LEAVE_PROJECTION, (payload: LeaveProjectorPayload) => {
        // Runtime validation with Zod
        const parseResult = leaveProjectorPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid leaveProjector payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid leaveProjector payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit('projector_error', errorPayload);
            return;
        }

        const { gameId } = parseResult.data;
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
        // First, get the accessCode from the gameId
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameId },
            select: { accessCode: true }
        });

        if (!gameInstance) {
            logger.error(`Game instance not found for gameId: ${gameId}`);
            return;
        }

        const gameStateResult = await getFullGameState(gameInstance.accessCode);
        io.to(room).emit(PROJECTOR_EVENTS.PROJECTION_STATE, { accessCode: gameInstance.accessCode, ...gameStateResult });
    } catch (err) {
        logger.error('Error broadcasting projector state', err);
    }
}
