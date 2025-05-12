const createLogger = require('../../logger');
const logger = createLogger('TournamentTriggersBridge');

let tsModuleExports = {}; // Default to empty object

try {
    const loadedModule = require('./tournamentTriggers');

    // Standardize export access
    const {
        triggerTournamentQuestion,
        triggerTournamentTimerSet,
        triggerTournamentAnswer
    } = loadedModule.default || loadedModule;

    if (triggerTournamentQuestion && triggerTournamentTimerSet && triggerTournamentAnswer) {
        tsModuleExports = {
            triggerTournamentQuestion,
            triggerTournamentTimerSet,
            triggerTournamentAnswer
        };
        logger.info('[Bridge] Successfully loaded TypeScript module for tournamentTriggers.');
    } else {
        throw new Error('Required functions not found in module exports.');
    }
} catch (error) {
    logger.error('[Bridge] Error loading TypeScript module for tournamentTriggers:', error);
    tsModuleExports = {
        triggerTournamentQuestion: (...args) => logger.error('[Bridge-Stub] triggerTournamentQuestion called on error-fallback module.', { args }),
        triggerTournamentTimerSet: (...args) => logger.error('[Bridge-Stub] triggerTournamentTimerSet called on error-fallback module.', { args }),
        triggerTournamentAnswer: (...args) => logger.error('[Bridge-Stub] triggerTournamentAnswer called on error-fallback module.', { args })
    };
}

module.exports = tsModuleExports;
