/**
 * gameHandler.ts - Game Handler Registration Module
 *
 * This file serves as the main entry point for game-related socket functionality.
 * It imports the game state, trigger functions, and registers the event handlers
 * by delegating to the gameEvents module.
 *
 * The architecture separates state management, helper functions, trigger functions,
 * and event registration into different modules/folders for clarity and maintainability:
 * - gameUtils/gameState.ts: Manages the in-memory state of active games.
 * - gameUtils/gameHelpers.ts: Contains helper functions like score calculation and sending questions.
 * - gameUtils/gameTriggers.ts: Exports functions to trigger game actions from other modules.
 * - gameEventHandlers/: Contains individual files for each socket event handler logic.
 * - gameEvents.ts: Imports handlers from gameEventHandlers/ and registers them with socket.io.
 * 
 * Previously known as tournamentHandler.ts, now renamed to reflect the new
 * GameInstance model in the schema.
 */

import { Server, Socket } from 'socket.io';
import { GameStateContainer } from '@sockets/types/gameTypes';

// Import the game state module 
import { gameState } from '@sockets/gameUtils/gameState';

// Import game event registration
import registerGameEvents from '@sockets/gameEvents';

import prisma from '@db';
import createLogger from '@logger';
const logger = createLogger('GameHandler');

/**
 * Main registration function called by the server
 * 
 * @param io - Socket.IO server instance
 * @param socket - Socket connection instance
 */
function registerGameHandlers(io: Server, socket: Socket): void {
    logger.info(`[registerGameHandlers] Registering game event handlers for socket ${socket.id}`);
    registerGameEvents(io, socket);
}

// Define an interface for the exports
interface GameHandlerExports {
    registerGameHandlers: (io: Server, socket: Socket) => void;
    gameState: GameStateContainer;
    triggerGameQuestion?: (...args: any[]) => any;
    triggerGameTimerSet?: (...args: any[]) => any;
    triggerGameAnswer?: (...args: any[]) => any;
    [key: string]: any; // Allow additional properties
}

// Create the export object first (without trigger functions)
const gameHandlerExports: GameHandlerExports = {
    registerGameHandlers,
    gameState, // Use the imported TypeScript state
};

// IMPORTANT: Load gameTriggers after creating the exports object
// This helps prevent circular dependencies
const gameTriggers = require('./gameUtils/gameTriggers');

// Attach trigger functions to the exports object
gameHandlerExports.triggerGameQuestion = gameTriggers.triggerGameQuestion;
gameHandlerExports.triggerGameTimerSet = gameTriggers.triggerGameTimerSet;
gameHandlerExports.triggerGameAnswer = gameTriggers.triggerGameQuestion; // Use appropriate function

// Export in TypeScript style first
export { registerGameHandlers, gameState }; // Ensure gameState is exported

// Also provide CommonJS export for compatibility with bridge files
module.exports = gameHandlerExports;
