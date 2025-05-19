import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { DASHBOARD_PREFIX } from './helpers';

// Create a handler-specific logger
const logger = createLogger('DisconnectHandler');

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        try {
            // Find which dashboards this socket might be part of
            const dashboardKeys = await redisClient.keys(`${DASHBOARD_PREFIX}*`);

            for (const key of dashboardKeys) {
                const exists = await redisClient.hexists(key, socket.id);
                if (exists) {
                    // Extract game ID from the key
                    const gameId = key.replace(DASHBOARD_PREFIX, '');
                    logger.info({ gameId, socketId: socket.id }, 'Teacher disconnected from dashboard');

                    // Remove from Redis
                    await redisClient.hdel(key, socket.id);
                }
            }
        } catch (error) {
            logger.error({ error }, 'Error handling teacher dashboard disconnect');
        }
    };
}
