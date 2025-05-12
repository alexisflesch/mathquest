/**
 * logger.js - JavaScript bridge to TypeScript logger module
 *
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility.
 */

let createLoggerTs;

try {
    // Try to require the TypeScript compiled output
    // It might be resolved directly as .ts by ts-node, or as .js if pre-compiled
    const tsModule = require('./logger.ts');

    if (typeof tsModule === 'function') {
        createLoggerTs = tsModule;
    } else if (tsModule && typeof tsModule.default === 'function') {
        // This handles if logger.ts has `export default createLogger`
        createLoggerTs = tsModule.default;
    } else if (tsModule && typeof tsModule.createLogger === 'function') {
        // This handles if logger.ts has `export { createLogger }` (less likely for a single function export)
        createLoggerTs = tsModule.createLogger;
    }
    else {
        // Fallback for other structures or if direct require('./logger.ts') fails to find the function
        console.warn('Could not directly load createLogger from logger.ts, attempting fallback require patterns.');
        // Attempt to require without extension, letting Node's resolution work (e.g. for dist/logger.js)
        const fallbackModule = require('./logger'); // This would point to itself if not careful, but with .ts above, it might try .js
        if (typeof fallbackModule === 'function') {
            createLoggerTs = fallbackModule;
        } else if (fallbackModule && typeof fallbackModule.default === 'function') {
            createLoggerTs = fallbackModule.default;
        } else if (fallbackModule && typeof fallbackModule.createLogger === 'function') {
            createLoggerTs = fallbackModule.createLogger;
        } else {
            // If logger.ts exists, this path suggests its export structure is not recognized.
            throw new Error('Logger function not found in logger.ts or its compiled output. Check export structure.');
        }
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