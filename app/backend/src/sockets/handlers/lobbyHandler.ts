import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { joinRoom, leaveRoom, getRoomMembers, broadcastToRoom } from '@/sockets/utils/roomUtils';
import { LOBBY_EVENTS } from '@shared/types/socket/events';

// Create a handler-specific logger
const logger = createLogger('LobbyHandler');

// Redis key prefixes
const LOBBY_KEY_PREFIX = 'mathquest:lobby:';

// Define types for lobby participants
export interface LobbyParticipant {
    id: string;           // Socket ID
    userId: string;     // Player ID from database
    username: string;     // Display name
    avatarUrl?: string;   // URL to avatar image
    joinedAt: number;     // Timestamp when joined
}

// Define event payload types
export interface JoinLobbyPayload {
    accessCode: string;   // Game access code
    userId: string;     // Player ID
    username: string;     // Display name
    avatarUrl?: string;   // Avatar URL
}

export interface LeaveLobbyPayload {
    accessCode: string;   // Game access code
}

export interface GetParticipantsPayload {
    accessCode: string;   // Game access code
}

/**
 * Register all lobby-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerLobbyHandlers(io: SocketIOServer, socket: Socket): void {
    // Join a game lobby
    socket.on(LOBBY_EVENTS.JOIN_LOBBY, async (payload: JoinLobbyPayload) => {
        const { accessCode, userId, username, avatarUrl } = payload;
        logger.info({ accessCode, userId, username, socketId: socket.id }, 'Player joining lobby');

        try {
            // Verify the game exists and check its status
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    status: true,
                    name: true,
                    gameTemplateId: true
                }
            });

            if (!gameInstance) {
                logger.warn({ accessCode, socketId: socket.id }, 'Game not found during join_lobby');
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_found',
                    message: 'Game not found with the provided access code.'
                });
                return;
            }

            // Check if game is in a joinable state
            if (gameInstance.status !== 'pending' && gameInstance.status !== 'active') {
                logger.info({ accessCode, gameStatus: gameInstance.status, socketId: socket.id }, 'Game not joinable');
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_joinable',
                    message: `Cannot join game in '${gameInstance.status}' status.`
                });
                return;
            }

            // If game is already active, send redirect immediately
            if (gameInstance.status === 'active') {
                logger.info({ accessCode, socketId: socket.id }, 'Game already active, sending redirect');
                socket.emit(LOBBY_EVENTS.REDIRECT_TO_GAME, { accessCode, gameId: gameInstance.id });

                // Still join the lobby room temporarily to receive any announcements
                await joinRoom(socket, `lobby_${accessCode}`, {
                    userId,
                    username,
                    avatarUrl,
                    redirected: true
                });

                return;
            }

            // Join the lobby room
            await joinRoom(socket, `lobby_${accessCode}`, {
                userId,
                username,
                avatarUrl,
                joinedAt: Date.now()
            });

            // Store participant data in Redis
            const participant: LobbyParticipant = {
                id: socket.id,
                userId,
                username,
                avatarUrl,
                joinedAt: Date.now()
            };

            await redisClient.hset(
                `${LOBBY_KEY_PREFIX}${accessCode}`,
                socket.id,
                JSON.stringify(participant)
            );

            // Get current participants list
            const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const participants: LobbyParticipant[] = Object.values(participantsHash)
                .map(p => JSON.parse(p as string));

            // Notify others that someone joined
            socket.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANT_JOINED, participant);

            // Send full participants list to everyone in the lobby
            io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANTS_LIST, {
                participants,
                gameId: gameInstance.id,
                gameName: gameInstance.name
            });

            // Set up periodic status check for this lobby
            await setupGameStatusCheck(io, socket, accessCode, gameInstance.id);

        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in join_lobby handler');
            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                error: 'internal_error',
                message: 'An internal error occurred while joining the lobby.'
            });
        }
    });

    // Leave a game lobby
    socket.on(LOBBY_EVENTS.LEAVE_LOBBY, async (payload: LeaveLobbyPayload) => {
        const { accessCode } = payload;
        logger.info({ accessCode, socketId: socket.id }, 'Player leaving lobby');

        try {
            // Leave the lobby room
            await leaveRoom(socket, `lobby_${accessCode}`);

            // Remove from Redis
            await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, socket.id);

            // Get updated participants list
            const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const participants: LobbyParticipant[] = Object.values(participantsHash)
                .map(p => JSON.parse(p as string));

            // Notify others that someone left
            socket.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANT_LEFT, { id: socket.id });

            // Send updated participants list
            io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANTS_LIST, { participants });

        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in leave_lobby handler');
        }
    });

    // Request current participants list
    socket.on(LOBBY_EVENTS.GET_PARTICIPANTS, async (payload: GetParticipantsPayload) => {
        const { accessCode } = payload;
        logger.debug({ accessCode, socketId: socket.id }, 'Getting lobby participants');

        try {
            // Make sure socket is joined to the lobby room
            if (!socket.rooms.has(`lobby_${accessCode}`)) {
                await joinRoom(socket, `lobby_${accessCode}`, {
                    message: 'Joined during get_participants request'
                });
            }

            // Get game details
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { id: true, name: true, status: true }
            });

            if (!gameInstance) {
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_found',
                    message: 'Game not found'
                });
                return;
            }

            // Get participants list
            const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const participants: LobbyParticipant[] = participantsHash ?
                Object.values(participantsHash).map(p => JSON.parse(p as string)) : [];

            // Send participants list only to requesting socket
            socket.emit(LOBBY_EVENTS.PARTICIPANTS_LIST, {
                participants,
                gameId: gameInstance.id,
                gameName: gameInstance.name
            });

        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in get_participants handler');
            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                error: 'internal_error',
                message: 'Error retrieving participants list'
            });
        }
    });

    // Handle disconnects
    socket.on('disconnecting', async () => {
        try {
            // Store the socket ID before disconnection
            const socketId = socket.id;

            // Check if socket is in any lobby rooms
            for (const room of Array.from(socket.rooms)) {
                if (room.startsWith('lobby_')) {
                    const accessCode = room.replace('lobby_', '');
                    logger.info({ accessCode, socketId }, 'Socket disconnecting from lobby');

                    // Remove from Redis
                    await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, socketId);

                    // Get updated participants list
                    const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
                    const participants: LobbyParticipant[] = participantsHash ?
                        Object.values(participantsHash).map(p => JSON.parse(p as string)) : [];

                    // Notify others that someone left - using io instead of socket.to to ensure delivery
                    io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANT_LEFT, { id: socketId });

                    // Send updated participants list
                    io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANTS_LIST, { participants });
                }
            }
        } catch (error) {
            logger.error({ error, socketId: socket.id }, 'Error handling disconnect from lobby');
        }
    });
}

/**
 * Setup periodic game status check for players in the lobby
 */
