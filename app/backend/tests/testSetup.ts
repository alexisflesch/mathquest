import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { redisClient } from '@/config/redis';
import { configureSocketServer, registerHandlers } from '@/sockets';

// Patch: Set logger to warn level in test unless overridden
import createLogger from '@/utils/logger';
const testLogger = createLogger('TestSetup');
if (process.env.NODE_ENV === 'test' && !process.env.LOG_LEVEL) {
    // @ts-ignore
    global.MIN_LOG_LEVEL = 2; // WARN
    testLogger.info('Set logger to WARN for tests');
}

// Keep track of any open servers during tests
const openServers: http.Server[] = [];
// Keep track of Redis clients created for tests
const redisClients: Redis[] = [];

/**
 * Start a test server with Socket.IO configured
 * This creates an isolated server instance for testing socket functionality
 */
export const startTestServer = async (): Promise<{
    app: express.Application;
    server: http.Server;
    io: Server;
    port: number;
    cleanup: () => Promise<void>;
}> => {
    // Set up Express
    const app = express();
    const server = http.createServer(app);

    // Get a random available port
    const port = Math.floor(Math.random() * 10000) + 30000;

    // Configure Socket.IO server
    const io = new Server(server, {
        path: '/api/socket.io',
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    // Add Redis adapter for horizontal scaling support
    // Create a new Redis client just for this test to avoid connection issues
    const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const subClient = pubClient.duplicate();

    // Track these clients for cleanup
    redisClients.push(pubClient, subClient);

    io.adapter(createAdapter(pubClient, subClient));

    // Add authentication middleware (but with relaxed rules for testing)
    io.use(async (socket, next) => {
        const token = socket.handshake.query.token;
        const role = socket.handshake.query.role;

        // For testing, allow any token/role combination
        if (token && role) {
            // Add user data to the socket for handlers to access
            socket.data.user = {
                id: typeof token === 'string' ? token : 'test-user',
                role: typeof role === 'string' ? role : 'player'
            };
            next();
        } else {
            next(new Error('Authentication failed: Missing token or role'));
        }
    });

    // Register all socket handlers
    registerHandlers(io);

    // Start the server
    return new Promise((resolve) => {
        server.listen(port, () => {
            // Keep track of this server for cleanup
            openServers.push(server);

            // Return server info
            resolve({
                app,
                server,
                io,
                port,
                cleanup: async () => {
                    // Close server and Redis clients
                    return new Promise((resolveClose) => {
                        server.close(async () => {
                            // Remove from tracked servers
                            const index = openServers.indexOf(server);
                            if (index > -1) {
                                openServers.splice(index, 1);
                            }

                            try {
                                // Wait for any in-flight Redis operations to complete
                                await new Promise(resolve => setTimeout(resolve, 100));

                                // Close Redis clients used by this test but don't wait for them
                                // This avoids issues with already closed connections
                                redisClients.forEach(client => {
                                    try {
                                        if (client.status !== 'end' && client.status !== 'close') {
                                            client.disconnect();
                                        }
                                    } catch (e) {
                                        // Ignore errors
                                    }
                                });
                            } catch (e) {
                                // Ignore errors during cleanup
                            }

                            resolveClose();
                        });
                    });
                }
            });
        });
    });
};

/**
 * Stop all test servers that may still be running
 */
export const stopAllTestServers = async (): Promise<void> => {
    // Close all test servers
    const closePromises = openServers.map((server) => {
        return new Promise<void>((resolve) => {
            server.close(() => resolve());
        });
    });

    // Close all Redis clients
    const redisClosePromises = redisClients.map((client) => {
        try {
            // Check if the client is still connected before trying to quit
            if (client.status !== 'end' && client.status !== 'close') {
                return client.quit().catch(() => {
                    // Ignore errors on quit
                    return Promise.resolve();
                });
            }
            return Promise.resolve();
        } catch (e) {
            // Ignore errors
            return Promise.resolve();
        }
    });

    // Wait for all to close
    await Promise.all([...closePromises, ...redisClosePromises]);

    // Clear the arrays
    openServers.length = 0;
    redisClients.length = 0;
};

// Make sure all servers are stopped after tests complete
if (typeof afterAll === 'function') {
    afterAll(async () => {
        await stopAllTestServers();
    });
}
