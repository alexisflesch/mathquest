"use strict";
/**
 * quizHandler.ts - Quiz Handler Registration Module
 *
 * This file serves as a bridge between the main server and the quiz event handlers.
 * It imports the quiz state and tournament functions, then registers the quiz event
 * handlers by delegating to the quizEvents module.
 *
 * The architecture separates quiz state management and event registration to:
 * 1. Keep the code modular
 * 2. Avoid circular dependencies
 * 3. Allow for easier testing and maintenance
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizState = void 0;
exports.registerQuizHandlers = registerQuizHandlers;
exports.computeQuizModeScore = computeQuizModeScore;
const _logger_1 = __importDefault(require("@logger"));
const logger = (0, _logger_1.default)('QuizHandler');
// Import tournament handler functions using require to avoid circular dependencies
const tournamentHandler = require('./tournamentHandler');
// Import quiz state and events
const quizState_1 = require("./quizState");
Object.defineProperty(exports, "quizState", { enumerable: true, get: function () { return quizState_1.quizState; } });
const quizEvents_1 = require("./quizEvents");
// Import score calculation utility and its result type
const scoreUtils_1 = require("./tournamentUtils/scoreUtils");
/**
 * Compute scores for quiz mode, accounting for paused timers.
 * @param state - The quiz state object.
 * @param question - The current question object.
 * @param answer - The participant's answer.
 * @param questionStart - The timestamp when the question started.
 * @param totalQuestions - The total number of questions in the quiz.
 * @returns The computed score details.
 */
function computeQuizModeScore(state, question, answer, questionStart, totalQuestions) {
    // These properties might not be in the QuizState interface, so we access them safely
    const activeTime = state.activeTime || 0; // Time the question was actively available
    const pausedTime = state.pausedTime || 0; // Time the question was paused
    // Calculate the effective question start time by subtracting paused time
    const effectiveStartTime = questionStart + pausedTime;
    // Create a processed answer object compatible with the new calculateScore signature
    const processedAnswer = {
        answerIdx: answer.answerIdx,
        clientTimestamp: answer.clientTimestamp || 0,
        serverReceiveTime: answer.serverReceiveTime,
        isCorrect: false, // We'll let calculateScore determine this
        timeMs: answer.clientTimestamp ? answer.clientTimestamp - effectiveStartTime : 0, // Calculate time taken
        value: undefined // We don't have access to the actual text values here
    };
    // Use the calculateScore utility with the new signature
    const result = (0, scoreUtils_1.calculateScore)(question, processedAnswer, totalQuestions);
    // Map the result properties to the expected interface
    return {
        baseScore: result.scoreBeforePenalty || 0,
        timePenalty: result.timePenalty || 0,
        totalScore: result.normalizedQuestionScore || 0
    };
}
/**
 * Register all quiz-related event handlers
 * @param io - Socket.IO server instance
 * @param socket - Socket connection
 * @param prisma - Prisma client for database operations
 */
function registerQuizHandlers(io, socket, prisma) {
    logger.debug(`Registering quiz handlers for socket ${socket.id}`);
    (0, quizEvents_1.registerQuizEvents)(io, socket, prisma);
    // Check for quizId in socket data
    const quizId = socket.quizId; // Cast to any to access non-standard property
    if (quizId) {
        io.in(`dashboard_${quizId}`).fetchSockets().then(sockets => {
            logger.debug(`[QuizHandler] Sockets in room dashboard_${quizId}:`, sockets.map(s => s.id));
        }).catch(err => {
            logger.error(`[QuizHandler] Error fetching sockets: ${err.message}`);
        });
    }
}
// Export the functions and state for CommonJS compatibility
const quizHandlerExports = {
    registerQuizHandlers,
    quizState: quizState_1.quizState,
    computeQuizModeScore
};
module.exports = quizHandlerExports;
