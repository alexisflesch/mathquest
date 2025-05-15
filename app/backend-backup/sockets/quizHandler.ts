/**
 * quizTemplateDashboardController.ts - Controller for Quiz Template Dashboard
 *
 * This file// Update exports for CommonJS and ES modules
const quizTemplateDashboardExports = {
    registerQuizTemplateDashboardHandlers,
}sters event handlers for the Quiz Template dashboard functionality.
 * It connects with the dashboard state and related events.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Ensure this is '../../../shared/prisma-client' if that's the output path
import createLogger from '@logger';
import { Question, QuizState } from './types/quizTypes'; // quizTypes might need to be renamed or adapted for dashboard state
import { TournamentAnswer } from './types/tournamentTypes'; // This type might be too specific if this isn't a tournament context

const logger = createLogger('QuizTemplateDashboardController');

// Import game instance handler functions - this suggests mixed concerns if dashboard is separate
// const gameHandler = require('./tournamentHandler'); // Renamed for clarity, was tournamentHandler

// Import dashboard state and events
import { quizState } from './quizState'; // This state is now for QuizTemplate dashboards, keyed by quizTemplateId
import { registerQuizTemplateDashboardEvents } from './quizEvents'; // Updated to reflect QuizTemplate dashboard context

// Import score calculation utility - its use here needs careful review
import { calculateScore } from './tournamentUtils/scoreUtils';
interface ScoreCalculationResult {
    baseScore: number;
    timePenalty: number;
    totalScore: number;
}

/**
 * Compute scores, potentially for a test run within the dashboard.
 * NOTE: The use of QuizState (now for template dashboards) for active scoring logic is questionable.
 * Dashboard state typically doesn't include live play metrics like activeTime/pausedTime.
 * This function might be a remnant or for a very specific dashboard feature.
 * @param state - The dashboard state object (QuizState, keyed by quizTemplateId).
 * @param question - The current question object.
 * @param answer - The participant's answer.
 * @param questionStart - The timestamp when the question started (in a simulated run).
 * @param totalQuestions - The total number of questions in the template.
 * @returns The computed score details.
 */
function computeDashboardTestScore( // Renamed for clarity
    state: QuizState, // This is QuizState for a QuizTemplate dashboard
    question: Question,
    answer: TournamentAnswer, // Using TournamentAnswer implies a specific answer format
    questionStart: number,
    totalQuestions: number
): ScoreCalculationResult {
    // Accessing activeTime/pausedTime via 'as any' is a code smell.
    // These properties are not part of the standard QuizState for a template dashboard.
    // This suggests this function might be misused or the state type is incorrect for this operation.
    logger.warn("[computeDashboardTestScore] Accessing non-standard properties 'activeTime' and 'pausedTime' on QuizState for a template dashboard. This may indicate incorrect usage.");
    const activeTime = (state as any).activeTime || 0;
    const pausedTime = (state as any).pausedTime || 0;

    const effectiveStartTime = questionStart + pausedTime;
    const processedAnswer = {
        answerIdx: answer.answerIdx,
        clientTimestamp: answer.clientTimestamp || 0,
        serverReceiveTime: answer.serverReceiveTime,
        isCorrect: false,
        timeMs: answer.clientTimestamp ? answer.clientTimestamp - effectiveStartTime : 0,
        value: undefined
    };

    const result = calculateScore(question, processedAnswer, totalQuestions);
    return {
        baseScore: result.scoreBeforePenalty || 0,
        timePenalty: result.timePenalty || 0,
        totalScore: result.normalizedQuestionScore || 0
    };
}

/**
 * Register all QuizTemplate dashboard-related event handlers
 * @param io - Socket.IO server instance
 * @param socket - Socket connection
 * @param prisma - Prisma client for database operations
 */
function registerQuizTemplateDashboardHandlers(io: Server, socket: Socket, prisma: PrismaClient): void { // Renamed function
    logger.debug(`Registering QuizTemplate dashboard handlers for socket ${socket.id}`);
    // Using refactored registerQuizTemplateDashboardEvents to handle events for a QuizTemplate dashboard context
    // It will operate on quizState keyed by quizTemplateId.
    registerQuizTemplateDashboardEvents(io, socket, prisma);

    // Check for quizTemplateId in socket data (assuming it's attached by joinQuizTemplateDashboardHandler)
    const quizTemplateId = (socket as any).quizTemplateId;
    if (quizTemplateId) {
        const roomName = `quiz_template_dashboard_${quizTemplateId}`;
        io.in(roomName).fetchSockets().then(socketsInRoom => { // Renamed variable for clarity
            logger.debug(`[QuizTemplateDashboard] Sockets in room ${roomName}:`, socketsInRoom.map(s => s.id));
        }).catch(err => {
            logger.error(`[QuizTemplateDashboard] Error fetching sockets for room ${roomName}: ${err.message}`);
        });
    }
}

// Update exports for CommonJS and ES modules
const quizTemplateDashboardExports = {
    registerQuizTemplateDashboardHandlers,
    quizState, // State for QuizTemplate dashboards
    computeDashboardTestScore // Renamed scoring function
};

module.exports = quizTemplateDashboardExports;

export {
    registerQuizTemplateDashboardHandlers,
    quizState,
    computeDashboardTestScore
};
