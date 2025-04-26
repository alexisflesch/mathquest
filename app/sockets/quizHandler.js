/**
 * quizHandler.js - Quiz Handler Registration Module
 * 
 * This file serves as a bridge between the main server and the quiz event handlers.
 * It imports the quiz state and tournament functions, then registers the quiz event
 * handlers by delegating to the quizEvents module.
 * 
 * The architecture separates quiz state management and event registration to:
 * 1. Keep the code modular
 * 2. Avoid circular dependencies
 * 3. Allow for easier testing and maintenance
 * 
 * The module exports:
 * - registerQuizHandlers: Function to register all quiz-related socket events
 * - quizState: In-memory state for active quizzes
 */

const prisma = require('../db'); // Adjust path as needed
const createLogger = require('../logger');
const logger = createLogger('QuizHandler');

const {
    tournamentState, // Import state for lookups
    triggerTournamentQuestion,
    triggerTournamentPause,
    triggerTournamentResume,
    triggerTournamentTimerSet,
} = require('./tournamentHandler'); // Import trigger functions
const quizState = require('./quizState');
const registerQuizEvents = require('./quizEvents');

function registerQuizHandlers(io, socket, prisma) {
    logger.debug(`Registering quiz handlers for socket ${socket.id}`);
    registerQuizEvents(io, socket, prisma);
}

module.exports = { registerQuizHandlers, quizState };
