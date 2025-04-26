const createLogger = require('../../logger');
const logger = createLogger('DisconnectQuizHandler');
const quizState = require('../quizState');

// Note: prisma is not needed here, but passed for consistency
function handleDisconnecting(io, socket, prisma) {
    logger.info(`disconnecting: socket.id=${socket.id}`);
    for (const quizId in quizState) {
        if (quizState[quizId].profSocketId === socket.id) {
            quizState[quizId].profSocketId = null;
            logger.info(`Professor disconnected from quiz ${quizId}`);
            // Optionally emit an update to other clients in the quiz room
            // io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
        }
    }
}

module.exports = handleDisconnecting;
