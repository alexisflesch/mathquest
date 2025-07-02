import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { SOCKET_EVENTS, PROJECTOR_EVENTS } from '@shared/types/socket/events';
import { ToggleProjectionStatsPayload } from '@shared/types/socket/payloads';
import createLogger from '@/utils/logger';

// Create a handler-specific logger
const logger = createLogger('ToggleProjectionStatsHandler');

/**
 * Handler for teacher's "toggle projection stats" action (bar graph button)
 * Shows or hides answer statistics on the projection display
 */
export function toggleProjectionStatsHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: ToggleProjectionStatsPayload) => {
        try {
            logger.info({ socketId: socket.id, payload }, 'Teacher requesting to toggle projection stats');

            const { gameId, accessCode, show, teacherId } = payload;

            // Validate required fields
            if (typeof show !== 'boolean') {
                logger.error({ socketId: socket.id, payload }, 'Missing or invalid fields in toggle projection stats request');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Missing show parameter'
                });
                return;
            }

            // Use accessCode or gameId to find the game
            let gameInstance;
            let resolvedAccessCode = accessCode;
            if (accessCode) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode }
                });
            } else if (gameId) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { id: gameId }
                });
                if (gameInstance) {
                    resolvedAccessCode = gameInstance.accessCode;
                }
            }

            if (!gameInstance) {
                logger.error({ socketId: socket.id, payload }, 'Game instance not found');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Game not found'
                });
                return;
            }

            // Persist the new showStats state
            try {
                const { updateProjectionDisplayState } = await import('@/core/services/gameStateService');
                if (resolvedAccessCode) {
                    await updateProjectionDisplayState(resolvedAccessCode, { showStats: show });
                    logger.info({ showStats: show, resolvedAccessCode }, 'Persisted showStats state');
                }
            } catch (persistError) {
                logger.error({ persistError, resolvedAccessCode }, 'Failed to persist showStats state');
            }

            // Prepare projection stats payload (no questionUid)
            const projectionStatsPayload = {
                show,
                stats: show ? {} : {}, // No stats for global toggle, backend/projection can decide what to show
                timestamp: Date.now()
            };

            // Emit to projection room
            io.to(`projection_${gameInstance.id}`).emit(PROJECTOR_EVENTS.PROJECTION_SHOW_STATS, projectionStatsPayload);
            logger.info({ projectionStatsPayload }, 'Emitted global projection stats toggle');
        } catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in toggle projection stats handler');
            socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Internal server error in toggle projection stats handler'
            });
        }
    };
}
