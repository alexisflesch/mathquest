const createLogger = require('../../logger');
const logger = createLogger('SetTimerHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentTimerSet } = require('../tournamentHandler');

// Note: prisma is not needed here, so we don't pass it in registerQuizEvents
function handleSetTimer(io, socket, prisma, { quizId, timeLeft }) {
    // *** ADDED LOGGING ***
    logger.info(`Received quiz_set_timer for quiz ${quizId} with timeLeft=${timeLeft}s`);

    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to set timer for quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Setting timer to ${timeLeft}s for quiz ${quizId}`);

    // Update the main chrono timeLeft value
    quizState[quizId].chrono.timeLeft = timeLeft;

    // For consistency, also update the timer action fields if they exist
    if ('timerTimeLeft' in quizState[quizId]) {
        quizState[quizId].timerTimeLeft = timeLeft;
        logger.debug(`Also updated timerTimeLeft to ${timeLeft}s`);
    }

    // *** FIX: Also update the 'temps' property of the current question in server state ***
    const currentQuestionIdx = quizState[quizId].currentQuestionIdx;
    if (typeof currentQuestionIdx === 'number' && currentQuestionIdx >= 0 && quizState[quizId].questions[currentQuestionIdx]) {
        quizState[quizId].questions[currentQuestionIdx].temps = timeLeft;
        logger.info(`Updated quizState.questions[${currentQuestionIdx}].temps to ${timeLeft}s`);
    } else {
        // Log a warning if we can't find the question to update its temps
        logger.warn(`Could not update temps for question index ${currentQuestionIdx} in quiz ${quizId} state.`);
    }


    // *** ADDED LOGGING ***
    logger.debug(`Quiz state PRE-EMIT for quiz_set_timer:`, quizState[quizId]);

    // Send the updated state to all clients in the quiz room
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    // Also emit a timer update event to ensure clients get the new value
    // This is especially important for paused timers where the value might not
    // be immediately visible in the standard quiz_state update
    if (quizState[quizId].timerQuestionId) {
        io.to(`quiz_${quizId}`).emit("quiz_timer_update", {
            status: quizState[quizId].chrono.running ? 'play' : 'pause',
            questionId: quizState[quizId].timerQuestionId,
            timeLeft: timeLeft,
            timestamp: Date.now()
        });
        logger.debug(`Emitted separate quiz_timer_update with new timeLeft=${timeLeft}`);
    }

    // Update the corresponding tournament timer if linked
    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        // For a paused tournament, update the pausedRemainingTime
        if (tournamentState[code] && tournamentState[code].paused) {
            tournamentState[code].pausedRemainingTime = timeLeft;
            logger.info(`Updated paused tournament ${code} timer to ${timeLeft}s`);
        }

        // Update the tournament timer using the trigger function
        triggerTournamentTimerSet(io, code, timeLeft);
    }
}

module.exports = handleSetTimer;
