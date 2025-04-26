const createLogger = require('../../logger');
const logger = createLogger('PauseQuizHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentPause } = require('../tournamentHandler');

// Note: prisma is not needed here
function handlePause(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to pause quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Pausing quiz ${quizId}`);
    quizState[quizId].chrono.running = false;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        triggerTournamentPause(io, code);
    }
}

module.exports = handlePause;
