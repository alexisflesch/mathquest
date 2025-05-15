import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    logger.error('REDIS_URL is not defined in environment variables.');
    throw new Error('REDIS_URL is not defined.');
}

const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Keep trying to reconnect
    enableReadyCheck: false,
    // Add other options here if needed, like password, tls, etc.
    // lazyConnect: true, // Connects only when a command is issued - might be useful
});

redisClient.on('connect', () => {
    logger.info('Successfully connected to Redis.');
});

redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
    // Depending on the error, you might want to exit the process
    // or implement a more robust reconnection strategy if ioredis's default isn't enough.
});

export { redisClient };
