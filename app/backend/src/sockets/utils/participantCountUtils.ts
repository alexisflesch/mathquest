import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import type { ConnectedCountPayload } from '@shared/types/socket/dashboardPayloads';

const logger = createLogger('ParticipantCountUtils');

/**
 * Emits participant count to teacher dashboard when participant count changes
 * This function counts sockets in both lobby and game rooms and sends the total
 * to the teacher's dashboard room
 * 
 * @param io - Socket.IO server instance
 * @param accessCode - The game access code
 */
export async function emitParticipantCount(
    io: SocketIOServer,
    accessCode: string
): Promise<void> {
    if (!accessCode) {
        logger.warn('emitParticipantCount called without accessCode');
        return;
    }

    try {
        // Get the game instance to find the gameId for the dashboard room
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: { id: true }
        });

        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found for access code');
            return;
        }

        const gameId = gameInstance.id;

        // Count sockets in lobby and game rooms
        const lobbyRoom = io.sockets.adapter.rooms.get(`lobby_${accessCode}`) || new Set<string>();
        const gameRoom = io.sockets.adapter.rooms.get(`game_${accessCode}`) || new Set<string>();

        // Combine all socket IDs (Set automatically handles duplicates)
        const allSocketIds = new Set<string>([
            ...lobbyRoom,
            ...gameRoom
        ]);

        // For each socket, get userId and count unique userIds
        const userIdSet = new Set<string>();
        for (const socketId of allSocketIds) {
            const userId = await getUserIdForSocket(io, socketId);
            if (userId) userIdSet.add(userId);
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
        io.to(dashboardRoom).emit('quiz_connected_count', { count: uniqueUserCount } as ConnectedCountPayload);

        logger.debug({
            dashboardRoom,
            uniqueUserCount,
            lobbySocketIds: Array.from(lobbyRoom),
            gameSocketIds: Array.from(gameRoom),
            userIds: Array.from(userIdSet)
        }, 'Unique participant count emitted');

    } catch (error) {
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
export async function getParticipantCount(
    io: SocketIOServer,
    accessCode: string
): Promise<number> {
    if (!accessCode) {
        logger.warn('getParticipantCount called without accessCode');
        return 0;
    }

    try {
        // Count sockets in lobby and game rooms
        const lobbyRoom = io.sockets.adapter.rooms.get(`lobby_${accessCode}`) || new Set<string>();
        const gameRoom = io.sockets.adapter.rooms.get(`game_${accessCode}`) || new Set<string>();

        // Combine all socket IDs (Set automatically handles duplicates)
        const allSocketIds = new Set<string>([
            ...lobbyRoom,
            ...gameRoom
        ]);

        // For each socket, get userId and count unique userIds
        const userIdSet = new Set<string>();
        for (const socketId of allSocketIds) {
            const userId = await getUserIdForSocket(io, socketId);
            if (userId) userIdSet.add(userId);
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

    } catch (error) {
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
async function getUserIdForSocket(io: SocketIOServer, socketId: string): Promise<string | null> {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.data && socket.data.userId) {
        return socket.data.userId;
    }
    // Fallback to Redis
    try {
        const userId = await redisClient.hget('mathquest:socketIdToUserId:', socketId);
        return userId || null;
    } catch (err) {
        logger.error({ socketId, err }, 'Failed to get userId from Redis');
        return null;
    }
}

// TODO: Sweep the rest of the file and update all emits to use shared types or add TODOs for missing types.
