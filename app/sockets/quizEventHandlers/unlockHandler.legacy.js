const createLogger = require('../../logger');
const logger = createLogger('UnlockQuizHandler');
const { quizState } = require('../quizState');
const { patchQuizStateForBroadcast } = require('../quizUtils.legacy.js');

// Note: prisma is not needed here
function handleUnlock(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }

    logger.info(`Unlocking quiz ${quizId}`);
    quizState[quizId].locked = false;
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));

    // Emit success message after unlocking the quiz
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz unlocked successfully.'
    });
}

module.exports = handleUnlock;
