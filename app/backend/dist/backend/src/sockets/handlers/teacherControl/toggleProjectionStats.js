"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
            let resolvedAccessCode = accessCode;
            if (accessCode) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { accessCode }
                });
            }
            else if (gameId) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { id: gameId }
                });
                if (gameInstance) {
                    resolvedAccessCode = gameInstance.accessCode;
                }
            }
            if (!gameInstance) {
                logger.error({ socketId: socket.id, payload }, 'Game instance not found');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Game not found'
                });
                return;
            }
            // Persist the new showStats state
            try {
                const { updateProjectionDisplayState } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameStateService')));
                if (resolvedAccessCode) {
                    await updateProjectionDisplayState(resolvedAccessCode, { showStats: show });
                    logger.info({ showStats: show, resolvedAccessCode }, 'Persisted showStats state');
                }
            }
            catch (persistError) {
                logger.error({ persistError, resolvedAccessCode }, 'Failed to persist showStats state');
            }
            // Prepare projection stats payload: fetch current question and stats if toggling ON
            let projectionStatsPayload = {
                show,
                stats: {},
                timestamp: Date.now()
            };
            if (show) {
                // Fetch current question UID and answer stats
                const { getFullGameState } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameStateService')));
                const { getAnswerStats } = await Promise.resolve().then(() => __importStar(require('./helpers')));
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
