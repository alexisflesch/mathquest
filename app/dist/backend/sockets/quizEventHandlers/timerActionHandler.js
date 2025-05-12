/**
 * timerActionHandler.ts - Handler for quiz timer actions
 *
 * This handler manages timer state (play/pause/stop) for quiz questions.
 * It updates timers in both quiz and tournament states when applicable.
 *
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */
import { quizState } from '@sockets/quizState';
import { updateQuestionTimer, emitQuizTimerUpdate, calculateQuestionRemainingTime } from '@sockets/quizUtils';
import { triggerQuizTimerAction } from '@sockets/quizTriggers';
// Import logger
import createLogger from '@logger';
const logger = createLogger('TimerActionHandler');
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
    // TODO: Implement tournament timer action handling
    // Current implementation is removed as the triggerTournamentTimerAction function
    // is not found in the codebase. This will need to be reimplemented.
    if (tournamentCode) {
        logger.info(`[TimerAction] Tournament timer action for code=${tournamentCode} is currently disabled`);
        // Future implementation will go here
    }
    // Trigger any additional quiz timer actions
    try {
        // Convert string status to the expected type
        const timerAction = status;
        triggerQuizTimerAction(io, quizId, questionId, timerAction, preciseTimeLeft);
    }
    catch (e) {
        logger.error(`[TimerAction] Error triggering quiz timer actions: ${e instanceof Error ? e.message : String(e)}`);
    }
}
export default handleTimerAction;
