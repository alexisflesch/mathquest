const createLogger = require('../../logger');
const logger = createLogger('EndQuizHandler');
const quizState = require('../quizState');

// Note: prisma is not needed here
function handleEnd(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to end quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Ending quiz ${quizId}`);
    quizState[quizId].ended = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    // Optionally: Trigger tournament end if linked?
    // const code = Object.keys(tournamentState).find(c => tournamentState[c].linkedQuizId === quizId);
    // if (code) {
    //     // Need an end trigger function in tournamentHandler
    //     // triggerTournamentEnd(io, code);
    // }
}

module.exports = handleEnd;
