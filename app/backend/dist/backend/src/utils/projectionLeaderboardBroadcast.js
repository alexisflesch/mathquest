"use strict";
/**
 * Projection Leaderboard Broadcast Utility
 *
 * Handles broadcasting leaderboard updates to projection rooms
 * when students join games, ensuring immediate leaderboard population for better UX.
 */
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
    logger.info({
        accessCode,
        gameId
    }, '🎯 [PROJECTION-BROADCAST] Starting leaderboard broadcast to projection room');
    try {
        // 🔒 SECURITY FIX: Projection should use snapshot data to prevent live score leakage
        // Only teacher trophy click should show live data to projection
        logger.debug({ accessCode }, '🔍 [PROJECTION-BROADCAST] Getting leaderboard from snapshot');
        const { getLeaderboardSnapshot } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/leaderboardSnapshotService')));
        const leaderboard = await getLeaderboardSnapshot(accessCode);
        // DEBUG: Add detailed logging of snapshot data
        logger.info({
            accessCode,
            gameId,
            leaderboardCount: leaderboard.length,
            topPlayers: leaderboard.slice(0, 3).map(p => ({ username: p.username, score: p.score })),
            dataSource: 'snapshot'
        }, '📊 [PROJECTION-BROADCAST] DEBUG: Leaderboard from snapshot (secure)');
        logger.info({
            accessCode,
            gameId,
            leaderboardCount: leaderboard.length,
            topPlayers: leaderboard.slice(0, 3).map(p => ({ username: p.username, score: p.score }))
        }, '📊 [PROJECTION-BROADCAST] Leaderboard calculated');
        if (leaderboard.length === 0) {
            logger.warn({ accessCode, gameId }, '⚠️ [PROJECTION-BROADCAST] No participants yet, skipping leaderboard broadcast');
            return;
        }
        // Prepare leaderboard data for projection
        const projectionLeaderboardPayload = {
            leaderboard: leaderboard.slice(0, 20), // Top 20 for projection display
            accessCode,
            timestamp: Date.now()
        };
        // Check if projection room has any sockets
        const projectionRoom = `projection_${gameId}`;
        const projectionRoomSockets = io.sockets.adapter.rooms.get(projectionRoom);
        const socketCount = projectionRoomSockets ? projectionRoomSockets.size : 0;
        logger.info({
            accessCode,
            gameId,
            projectionRoom,
            socketCount,
            socketIds: projectionRoomSockets ? Array.from(projectionRoomSockets) : []
        }, '🎪 [PROJECTION-BROADCAST] Projection room status');
        if (socketCount === 0) {
            logger.warn({
                accessCode,
                gameId,
                projectionRoom
            }, '⚠️ [PROJECTION-BROADCAST] No sockets in projection room - broadcast will have no recipients');
        }
        // Broadcast to projection room
        logger.debug({
            eventName: events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE,
            projectionRoom,
            payloadSize: JSON.stringify(projectionLeaderboardPayload).length
        }, '📡 [PROJECTION-BROADCAST] Emitting leaderboard update event');
        io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE, projectionLeaderboardPayload);
        logger.info({
            accessCode,
            gameId,
            projectionRoom,
            leaderboardCount: leaderboard.length,
            topPlayers: leaderboard.slice(0, 5).map(p => ({ username: p.username, score: p.score })),
            recipientSockets: socketCount,
            eventEmitted: events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE
        }, '✅ [PROJECTION-BROADCAST] Successfully broadcasted leaderboard update to projection room');
    }
    catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            accessCode,
            gameId
        }, '❌ [PROJECTION-BROADCAST] Error broadcasting leaderboard to projection room');
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
        // 🔒 SECURITY FIX: Use snapshot for student emissions, live data for others
        // Students should only see snapshot data to prevent live score cheating
        let studentLeaderboard = [];
        let projectionLeaderboard = [];
        if (includeGameRoom) {
            // For game room (students), use snapshot to prevent live score leakage
            const { getLeaderboardSnapshot, syncSnapshotWithLiveData } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/leaderboardSnapshotService')));
            // CRITICAL: Sync snapshot with current live data first
            await syncSnapshotWithLiveData(accessCode);
            studentLeaderboard = await getLeaderboardSnapshot(accessCode);
            if (studentLeaderboard.length > 0) {
                const gameRoom = `game_${accessCode}`;
                const limitedStudentLeaderboard = studentLeaderboard.slice(0, limitToTopN);
                io.to(gameRoom).emit(events_1.SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE, {
                    leaderboard: limitedStudentLeaderboard
                });
                logger.debug({
                    accessCode,
                    gameRoom,
                    playerCount: limitedStudentLeaderboard.length,
                    dataSource: 'snapshot'
                }, '[SECURITY] Broadcasted leaderboard to game room from snapshot');
            }
            else {
                logger.debug({ accessCode }, 'No snapshot data available, skipping game room broadcast');
            }
        }
        // For projection/dashboard, calculate fresh data (teachers need current state)
        if (includeProjectionRoom || includeDashboardRoom) {
            projectionLeaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
        }
        // Broadcast to projection room (teacher projection display)
        if (includeProjectionRoom && projectionLeaderboard.length > 0) {
            await broadcastLeaderboardToProjection(io, accessCode, gameId);
        }
        // Broadcast to dashboard room (teacher control panel)
        if (includeDashboardRoom && projectionLeaderboard.length > 0) {
            const dashboardRoom = `dashboard_${gameId}`;
            const limitedLeaderboard = projectionLeaderboard.slice(0, limitToTopN);
            io.to(dashboardRoom).emit('leaderboard_update', {
                leaderboard: limitedLeaderboard,
                accessCode,
                timestamp: Date.now()
            });
            logger.debug({
                accessCode,
                gameId,
                dashboardRoom,
                playerCount: limitedLeaderboard.length,
                dataSource: 'live'
            }, 'Broadcasted leaderboard to dashboard room from live data');
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
