import { Server, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { ErrorPayload } from '@shared/types/socketEvents';
import * as gameStateService from '@/core/gameStateService';

const logger = createLogger('ProjectionHandler');

/**
 * Handler for teacher projection page to join projection room
 * Separate from dashboard to keep rooms cleanly separated
 */
export function projectionHandler(io: Server, socket: Socket) {
    logger.info({ socketId: socket.id }, 'ProjectionHandler: Socket connected, setting up projection event listeners');

    /**
     * Join projection room for a specific gameId
     * This is specifically for the teacher projection page display
     */
    socket.on(SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION, async (payload: any) => {
        logger.info({ socketId: socket.id, payload }, 'ProjectionHandler: Received JOIN_PROJECTION event');
        try {
            const { gameId } = payload;

            if (!gameId || typeof gameId !== 'string') {
                const errorPayload: ErrorPayload = {
                    message: 'Invalid gameId for projection join',
                    code: 'VALIDATION_ERROR',
                    details: { gameId }
                };
                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }

            // Verify the game exists
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { id: true, accessCode: true, status: true }
            });

            if (!gameInstance) {
                const errorPayload: ErrorPayload = {
                    message: 'Game not found',
                    code: 'GAME_NOT_FOUND',
                    details: { gameId }
                };
                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
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
            socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, {
                gameId,
                accessCode: gameInstance.accessCode,
                room: projectionRoom
            });

            // Send initial game state to the projection
            try {
                const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, {
                    accessCode: gameInstance.accessCode,
                    ...fullState
                });
                logger.info({ gameId, accessCode: gameInstance.accessCode }, 'Initial projection state sent');
            } catch (stateError) {
                logger.error({ error: stateError, gameId }, 'Failed to send initial projection state');
            }

        } catch (error) {
            logger.error({ error, payload }, 'Error joining projection room');

            const errorPayload: ErrorPayload = {
                message: 'Failed to join projection room',
                code: 'JOIN_ERROR',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
            socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
        }
    });

    /**
     * Leave projection room
     */
    socket.on(SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION, async (payload: any) => {
        logger.info({ socketId: socket.id, payload }, 'ProjectionHandler: Received LEAVE_PROJECTION event');
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

                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_LEFT, { gameId, room: projectionRoom });
            }
        } catch (error) {
            logger.error({ error, payload }, 'Error leaving projection room');
        }
    });
}
