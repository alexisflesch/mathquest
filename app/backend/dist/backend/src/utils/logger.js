"use strict";
/**
 * logger.ts - Centralized Logging Utility for MathQuest
 *
 * This module provides a consistent logging interface with:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Automatic timestamps
 * - Contextual prefixes for easier log filtering
 * - Environment-based configuration
 *
 * Usage:
 *   import createLogger from '../utils/logger';
 *   const logger = createLogger('ComponentName');
 *   logger.debug('Detailed info for debugging');
 *   logger.info('Normal operation information');
 *   logger.warn('Warning that might need attention');
 *   logger.error('Error condition', errorObject);
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Log levels and their priorities
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (LogLevel = {}));
// Set minimum log level based on environment (can be overridden via env var)
// Default level is DEBUG in development, INFO in production, and INFO in test (was WARN)
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
let MIN_LOG_LEVEL = process.env.NODE_ENV === 'test'
    ? LogLevel.INFO // Show info+ in test
    : (process.env.LOG_LEVEL
        ? (LogLevel[process.env.LOG_LEVEL.toUpperCase()] ?? DEFAULT_LOG_LEVEL)
        : DEFAULT_LOG_LEVEL);
// Allow override from global (for test patching)
if (typeof global !== 'undefined' && global.MIN_LOG_LEVEL !== undefined) {
    MIN_LOG_LEVEL = global.MIN_LOG_LEVEL;
}
// ANSI color codes for different log levels
const COLORS = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m', // Green
    WARN: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m' // Reset
};
/**
 * Format the current timestamp
 * @returns {string} Formatted timestamp [YYYY-MM-DD HH:MM:SS.mmm]
 */
function getTimestamp() {
    const now = new Date();
    // Pad single digit numbers with a leading zero
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = now.getFullYear();
    const MM = pad(now.getMonth() + 1);
    const DD = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const mmm = now.getMilliseconds().toString().padStart(3, '0');
    return `[${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${mmm}]`;
}
/**
 * Creates a logger instance with a specific prefix.
 * @param prefix - The prefix to use for log messages (e.g., component name)
 * @returns Logger instance
 */
function createLogger(prefix) {
    const log = (level, color, ...args) => {
        if (level >= MIN_LOG_LEVEL) {
            const timestamp = getTimestamp();
            const prefixStr = `[${prefix}]`;
            // Convert all arguments to strings, handling objects and errors
            const processedArgs = args.map(arg => {
                if (arg instanceof Error) {
                    return `${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
                }
                if (typeof arg === 'object' && arg !== null) {
                    try {
                        return JSON.stringify(arg, null, 2); // Pretty print objects
                    }
                    catch (e) {
                        return '[Unserializable Object]';
                    }
                }
                return arg;
            });
            console.log(`${timestamp} ${color}${levelToString(level).padEnd(5)}${COLORS.RESET} ${prefixStr}`, ...processedArgs);
        }
    };
    const levelToString = (level) => {
        switch (level) {
            case LogLevel.DEBUG: return 'DEBUG';
            case LogLevel.INFO: return 'INFO';
            case LogLevel.WARN: return 'WARN';
            case LogLevel.ERROR: return 'ERROR';
            default: return 'LOG';
        }
    };
    return {
        debug: (...args) => log(LogLevel.DEBUG, COLORS.DEBUG, ...args),
        info: (...args) => log(LogLevel.INFO, COLORS.INFO, ...args),
        warn: (...args) => log(LogLevel.WARN, COLORS.WARN, ...args),
        error: (...args) => log(LogLevel.ERROR, COLORS.ERROR, ...args),
    };
}
// Create default logger instance
exports.logger = createLogger('Server');
// Export for CommonJS environments (e.g., Node.js)
exports.default = createLogger;
