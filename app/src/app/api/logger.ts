/**
 * API Logger
 * 
 * This module provides a structured logging system for server-side API routes:
 * - Standard log levels (debug, info, warn, error)
 * - Consistent formatting with additional context
 * - Environment-based log level control
 * 
 * The server-side logger provides a similar interface to the client-side logger,
 * but is specifically tailored for use in API routes and other server-side code.
 */

// Define log levels and their priorities
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

// Determine minimum log level from environment or default to INFO
const getMinLogLevel = (): number => {
    const envLevel = process.env.API_LOG_LEVEL as LogLevel;
    return envLevel && LOG_LEVELS[envLevel] !== undefined
        ? LOG_LEVELS[envLevel]
        : LOG_LEVELS.INFO; // Default to INFO in production
};

const MIN_LOG_LEVEL = getMinLogLevel();

// Core logging function
const log = (level: LogLevel, message: string, context?: unknown) => {
    if (LOG_LEVELS[level] < MIN_LOG_LEVEL) return;

    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    const formattedMessage = `[${timestamp}] [${level}] ${message} ${contextStr}`;

    switch (level) {
        case 'ERROR':
            console.error(formattedMessage);
            break;
        case 'WARN':
            console.warn(formattedMessage);
            break;
        case 'INFO':
            console.info(formattedMessage);
            break;
        case 'DEBUG':
        default:
            console.log(formattedMessage);
            break;
    }
};

// Export methods for each log level
const logger = {
    debug: (message: string, context?: unknown) => log('DEBUG', message, context),
    info: (message: string, context?: unknown) => log('INFO', message, context),
    warn: (message: string, context?: unknown) => log('WARN', message, context),
    error: (message: string, context?: unknown) => log('ERROR', message, context),
};

export default logger;