"use strict";
/**
 * logger.ts - Centralized Logging Utility for MathQuest
 *
 * This module provides a consistent logging interface with:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Automatic timestamps
 * - Contextual prefixes for easier log filtering
 * - Environment-based configuration
 * - Both console and file logging using Winston
 *
 * Usage:
 *   import createLogger from '../utils/logger';
 *   const logger = createLogger('ComponentName');
 *   logger.debug('Detailed info for debugging');
 *   logger.info('Normal operation information');
 *   logger.warn('Warning that might need attention');
 *   logger.error('Error condition', errorObject);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.flushLogger = flushLogger;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
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
}
else if (process.env.NODE_ENV === 'test') {
    DEFAULT_LOG_LEVEL = 'info';
}
const LOG_LEVEL = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;
// Determine log directory
const LOG_DIR = path_1.default.join(process.cwd(), 'logs');
// Winston configuration
const transports = [];
// Always add a console transport for debugging, even in production (remove later if not needed)
transports.push(new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.printf(({ timestamp, level, message, component, ...meta }) => {
        const componentStr = component ? `[${component}] ` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${level} ${componentStr}${message}${metaStr}`;
    }))
}));
if (process.env.NODE_ENV !== 'production') {
    // Development: Console + file (all levels)
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(LOG_DIR, 'combined.log'),
        level: 'debug',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
    }));
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
    }));
}
else {
    // Production: Write WARN and ERROR to combined.log, ERROR to error.log
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(LOG_DIR, 'combined.log'),
        level: 'warn', // includes warn and error
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
    }));
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
    }));
}
const winstonConfig = {
    levels: logLevels,
    level: LOG_LEVEL,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports
};
// Create the base winston logger
const baseLogger = winston_1.default.createLogger(winstonConfig);
/**
 * Creates a logger instance with a specific component prefix.
 * @param component - The component name to use for log messages (e.g., component name)
 * @returns Logger instance
 */
function createLogger(component) {
    return {
        debug: (...args) => {
            baseLogger.debug(formatMessage(...args), { component });
        },
        info: (...args) => {
            baseLogger.info(formatMessage(...args), { component });
        },
        warn: (...args) => {
            baseLogger.warn(formatMessage(...args), { component });
        },
        error: (...args) => {
            baseLogger.error(formatMessage(...args), { component });
        }
    };
}
/**
 * Helper function to format log messages consistently
 */
function formatMessage(...args) {
    return args.map(arg => {
        if (arg instanceof Error) {
            return `${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, null, 2);
            }
            catch (e) {
                return '[Unserializable Object]';
            }
        }
        return String(arg);
    }).join(' ');
}
// Create default logger instance
exports.logger = createLogger('Server');
// Startup messages to verify winston is working and config is correct
exports.logger.info('Winston logger initialized successfully', {
    logLevel: LOG_LEVEL,
    logDir: LOG_DIR,
    nodeEnv: process.env.NODE_ENV
});
exports.logger.warn('Winston logger WARN test: This should appear in combined.log and console if warn logging is working.', {
    logLevel: LOG_LEVEL,
    logDir: LOG_DIR,
    nodeEnv: process.env.NODE_ENV
});
// Add a flush method for test and script environments
function flushLogger() {
    return new Promise((resolve) => {
        baseLogger.on('finish', resolve);
        baseLogger.end();
    });
}
// Export for CommonJS environments (e.g., Node.js)
exports.default = createLogger;
