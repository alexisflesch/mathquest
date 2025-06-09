import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { redisClient } from '@/config/redis';
import { configureSocketServer, registerHandlers } from '@/sockets';
import * as jwt from 'jsonwebtoken'; // Added import
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from '@/api';

// Patch: Set logger to warn level in test unless overridden
import createLogger from '@/utils/logger';
const testLogger = createLogger('TestSetup');
const testSocketAuthLogger = createLogger('TestSocketAuth'); // Added logger for auth
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret'; // Added JWT Secret

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

    // Configure CORS for API requests
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(express.json());
    app.use(cookieParser());

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    // Mount API routes
    app.use('/api', apiRouter);

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
        const token = socket.handshake.query.token as string;
        const roleFromQuery = socket.handshake.query.role as string;

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { userId: string; username: string; role: string };

                if (!decoded.userId || !decoded.username || !decoded.role) {
                    testSocketAuthLogger.warn({ decoded, socketId: socket.id }, 'Token decoded but missing essential fields (userId, username, role)');
                    return next(new Error('Authentication failed in testSetup.ts: Token missing essential fields'));
                }

                if (roleFromQuery && decoded.role !== roleFromQuery) {
                    testSocketAuthLogger.warn(
                        { tokenRole: decoded.role, queryRole: roleFromQuery, socketId: socket.id },
                        'Role mismatch between JWT and query parameter in testSetup.ts. Using token role.'
                    );
                }

                socket.data.user = {
                    id: decoded.userId, // Set id to userId
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };
                testSocketAuthLogger.debug({ user: socket.data.user, socketId: socket.id }, 'Test user authenticated via JWT in testSetup.ts');
                next();
            } catch (err: any) {
                testSocketAuthLogger.error({ error: err.message, token, socketId: socket.id }, 'Invalid token in testSetup.ts');
                next(new Error(`Authentication failed in testSetup.ts: Invalid token (${err.message})`));
            }
        } else if (roleFromQuery) {
            // This case might be for tests not using JWT.
            // For current practiceMode.test.ts, token should always be present.
            testSocketAuthLogger.warn({ roleFromQuery, socketId: socket.id }, 'Token missing, role provided in query (testSetup.ts). Authenticating with role only.');
            socket.data.user = {
                id: 'test-user-no-token', // Generic ID
                userId: 'test-user-no-token',
                username: 'Anonymous Test User (No Token)',
                role: roleFromQuery
            };
            next();
        } else {
            testSocketAuthLogger.warn({ socketId: socket.id }, 'Missing token and role in query parameters in testSetup.ts');
            next(new Error('Authentication failed in testSetup.ts: Missing token or role in query parameters'));
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
                                redisClients.forEach(async (client) => {
                                    try {
                                        if (client.status !== 'end' && client.status !== 'close') {
                                            await client.quit(); // Use quit() for graceful shutdown
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
    const redisClosePromises = redisClients.map(async (client) => {
        try {
            // Check if the client is still connected before trying to quit
            if (client.status !== 'end' && client.status !== 'close') {
                await client.quit(); // Use quit() for graceful shutdown
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
    }, 60000); // 60 second timeout
}
