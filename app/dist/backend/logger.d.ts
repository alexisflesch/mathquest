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
 *   import createLogger from './logger'; // or const createLogger = require('./logger');
 *   const logger = createLogger('ComponentName');
 *   logger.debug('Detailed info for debugging');
 *   logger.info('Normal operation information');
 *   logger.warn('Warning that might need attention');
 *   logger.error('Error condition', errorObject);
 */
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
declare function createLogger(prefix: string): Logger;
export default createLogger;
