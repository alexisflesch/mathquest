const createLogger = require('../../logger');
const logger = createLogger('UnlockQuizHandler');
const quizState = require('../quizState');
const { patchQuizStateForBroadcast } = require('../quizUtils');

// Note: prisma is not needed here
function handleUnlock(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Unlocking quiz ${quizId}`);
    quizState[quizId].locked = false;
    io.to(`quiz_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
}

module.exports = handleUnlock;
