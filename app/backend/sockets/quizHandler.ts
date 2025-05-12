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

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import createLogger from '@logger';
import { Question, QuizState } from './types/quizTypes';
import { TournamentAnswer } from './types/tournamentTypes';

const logger = createLogger('QuizHandler');

// Import tournament handler functions using require to avoid circular dependencies
const tournamentHandler = require('./tournamentHandler');

// Import quiz state and events
import { quizState } from './quizState';
import { registerQuizEvents } from './quizEvents';

// Import score calculation utility and its result type
import { calculateScore } from './tournamentUtils/scoreUtils';
// Define the ScoreCalculationResult interface directly here
interface ScoreCalculationResult {
    baseScore: number;
    timePenalty: number;
    totalScore: number;
}

/**
 * Compute scores for quiz mode, accounting for paused timers.
 * @param state - The quiz state object.
 * @param question - The current question object.
 * @param answer - The participant's answer.
 * @param questionStart - The timestamp when the question started.
 * @param totalQuestions - The total number of questions in the quiz.
 * @returns The computed score details.
 */
function computeQuizModeScore(
    state: QuizState,
    question: Question,
    answer: TournamentAnswer,
    questionStart: number,
    totalQuestions: number
): ScoreCalculationResult {
    // These properties might not be in the QuizState interface, so we access them safely
    const activeTime = (state as any).activeTime || 0; // Time the question was actively available
    const pausedTime = (state as any).pausedTime || 0; // Time the question was paused

    // Calculate the effective question start time by subtracting paused time
    const effectiveStartTime = questionStart + pausedTime;

    // Use the calculateScore utility, passing the effective start time
    return calculateScore(question, answer, effectiveStartTime, totalQuestions);
}

/**
 * Register all quiz-related event handlers
 * @param io - Socket.IO server instance
 * @param socket - Socket connection
 * @param prisma - Prisma client for database operations
 */
function registerQuizHandlers(io: Server, socket: Socket, prisma: PrismaClient): void {
    logger.debug(`Registering quiz handlers for socket ${socket.id}`);
    registerQuizEvents(io, socket, prisma);

    // Check for quizId in socket data
    const quizId = (socket as any).quizId; // Cast to any to access non-standard property
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
    quizState,
    computeQuizModeScore
};

module.exports = quizHandlerExports;

// Add TypeScript exports for named imports
export { registerQuizHandlers, quizState, computeQuizModeScore };
