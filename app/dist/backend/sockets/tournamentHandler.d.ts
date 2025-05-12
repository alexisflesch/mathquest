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
import { tournamentState } from './tournamentUtils/tournamentState';
/**
 * Main registration function called by the server
 *
 * @param io - Socket.IO server instance
 * @param socket - Socket connection instance
 */
declare function registerTournamentHandlers(io: Server, socket: Socket): void;
export { registerTournamentHandlers, tournamentState };
