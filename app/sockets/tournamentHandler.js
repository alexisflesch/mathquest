/**
 * tournamentHandler.js - Tournament Handler Registration Module
 *
 * This file serves as the main entry point for tournament-related socket functionality.
 * It imports the tournament state, trigger functions, and registers the event handlers
 * by delegating to the tournamentEvents module.
 *
 * The architecture separates state management, helper functions, trigger functions,
 * and event registration into different modules/folders for clarity and maintainability:
 * - tournamentUtils/tournamentState.js: Manages the in-memory state of active tournaments.
 * - tournamentUtils/tournamentHelpers.js: Contains helper functions like score calculation and sending questions.
 * - tournamentUtils/tournamentTriggers.js: Exports functions to trigger tournament actions from other modules (e.g., quiz handler).
 * - tournamentEventHandlers/: Contains individual files for each socket event handler logic.
 * - tournamentEvents.js: Imports handlers from tournamentEventHandlers/ and registers them with socket.io.
 *
 * The module exports:
 * - registerTournamentHandlers: Function to register all tournament-related socket events.
 * - tournamentState: In-memory state store of active tournaments.
 * - trigger* functions: Functions that can be called by other modules to trigger tournament actions.
 */

const prisma = require('../db'); // Keep prisma require here if needed by top-level or for passing down (though currently not passed)
const createLogger = require('../logger');
const logger = createLogger('TournamentHandler');

// Import state, triggers, and event registration function
const { tournamentState } = require('./tournamentUtils/tournamentState');
const {
    triggerTournamentQuestion,
    triggerTournamentPause,
    triggerTournamentResume,
    triggerTournamentTimerSet,
} = require('./tournamentUtils/tournamentTriggers');
const registerTournamentEvents = require('./tournamentEvents');

// Main registration function called by the server
function registerTournamentHandlers(io, socket) {
    logger.debug(`Registering tournament handlers for socket ${socket.id}`);
    // Delegate event registration to the dedicated module
    // Pass prisma here if registerTournamentEvents needs it (currently it doesn't)
    registerTournamentEvents(io, socket);
}

// Export the registration function, state, and triggers
module.exports = {
    registerTournamentHandlers,
    tournamentState,
    triggerTournamentQuestion,
    triggerTournamentPause,
    triggerTournamentResume,
    triggerTournamentTimerSet,
};
