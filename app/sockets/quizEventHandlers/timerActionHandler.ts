/**
 * timerActionHandler.ts - Handler for quiz timer actions
 * 
 * This handler manages timer state (play/pause/stop) for quiz questions.
 * It updates timers in both quiz and tournament states when applicable.
 * 
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { TimerActionPayload } from '../types/socketTypes';
import { quizState, getQuestionTimer } from '../quizState.js'; // MODIFIED
// Import from the legacy file for consistency during transition
const {
    updateQuestionTimer,
    emitQuizTimerUpdate,
    calculateQuestionRemainingTime
} = require('../quizUtils.legacy.js');

// Import using require for modules not yet converted to TypeScript
const createLogger = require('../../logger');
const logger = createLogger('TimerActionHandler');
const { triggerTournamentTimerAction } = require('../tournamentHandler');
const { triggerQuizTimerAction } = require('../quizTriggers');

/**
 * Handle quiz_timer_action event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client 
 * @param payload - Event payload with timer action details
 */
async function handleTimerAction(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { status, questionId, timeLeft, quizId, tournamentCode }: TimerActionPayload
): Promise<void> {
    logger.info(`[TimerAction] Received: quizId=${quizId}, status=${status}, questionId=${questionId}, timeLeft=${timeLeft}`);

    if (!quizState[quizId]) {
        logger.error(`[TimerAction] No quiz state found for quizId=${quizId}`);
        return;
    }

    // Update question-specific timer
    updateQuestionTimer(quizId, questionId, status, timeLeft);

    // Calculate precise time remaining
    const preciseTimeLeft = calculateQuestionRemainingTime(quizId, questionId);
    logger.info(`[TimerAction] Calculated precise time left: ${preciseTimeLeft} for questionId=${questionId}`);

    // Update global quiz state with timer info
    quizState[quizId].timerStatus = status;
    quizState[quizId].timerQuestionId = questionId;
    quizState[quizId].timerTimeLeft = preciseTimeLeft;
    quizState[quizId].timerTimestamp = Date.now();

    // Emit timer update to all connected clients for this quiz
    emitQuizTimerUpdate(io, quizId, status, questionId, preciseTimeLeft);
    logger.info(`[TimerAction] Emitted quiz_timer_update with status=${status}, timeLeft=${preciseTimeLeft}`);

    // Trigger tournament timer action if a tournament code is provided
    if (tournamentCode) {
        logger.info(`[TimerAction] Triggering tournament timer action for code=${tournamentCode}, status=${status}`);
        try {
            triggerTournamentTimerAction(io, tournamentCode, status, preciseTimeLeft);
        } catch (e) {
            logger.error(`[TimerAction] Error triggering tournament timer: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    // Trigger any additional quiz timer actions
    try {
        triggerQuizTimerAction(io, quizId, status, questionId, preciseTimeLeft);
    } catch (e) {
        logger.error(`[TimerAction] Error triggering quiz timer actions: ${e instanceof Error ? e.message : String(e)}`);
    }
}

export default handleTimerAction;
