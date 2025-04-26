const createLogger = require('../../logger');
const logger = createLogger('LockQuizHandler');
const quizState = require('../quizState');

// Note: prisma is not needed here
function handleLock(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to lock quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Locking quiz ${quizId}`);
    quizState[quizId].locked = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
}

module.exports = handleLock;
