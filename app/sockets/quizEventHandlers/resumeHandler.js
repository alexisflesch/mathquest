const createLogger = require('../../logger');
const logger = createLogger('ResumeQuizHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentResume } = require('../tournamentHandler');

// Note: prisma is not needed here
function handleResume(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to resume quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Resuming quiz ${quizId}`);
    quizState[quizId].chrono.running = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        triggerTournamentResume(io, code);
    }
}

module.exports = handleResume;