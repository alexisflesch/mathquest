"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = disconnectHandler;
const redis_1 = require("@/config/redis");
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
function disconnectHandler(io, socket) {
    return async () => {
        // Remove this socket from all game participants hashes
        const keys = await redis_1.redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);
        for (const key of keys) {
            await redis_1.redisClient.hdel(key, socket.id);
        }
    };
}
