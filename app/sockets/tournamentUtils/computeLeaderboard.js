const createLogger = require('@logger'); // Use path alias
const logger = createLogger('ComputeLeaderboardBridge');

let tsModuleExports = {}; // Default to empty object

try {
    const loadedModule = require('./computeLeaderboard'); // Expects compiled .js from computeLeaderboard.ts

    if (loadedModule && typeof loadedModule.computeLeaderboard === 'function') {
        tsModuleExports = loadedModule;
        logger.info('[Bridge] Successfully loaded TypeScript module for computeLeaderboard.');
    } else {
        const moduleType = typeof loadedModule;
        const keys = loadedModule ? Object.keys(loadedModule).join(', ') : 'undefined/null';
        logger.error(`[Bridge] Failed to load computeLeaderboard.ts correctly. Expected 'computeLeaderboard' function. Found type '${moduleType}' with keys: [${keys}]. Using stub implementation.`);
        tsModuleExports = {
            computeLeaderboard: (...args) => {
                logger.error('[Bridge-Stub] computeLeaderboard called on empty/failed module.', { args });
                return []; // Return an empty array as a default
            }
        };
    }
} catch (error) {
    logger.error('[Bridge] Error loading TypeScript module for computeLeaderboard. Using stub implementation:', error);
    tsModuleExports = { // Fallback stub in case of error
        computeLeaderboard: (...args) => {
            logger.error('[Bridge-Stub] computeLeaderboard called on error-fallback module.', { args });
            return [];
        }
    };
}

module.exports = tsModuleExports;