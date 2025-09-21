// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load appropriate environment file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
// Always resolve from project root, not __dirname (works for both src/ and dist/)
const envPath = path.resolve(process.cwd(), envFile);
const dotenvResult = dotenv.config({ path: envPath });
// Log which .env file is loaded and a key variable for debugging
console.log(`[ENV] Loaded: ${envPath}`);
console.log(`[ENV] DATABASE_URL:`, process.env.DATABASE_URL);
if (dotenvResult.error) {
    console.error('[ENV] Error loading .env file:', dotenvResult.error);
}

// Register module aliases for path mapping
import 'module-alias/register';

import express, { Request, Response, NextFunction } from 'express';
import os from 'os';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from '@/api';
import createLogger from '@/utils/logger';
import { initializeSocketIO, getIO } from '@/sockets'; // Import getIO
import { Server as SocketIOServer } from 'socket.io'; // Import SocketIOServer type
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@shared/types/socketEvents';

// Create a server-specific logger
const logger = createLogger('Server');

// Handle uncaught exceptions to prevent server crashes
process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught Exception - preventing server crash');
    // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection - preventing server crash');
    // Don't exit the process, just log the error
});

// Check for JWT_SECRET
if (!process.env.JWT_SECRET) {
    logger.warn('JWT_SECRET not found in environment variables, using default secret');
}

const app = express();
const port = process.env.PORT || 3007; // Default to 3007 if PORT not in .env

// Configure CORS for API requests
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://mathquest.example.com'
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Memory monitoring endpoint for VPS monitoring
app.get('/health/memory', (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.status(200).json({
        status: 'OK',
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        uptime: Math.round(uptime),
        timestamp: new Date().toISOString()
    });
});

// Mount API routes, but ensure /api/socket.io is not intercepted by apiRouter
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/socket.io')) { // req.path is relative to the mount point '/api'
        return next('router'); // Skip this router instance for socket.io paths
    }
    // Ensure apiRouter is treated as a middleware function
    return apiRouter(req, res, next); // Process other /api paths with apiRouter
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
    // Always return JSON for errors, and set content-type explicitly
    res.status(500).type('application/json').json({ error: 'Internal server error' });
});

const server = http.createServer(app);

// Initialize Socket.IO with Redis adapter
if (process.env.NODE_ENV !== 'test') {
    initializeSocketIO(server);
}

// Only start the server if this file is run directly (not imported as a module)
// This helps prevent port conflicts during testing
if (process.env.NODE_ENV !== 'test') {
    function isPrivateIp(ip: string) {
        return (
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            (ip.startsWith('172.') && (() => {
                const n = Number(ip.split('.')[1]);
                return n >= 16 && n <= 31;
            })())
        );
    }

    function getLocalIp() {
        const interfaces = os.networkInterfaces();
        const preferred = ['wlan', 'wifi', 'eth', 'en', 'Ethernet', 'Wi-Fi'];
        // Prefer WiFi/Ethernet interfaces with private IP
        for (const pref of preferred) {
            for (const name of Object.keys(interfaces)) {
                if (name.toLowerCase().includes(pref)) {
                    for (const iface of interfaces[name] || []) {
                        if (iface.family === 'IPv4' && !iface.internal && isPrivateIp(iface.address)) {
                            return iface.address;
                        }
                    }
                }
            }
        }
        // Fallback: any private IPv4
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                if (iface.family === 'IPv4' && !iface.internal && isPrivateIp(iface.address)) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }

    server.listen(Number(port), '0.0.0.0', () => {
        logger.info(`Backend server listening on port ${port}`);
        logger.info(`Backend process.cwd(): ${process.cwd()}`);
        const localIp = getLocalIp();
        logger.info(`Access from your local network: http://${localIp}:${port}`);
        logger.error('Forced error log at startup (should appear in error.log and combined.log)');
        logger.info('Forced info log at startup (should appear in combined.log)');

        // Memory monitoring for VPS optimization
        const memUsage = process.memoryUsage();
        logger.info(`Memory at startup: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used, ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB total`);

        // Periodic memory monitoring (every 5 minutes)
        setInterval(() => {
            const mem = process.memoryUsage();
            const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
            const totalMB = Math.round(mem.heapTotal / 1024 / 1024);
            const externalMB = Math.round(mem.external / 1024 / 1024);

            logger.info(`Memory check: ${usedMB}MB used, ${totalMB}MB total, ${externalMB}MB external`);

            // Warn if memory usage is getting high (>80% of limit)
            if (process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
                const maxOldSpace = process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1];
                if (maxOldSpace && usedMB > parseInt(maxOldSpace) * 0.8) {
                    logger.warn(`High memory usage detected: ${usedMB}MB used of ${maxOldSpace}MB limit`);
                }
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    });
} else {
    // For test environment, we'll manually control server start/stop
    // Tests will use the app instance directly with supertest
    logger.info(`Test environment detected, server not automatically started`);
}

// Helper function for tests to setup and start the server on a specific port
export function setupServer(testPort?: number): { httpServer: http.Server, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> } {
    const serverInstance = http.createServer(app);

    // Initialize Socket.IO for test server also
    const ioInstance = initializeSocketIO(serverInstance);

    if (testPort) {
        serverInstance.listen(testPort);
        logger.debug(`Test server started on port ${testPort}`);
    }
    return { httpServer: serverInstance, io: ioInstance };
}

export { app };
export default server;

// Graceful shutdown handling
if (process.env.NODE_ENV !== 'test') {
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully...');

        try {
            // Close Socket.IO server
            const io = getIO();
            if (io) {
                io.close();
                logger.info('Socket.IO server closed');
            }

            // Close HTTP server
            server.close((err) => {
                if (err) {
                    logger.error('Error closing HTTP server:', err);
                } else {
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

        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        process.emit('SIGINT'); // Reuse SIGINT handler
    });
}
