const handlePause = (io, socket, quizState, tournamentState, tournamentHandler, logger) => ({ quizId }) => {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to pause quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Pausing quiz ${quizId}`);
    quizState[quizId].chrono.running = false;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    const code = Object.keys(tournamentState).find(c => tournamentState[c].linkedQuizId === quizId);
    if (code) {
        tournamentHandler.triggerTournamentPause(io, code);
    }
};

module.exports = handlePause;
