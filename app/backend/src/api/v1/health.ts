/**
 * Health Check and Resource Monitoring Endpoints
 * 
 * Provides system health and resource usage information
 * for monitoring, testing, and operational purposes.
 */

import express, { Request, Response } from 'express';
import createLogger from '@/utils/logger';

const router = express.Router();
const logger = createLogger('health-api');

/**
 * GET /api/v1/health
 * Basic health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /api/v1/health/resources
 * Get current resource usage (memory, CPU)
 * 
 * Useful for:
 * - Stress testing
 * - Performance monitoring
 * - Capacity planning
 */
router.get('/resources', (_req: Request, res: Response) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // Convert to MB for readability
        const memoryUsageMB = memUsage.rss / 1024 / 1024;
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
        const externalMB = memUsage.external / 1024 / 1024;

        // CPU usage (user + system time in microseconds)
        const cpuUserSeconds = cpuUsage.user / 1000000;
        const cpuSystemSeconds = cpuUsage.system / 1000000;
        const cpuTotalSeconds = cpuUserSeconds + cpuSystemSeconds;

        // Estimate CPU percentage (over process lifetime)
        const uptime = process.uptime();
        const cpuUsagePercent = ((cpuTotalSeconds / uptime) * 100).toFixed(2);

        res.status(200).json({
            timestamp: Date.now(),
            memoryUsageMB: parseFloat(memoryUsageMB.toFixed(2)),
            heapUsedMB: parseFloat(heapUsedMB.toFixed(2)),
            heapTotalMB: parseFloat(heapTotalMB.toFixed(2)),
            externalMB: parseFloat(externalMB.toFixed(2)),
            cpuUsagePercent: parseFloat(cpuUsagePercent),
            uptime: parseFloat(uptime.toFixed(2)),
            // Raw values for detailed analysis
            raw: {
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers,
                cpuUser: cpuUsage.user,
                cpuSystem: cpuUsage.system
            }
        });
    } catch (error) {
        logger.error('[HEALTH] Error getting resource usage:', error);
        res.status(500).json({
            error: 'Failed to get resource usage',
            timestamp: Date.now()
        });
    }
});

/**
 * GET /api/v1/health/detailed
 * Get detailed system information
 * 
 * Includes:
 * - Memory usage
 * - CPU usage
 * - Event loop lag
 * - Active handles/requests
 */
router.get('/detailed', (_req: Request, res: Response) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // @ts-ignore - _getActiveHandles and _getActiveRequests are internal Node.js APIs
        const activeHandles = process._getActiveHandles ? process._getActiveHandles().length : 'N/A';
        // @ts-ignore
        const activeRequests = process._getActiveRequests ? process._getActiveRequests().length : 'N/A';

        res.status(200).json({
            timestamp: Date.now(),
            uptime: process.uptime(),
            memory: {
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers,
                rssMB: (memUsage.rss / 1024 / 1024).toFixed(2),
                heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
                heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2)
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
                userSeconds: (cpuUsage.user / 1000000).toFixed(2),
                systemSeconds: (cpuUsage.system / 1000000).toFixed(2)
            },
            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.versions.node,
                v8Version: process.versions.v8
            },
            handles: {
                active: activeHandles,
                requests: activeRequests
            }
        });
    } catch (error) {
        logger.error('[HEALTH] Error getting detailed health:', error);
        res.status(500).json({
            error: 'Failed to get detailed health',
            timestamp: Date.now()
        });
    }
});

export default router;
