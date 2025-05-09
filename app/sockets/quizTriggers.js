// Quiz-specific timer trigger functions (play, pause, stop, set, etc.)
// These should be called only for quiz mode, not for tournaments.

const { updateQuestionTimer, emitQuizTimerUpdate, patchQuizStateForBroadcast, synchronizeTimerValues } = require('./quizUtils');
const { quizState, getQuestionTimer } = require('./quizState');
const { tournamentState } = require('./tournamentHandler');
const createLogger = require('../logger');
const logger = createLogger('QuizTriggers');

// In-memory object to track running timer intervals per quiz/question
const quizTimerIntervals = {};

// In-memory object to track countdown timeouts per quiz/question
const quizTimerCountdowns = {};

function clearQuizCountdown(quizId, questionId) {
    if (quizTimerCountdowns[quizId] && quizTimerCountdowns[quizId][questionId]) {
        clearTimeout(quizTimerCountdowns[quizId][questionId]);
        quizTimerCountdowns[quizId][questionId] = null;
    }
}

/**
 * Triggers the timer action for a quiz question (play, pause, stop)
 * @param {object} io - Socket.io server instance
 * @param {string} quizId - Quiz ID
 * @param {string} questionId - Question UID
 * @param {string} action - 'play', 'pause', or 'stop'
 * @param {number} [timeLeft] - Optional time left (seconds)
 */
// Add debug logs to verify countdown logic for second question in triggerQuizTimerAction
/**
 * Sends the current question to the tournament room if the quiz is linked to a tournament
 * This ensures that when quiz questions change, tournament participants get the update
 * @param {object} io - Socket.io instance
 * @param {string} quizId - Quiz ID
 * @param {string} questionId - Question ID to send
 */
function sendQuestionToTournament(io, quizId, questionId) {
    // Find if this quiz is linked to a tournament
    if (!quizState[quizId]) {
        logger.warn(`[sendQuestionToTournament] Quiz state not found for ${quizId}`);
        return;
    }

    const tournamentCode = quizState[quizId].tournament_code;
    if (!tournamentCode) {
        // Check if we can find the tournament code by looking through tournament states
        const linkedTournament = Object.keys(tournamentState).find(code =>
            tournamentState[code] && tournamentState[code].linkedQuizId === quizId
        );

        if (!linkedTournament) {
            logger.debug(`[sendQuestionToTournament] No linked tournament found for quiz ${quizId}`);
            return;
        }
    }

    // Use either the directly linked code or the one we found
    const code = tournamentCode || Object.keys(tournamentState).find(code =>
        tournamentState[code] && tournamentState[code].linkedQuizId === quizId
    );

    if (!code || !tournamentState[code]) {
        logger.warn(`[sendQuestionToTournament] Tournament state not found for code ${code}`);
        return;
    }

    // Make sure we have the question in the tournament state
    if (!tournamentState[code].questions || !Array.isArray(tournamentState[code].questions)) {
        logger.warn(`[sendQuestionToTournament] Tournament ${code} questions array not initialized`);
        return;
    }

    // Find the specific question
    const question = tournamentState[code].questions.find(q => q.uid === questionId);
    if (!question) {
        logger.warn(`[sendQuestionToTournament] Question ${questionId} not found in tournament ${code}`);
        return;
    }

    // Set the current question UID in tournament state
    tournamentState[code].currentQuestionUid = questionId;

    // Get the question's index
    const index = tournamentState[code].questions.findIndex(q => q.uid === questionId);
    const total = tournamentState[code].questions.length;

    logger.info(`[sendQuestionToTournament] Sending question ${questionId} to live_${code}. Index: ${index}, Total: ${total}`);

    // Import the function to send the question
    try {
        const { sendTournamentQuestion } = require('./tournamentUtils/sendTournamentQuestion');
        // Get timer info
        const timer = getQuestionTimer(quizId, questionId);
        const timeLeft = timer ? timer.timeLeft : (question.temps || 20);
        const questionState = timer ? timer.status === 'play' ? 'active' : timer.status : 'stopped';

        // Always use the question UID to identify questions, not array indices

        // Use triggerTournamentQuestion from tournamentUtils to ensure proper state update
        const { triggerTournamentQuestion } = require('./tournamentUtils/tournamentTriggers');

        // First, ensure the tournament state has the correct question set by using questionId directly
        // Pass null for index to force finding by UID
        triggerTournamentQuestion(io, code, null, quizId, timeLeft, questionId);

        // Then also directly send to ensure immediate update
        // Still pass the index for progress tracking but rely on questionId for identification
        sendTournamentQuestion(io, `live_${code}`, question, index, total, timeLeft, questionState, true);

        logger.info(`[sendQuestionToTournament] Successfully sent question ${questionId} to live_${code}`);
    } catch (err) {
        logger.error(`[sendQuestionToTournament] Error sending question: ${err.message}`);
    }
}

