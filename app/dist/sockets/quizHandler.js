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
const { tournamentState, // Import state for lookups
triggerTournamentQuestion, triggerTournamentPause, triggerTournamentResume, triggerTournamentTimerSet, } = require('./tournamentHandler'); // Import trigger functions
const { quizState } = require('./quizState');
const registerQuizEvents = require('./quizEvents');
const { calculateScore } = require('./tournamentUtils/scoreUtils');
/**
 * Compute scores for quiz mode, accounting for paused timers.
 * @param {Object} state - The quiz state object.
 * @param {Object} question - The current question object.
 * @param {Object} answer - The participant's answer.
 * @param {number} questionStart - The timestamp when the question started.
 * @param {number} totalQuestions - The total number of questions in the quiz.
 * @returns {Object} - The computed score details.
 */
function computeQuizModeScore(state, question, answer, questionStart, totalQuestions) {
    const activeTime = state.activeTime || 0; // Time the question was actively available
    const pausedTime = state.pausedTime || 0; // Time the question was paused
    // Calculate the effective question start time by subtracting paused time
    const effectiveStartTime = questionStart + pausedTime;
    // Use the calculateScore utility, passing the effective start time
    return calculateScore(question, answer, effectiveStartTime, totalQuestions);
}
function registerQuizHandlers(io, socket, prisma) {
    logger.debug(`Registering quiz handlers for socket ${socket.id}`);
    registerQuizEvents(io, socket, prisma);
    const quizId = socket.quizId; // Assuming quizId is available on the socket object
    io.in(`dashboard_${quizId}`).fetchSockets().then(sockets => {
        logger.debug(`[QuizHandler] Sockets in room dashboard_${quizId}:`, sockets.map(socket => socket.id));
    });
}
module.exports = { registerQuizHandlers, quizState, computeQuizModeScore };
