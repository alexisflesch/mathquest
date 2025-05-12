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

import { Server, Socket } from 'socket.io';
import { TournamentStateContainer } from './types/tournamentTypes';

// Import the new tournamentState module
import { tournamentState } from './tournamentUtils/tournamentState';

// Import tournament event registration - keeping as require for now
const registerTournamentEvents = require('./tournamentEvents');

const prisma = require('../db');
const createLogger = require('../logger');
const logger = createLogger('TournamentHandler');

/**
 * Main registration function called by the server
 * 
 * @param io - Socket.IO server instance
 * @param socket - Socket connection instance
 */
function registerTournamentHandlers(io: Server, socket: Socket): void {
    logger.info(`[registerTournamentHandlers] Registering tournament event handlers for socket ${socket.id}`);
    registerTournamentEvents(io, socket);
}

// Define an interface for the exports
interface TournamentHandlerExports {
    registerTournamentHandlers: (io: Server, socket: Socket) => void;
    tournamentState: TournamentStateContainer;
    triggerTournamentQuestion?: (...args: any[]) => any;
    triggerTournamentTimerSet?: (...args: any[]) => any;
    triggerTournamentAnswer?: (...args: any[]) => any;
    [key: string]: any; // Allow additional properties
}

// Create the export object first (without trigger functions)
const tournamentHandlerExports: TournamentHandlerExports = {
    registerTournamentHandlers,
    tournamentState, // Use the imported TypeScript state
};

// IMPORTANT: Load tournamentTriggers after creating the exports object
// This helps prevent circular dependencies
const tournamentTriggers = require('./tournamentUtils/tournamentTriggers');

// Attach trigger functions to the exports object
tournamentHandlerExports.triggerTournamentQuestion = tournamentTriggers.triggerTournamentQuestion;
tournamentHandlerExports.triggerTournamentTimerSet = tournamentTriggers.triggerTournamentTimerSet;
tournamentHandlerExports.triggerTournamentAnswer = tournamentTriggers.triggerTournamentAnswer;

// Use CommonJS export
module.exports = tournamentHandlerExports;
