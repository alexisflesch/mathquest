import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import { emitParticipantList } from '../lobbyHandler';
import createLogger from '@/utils/logger';

import { z } from 'zod';

const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        const logger = createLogger('DisconnectHandler');

        logger.info({ socketId: socket.id }, '[DISCONNECT] User disconnected');

        // Get access code from socket data
        const accessCode = socket.data?.accessCode;

        if (!accessCode) {
            logger.info({ socketId: socket.id }, '[DISCONNECT] No access code found in socket data, skipping cleanup');
            return;
        }

        // Use game-specific Redis keys (consistent with joinGame.ts)
        const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;
        const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
        const participantsKey = `mathquest:game:participants:${accessCode}`;

        // Look up userId for this socket
        const userId = await redisClient.hget(socketIdToUserIdKey, socket.id);

        logger.debug({
            socketIdToUserIdKey,
            socketId: socket.id,
            userId,
            accessCode
        }, '[DISCONNECT] Redis lookup result');

        if (!userId) {
            logger.info({ socketId: socket.id, accessCode }, '[DISCONNECT] No userId found for socket, skipping cleanup');
            return;
        }

        logger.info({ socketId: socket.id, userId, accessCode }, '[DISCONNECT] Found userId for disconnected socket');

        // Remove this socket from Redis mappings
        await redisClient.hdel(userIdToSocketIdKey, userId);
        await redisClient.hdel(socketIdToUserIdKey, socket.id);

        // Check if any other sockets for this userId remain in this game
        const remainingSockets = await redisClient.hvals(userIdToSocketIdKey);
        const stillConnected = remainingSockets.includes(socket.id);

        logger.info({
            userId,
            accessCode,
            stillConnected,
            remainingSockets
        }, '[DISCONNECT] Checked for remaining sockets in this game');

        if (!stillConnected) {
            logger.info({ userId, accessCode }, '[DISCONNECT] No remaining sockets for this user in this game, removing participant');

            // Remove participant from Redis
            await redisClient.hdel(participantsKey, userId);

            // Remove from database if they're still in PENDING status
            // Don't remove ACTIVE participants as they might have started playing
            try {
                const { prisma } = await import('@/db/prisma');
                const participant = await prisma.gameParticipant.findFirst({
                    where: {
                        userId,
                        gameInstance: { accessCode },
                        status: 'PENDING'
                    }
                });

                if (participant) {
                    await prisma.gameParticipant.delete({
                        where: { id: participant.id }
                    });
                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant.id
                    }, '[DISCONNECT] Removed PENDING participant from database');
                } else {
                    logger.info({
                        userId,
                        accessCode
                    }, '[DISCONNECT] No PENDING participant found in database to remove');
                }
            } catch (dbError) {
                logger.error({
                    userId,
                    accessCode,
                    error: dbError
                }, '[DISCONNECT] Error removing participant from database');
            }

            // Emit updated participant list
            logger.info({ userId, accessCode }, '[DISCONNECT] Emitting updated participant list');
            await emitParticipantList(io, accessCode);
        }
    };
}
