const createLogger = require('../../logger');
const logger = createLogger('SetTimerHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentTimerSet } = require('../tournamentHandler');
const { patchQuizStateForBroadcast } = require('../quizUtils');

// Note: prisma is not needed here, so we don't pass it in registerQuizEvents
function handleSetTimer(io, socket, prisma, { quizId, timeLeft, teacherId, tournamentCode }) {
    logger.info(`[SetTimer] Received quiz_set_timer for quiz ${quizId} with timeLeft=${timeLeft}s`);

    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[SetTimer] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        return;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    logger.info(`[SetTimer] Setting timer to ${timeLeft}s for quiz ${quizId}`);

    // --- Update Quiz State --- 
    quizState[quizId].chrono.timeLeft = timeLeft;
    // Update timerTimeLeft if it exists, for consistency
    if ('timerTimeLeft' in quizState[quizId]) {
        quizState[quizId].timerTimeLeft = timeLeft;
    }
    // Update the 'temps' property of the current question in quiz state
    const currentQuestionIdx = quizState[quizId].currentQuestionIdx;
    if (typeof currentQuestionIdx === 'number' && currentQuestionIdx >= 0 && quizState[quizId].questions[currentQuestionIdx]) {
        quizState[quizId].questions[currentQuestionIdx].temps = timeLeft;
        logger.info(`[SetTimer] Updated quizState.questions[${currentQuestionIdx}].temps to ${timeLeft}s`);
    } else {
        logger.warn(`[SetTimer] Could not update temps for question index ${currentQuestionIdx} in quiz ${quizId} state.`);
    }

    // Emit updated quiz state and specific timer update
    // Patch: Recalculate timer for dashboard broadcast
    io.to(`quiz_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    if (quizState[quizId].timerQuestionId) {
        io.to(`quiz_${quizId}`).emit("quiz_timer_update", {
            status: quizState[quizId].chrono.running ? 'play' : 'pause',
            questionId: quizState[quizId].timerQuestionId,
            timeLeft: timeLeft,
            timestamp: Date.now() // Use current time for timestamp
        });
        logger.debug(`[SetTimer] Emitted quiz_state and quiz_timer_update for ${quizId}`);
    }

    // Use tournamentCode from payload if present, else fallback
    const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        logger.info(`[SetTimer] Triggering timer set for linked tournament ${code} with timeLeft=${timeLeft}s`);
        // Use triggerTournamentTimerSet. forceActive=false because we are just editing the time,
        // not necessarily starting/resuming it. The trigger function handles paused/stopped states internally.
        triggerTournamentTimerSet(io, code, timeLeft, false);
    } else {
        logger.warn(`[SetTimer] No linked tournament found for quiz ${quizId}`);
    }
}

module.exports = handleSetTimer;
