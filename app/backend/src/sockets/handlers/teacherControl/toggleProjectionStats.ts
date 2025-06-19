import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { ToggleProjectionStatsPayload } from '@shared/types/socket/payloads';
import createLogger from '@/utils/logger';
import { getAnswerStats } from './helpers';

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

            const { gameId, accessCode, questionUid, show, teacherId } = payload;

            // Validate required fields
            if (!questionUid || typeof show !== 'boolean') {
                logger.error({ socketId: socket.id, payload }, 'Missing or invalid fields in toggle projection stats request');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Missing question ID or show parameter'
                });
                return;
            }

            // Use accessCode or gameId to find the game
            let gameInstance;
            if (accessCode) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode }
                });
            } else if (gameId) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { id: gameId }
                });
            }

            if (!gameInstance) {
                logger.error({ socketId: socket.id, payload }, 'Game instance not found');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Game not found'
                });
                return;
            }

            // Get current answer statistics for the question
            let answerStats: Record<string, number> = {};

            if (show) {
                // Get real answer statistics from Redis using the same function as dashboard
                try {
                    answerStats = await getAnswerStats(gameInstance.accessCode, questionUid);
                    logger.info({
                        questionUid,
                        answerStats,
                        accessCode: gameInstance.accessCode
                    }, 'Retrieved real answer stats for projection');
                } catch (error) {
                    logger.error({
                        questionUid,
                        error,
                        accessCode: gameInstance.accessCode
                    }, 'Error retrieving answer stats for projection, using empty stats');
                    answerStats = {};
                }
            }

            // Prepare projection stats payload
            const projectionStatsPayload = {
                questionUid,
                show,
                stats: show ? answerStats : {},
                timestamp: Date.now()
            };

            // Emit to projection room
            const projectionRoom = `projection_${gameInstance.id}`;
            const eventType = show
                ? SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS
                : SOCKET_EVENTS.PROJECTOR.PROJECTION_HIDE_STATS;

            io.to(projectionRoom).emit(eventType, projectionStatsPayload);

            logger.info({
                projectionRoom,
                questionUid,
                show,
                eventType
            }, 'Emitted stats toggle to projection room');

            logger.info({
                socketId: socket.id,
                questionUid,
                show,
                gameId: gameInstance.id,
                accessCode: gameInstance.accessCode
            }, 'Successfully processed toggle projection stats request');

        } catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in toggle projection stats handler');
            socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Failed to toggle projection stats'
            });
        }
    };
}
