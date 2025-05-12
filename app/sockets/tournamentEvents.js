/**
 * tournamentEvents.js - JavaScript bridge to TypeScript module
 *
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

const createLogger = require('../logger');
const logger = createLogger('TournamentEventsBridge');

// Import the TypeScript module with fallback options
let tsModule;

// Legacy fallback function
function createLegacyTournamentEventsModule(reason) {
    logger.warn(`[Bridge] Creating legacy tournamentEvents module. Reason: ${reason}`);
    const handleStartTournament = require('./tournamentEventHandlers/startHandler');
    const handleJoinTournament = require('./tournamentEventHandlers/joinHandler');
    const handleTournamentAnswer = require('./tournamentEventHandlers/answerHandler');
    const handleTournamentPause = require('./tournamentEventHandlers/pauseHandler');
    const handleTournamentResume = require('./tournamentEventHandlers/resumeHandler');
    const handleDisconnecting = require('./tournamentEventHandlers/disconnectingHandler');

    return function registerTournamentEvents(io, socket) {
        logger.warn(`[Bridge] Using fallback registerTournamentEvents - ${reason}`);

        // Note: prisma is not passed here, handlers import it directly if needed.
        socket.on("start_tournament", (payload) => handleStartTournament(io, socket, payload));
        socket.on("join_tournament", (payload) => handleJoinTournament(io, socket, payload));
        socket.on("tournament_answer", (payload) => handleTournamentAnswer(io, socket, payload));
        socket.on("tournament_pause", (payload) => handleTournamentPause(io, socket, payload));
        socket.on("tournament_resume", (payload) => handleTournamentResume(io, socket, payload));
        socket.on("disconnecting", () => handleDisconnecting(io, socket));
        // Add other tournament-specific events here if any
    };
}

try {
    const rawModule = require('./tournamentEvents'); // Attempt to load TS module (compiled to .js)

    // tournamentEvents.ts uses: module.exports = registerTournamentEvents; (a function)
    if (typeof rawModule === 'function') {
        tsModule = rawModule;
        logger.info('[Bridge] Successfully loaded TypeScript module for tournamentEvents.');
    } else {
        const moduleType = typeof rawModule;
        logger.error(`[Bridge] Failed to load TypeScript module for tournamentEvents correctly. Expected a function. Got: ${moduleType}. Falling back to legacy.`);
        tsModule = createLegacyTournamentEventsModule('TS module not a function');
    }
} catch (error) {
    logger.error('[Bridge] Error loading TypeScript module for tournamentEvents. Falling back to legacy:', error);
    tsModule = createLegacyTournamentEventsModule('TS module load failed (exception)');
}

// Final fallback in case tsModule is still not a function
if (typeof tsModule !== 'function') {
    logger.error('[Bridge] tsModule for tournamentEvents was not properly initialized as a function. Using emergency fallback.');
    tsModule = function (io, socket) {
        logger.error('[Bridge] Using emergency fallback registerTournamentEvents');
        socket.on("tournament_error", () => {
            socket.emit("tournament_error", {
                message: "Tournament functionality is currently unavailable. Please try again later."
            });
        });
    };
}

// Export the function
module.exports = tsModule;
