import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';

import { z } from 'zod';

const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        // Look up userId for this socket
        const socketIdToUserIdKey = `${SOCKETID_TO_USERID_KEY_PREFIX}`;
        const userId = await redisClient.hget(socketIdToUserIdKey, socket.id);
        if (!userId) return;
        // Remove this socket from userIdToSocketId mapping
        const userIdToSocketIdKey = `${USERID_TO_SOCKETID_KEY_PREFIX}`;
        await redisClient.hdel(userIdToSocketIdKey, userId);
        await redisClient.hdel(socketIdToUserIdKey, socket.id);
        // Check if any other sockets for this userId remain
        const remainingSockets = await redisClient.hvals(userIdToSocketIdKey);
        const stillConnected = remainingSockets.includes(socket.id);
        if (!stillConnected) {
            // Remove participant from all games if no sockets remain for this user
            const keys = await redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);
            for (const key of keys) {
                await redisClient.hdel(key, userId);
            }
        }
    };
}
