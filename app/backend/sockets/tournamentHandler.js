/**
 * tournamentHandler.js - JavaScript bridge to TypeScript module
 *
 * This file serves as a simplified bridge between JavaScript and TypeScript modules.
 * It imports directly from the TypeScript module without complex fallback logic.
 *
 * The module exports:
 * - registerTournamentHandlers: Function to register all tournament-related socket events.
 * - tournamentState: In-memory state store of active tournaments.
 * - trigger* functions: Functions that can be called by other modules to trigger tournament actions.
 */

const createLogger = require('../logger');
const logger = createLogger('TournamentHandlerBridge');

// Import directly from TypeScript modules
const { tournamentState } = require('./tournamentUtils/tournamentState');
const { triggerTournamentQuestion, triggerTournamentTimerSet, triggerTournamentAnswer } = require('./tournamentUtils/tournamentTriggers');
const { registerTournamentEvents } = require('./tournamentEvents');

// Create a module exports object with tournament handler functionality
const moduleExports = {
    registerTournamentHandlers: function (io, socket) {
        logger.debug(`Registering tournament handlers for socket ${socket.id}`);
        registerTournamentEvents(io, socket);
    },
    tournamentState,
    triggerTournamentQuestion,
    triggerTournamentPause,
    triggerTournamentResume,
    triggerTournamentTimerSet
};

// Log successful initialization
logger.info('[Bridge] Successfully loaded tournament handler module components');

// Export the module
module.exports = moduleExports;
