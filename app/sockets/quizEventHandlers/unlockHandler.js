const handleUnlock = (io, socket, quizState, logger) => ({ quizId }) => {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Unlocking quiz ${quizId}`);
    quizState[quizId].locked = false;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
};

module.exports = handleUnlock;
