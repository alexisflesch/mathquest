const createLogger = require('../../logger');
const logger = createLogger('ResumeQuizHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentResume } = require('../tournamentHandler');
const { triggerTournamentTimerSet } = require('../tournamentUtils/tournamentTriggers');

// Note: prisma is not needed here
function handleResume(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to resume quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Resuming quiz ${quizId}`);
    quizState[quizId].chrono.running = true;
    quizState[quizId].timerStatus = 'play';
    quizState[quizId].timerTimestamp = Date.now(); // PATCH: reset le point de départ du timer à chaque reprise
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        // Use the current timeLeft from the quiz state
        const timeLeft = quizState[quizId].chrono.timeLeft || 0;
        triggerTournamentTimerSet(io, code, timeLeft, true);
    }
}

module.exports = handleResume;