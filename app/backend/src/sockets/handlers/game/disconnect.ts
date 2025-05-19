import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';

const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        // Remove this socket from all game participants hashes
        const keys = await redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);
        for (const key of keys) {
            await redisClient.hdel(key, socket.id);
        }
    };
}
