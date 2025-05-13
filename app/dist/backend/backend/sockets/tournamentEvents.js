"use strict";
/**
 * tournamentEvents.ts - Register tournament-related socket.io event handlers
 *
 * This file centralizes all tournament-related socket event handling by importing
 * handler functions from individual files and registering them with socket.io.
 * Each handler is in its own file for modularity and maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTournamentEvents = registerTournamentEvents;
// Import handlers - now using proper ESM imports for TypeScript files
const startHandler_1 = __importDefault(require("./tournamentEventHandlers/startHandler"));
const joinHandler_1 = __importDefault(require("./tournamentEventHandlers/joinHandler"));
const answerHandler_1 = __importDefault(require("./tournamentEventHandlers/answerHandler"));
const pauseHandler_1 = __importDefault(require("./tournamentEventHandlers/pauseHandler"));
const resumeHandler_1 = __importDefault(require("./tournamentEventHandlers/resumeHandler"));
const disconnectingHandler_1 = __importDefault(require("./tournamentEventHandlers/disconnectingHandler"));
// Create logger for this module
const createLogger = require('../logger');
const logger = createLogger('TournamentEvents');
/**
 * Register all tournament-related socket event handlers
 *
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
function registerTournamentEvents(io, socket) {
    logger.debug(`[registerTournamentEvents] Registering tournament event handlers for socket ${socket.id}`);
    // Register event handlers with their respective payloads
    socket.on("start_tournament", (payload) => {
        logger.debug(`[start_tournament] Received from socket ${socket.id}`);
        (0, startHandler_1.default)(io, socket, payload);
    });
    socket.on("join_tournament", (payload) => {
        logger.debug(`[join_tournament] Received from socket ${socket.id}`);
        (0, joinHandler_1.default)(io, socket, payload);
    });
    socket.on("tournament_answer", (payload) => {
        logger.debug(`[tournament_answer] Received from socket ${socket.id}`);
        (0, answerHandler_1.default)(io, socket, payload);
    });
    socket.on("tournament_pause", (payload) => {
        logger.debug(`[tournament_pause] Received from socket ${socket.id}`);
        (0, pauseHandler_1.default)(io, socket, payload);
    });
    socket.on("tournament_resume", (payload) => {
        logger.debug(`[tournament_resume] Received from socket ${socket.id}`);
        (0, resumeHandler_1.default)(io, socket, payload);
    });
    socket.on("disconnecting", () => {
        logger.debug(`[disconnecting] Socket ${socket.id} disconnecting`);
        (0, disconnectingHandler_1.default)(io, socket);
    });
    // Add other tournament-specific events here if any
}
// Define a named property for the function to make it easier to find in bridges
registerTournamentEvents.displayName = "registerTournamentEvents";
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
