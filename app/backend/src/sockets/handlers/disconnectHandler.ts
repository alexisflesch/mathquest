import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '@shared/types/socketEvents';
import { z } from 'zod';

const logger = createLogger('DisconnectHandler');

export function disconnectHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    return async (reason: string) => {
        logger.info({ socketId: socket.id, userId: socket.data.userId, accessCode: socket.data.accessCode, reason }, 'Client disconnected');

        const { userId, accessCode, currentGameRoom } = socket.data;

        if (!userId || !accessCode) {
            logger.warn({ socketId: socket.id, reason }, 'Disconnected socket had no userId or accessCode in socket.data. Cannot process participant update.');
            return;
        }

        const participantsKey = `mathquest:game:participants:${accessCode}`;
        const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
        const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;

        try {
            // 1. Clean up socketIdToUserId mapping
            logger.debug({ socketIdToUserIdKey, socketId: socket.id }, 'Removing socketId from socketIdToUserId mapping');
            await redisClient.hdel(socketIdToUserIdKey, socket.id);

            // 2. Check if this was the last active socket for the user
            const lastActiveSocketId = await redisClient.hget(userIdToSocketIdKey, userId);

            if (lastActiveSocketId === socket.id) {
                // This was the primary/last known socket for the user. Mark as offline or remove.
                logger.info({ userId, accessCode, socketId: socket.id }, 'Disconnected socket was the last known active socket for the user.');

                // Remove from userIdToSocketId mapping as this socket is gone
                logger.debug({ userIdToSocketIdKey, userId }, 'Removing user from userIdToSocketId mapping as their last socket disconnected');
                await redisClient.hdel(userIdToSocketIdKey, userId);

                // Update participant status in the main hash
                const participantJson = await redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    const participantData = JSON.parse(participantJson);
                    participantData.online = false;
                    // Optionally, update lastSeen or similar timestamp
                    // participantData.lastSeen = new Date().toISOString();
                    logger.debug({ participantsKey, userId, participantDataUpdate: { online: false } }, 'Updating participant to offline in Redis');
                    await redisClient.hset(participantsKey, userId, JSON.stringify(participantData));

                    // Notify other clients in the game room (if applicable)
                    if (currentGameRoom) {
                        const playerLeftPayload = { userId, socketId: socket.id }; // Added socketId
                        logger.info({ playerLeftPayload, room: currentGameRoom }, 'Emitting player_left_game to room');
                        io.to(currentGameRoom).emit('player_left_game', playerLeftPayload);
                    }
                } else {
                    logger.warn({ participantsKey, userId }, 'Participant data not found in Redis for disconnected user. Cannot mark as offline.');
                }
            } else {
                // Another socket is still active for this user, or this was an old/stale socket.
                logger.info({ userId, accessCode, disconnectedSocketId: socket.id, currentActiveSocketId: lastActiveSocketId }, 'Disconnected socket was not the last known active socket for the user. No "offline" status change needed based on this disconnect.');
            }

            // Additional cleanup: if the game instance itself needs to know about disconnections,
            // e.g., for live games to end if all players leave, that logic would go here or be triggered.

        } catch (err) {
            logger.error({ err, socketId: socket.id, userId, accessCode, stack: err instanceof Error ? err.stack : undefined }, 'Error in disconnectHandler');
        }
    };
}
