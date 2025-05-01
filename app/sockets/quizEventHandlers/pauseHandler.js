const createLogger = require('../../logger');
const logger = createLogger('PauseQuizHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentPause } = require('../tournamentHandler');

// Note: prisma is not needed here
function handlePause(io, socket, prisma, { quizId, teacherId }) {
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[PauseQuiz] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        return;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    logger.info(`[PauseQuiz] Pausing quiz ${quizId}`);

    // Calculate remaining time based on quiz state
    const now = Date.now();
    const chrono = quizState[quizId].chrono;
    let remaining = 0;

    if (chrono && chrono.running && typeof chrono.timeLeft === 'number' && quizState[quizId].timerTimestamp) {
        const elapsed = Math.floor((now - quizState[quizId].timerTimestamp) / 1000);
        remaining = Math.max(chrono.timeLeft - elapsed, 0);
        quizState[quizId].chrono.timeLeft = remaining; // Update quiz state remaining time
        quizState[quizId].timerTimeLeft = remaining;
        logger.info(`[PauseQuiz] Calculated remaining time: ${remaining}s (elapsed: ${elapsed}s)`);
    } else if (typeof chrono?.timeLeft === 'number') {
        remaining = chrono.timeLeft;
        logger.info(`[PauseQuiz] Using existing timeLeft: ${remaining}s (no elapsed calculation)`);
    }

    // Update quiz state flags and emit
    quizState[quizId].chrono.running = false;
    quizState[quizId].timerStatus = 'pause';
    // timerTimestamp is NOT updated here, it marks the start of the last run period
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
    logger.debug(`[PauseQuiz] Emitted quiz_state update for ${quizId}`);

    // Find the *actual live* tournament code for this quiz
    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        logger.info(`[PauseQuiz] Triggering pause for linked tournament ${code} with remaining time ${remaining}s`);
        triggerTournamentPause(io, code, remaining);
    } else {
        logger.warn(`[PauseQuiz] No linked tournament found for quiz ${quizId}`);
    }
}

module.exports = handlePause;
