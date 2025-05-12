/**
 * tournamentHandler.js - JavaScript bridge to TypeScript module
 *
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 *
 * The module exports:
 * - registerTournamentHandlers: Function to register all tournament-related socket events.
 * - tournamentState: In-memory state store of active tournaments.
 * - trigger* functions: Functions that can be called by other modules to trigger tournament actions.
 */

const createLogger = require('../logger');
const logger = createLogger('TournamentHandlerBridge');

// Helper function to create the legacy module fallback
function createLegacyTournamentModule(reason) {
    logger.warn(`[Bridge] Creating legacy tournament module. Reason: ${reason}`);
    // const prisma = require('../db'); // Prisma not directly used in the returned object structure
    const { tournamentState } = require('./tournamentUtils/tournamentState.legacy.js');
    // Ensure these are pointing to the JS versions if they are not yet TS or if this is a pure JS fallback path
    const tournamentTriggers = require('./tournamentUtils/tournamentTriggers');
    const registerTournamentEvents = require('./tournamentEvents');

    return {
        registerTournamentHandlers: function (io, socket) {
            logger.warn(`[Bridge] Using fallback registerTournamentHandlers - ${reason}`);
            logger.debug(`Registering tournament handlers for socket ${socket.id} (legacy)`);
            registerTournamentEvents(io, socket);
        },
        tournamentState, // This will be the legacy tournamentState
        triggerTournamentQuestion: (tournamentTriggers && tournamentTriggers.triggerTournamentQuestion) || function () {
            logger.error('triggerTournamentQuestion not available in legacy fallback');
        },
        triggerTournamentPause: (tournamentTriggers && tournamentTriggers.triggerTournamentPause) || function () {
            logger.error('triggerTournamentPause not available in legacy fallback');
        },
        triggerTournamentResume: (tournamentTriggers && tournamentTriggers.triggerTournamentResume) || function () {
            logger.error('triggerTournamentResume not available in legacy fallback');
        },
        triggerTournamentTimerSet: (tournamentTriggers && tournamentTriggers.triggerTournamentTimerSet) || function () {
            logger.error('triggerTournamentTimerSet not available in legacy fallback');
        },
    };
}

// Import the TypeScript module with fallback options
let tsModule;
try {
    const rawModule = require('./tournamentHandler'); // Attempt to load TS module (compiled to .js)

    // tournamentHandler.ts uses: module.exports = tournamentHandlerExports;
    // So, rawModule should be tournamentHandlerExports directly.
    if (rawModule && typeof rawModule.registerTournamentHandlers === 'function') {
        tsModule = rawModule;
        logger.info('[Bridge] Successfully loaded TypeScript module for tournamentHandler.');
    } else {
        const keys = rawModule ? Object.keys(rawModule).join(', ') : 'undefined/null';
        const moduleType = typeof rawModule;
        logger.error(`[Bridge] Failed to load TypeScript module for tournamentHandler correctly. Expected 'registerTournamentHandlers' function. Found type '${moduleType}' with keys: [${keys}]. Falling back to legacy.`);
        tsModule = createLegacyTournamentModule('TS module structure not as expected or incomplete');
    }
} catch (error) {
    logger.error('[Bridge] Error loading TypeScript module for tournamentHandler. Falling back to legacy:', error);
    tsModule = createLegacyTournamentModule('TS module load failed (exception)');
}

// If tsModule was not successfully assigned (e.g. due to an unexpected error path not caught above)
// ensure it's at least the emergency fallback if it's still undefined or not an object.
if (typeof tsModule !== 'object' || tsModule === null) {
    logger.error('[Bridge] tsModule was not properly initialized before export. Using emergency legacy fallback.');
    tsModule = createLegacyTournamentModule('tsModule not initialized');
}

module.exports = tsModule;
