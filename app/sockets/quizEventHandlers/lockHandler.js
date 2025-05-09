const createLogger = require('../../logger');
const logger = createLogger('LockQuizHandler');
const quizState = require('../quizState');
const { patchQuizStateForBroadcast } = require('../quizUtils');

// Note: prisma is not needed here
function handleLock(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to lock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }

    logger.info(`Locking quiz ${quizId}`);
    quizState[quizId].locked = true;
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));

    // Emit success message after locking the quiz
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz locked successfully.'
    });
}

module.exports = handleLock;
