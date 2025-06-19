"use strict";
/**
 * Projection Leaderboard Broadcast Utility
 *
 * Handles broadcasting leaderboard updates to projection rooms
 * when students join games, ensuring immediate leaderboard population for better UX.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastLeaderboardToProjection = broadcastLeaderboardToProjection;
exports.broadcastLeaderboardToAllRooms = broadcastLeaderboardToAllRooms;
const sharedLeaderboard_1 = require("@/sockets/handlers/sharedLeaderboard");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('ProjectionLeaderboardBroadcast');
/**
 * Broadcast leaderboard update to projection room when students join
 *
 * @param io - Socket.IO server instance
 * @param accessCode - Game access code
 * @param gameId - Game instance ID
 */
async function broadcastLeaderboardToProjection(io, accessCode, gameId) {
    try {
        // Calculate current leaderboard including join-order bonuses
        const leaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
        if (leaderboard.length === 0) {
            logger.debug({ accessCode, gameId }, 'No participants yet, skipping leaderboard broadcast');
            return;
        }
        // Prepare leaderboard data for projection
        const projectionLeaderboardPayload = {
            leaderboard: leaderboard.slice(0, 20), // Top 20 for projection display
            accessCode,
            timestamp: Date.now()
        };
        // Broadcast to projection room
        const projectionRoom = `projection_${gameId}`;
        io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE, projectionLeaderboardPayload);
        logger.info({
            accessCode,
            gameId,
            projectionRoom,
            leaderboardCount: leaderboard.length,
            topPlayers: leaderboard.slice(0, 5).map(p => ({ username: p.username, score: p.score }))
        }, 'Broadcasted leaderboard update to projection room');
    }
    catch (error) {
        logger.error({
            error,
            accessCode,
            gameId
        }, 'Error broadcasting leaderboard to projection room');
    }
}
/**
 * Broadcast leaderboard update to all relevant rooms (game, projection, dashboard)
 *
 * @param io - Socket.IO server instance
 * @param accessCode - Game access code
 * @param gameId - Game instance ID
 * @param options - Broadcast options
 */
async function broadcastLeaderboardToAllRooms(io, accessCode, gameId, options = {}) {
    try {
        const { includeGameRoom = true, includeProjectionRoom = true, includeDashboardRoom = false, limitToTopN = 20 } = options;
        // Calculate current leaderboard
        const fullLeaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
        if (fullLeaderboard.length === 0) {
            logger.debug({ accessCode, gameId }, 'No participants yet, skipping leaderboard broadcast');
            return;
        }
        const limitedLeaderboard = fullLeaderboard.slice(0, limitToTopN);
        // Broadcast to game room (students see leaderboard updates)
        if (includeGameRoom) {
            const gameRoom = `game_${accessCode}`;
            io.to(gameRoom).emit(events_1.SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE, {
                leaderboard: limitedLeaderboard
            });
            logger.debug({
                accessCode,
                gameRoom,
                playerCount: limitedLeaderboard.length
            }, 'Broadcasted leaderboard to game room');
        }
        // Broadcast to projection room (teacher projection display)
        if (includeProjectionRoom) {
            await broadcastLeaderboardToProjection(io, accessCode, gameId);
        }
        // Broadcast to dashboard room (teacher control panel)
        if (includeDashboardRoom) {
            const dashboardRoom = `dashboard_${gameId}`;
            io.to(dashboardRoom).emit('leaderboard_update', {
                leaderboard: limitedLeaderboard,
                accessCode,
                timestamp: Date.now()
            });
            logger.debug({
                accessCode,
                gameId,
                dashboardRoom,
                playerCount: limitedLeaderboard.length
            }, 'Broadcasted leaderboard to dashboard room');
        }
    }
    catch (error) {
        logger.error({
            error,
            accessCode,
            gameId
        }, 'Error broadcasting leaderboard to rooms');
    }
}
