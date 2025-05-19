"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLobbyHandlers = registerLobbyHandlers;
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const roomUtils_1 = require("@/sockets/utils/roomUtils");
// Create a handler-specific logger
const logger = (0, logger_1.default)('LobbyHandler');
// Redis key prefixes
const LOBBY_KEY_PREFIX = 'mathquest:lobby:';
/**
 * Register all lobby-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function registerLobbyHandlers(io, socket) {
    // Join a game lobby
    socket.on('join_lobby', async (payload) => {
        const { accessCode, playerId, username, avatarUrl } = payload;
        logger.info({ accessCode, playerId, username, socketId: socket.id }, 'Player joining lobby');
        try {
            // Verify the game exists and check its status
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
                socket.emit('lobby_error', {
                    error: 'game_not_found',
                    message: 'Game not found with the provided access code.'
                });
                return;
            }
            // Check if game is in a joinable state
            if (gameInstance.status !== 'pending' && gameInstance.status !== 'active') {
                logger.info({ accessCode, gameStatus: gameInstance.status, socketId: socket.id }, 'Game not joinable');
                socket.emit('lobby_error', {
                    error: 'game_not_joinable',
                    message: `Cannot join game in '${gameInstance.status}' status.`
                });
                return;
            }
            // If game is already active, send redirect immediately
            if (gameInstance.status === 'active') {
                logger.info({ accessCode, socketId: socket.id }, 'Game already active, sending redirect');
                socket.emit('redirect_to_game', { accessCode, gameId: gameInstance.id });
                // Still join the lobby room temporarily to receive any announcements
                await (0, roomUtils_1.joinRoom)(socket, `lobby_${accessCode}`, {
                    playerId,
                    username,
                    avatarUrl,
                    redirected: true
                });
                return;
            }
            // Join the lobby room
            await (0, roomUtils_1.joinRoom)(socket, `lobby_${accessCode}`, {
                playerId,
                username,
                avatarUrl,
                joinedAt: Date.now()
            });
            // Store participant data in Redis
            const participant = {
                id: socket.id,
                playerId,
                username,
                avatarUrl,
                joinedAt: Date.now()
            };
            await redis_1.redisClient.hset(`${LOBBY_KEY_PREFIX}${accessCode}`, socket.id, JSON.stringify(participant));
            // Get current participants list
            const participantsHash = await redis_1.redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const participants = Object.values(participantsHash)
                .map(p => JSON.parse(p));
            // Notify others that someone joined
            socket.to(`lobby_${accessCode}`).emit('participant_joined', participant);
            // Send full participants list to everyone in the lobby
            io.to(`lobby_${accessCode}`).emit('participants_list', {
                participants,
                gameId: gameInstance.id,
                gameName: gameInstance.name
            });
            // Set up periodic status check for this lobby
            await setupGameStatusCheck(io, socket, accessCode, gameInstance.id);
        }
        catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in join_lobby handler');
            socket.emit('lobby_error', {
                error: 'internal_error',
                message: 'An internal error occurred while joining the lobby.'
            });
        }
    });
    // Leave a game lobby
    socket.on('leave_lobby', async (payload) => {
        const { accessCode } = payload;
        logger.info({ accessCode, socketId: socket.id }, 'Player leaving lobby');
        try {
            // Leave the lobby room
            await (0, roomUtils_1.leaveRoom)(socket, `lobby_${accessCode}`);
            // Remove from Redis
            await redis_1.redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, socket.id);
            // Get updated participants list
            const participantsHash = await redis_1.redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const participants = Object.values(participantsHash)
                .map(p => JSON.parse(p));
            // Notify others that someone left
            socket.to(`lobby_${accessCode}`).emit('participant_left', { id: socket.id });
            // Send updated participants list
            io.to(`lobby_${accessCode}`).emit('participants_list', { participants });
        }
        catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in leave_lobby handler');
        }
    });
    // Request current participants list
    socket.on('get_participants', async (payload) => {
        const { accessCode } = payload;
        logger.debug({ accessCode, socketId: socket.id }, 'Getting lobby participants');
        try {
            // Make sure socket is joined to the lobby room
            if (!socket.rooms.has(`lobby_${accessCode}`)) {
                await (0, roomUtils_1.joinRoom)(socket, `lobby_${accessCode}`, {
                    message: 'Joined during get_participants request'
                });
            }
            // Get game details
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { id: true, name: true, status: true }
            });
            if (!gameInstance) {
                socket.emit('lobby_error', {
                    error: 'game_not_found',
                    message: 'Game not found'
                });
                return;
            }
            // Get participants list
            const participantsHash = await redis_1.redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const participants = participantsHash ?
                Object.values(participantsHash).map(p => JSON.parse(p)) : [];
            // Send participants list only to requesting socket
            socket.emit('participants_list', {
                participants,
                gameId: gameInstance.id,
                gameName: gameInstance.name
            });
        }
        catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in get_participants handler');
            socket.emit('lobby_error', {
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
                    await redis_1.redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, socketId);
                    // Get updated participants list
                    const participantsHash = await redis_1.redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
                    const participants = participantsHash ?
                        Object.values(participantsHash).map(p => JSON.parse(p)) : [];
                    // Notify others that someone left - using io instead of socket.to to ensure delivery
                    io.to(`lobby_${accessCode}`).emit('participant_left', { id: socketId });
                    // Send updated participants list
                    io.to(`lobby_${accessCode}`).emit('participants_list', { participants });
                }
            }
        }
        catch (error) {
            logger.error({ error, socketId: socket.id }, 'Error handling disconnect from lobby');
        }
    });
}
/**
 * Setup periodic game status check for players in the lobby
 */
