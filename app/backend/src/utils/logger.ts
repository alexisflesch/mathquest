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

// Log levels and their priorities
enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

// Set minimum log level based on environment (can be overridden via env var)
// Default level is DEBUG in development, INFO in production
const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
const MIN_LOG_LEVEL: LogLevel = process.env.LOG_LEVEL
    ? (LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] ?? DEFAULT_LOG_LEVEL)
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
function getTimestamp(): string {
    const now = new Date();
    // Pad single digit numbers with a leading zero
    const pad = (n: number) => n.toString().padStart(2, '0');
    const YYYY = now.getFullYear();
    const MM = pad(now.getMonth() + 1);
    const DD = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const mmm = now.getMilliseconds().toString().padStart(3, '0');
    return `[${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${mmm}]`;
}

interface Logger {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}

/**
 * Creates a logger instance with a specific prefix.
 * @param prefix - The prefix to use for log messages (e.g., component name)
 * @returns Logger instance
 */
function createLogger(prefix: string): Logger {
    const log = (level: LogLevel, color: string, ...args: any[]): void => {
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
                    } catch (e) {
                        return '[Unserializable Object]';
                    }
                }
                return arg;
            });

            console.log(`${timestamp} ${color}${levelToString(level).padEnd(5)}${COLORS.RESET} ${prefixStr}`, ...processedArgs);
        }
    };

    const levelToString = (level: LogLevel): string => {
        switch (level) {
            case LogLevel.DEBUG: return 'DEBUG';
            case LogLevel.INFO: return 'INFO';
            case LogLevel.WARN: return 'WARN';
            case LogLevel.ERROR: return 'ERROR';
            default: return 'LOG';
        }
    };

    return {
        debug: (...args: any[]) => log(LogLevel.DEBUG, COLORS.DEBUG, ...args),
        info: (...args: any[]) => log(LogLevel.INFO, COLORS.INFO, ...args),
        warn: (...args: any[]) => log(LogLevel.WARN, COLORS.WARN, ...args),
        error: (...args: any[]) => log(LogLevel.ERROR, COLORS.ERROR, ...args),
    };
}

// Create default logger instance
export const logger = createLogger('Server');

// Export for CommonJS environments (e.g., Node.js)
export default createLogger;
