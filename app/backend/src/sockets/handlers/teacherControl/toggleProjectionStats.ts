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

            // Prepare projection stats payload: fetch current question and stats if toggling ON
            let projectionStatsPayload: any = {
                show,
                stats: {},
                timestamp: Date.now()
            };
            if (show) {
                // Fetch current question UID and answer stats
                const { getFullGameState } = await import('@/core/services/gameStateService');
                const { getAnswerStats } = await import('./helpers');
                const fullState = await getFullGameState(gameInstance.accessCode);
                const gameState = fullState?.gameState;
                let currentQuestionUid = null;
                if (gameState && typeof gameState.currentQuestionIndex === 'number' && Array.isArray(gameState.questionUids)) {
                    currentQuestionUid = gameState.questionUids[gameState.currentQuestionIndex] || null;
                }
                if (currentQuestionUid) {
                    const answerStats = await getAnswerStats(gameInstance.accessCode, currentQuestionUid);
                    projectionStatsPayload = {
                        show,
                        stats: answerStats || {},
                        questionUid: currentQuestionUid,
                        timestamp: Date.now()
                    };
                }
            }
            // Emit to projection room (canonical payload)
            io.to(`projection_${gameInstance.id}`).emit(PROJECTOR_EVENTS.PROJECTION_SHOW_STATS, projectionStatsPayload);
            logger.info({ projectionStatsPayload }, 'Emitted global projection stats toggle to projection');

            // IMPORTANT: Also emit confirmation to dashboard room so the teacher UI reflects the canonical state
            // Source of truth is backend; dashboard should update only on this confirmation
            const dashboardRoom = `dashboard_${gameInstance.id}`;
            io.to(dashboardRoom).emit(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, { show });
            logger.info({ dashboardRoom, show }, 'Emitted showStats confirmation to dashboard room');
        } catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in toggle projection stats handler');
            socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Internal server error in toggle projection stats handler'
            });
        }
    };
}
