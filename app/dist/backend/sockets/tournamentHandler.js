"use strict";
/**
 * tournamentHandler.ts - Tournament Handler Registration Module
 *
 * This file serves as the main entry point for tournament-related socket functionality.
 * It imports the tournament state, trigger functions, and registers the event handlers
 * by delegating to the tournamentEvents module.
 *
 * The architecture separates state management, helper functions, trigger functions,
 * and event registration into different modules/folders for clarity and maintainability:
 * - tournamentUtils/tournamentState.ts: Manages the in-memory state of active tournaments.
 * - tournamentUtils/tournamentHelpers.ts: Contains helper functions like score calculation and sending questions.
 * - tournamentUtils/tournamentTriggers.ts: Exports functions to trigger tournament actions from other modules.
 * - tournamentEventHandlers/: Contains individual files for each socket event handler logic.
 * - tournamentEvents.ts: Imports handlers from tournamentEventHandlers/ and registers them with socket.io.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentState = void 0;
exports.registerTournamentHandlers = registerTournamentHandlers;
// Import the new tournamentState module
const tournamentState_1 = require("./tournamentUtils/tournamentState");
Object.defineProperty(exports, "tournamentState", { enumerable: true, get: function () { return tournamentState_1.tournamentState; } });
// Import tournament event registration
const tournamentEvents_1 = require("./tournamentEvents");
const prisma = require('../db');
const createLogger = require('../logger');
const logger = createLogger('TournamentHandler');
/**
 * Main registration function called by the server
 *
 * @param io - Socket.IO server instance
 * @param socket - Socket connection instance
 */
function registerTournamentHandlers(io, socket) {
    logger.info(`[registerTournamentHandlers] Registering tournament event handlers for socket ${socket.id}`);
    (0, tournamentEvents_1.registerTournamentEvents)(io, socket);
}
// Create the export object first (without trigger functions)
const tournamentHandlerExports = {
    registerTournamentHandlers,
    tournamentState: tournamentState_1.tournamentState, // Use the imported TypeScript state
};
// IMPORTANT: Load tournamentTriggers after creating the exports object
// This helps prevent circular dependencies
const tournamentTriggers = require('./tournamentUtils/tournamentTriggers');
// Attach trigger functions to the exports object
tournamentHandlerExports.triggerTournamentQuestion = tournamentTriggers.triggerTournamentQuestion;
tournamentHandlerExports.triggerTournamentTimerSet = tournamentTriggers.triggerTournamentTimerSet;
tournamentHandlerExports.triggerTournamentAnswer = tournamentTriggers.triggerTournamentAnswer;
// Also provide CommonJS export for compatibility with bridge files
module.exports = tournamentHandlerExports;
