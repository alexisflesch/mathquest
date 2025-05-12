/**
 * tournamentEvents.ts - Register tournament-related socket.io event handlers
 * 
 * This file centralizes all tournament-related socket event handling by importing
 * handler functions from individual files and registering them with socket.io.
 * Each handler is in its own file for modularity and maintainability.
 */

import { Server, Socket } from 'socket.io';
import { StartTournamentPayload, JoinTournamentPayload, TournamentAnswerPayload } from './types/socketTypes';

// Import handlers - we're using dynamic require to allow for both TypeScript and JavaScript files
// This helps during the migration process from JS to TS
const handleStartTournament = require('./tournamentEventHandlers/startHandler');
const handleJoinTournament = require('./tournamentEventHandlers/joinHandler');
const handleTournamentAnswer = require('./tournamentEventHandlers/answerHandler');
const handleTournamentPause = require('./tournamentEventHandlers/pauseHandler');
const handleTournamentResume = require('./tournamentEventHandlers/resumeHandler');
const handleDisconnecting = require('./tournamentEventHandlers/disconnectingHandler');

// Create logger for this module
const createLogger = require('../logger');
const logger = createLogger('TournamentEvents');

/**
 * Register all tournament-related socket event handlers
 * 
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
function registerTournamentEvents(io: Server, socket: Socket): void {
    logger.debug(`[registerTournamentEvents] Registering tournament event handlers for socket ${socket.id}`);

    // Register event handlers with their respective payloads
    socket.on("start_tournament", (payload: StartTournamentPayload) => {
        logger.debug(`[start_tournament] Received from socket ${socket.id}`);
        handleStartTournament(io, socket, payload);
    });

    socket.on("join_tournament", (payload: JoinTournamentPayload) => {
        logger.debug(`[join_tournament] Received from socket ${socket.id}`);
        handleJoinTournament(io, socket, payload);
    });

    socket.on("tournament_answer", (payload: TournamentAnswerPayload) => {
        logger.debug(`[tournament_answer] Received from socket ${socket.id}`);
        handleTournamentAnswer(io, socket, payload);
    });

    socket.on("tournament_pause", (payload: any) => {
        logger.debug(`[tournament_pause] Received from socket ${socket.id}`);
        handleTournamentPause(io, socket, payload);
    });

    socket.on("tournament_resume", (payload: any) => {
        logger.debug(`[tournament_resume] Received from socket ${socket.id}`);
        handleTournamentResume(io, socket, payload);
    });

    socket.on("disconnecting", () => {
        logger.debug(`[disconnecting] Socket ${socket.id} disconnecting`);
        handleDisconnecting(io, socket);
    });

    // Add other tournament-specific events here if any
}

// Define a named property for the function to make it easier to find in bridges
registerTournamentEvents.displayName = "registerTournamentEvents";

// Export in TypeScript style first
export { registerTournamentEvents };

// Also provide CommonJS export for compatibility with bridge files
// Create an object with the registerTournamentEvents function as a property
const tournamentEventsExports = {
    registerTournamentEvents
};

// This allows both 
// import { registerTournamentEvents } from './tournamentEvents'
// and 
// const { registerTournamentEvents } = require('./tournamentEvents')
module.exports = tournamentEventsExports;
