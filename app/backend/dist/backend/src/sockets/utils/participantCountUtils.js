"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitParticipantCount = emitParticipantCount;
exports.getParticipantCount = getParticipantCount;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
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
        const allParticipantSockets = new Set([
            ...lobbyRoom,
            ...gameRoom
        ]);
        const totalCount = allParticipantSockets.size;
        logger.info({
            accessCode,
            gameId,
            lobbyCount: lobbyRoom.size,
            gameCount: gameRoom.size,
            totalCount
        }, 'Emitting participant count to dashboard');
        // Emit to the dashboard room for this game
        const dashboardRoom = `dashboard_${gameId}`;
        io.to(dashboardRoom).emit('quiz_connected_count', { count: totalCount });
        logger.debug({
            dashboardRoom,
            totalCount,
            lobbySocketIds: Array.from(lobbyRoom),
            gameSocketIds: Array.from(gameRoom)
        }, 'Participant count emitted');
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
        const allParticipantSockets = new Set([
            ...lobbyRoom,
            ...gameRoom
        ]);
        const totalCount = allParticipantSockets.size;
        logger.debug({
            accessCode,
            lobbyCount: lobbyRoom.size,
            gameCount: gameRoom.size,
            totalCount
        }, 'Retrieved participant count');
        return totalCount;
    }
    catch (error) {
        logger.error({
            error,
            accessCode
        }, 'Error getting participant count');
        return 0;
    }
}
