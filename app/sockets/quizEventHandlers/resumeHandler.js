const createLogger = require('../../logger');
const logger = createLogger('ResumeQuizHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentTimerSet } = require('../tournamentHandler');

// Note: prisma is not needed here
function handleResume(io, socket, prisma, { quizId, teacherId }) {
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[ResumeQuiz] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        return;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    logger.info(`[ResumeQuiz] Resuming quiz ${quizId}`);

    // Use the current timeLeft from the quiz state
    const timeLeft = quizState[quizId].chrono.timeLeft || 0;

    // Update quiz state flags and emit
    quizState[quizId].chrono.running = true;
    quizState[quizId].timerStatus = 'play';
    quizState[quizId].timerTimestamp = Date.now(); // Reset timestamp for the new run period
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
    logger.debug(`[ResumeQuiz] Emitted quiz_state update for ${quizId}`);

    // Find the *actual live* tournament code for this quiz
    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        logger.info(`[ResumeQuiz] Triggering timer set (resume) for linked tournament ${code} with timeLeft=${timeLeft}s`);
        // Use triggerTournamentTimerSet with forceActive=true to resume
        triggerTournamentTimerSet(io, code, timeLeft, true);
    } else {
        logger.warn(`[ResumeQuiz] No linked tournament found for quiz ${quizId}`);
    }
}

module.exports = handleResume;