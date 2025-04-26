const handleEnd = (io, socket, quizState, logger) => ({ quizId }) => {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to end quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Ending quiz ${quizId}`);
    quizState[quizId].ended = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
};

module.exports = handleEnd;