function triggerQuizTimerAction(io, quizId, questionId, action, timeLeft) {
    logger.info(`[triggerQuizTimerAction] Called with: quizId=${quizId}, questionId=${questionId}, action=${action}, timeLeft=${timeLeft}`);

    // Safely display timer state without circular references
    logger.debug(`[triggerQuizTimerAction] Debug: Initial state of quizTimerCountdowns: ${Object.keys(quizTimerCountdowns).length} quiz(zes), ${quizTimerCountdowns[quizId] ? Object.keys(quizTimerCountdowns[quizId]).length : 0} timers for this quiz`);

    updateQuestionTimer(quizId, questionId, action, timeLeft);

    if (!quizTimerCountdowns[quizId]) {
        logger.debug(`[triggerQuizTimerAction] Debug: Initializing quizTimerCountdowns for quizId=${quizId}`);
        quizTimerCountdowns[quizId] = {};
    }

    // Always clear any existing countdown for this question
    logger.info(`[triggerQuizTimerAction] Clearing existing countdown for quizId=${quizId}, questionId=${questionId}`);
    clearQuizCountdown(quizId, questionId);

    const timer = getQuestionTimer(quizId, questionId);
    logger.info(`[triggerQuizTimerAction] After update: quizId=${quizId}, questionId=${questionId}, action=${action}, status=${timer.status}, timeLeft=${timer.timeLeft}, timestamp=${timer.timestamp}`);

    // Debug: Log timer object immediately after fetching
    logger.debug(`[triggerQuizTimerAction] Debug: Timer object immediately after fetching:`, JSON.stringify(timer));

    // Debug: Log condition check for starting countdown
    logger.debug(`[triggerQuizTimerAction] Debug: Condition check: action=${action}, timer.timeLeft=${timer.timeLeft}, timer.status=${timer.status}`);

    if (action === 'play' && timer.timeLeft > 0 && timer.status === 'play') {
        const msLeft = Math.max(0, Math.round(timer.timeLeft * 1000));
        logger.info(`[triggerQuizTimerAction] Starting countdown for quizId=${quizId}, questionId=${questionId}, msLeft=${msLeft}`);

        // Debug: Log before setting the timeout
        logger.debug(`[triggerQuizTimerAction] Debug: Setting timeout for quizId=${quizId}, questionId=${questionId}, msLeft=${msLeft}`);

        quizTimerCountdowns[quizId][questionId] = setTimeout(() => {
            logger.info(`[triggerQuizTimerAction] Countdown expired for quizId=${quizId}, questionId=${questionId}`);
            updateQuestionTimer(quizId, questionId, 'stop', 0);
            emitQuizTimerUpdate(io, quizId, 'stop', questionId, 0);
            io.to(`dashboard_${quizId}`).emit('quiz_state', patchQuizStateForBroadcast(quizState[quizId]));
        }, msLeft);

        // Debug: Log after setting the timeout
        logger.debug(`[triggerQuizTimerAction] Debug: Timeout set for quizId=${quizId}, questionId=${questionId}`);
    } else {
        if (action === 'play') {
            logger.info(`[triggerQuizTimerAction] Not starting countdown: action=play, but timer.status=${timer.status}, timeLeft=${timer.timeLeft}`);
        }
    }

    // Safely display final state without circular references
    const activeTimers = quizTimerCountdowns[quizId] ?
        Object.keys(quizTimerCountdowns[quizId]).filter(qId => quizTimerCountdowns[quizId][qId] !== null) : [];
    logger.debug(`[triggerQuizTimerAction] Debug: Final state of quizTimerCountdowns: ${activeTimers.length} active timers. Active question IDs: [${activeTimers.join(', ')}]`);

    // Emit timer update to quiz rooms
    emitQuizTimerUpdate(io, quizId, action, questionId, timer.timeLeft);
    io.to(`dashboard_${quizId}`).emit('quiz_state', patchQuizStateForBroadcast(quizState[quizId]));
}

/**
 * Sets the timer value for a quiz question (edit duration)
 * @param {object} io - Socket.io server instance
 * @param {string} quizId - Quiz ID
 * @param {string} questionId - Question UID
 * @param {number} timeLeft - New time left (seconds)
 */
function triggerQuizSetTimer(io, quizId, questionId, timeLeft) {
    const timer = getQuestionTimer(quizId, questionId);
    timer.timeLeft = timeLeft;
    timer.initialTime = timeLeft;
    emitQuizTimerUpdate(io, quizId, timer.status, questionId, timeLeft);
    io.to(`dashboard_${quizId}`).emit('quiz_state', patchQuizStateForBroadcast(quizState[quizId]));
}

module.exports = {
    triggerQuizTimerAction,
    triggerQuizSetTimer,
    sendQuestionToTournament
};
