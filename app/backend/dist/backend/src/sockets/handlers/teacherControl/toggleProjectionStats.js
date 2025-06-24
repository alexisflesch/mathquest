"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleProjectionStatsHandler = toggleProjectionStatsHandler;
const prisma_1 = require("@/db/prisma");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('ToggleProjectionStatsHandler');
/**
 * Handler for teacher's "toggle projection stats" action (bar graph button)
 * Shows or hides answer statistics on the projection display
 */
function toggleProjectionStatsHandler(io, socket) {
    return async (payload) => {
        try {
            logger.info({ socketId: socket.id, payload }, 'Teacher requesting to toggle projection stats');
            const { gameId, accessCode, show, teacherId } = payload;
            // Validate required fields
            if (typeof show !== 'boolean') {
                logger.error({ socketId: socket.id, payload }, 'Missing or invalid fields in toggle projection stats request');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Missing show parameter'
                });
                return;
            }
            // Use accessCode or gameId to find the game
            let gameInstance;
            if (accessCode) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { accessCode }
                });
            }
            else if (gameId) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { id: gameId }
                });
            }
            if (!gameInstance) {
                logger.error({ socketId: socket.id, payload }, 'Game instance not found');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Game not found'
                });
                return;
            }
            // Prepare projection stats payload (no questionUid)
            const projectionStatsPayload = {
                show,
                stats: show ? {} : {}, // No stats for global toggle, backend/projection can decide what to show
                timestamp: Date.now()
            };
            // Emit to projection room
            io.to(`projection_${gameInstance.id}`).emit(events_1.PROJECTOR_EVENTS.PROJECTION_SHOW_STATS, projectionStatsPayload);
            logger.info({ projectionStatsPayload }, 'Emitted global projection stats toggle');
        }
        catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in toggle projection stats handler');
            socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Internal server error in toggle projection stats handler'
            });
        }
    };
}
