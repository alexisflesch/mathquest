"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopAllTestServers = exports.startTestServer = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const sockets_1 = require("@/sockets");
const jwt = __importStar(require("jsonwebtoken")); // Added import
// Patch: Set logger to warn level in test unless overridden
const logger_1 = __importDefault(require("@/utils/logger"));
const testLogger = (0, logger_1.default)('TestSetup');
const testSocketAuthLogger = (0, logger_1.default)('TestSocketAuth'); // Added logger for auth
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret'; // Added JWT Secret
// Keep track of any open servers during tests
const openServers = [];
// Keep track of Redis clients created for tests
const redisClients = [];
/**
 * Start a test server with Socket.IO configured
 * This creates an isolated server instance for testing socket functionality
 */
const startTestServer = async () => {
    // Set up Express
    const app = (0, express_1.default)();
    const server = http_1.default.createServer(app);
    // Get a random available port
    const port = Math.floor(Math.random() * 10000) + 30000;
    // Configure Socket.IO server
    const io = new socket_io_1.Server(server, {
        path: '/api/socket.io',
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });
    // Add Redis adapter for horizontal scaling support
    // Create a new Redis client just for this test to avoid connection issues
    const pubClient = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    const subClient = pubClient.duplicate();
    // Track these clients for cleanup
    redisClients.push(pubClient, subClient);
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    // Add authentication middleware (but with relaxed rules for testing)
    io.use(async (socket, next) => {
        const token = socket.handshake.query.token;
        const roleFromQuery = socket.handshake.query.role;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (!decoded.userId || !decoded.username || !decoded.role) {
                    testSocketAuthLogger.warn({ decoded, socketId: socket.id }, 'Token decoded but missing essential fields (userId, username, role)');
                    return next(new Error('Authentication failed in testSetup.ts: Token missing essential fields'));
                }
                if (roleFromQuery && decoded.role !== roleFromQuery) {
                    testSocketAuthLogger.warn({ tokenRole: decoded.role, queryRole: roleFromQuery, socketId: socket.id }, 'Role mismatch between JWT and query parameter in testSetup.ts. Using token role.');
                }
                socket.data.user = {
                    id: decoded.userId, // Set id to userId
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };
                testSocketAuthLogger.debug({ user: socket.data.user, socketId: socket.id }, 'Test user authenticated via JWT in testSetup.ts');
                next();
            }
            catch (err) {
                testSocketAuthLogger.error({ error: err.message, token, socketId: socket.id }, 'Invalid token in testSetup.ts');
                next(new Error(`Authentication failed in testSetup.ts: Invalid token (${err.message})`));
            }
        }
        else if (roleFromQuery) {
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
        }
        else {
            testSocketAuthLogger.warn({ socketId: socket.id }, 'Missing token and role in query parameters in testSetup.ts');
            next(new Error('Authentication failed in testSetup.ts: Missing token or role in query parameters'));
        }
    });
    // Register all socket handlers
    (0, sockets_1.registerHandlers)(io);
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
                                    }
                                    catch (e) {
                                        // Ignore errors
                                    }
                                });
                            }
                            catch (e) {
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
exports.startTestServer = startTestServer;
/**
 * Stop all test servers that may still be running
 */
const stopAllTestServers = async () => {
    // Close all test servers
    const closePromises = openServers.map((server) => {
        return new Promise((resolve) => {
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
        }
        catch (e) {
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
exports.stopAllTestServers = stopAllTestServers;
// Make sure all servers are stopped after tests complete
if (typeof afterAll === 'function') {
    afterAll(async () => {
        await (0, exports.stopAllTestServers)();
    });
}
