// filepath: /home/aflesch/mathquest/app/sockets/tournamentUtils/tournamentTriggers.js
const createLogger = require('@logger'); // Use path alias
const logger = createLogger('TournamentTriggersBridge');

let tsModuleExports = {}; // Default to empty object

try {
    // Attempt to load the compiled TypeScript module
    const loadedModule = require('./tournamentTriggers');

    // Check if the loaded module has the expected structure (e.g., exports triggerTournamentQuestion function)
    if (loadedModule && typeof loadedModule.triggerTournamentQuestion === 'function') {
        tsModuleExports = loadedModule;
        logger.info('[Bridge] Successfully loaded TypeScript module for tournamentTriggers.');
    } else {
        const moduleType = typeof loadedModule;
        const keys = loadedModule ? Object.keys(loadedModule).join(', ') : 'undefined/null';
        logger.error(`[Bridge] Failed to load TypeScript module for tournamentTriggers correctly. Expected 'triggerTournamentQuestion' function. Found type '${moduleType}' with keys: [${keys}]. Using stub implementations.`);
        // Provide minimal stub implementations to prevent crashes and log usage
        tsModuleExports = {
            triggerTournamentQuestion: (...args) => logger.error('[Bridge-Stub] triggerTournamentQuestion called on empty/failed module.', { args }),
            triggerTournamentPause: (...args) => logger.error('[Bridge-Stub] triggerTournamentPause called on empty/failed module.', { args }),
            triggerTournamentResume: (...args) => logger.error('[Bridge-Stub] triggerTournamentResume called on empty/failed module.', { args }),
            triggerTournamentTimerSet: (...args) => logger.error('[Bridge-Stub] triggerTournamentTimerSet called on empty/failed module.', { args }),
        };
    }
} catch (error) {
    logger.error('[Bridge] Error loading TypeScript module for tournamentTriggers. Using stub implementations:', error);
    tsModuleExports = { // Fallback stubs in case of error
        triggerTournamentQuestion: (...args) => logger.error('[Bridge-Stub] triggerTournamentQuestion called on error-fallback module.', { args }),
        triggerTournamentPause: (...args) => logger.error('[Bridge-Stub] triggerTournamentPause called on error-fallback module.', { args }),
        triggerTournamentResume: (...args) => logger.error('[Bridge-Stub] triggerTournamentResume called on error-fallback module.', { args }),
        triggerTournamentTimerSet: (...args) => logger.error('[Bridge-Stub] triggerTournamentTimerSet called on error-fallback module.', { args }),
    };
}

module.exports = tsModuleExports;
