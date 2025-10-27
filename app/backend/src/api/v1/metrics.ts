/**
 * Phase 5: Observability - Metrics API Endpoint
 * 
 * GET /api/v1/metrics
 * - Returns current metrics snapshot
 * - Dev/staging only (gated by ENABLE_METRICS env var)
 * - No authentication required (internal debugging tool)
 */

import express, { Request, Response } from 'express';
import createLogger from '@/utils/logger';
import { metricsCollector } from '@/metrics/metricsCollector';

const router = express.Router();
const logger = createLogger('MetricsAPI');

/**
 * GET /api/v1/metrics
 * Returns current metrics snapshot and alerts
 */
router.get('/', (req: Request, res: Response): void => {
    const snapshot = metricsCollector.getSnapshot();

    if (!snapshot.enabled) {
        res.status(503).json({
            error: 'Metrics collection is disabled',
            message: 'Set ENABLE_METRICS=true to enable metrics collection'
        });
        return;
    }

    logger.debug('Metrics snapshot requested', { 
        alerts: snapshot.alerts.length,
        timestamp: snapshot.timestamp 
    });

    res.status(200).json(snapshot);
});

/**
 * GET /api/v1/metrics/history
 * Returns historical data (last N minutes)
 */
router.get('/history', (req: Request, res: Response): void => {
    const minutes = parseInt(req.query.minutes as string) || 10;
    
    if (minutes < 1 || minutes > 60) {
        res.status(400).json({
            error: 'Invalid minutes parameter',
            message: 'minutes must be between 1 and 60'
        });
        return;
    }

    const history = metricsCollector.getHistory(minutes);
    const snapshot = metricsCollector.getSnapshot();

    if (!snapshot.enabled) {
        res.status(503).json({
            error: 'Metrics collection is disabled',
            message: 'Set ENABLE_METRICS=true to enable metrics collection'
        });
        return;
    }

    logger.debug('Metrics history requested', { minutes, buckets: history.length });

    res.status(200).json({
        enabled: true,
        minutes,
        buckets: history,
        current: snapshot.currentMinute,
        timestamp: Date.now()
    });
});

export default router;
