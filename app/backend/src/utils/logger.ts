/**
 * logger.ts - Centralized Logging Utility for MathQuest
 *
 * This module provides a consistent logging interface with:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Automatic timestamps
 * - Contextual prefixes for easier log filtering
 * - Environment-based configuration
 * - Both console and file logging using Winston
 * - Correlation ID support for request tracing (Phase 5: Observability)
 *
 * Usage:
 *   import createLogger from '../utils/logger';
 *   const logger = createLogger('ComponentName');
 *   logger.debug('Detailed info for debugging');
 *   logger.info('Normal operation information', { correlationId: 'client-123-abc' });
 *   logger.warn('Warning that might need attention');
 *   logger.error('Error condition', errorObject);
 */

import winston from 'winston';
import path from 'path';
import type { CorrelationId } from '@shared/types/core/correlation';

// Winston log levels and their priorities
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Set minimum log level based on environment (can be overridden via env var)
// In production, force at least 'warn' to ensure warn+error logs are processed
let DEFAULT_LOG_LEVEL = 'debug';
if (process.env.NODE_ENV === 'production') {
    DEFAULT_LOG_LEVEL = 'warn';
} else if (process.env.NODE_ENV === 'test') {
    DEFAULT_LOG_LEVEL = 'info';
}
const LOG_LEVEL = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

// Determine log directory
const LOG_DIR = path.join(process.cwd(), 'logs');

// Winston configuration
const transports = [];

// Always add a console transport for debugging, even in production (remove later if not needed)
transports.push(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.printf(({ timestamp, level, message, component, correlationId, ...meta }) => {
                const componentStr = component ? `[${component}] ` : '';
                // Ensure correlationId is string before calling slice
                const correlationStr = correlationId && typeof correlationId === 'string' 
                    ? ` [CID:${correlationId.slice(-8)}]` 
                    : '';
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
                return `${timestamp} ${level} ${componentStr}${correlationStr}${message}${metaStr}`;
            })
        )
    })
);

if (process.env.NODE_ENV !== 'production') {
    // Development: Console + file (all levels)
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            level: 'debug',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    );
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    );
} else {
    // Production: Write WARN and ERROR to combined.log, ERROR to error.log
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            level: 'warn', // includes warn and error
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    );
    transports.push(
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    );
}

const winstonConfig = {
    levels: logLevels,
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports
};

// Create the base winston logger
const baseLogger = winston.createLogger(winstonConfig);

// Logger metadata interface (Phase 5: Observability)
interface LoggerMetadata {
    correlationId?: CorrelationId;
    [key: string]: any;
}

interface Logger {
    debug: (messageOrMeta: any, metadataOrMessage?: any) => void;
    info: (messageOrMeta: any, metadataOrMessage?: any) => void;
    warn: (messageOrMeta: any, metadataOrMessage?: any) => void;
    error: (messageOrMeta: any, metadataOrMessage?: any) => void;
}

/**
 * Creates a logger instance with a specific component prefix.
 * @param component - The component name to use for log messages (e.g., component name)
 * @returns Logger instance
 */
function createLogger(component: string): Logger {
    // Helper to normalize arguments (support both old and new calling patterns)
    const normalizeArgs = (messageOrMeta: any, metadataOrMessage?: any): { message: string; metadata: any } => {
        // Old pattern: logger.error({ error }, 'message')
        if (typeof messageOrMeta === 'object' && typeof metadataOrMessage === 'string') {
            return { message: metadataOrMessage, metadata: messageOrMeta };
        }
        // New pattern: logger.error('message', { correlationId })
        if (typeof messageOrMeta === 'string' && typeof metadataOrMessage === 'object') {
            return { message: messageOrMeta, metadata: metadataOrMessage };
        }
        // Single argument (message only or metadata only)
        if (typeof messageOrMeta === 'string') {
            return { message: messageOrMeta, metadata: {} };
        }
        return { message: formatMessage(messageOrMeta), metadata: {} };
    };

    return {
        debug: (messageOrMeta: any, metadataOrMessage?: any) => {
            const { message, metadata } = normalizeArgs(messageOrMeta, metadataOrMessage);
            baseLogger.debug(message, { component, ...metadata });
        },
        info: (messageOrMeta: any, metadataOrMessage?: any) => {
            const { message, metadata } = normalizeArgs(messageOrMeta, metadataOrMessage);
            baseLogger.info(message, { component, ...metadata });
        },
        warn: (messageOrMeta: any, metadataOrMessage?: any) => {
            const { message, metadata } = normalizeArgs(messageOrMeta, metadataOrMessage);
            baseLogger.warn(message, { component, ...metadata });
        },
        error: (messageOrMeta: any, metadataOrMessage?: any) => {
            const { message, metadata } = normalizeArgs(messageOrMeta, metadataOrMessage);
            baseLogger.error(message, { component, ...metadata });
        }
    };
}

/**
 * Helper function to format log messages consistently
 */
function formatMessage(arg: any): string {
    if (arg instanceof Error) {
        return `${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
    }
    if (typeof arg === 'object' && arg !== null) {
        try {
            return JSON.stringify(arg, null, 2);
        } catch (e) {
            return '[Unserializable Object]';
        }
    }
    return String(arg);
}

// Create default logger instance
export const logger = createLogger('Server');


// Startup messages to verify winston is working and config is correct
logger.info('Winston logger initialized successfully', {
    logLevel: LOG_LEVEL,
    logDir: LOG_DIR,
    nodeEnv: process.env.NODE_ENV
});
logger.warn('Winston logger WARN test: This should appear in combined.log and console if warn logging is working.', {
    logLevel: LOG_LEVEL,
    logDir: LOG_DIR,
    nodeEnv: process.env.NODE_ENV
});

// Add a flush method for test and script environments
export function flushLogger(): Promise<void> {
    return new Promise((resolve) => {
        baseLogger.on('finish', resolve);
        baseLogger.end();
    });
}

// Export for CommonJS environments (e.g., Node.js)
export default createLogger;
