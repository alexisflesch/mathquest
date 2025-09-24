import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import * as http from 'http';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { socketAuthMiddleware } from './middleware/socketAuth';
import { socketRateLimitMiddleware } from './middleware/socketRateLimit';
import { registerConnectionHandlers } from './handlers/connectionHandlers';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@shared/types/socketEvents';

// Create a socket-specific logger
const logger = createLogger('SocketIO');

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;
let subClient: ReturnType<typeof redisClient.duplicate> | null = null;

/**
 * Initialize Socket.IO server with Redis adapter
 * @param server HTTP server instance to attach Socket.IO to
 */
export function initializeSocketIO(server: http.Server): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    if (io) {
        logger.warn('Socket.IO server already initialized');
        return io;
    }

    // Create a duplicate Redis client for subscription
    subClient = redisClient.duplicate();

    // Create Socket.IO server with CORS configuration
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
        cors: {
            // Allow connections from frontend in dev and prod
            origin: process.env.NODE_ENV === 'production'
                ? process.env.FRONTEND_URL || 'https://mathquest.example.com'
                : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
            methods: ['GET', 'POST'],
            credentials: true
        },
        // Set path if needed (defaults to /socket.io)
        path: '/api/socket.io',
        // Socket.IO server configuration
        transports: ['websocket', 'polling'],
        // Ping timeout configuration
        pingTimeout: 30000,
        pingInterval: 25000
    });

    // Set up Redis adapter for horizontal scaling
    io.adapter(createAdapter(redisClient, subClient));

    // Add rate limiting middleware first (before auth)
    io.use(socketRateLimitMiddleware);

    // Add authentication middleware
    io.use(socketAuthMiddleware);

    // Register connection handlers
    registerConnectionHandlers(io);

    logger.info('Socket.IO server initialized with Redis adapter');

    return io;
}

/**
 * Cleanup function to close the Redis subClient (for tests)
 */
export async function closeSocketIORedisClients() {
    if (subClient) {
        try {
            await subClient.quit();
        } catch (e) {
            logger.warn('Error closing Socket.IO Redis subClient:', e);
        }
        subClient = null;
    }
}

/**
 * Get the Socket.IO server instance
 * @returns The Socket.IO server instance or null if not initialized
 */
export function getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null {
    return io;
}

/**
 * Configure a Socket.IO server instance
 * This is used for testing to configure a server that's created outside the normal startup flow
 * @param socketServer The Socket.IO server to configure
 */
export function configureSocketServer(socketServer: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    // If we're already tracking an instance, log a warning
    if (io && io !== socketServer) {
        logger.warn('Configuring a new Socket.IO server while another one exists');
    }
    io = socketServer;
    // --- Ensure middleware is applied in test/configure mode ---
    io.use(socketRateLimitMiddleware);
    io.use(socketAuthMiddleware);
}

/**
 * Register all socket event handlers
 * @param socketServer The Socket.IO server to register handlers on
 */
export function registerHandlers(socketServer: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    registerConnectionHandlers(socketServer);
}
