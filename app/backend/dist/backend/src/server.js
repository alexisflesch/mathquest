"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.setupServer = setupServer;
// Load environment variables FIRST, before any other imports
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load appropriate environment file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
// Always resolve from project root, not __dirname (works for both src/ and dist/)
const envPath = path_1.default.resolve(process.cwd(), envFile);
const dotenvResult = dotenv_1.default.config({ path: envPath });
// Log which .env file is loaded and a key variable for debugging
console.log(`[ENV] Loaded: ${envPath}`);
console.log(`[ENV] DATABASE_URL:`, process.env.DATABASE_URL);
if (dotenvResult.error) {
    console.error('[ENV] Error loading .env file:', dotenvResult.error);
}
// Register module aliases for path mapping
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const api_1 = __importDefault(require("@/api"));
const logger_1 = __importDefault(require("@/utils/logger"));
const sockets_1 = require("@/sockets"); // Import getIO
// Create a server-specific logger
const logger = (0, logger_1.default)('Server');
// Check for JWT_SECRET
if (!process.env.JWT_SECRET) {
    logger.warn('JWT_SECRET not found in environment variables, using default secret');
}
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3007; // Default to 3007 if PORT not in .env
// Configure CORS for API requests
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://mathquest.example.com'
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Mount API routes, but ensure /api/socket.io is not intercepted by apiRouter
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) { // req.path is relative to the mount point '/api'
        return next('router'); // Skip this router instance for socket.io paths
    }
    // Ensure apiRouter is treated as a middleware function
    return (0, api_1.default)(req, res, next); // Process other /api paths with apiRouter
});
// Global error handler
app.use((err, req, res, next) => {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
    // Always return JSON for errors, and set content-type explicitly
    res.status(500).type('application/json').json({ error: 'Internal server error' });
});
const server = http_1.default.createServer(app);
// Initialize Socket.IO with Redis adapter
if (process.env.NODE_ENV !== 'test') {
    (0, sockets_1.initializeSocketIO)(server);
}
// Only start the server if this file is run directly (not imported as a module)
// This helps prevent port conflicts during testing
if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        logger.info(`Backend server listening on port ${port}`);
        logger.info(`Backend process.cwd(): ${process.cwd()}`);
        logger.error('Forced error log at startup (should appear in error.log and combined.log)');
        logger.info('Forced info log at startup (should appear in combined.log)');
    });
}
else {
    // For test environment, we'll manually control server start/stop
    // Tests will use the app instance directly with supertest
    logger.info(`Test environment detected, server not automatically started`);
}
// Helper function for tests to setup and start the server on a specific port
function setupServer(testPort) {
    const serverInstance = http_1.default.createServer(app);
    // Initialize Socket.IO for test server also
    const ioInstance = (0, sockets_1.initializeSocketIO)(serverInstance);
    if (testPort) {
        serverInstance.listen(testPort);
        logger.debug(`Test server started on port ${testPort}`);
    }
    return { httpServer: serverInstance, io: ioInstance };
}
exports.default = server;
// Graceful shutdown handling
if (process.env.NODE_ENV !== 'test') {
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully...');
        try {
            // Close Socket.IO server
            const io = (0, sockets_1.getIO)();
            if (io) {
                io.close();
                logger.info('Socket.IO server closed');
            }
            // Close HTTP server
            server.close((err) => {
                if (err) {
                    logger.error('Error closing HTTP server:', err);
                }
                else {
                    logger.info('HTTP server closed');
                }
                // Exit the process
                process.exit(0);
            });
            // Force exit after 10 seconds if graceful shutdown fails
            setTimeout(() => {
                logger.error('Graceful shutdown timed out, forcing exit');
                process.exit(1);
            }, 10000);
        }
        catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        process.emit('SIGINT'); // Reuse SIGINT handler
    });
}
