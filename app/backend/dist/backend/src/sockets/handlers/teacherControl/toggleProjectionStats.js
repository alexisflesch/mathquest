"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleProjectionStatsHandler = toggleProjectionStatsHandler;
const prisma_1 = require("@/db/prisma");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const helpers_1 = require("./helpers");
const gameStateService_1 = require("@/core/services/gameStateService");
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
            const { gameId, accessCode, questionUid, show, teacherId } = payload;
            // Validate required fields
            if (!questionUid || typeof show !== 'boolean') {
                logger.error({ socketId: socket.id, payload }, 'Missing or invalid fields in toggle projection stats request');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Missing question ID or show parameter'
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
            // Get current answer statistics for the question
            let answerStats = {};
            if (show) {
                // Get real answer statistics from Redis using the same function as dashboard
                try {
                    answerStats = await (0, helpers_1.getAnswerStats)(gameInstance.accessCode, questionUid);
                    logger.info({
                        questionUid,
                        answerStats,
                        accessCode: gameInstance.accessCode
                    }, 'Retrieved real answer stats for projection');
                }
                catch (error) {
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
            // Update persistent projection display state
            await (0, gameStateService_1.updateProjectionDisplayState)(gameInstance.accessCode, {
                showStats: show,
                currentStats: show ? answerStats : {},
                statsQuestionUid: show ? questionUid : null
            });
            // Emit to projection room
            const projectionRoom = `projection_${gameInstance.id}`;
            const eventType = show
                ? events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS
                : events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_HIDE_STATS;
            io.to(projectionRoom).emit(eventType, projectionStatsPayload);
            logger.info({
                projectionRoom,
                questionUid,
                show,
                eventType,
                statsPersisted: true
            }, 'Emitted stats toggle to projection room and persisted state');
            logger.info({
                socketId: socket.id,
                questionUid,
                show,
                gameId: gameInstance.id,
                accessCode: gameInstance.accessCode
            }, 'Successfully processed toggle projection stats request');
        }
        catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in toggle projection stats handler');
            socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Failed to toggle projection stats'
            });
        }
    };
}