async function setupGameStatusCheck(io: SocketIOServer, socket: Socket, accessCode: string, gameId: string): Promise<void> {
    // Check every 2 seconds for game status changes
    const intervalId = setInterval(async () => {
        try {
            // Stop checking if socket disconnected
            if (!socket.connected) {
                clearInterval(intervalId);
                return;
            }

            // Check if game is now active
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { status: true }
            });

            if (!gameInstance) {
                logger.warn({ accessCode, gameId, socketId: socket.id }, 'Game no longer exists during status check');
                clearInterval(intervalId);
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_found',
                    message: 'Game no longer exists'
                });
                return;
            }

            // If game is now active, redirect players to the game
            if (gameInstance.status === 'active') {
                logger.info({ accessCode, gameId, socketId: socket.id }, 'Game is now active, sending redirect');

                // Send redirect to individual socket
                socket.emit(LOBBY_EVENTS.REDIRECT_TO_GAME, { accessCode, gameId });

                // Also broadcast to all sockets in the lobby
                io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.GAME_STARTED, { accessCode, gameId });
                io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.REDIRECT_TO_GAME, { accessCode, gameId });

                // Send delayed redirects to ensure clients receive it
                [500, 1500, 3000].forEach(delay => {
                    setTimeout(() => {
                        if (socket.connected) {
                            socket.emit(LOBBY_EVENTS.REDIRECT_TO_GAME, { accessCode, gameId });
                        }
                    }, delay);
                });

                clearInterval(intervalId);
            } else if (gameInstance.status === 'completed' || gameInstance.status === 'archived') {
                logger.info({ accessCode, gameId, gameStatus: gameInstance.status, socketId: socket.id },
                    'Game is no longer available');
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_ended',
                    message: `Game has ended (${gameInstance.status})`
                });
                clearInterval(intervalId);
            }
        } catch (error) {
            logger.error({ error, accessCode, gameId, socketId: socket.id }, 'Error in game status check');
        }
    }, 2000);

    // Clear interval on disconnect
    socket.on('disconnect', () => {
        clearInterval(intervalId);
    });
}
