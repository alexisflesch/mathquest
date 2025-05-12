"use strict";
/**
 * timerActionHandler.ts - Handler for quiz timer actions
 *
 * This handler manages timer state (play/pause/stop) for quiz questions.
 * It updates timers in both quiz and tournament states when applicable.
 *
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_js_1 = require("../quizState.js"); // MODIFIED
// Import from the legacy file for consistency during transition
const { updateQuestionTimer, emitQuizTimerUpdate, calculateQuestionRemainingTime } = require('../quizUtils.legacy.js');
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
async function handleTimerAction(io, socket, prisma, { status, questionId, timeLeft, quizId, tournamentCode }) {
    logger.info(`[TimerAction] Received: quizId=${quizId}, status=${status}, questionId=${questionId}, timeLeft=${timeLeft}`);
    if (!quizState_js_1.quizState[quizId]) {
        logger.error(`[TimerAction] No quiz state found for quizId=${quizId}`);
        return;
    }
    // Update question-specific timer
    updateQuestionTimer(quizId, questionId, status, timeLeft);
    // Calculate precise time remaining
    const preciseTimeLeft = calculateQuestionRemainingTime(quizId, questionId);
    logger.info(`[TimerAction] Calculated precise time left: ${preciseTimeLeft} for questionId=${questionId}`);
    // Update global quiz state with timer info
    quizState_js_1.quizState[quizId].timerStatus = status;
    quizState_js_1.quizState[quizId].timerQuestionId = questionId;
    quizState_js_1.quizState[quizId].timerTimeLeft = preciseTimeLeft;
    quizState_js_1.quizState[quizId].timerTimestamp = Date.now();
    // Emit timer update to all connected clients for this quiz
    emitQuizTimerUpdate(io, quizId, status, questionId, preciseTimeLeft);
    logger.info(`[TimerAction] Emitted quiz_timer_update with status=${status}, timeLeft=${preciseTimeLeft}`);
    // Trigger tournament timer action if a tournament code is provided
    if (tournamentCode) {
        logger.info(`[TimerAction] Triggering tournament timer action for code=${tournamentCode}, status=${status}`);
        try {
            triggerTournamentTimerAction(io, tournamentCode, status, preciseTimeLeft);
        }
        catch (e) {
            logger.error(`[TimerAction] Error triggering tournament timer: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    // Trigger any additional quiz timer actions
    try {
        triggerQuizTimerAction(io, quizId, status, questionId, preciseTimeLeft);
    }
    catch (e) {
        logger.error(`[TimerAction] Error triggering quiz timer actions: ${e instanceof Error ? e.message : String(e)}`);
    }
}
exports.default = handleTimerAction;
