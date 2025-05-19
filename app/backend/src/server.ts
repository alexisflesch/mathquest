// Register module aliases for path mapping
import 'module-alias/register';

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from '@/api';
import createLogger from '@/utils/logger';
import { initializeSocketIO } from '@/sockets';

// Create a server-specific logger
const logger = createLogger('Server');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Check for JWT_SECRET
if (!process.env.JWT_SECRET) {
    logger.warn('JWT_SECRET not found in environment variables, using default secret');
}

const app = express();
const port = process.env.PORT || 3007; // Default to 3007 if PORT not in .env

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Mount API routes
app.use('/api', apiRouter);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
    // Always return JSON for errors, and set content-type explicitly
    res.status(500).type('application/json').json({ error: 'Internal server error' });
});

const server = http.createServer(app);

// Initialize Socket.IO with Redis adapter
initializeSocketIO(server);

// Only start the server if this file is run directly (not imported as a module)
// This helps prevent port conflicts during testing
if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        logger.info(`Backend server listening on port ${port}`);
    });
} else {
    // For test environment, we'll manually control server start/stop
    // Tests will use the app instance directly with supertest
    console.log(`Test environment detected, server not automatically started`);
}

// Helper function for tests to setup and start the server on a specific port
export function setupServer(testPort?: number): http.Server {
    const serverInstance = http.createServer(app);

    // Initialize Socket.IO for test server also
    initializeSocketIO(serverInstance);

    if (testPort) {
        serverInstance.listen(testPort);
        logger.debug(`Test server started on port ${testPort}`);
    }
    return serverInstance;
}

export { app };
export default server;
