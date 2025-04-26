/**
 * logger.js - Centralized Logging Utility for MathQuest
 * 
 * This module provides a consistent logging interface with:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Automatic timestamps
 * - Contextual prefixes for easier log filtering
 * - Environment-based configuration
 * 
 * Usage:
 *   const logger = require('./logger')('ComponentName');
 *   logger.debug('Detailed info for debugging');
 *   logger.info('Normal operation information');
 *   logger.warn('Warning that might need attention');
 *   logger.error('Error condition', errorObject);
 */

// Log levels and their priorities
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Set minimum log level based on environment (can be overridden via env var)
// Default level is DEBUG in development, INFO in production
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
const MIN_LOG_LEVEL = process.env.LOG_LEVEL
    ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || DEFAULT_LOG_LEVEL)
    : DEFAULT_LOG_LEVEL;

// ANSI color codes for different log levels
const COLORS = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m'   // Reset
};

/**
 * Format the current timestamp
 * @returns {string} Formatted timestamp [YYYY-MM-DD HH:MM:SS.mmm]
 */
function getTimestamp() {
    const now = new Date();
    return `[${now.toISOString().replace('T', ' ').replace('Z', '')}]`;
}

/**
 * Create a logger instance for a specific component
 * @param {string} context - The name of the component using this logger
 * @returns {object} Logger object with methods for each log level
 */
function createLogger(context) {
    // Common logging function
    const log = (level, message, ...args) => {
        if (LOG_LEVELS[level] < MIN_LOG_LEVEL) return;

        const color = COLORS[level] || COLORS.RESET;
        const prefix = `${getTimestamp()} ${color}[${level}]\x1b[0m [${context}]`;

        if (level === 'ERROR') {
            console.error(prefix, message, ...args);
        } else {
            console.log(prefix, message, ...args);
        }
    };

    return {
        debug: (message, ...args) => log('DEBUG', message, ...args),
        info: (message, ...args) => log('INFO', message, ...args),
        warn: (message, ...args) => log('WARN', message, ...args),
        error: (message, ...args) => log('ERROR', message, ...args)
    };
}

// At the end of logger.js, use only CommonJS export for server-side compatibility
module.exports = createLogger;