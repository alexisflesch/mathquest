import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { DASHBOARD_PREFIX } from './helpers';

// Create a handler-specific logger
const logger = createLogger('DisconnectHandler');

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        try {
            // Check if Redis client is still connected before proceeding
            if (redisClient.status === 'end' || redisClient.status === 'close') {
                logger.warn({ socketId: socket.id, redisStatus: redisClient.status }, 'Redis connection is closed, skipping teacher disconnect cleanup');
                return;
            }

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
            // Check if the error is related to Redis being closed
            if (error instanceof Error && (error.message.includes('Connection is closed') || error.message.includes('Connection is already closed'))) {
                logger.warn({ socketId: socket.id }, 'Redis connection closed during teacher disconnect handling, skipping cleanup');
                return;
            }
            logger.error({ error }, 'Error handling teacher dashboard disconnect');
        }
    };
}
