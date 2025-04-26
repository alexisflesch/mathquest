const handleLock = (io, socket, quizState, logger) => ({ quizId }) => {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to lock quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Locking quiz ${quizId}`);
    quizState[quizId].locked = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
};

module.exports = handleLock;