async function setupGameStatusCheck(io, socket, accessCode, gameId) {
    // Check every 2 seconds for game status changes
    const intervalId = setInterval(async () => {
        try {
            // Stop checking if socket disconnected
            if (!socket.connected) {
                clearInterval(intervalId);
                return;
            }
            // Check if game is now active
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { status: true }
            });
            if (!gameInstance) {
                logger.warn({ accessCode, gameId, socketId: socket.id }, 'Game no longer exists during status check');
                clearInterval(intervalId);
                socket.emit('lobby_error', {
                    error: 'game_not_found',
                    message: 'Game no longer exists'
                });
                return;
            }
            // If game is now active, redirect players to the game
            if (gameInstance.status === 'active') {
                logger.info({ accessCode, gameId, socketId: socket.id }, 'Game is now active, sending redirect');
                // Send redirect to individual socket
                socket.emit('redirect_to_game', { accessCode, gameId });
                // Also broadcast to all sockets in the lobby
                io.to(`lobby_${accessCode}`).emit('game_started', { accessCode, gameId });
                io.to(`lobby_${accessCode}`).emit('redirect_to_game', { accessCode, gameId });
                // Send delayed redirects to ensure clients receive it
                [500, 1500, 3000].forEach(delay => {
                    setTimeout(() => {
                        if (socket.connected) {
                            socket.emit('redirect_to_game', { accessCode, gameId });
                        }
                    }, delay);
                });
                clearInterval(intervalId);
            }
            else if (gameInstance.status === 'completed' || gameInstance.status === 'archived') {
                logger.info({ accessCode, gameId, gameStatus: gameInstance.status, socketId: socket.id }, 'Game is no longer available');
                socket.emit('lobby_error', {
                    error: 'game_ended',
                    message: `Game has ended (${gameInstance.status})`
                });
                clearInterval(intervalId);
            }
        }
        catch (error) {
            logger.error({ error, accessCode, gameId, socketId: socket.id }, 'Error in game status check');
        }
    }, 2000);
    // Clear interval on disconnect
    socket.on('disconnect', () => {
        clearInterval(intervalId);
    });
}
