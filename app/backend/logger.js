/**
 * logger.js - JavaScript bridge to TypeScript logger module
 *
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility. This is a simplified version that directly imports
 * from the TypeScript module without fallback logic.
 */

let createLoggerTs;

try {
    // Import directly from the TypeScript module
    const tsModule = require('./logger.ts');

    if (typeof tsModule === 'function') {
        createLoggerTs = tsModule;
    } else if (tsModule && typeof tsModule.default === 'function') {
        // This handles if logger.ts has `export default createLogger`
        createLoggerTs = tsModule.default;
    } else if (tsModule && typeof tsModule.createLogger === 'function') {
        // This handles if logger.ts has `export { createLogger }` (less likely for a single function export)
        createLoggerTs = tsModule.createLogger;
    } else {
        // If none of the expected patterns match, throw an error
        throw new Error('Logger function not found in logger.ts module. Check export structure.');
    }
} catch (error) {
    console.error('Error importing logger.ts module, falling back to basic JS logger:', error);
    const LOG_LEVELS_JS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 };
    // Ensure LOG_LEVEL is a string before calling toUpperCase
    const currentLogLevelEnv = typeof process.env.LOG_LEVEL === 'string' ? process.env.LOG_LEVEL : 'DEBUG';
    const MIN_LOG_LEVEL_JS = LOG_LEVELS_JS[currentLogLevelEnv.toUpperCase()] || LOG_LEVELS_JS.DEBUG;

    createLoggerTs = function (prefix) { // Using function keyword
        return {
            debug: function (...args) { // Using function keyword
                if (MIN_LOG_LEVEL_JS <= LOG_LEVELS_JS.DEBUG) {
                    console.log(`[${prefix}] DEBUG:`, ...args);
                }
            },
            info: function (...args) { // Using function keyword
                if (MIN_LOG_LEVEL_JS <= LOG_LEVELS_JS.INFO) {
                    console.log(`[${prefix}] INFO:`, ...args);
                }
            },
            warn: function (...args) { // Using function keyword
                if (MIN_LOG_LEVEL_JS <= LOG_LEVELS_JS.WARN) {
                    console.warn(`[${prefix}] WARN:`, ...args);
                }
            },
            error: function (...args) { // Using function keyword
                if (MIN_LOG_LEVEL_JS <= LOG_LEVELS_JS.ERROR) {
                    console.error(`[${prefix}] ERROR:`, ...args);
                }
            }
        };
    };
}

module.exports = createLoggerTs;