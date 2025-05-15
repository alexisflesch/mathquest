"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.setupServer = setupServer;
// Register module aliases for path mapping
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const api_1 = __importDefault(require("@/api"));
const logger_1 = __importDefault(require("@/utils/logger"));
const sockets_1 = require("@/sockets");
// Create a server-specific logger
const logger = (0, logger_1.default)('Server');
// Load environment variables from the root .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Check for JWT_SECRET
if (!process.env.JWT_SECRET) {
    logger.warn('JWT_SECRET not found in environment variables, using default secret');
}
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3007; // Default to 3007 if PORT not in .env
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Mount API routes
app.use('/api', api_1.default);
// Global error handler
app.use((err, req, res, next) => {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
    res.status(500).send('Something broke!');
});
const server = http_1.default.createServer(app);
// Initialize Socket.IO with Redis adapter
(0, sockets_1.initializeSocketIO)(server);
// Only start the server if this file is run directly (not imported as a module)
// This helps prevent port conflicts during testing
if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        logger.info(`Backend server listening on port ${port}`);
    });
}
else {
    // For test environment, we'll manually control server start/stop
    // Tests will use the app instance directly with supertest
    console.log(`Test environment detected, server not automatically started`);
}
// Helper function for tests to setup and start the server on a specific port
function setupServer(testPort) {
    const serverInstance = http_1.default.createServer(app);
    // Initialize Socket.IO for test server also
    (0, sockets_1.initializeSocketIO)(serverInstance);
    if (testPort) {
        serverInstance.listen(testPort);
        logger.debug(`Test server started on port ${testPort}`);
    }
    return serverInstance;
}
exports.default = server;
