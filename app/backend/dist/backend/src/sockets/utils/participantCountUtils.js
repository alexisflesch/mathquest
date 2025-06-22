"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitParticipantCount = emitParticipantCount;
exports.getParticipantCount = getParticipantCount;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const logger = (0, logger_1.default)('ParticipantCountUtils');
/**
 * Emits participant count to teacher dashboard when participant count changes
 * This function counts sockets in both lobby and game rooms and sends the total
 * to the teacher's dashboard room
 *
 * @param io - Socket.IO server instance
 * @param accessCode - The game access code
 */
async function emitParticipantCount(io, accessCode) {
    if (!accessCode) {
        logger.warn('emitParticipantCount called without accessCode');
        return;
    }
    try {
        // Get the game instance to find the gameId for the dashboard room
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            select: { id: true }
        });
        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found for access code');
            return;
        }
        const gameId = gameInstance.id;
        // Count sockets in lobby and game rooms
        const lobbyRoom = io.sockets.adapter.rooms.get(`lobby_${accessCode}`) || new Set();
        const gameRoom = io.sockets.adapter.rooms.get(`game_${accessCode}`) || new Set();
        // Combine all socket IDs (Set automatically handles duplicates)
        const allSocketIds = new Set([
            ...lobbyRoom,
            ...gameRoom
        ]);
        // For each socket, get userId and count unique userIds
        const userIdSet = new Set();
        for (const socketId of allSocketIds) {
            const userId = await getUserIdForSocket(io, socketId);
            if (userId)
                userIdSet.add(userId);
        }
        const uniqueUserCount = userIdSet.size;
        logger.info({
            accessCode,
            gameId,
            lobbyCount: lobbyRoom.size,
            gameCount: gameRoom.size,
            totalSocketCount: allSocketIds.size,
            uniqueUserCount,
            userIds: Array.from(userIdSet)
        }, 'Emitting unique participant count to dashboard');
        // Emit to the dashboard room for this game
        const dashboardRoom = `dashboard_${gameId}`;
        io.to(dashboardRoom).emit('quiz_connected_count', { count: uniqueUserCount });
        logger.debug({
            dashboardRoom,
            uniqueUserCount,
            lobbySocketIds: Array.from(lobbyRoom),
            gameSocketIds: Array.from(gameRoom),
            userIds: Array.from(userIdSet)
        }, 'Unique participant count emitted');
    }
    catch (error) {
        logger.error({
            error,
            accessCode
        }, 'Error emitting participant count');
    }
}
/**
 * Get current participant count without emitting
 * Useful for initial dashboard join
 *
 * @param io - Socket.IO server instance
 * @param accessCode - The game access code
 * @returns Promise<number> - The current participant count
 */
async function getParticipantCount(io, accessCode) {
    if (!accessCode) {
        logger.warn('getParticipantCount called without accessCode');
        return 0;
    }
    try {
        // Count sockets in lobby and game rooms
        const lobbyRoom = io.sockets.adapter.rooms.get(`lobby_${accessCode}`) || new Set();
        const gameRoom = io.sockets.adapter.rooms.get(`game_${accessCode}`) || new Set();
        // Combine all socket IDs (Set automatically handles duplicates)
        const allSocketIds = new Set([
            ...lobbyRoom,
            ...gameRoom
        ]);
        // For each socket, get userId and count unique userIds
        const userIdSet = new Set();
        for (const socketId of allSocketIds) {
            const userId = await getUserIdForSocket(io, socketId);
            if (userId)
                userIdSet.add(userId);
        }
        const uniqueUserCount = userIdSet.size;
        logger.debug({
            accessCode,
            lobbyCount: lobbyRoom.size,
            gameCount: gameRoom.size,
            totalSocketCount: allSocketIds.size,
            uniqueUserCount,
            userIds: Array.from(userIdSet)
        }, 'Retrieved unique participant count');
        return uniqueUserCount;
    }
    catch (error) {
        logger.error({
            error,
            accessCode
        }, 'Error getting participant count');
        return 0;
    }
}
/**
 * Helper to get userId for a given socketId, using in-memory socket data or Redis as fallback
 */
async function getUserIdForSocket(io, socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.data && socket.data.userId) {
        return socket.data.userId;
    }
    // Fallback to Redis
    try {
        const userId = await redis_1.redisClient.hget('mathquest:socketIdToUserId:', socketId);
        return userId || null;
    }
    catch (err) {
        logger.error({ socketId, err }, 'Failed to get userId from Redis');
        return null;
    }
}
// TODO: Sweep the rest of the file and update all emits to use shared types or add TODOs for missing types.
