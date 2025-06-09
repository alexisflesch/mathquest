import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

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
        const allParticipantSockets = new Set<string>([
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
        const allParticipantSockets = new Set<string>([
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

    } catch (error) {
        logger.error({
            error,
            accessCode
        }, 'Error getting participant count');
        return 0;
    }
}
