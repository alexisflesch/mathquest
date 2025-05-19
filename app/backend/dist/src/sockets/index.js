"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketIO = initializeSocketIO;
exports.getIO = getIO;
exports.configureSocketServer = configureSocketServer;
exports.registerHandlers = registerHandlers;
exports.setupSocketHandlers = setupSocketHandlers;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const socketAuth_1 = require("./middleware/socketAuth");
const connectionHandlers_1 = require("./handlers/connectionHandlers");
const projectorHandler_1 = require("./handlers/projectorHandler");
// Create a socket-specific logger
const logger = (0, logger_1.default)('SocketIO');
let io = null;
/**
 * Initialize Socket.IO server with Redis adapter
 * @param server HTTP server instance to attach Socket.IO to
 */
function initializeSocketIO(server) {
    if (io) {
        logger.warn('Socket.IO server already initialized');
        return io;
    }
    // Create a duplicate Redis client for subscription
    const subClient = redis_1.redisClient.duplicate();
    // Create Socket.IO server with CORS configuration
    io = new socket_io_1.Server(server, {
        cors: {
            // Allow connections from frontend in dev and prod
            origin: process.env.NODE_ENV === 'production'
                ? process.env.FRONTEND_URL || 'https://mathquest.example.com'
                : ['http://localhost:3000', 'http://localhost:3001'],
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
    io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redisClient, subClient));
    // Add authentication middleware
    io.use(socketAuth_1.socketAuthMiddleware);
    // Register connection handlers
    (0, connectionHandlers_1.registerConnectionHandlers)(io);
    logger.info('Socket.IO server initialized with Redis adapter');
    return io;
}
/**
 * Get the Socket.IO server instance
 * @returns The Socket.IO server instance or null if not initialized
 */
function getIO() {
    return io;
}
/**
 * Configure a Socket.IO server instance
 * This is used for testing to configure a server that's created outside the normal startup flow
 * @param socketServer The Socket.IO server to configure
 */
function configureSocketServer(socketServer) {
    // If we're already tracking an instance, log a warning
    if (io && io !== socketServer) {
        logger.warn('Configuring a new Socket.IO server while another one exists');
    }
    io = socketServer;
}
/**
 * Register all socket event handlers
 * @param socketServer The Socket.IO server to register handlers on
 */
function registerHandlers(socketServer) {
    (0, connectionHandlers_1.registerConnectionHandlers)(socketServer);
}
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        (0, projectorHandler_1.projectorHandler)(io, socket);
    });
}
