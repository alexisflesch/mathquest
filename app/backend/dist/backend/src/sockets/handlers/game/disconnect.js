"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = disconnectHandler;
const redis_1 = require("@/config/redis");
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';
function disconnectHandler(io, socket) {
    return async () => {
        // Look up userId for this socket
        const socketIdToUserIdKey = `${SOCKETID_TO_USERID_KEY_PREFIX}`;
        const userId = await redis_1.redisClient.hget(socketIdToUserIdKey, socket.id);
        if (!userId)
            return;
        // Remove this socket from userIdToSocketId mapping
        const userIdToSocketIdKey = `${USERID_TO_SOCKETID_KEY_PREFIX}`;
        await redis_1.redisClient.hdel(userIdToSocketIdKey, userId);
        await redis_1.redisClient.hdel(socketIdToUserIdKey, socket.id);
        // Check if any other sockets for this userId remain
        const remainingSockets = await redis_1.redisClient.hvals(userIdToSocketIdKey);
        const stillConnected = remainingSockets.includes(socket.id);
        if (!stillConnected) {
            // Remove participant from all games if no sockets remain for this user
            const keys = await redis_1.redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);
            for (const key of keys) {
                await redis_1.redisClient.hdel(key, userId);
            }
        }
    };
}
