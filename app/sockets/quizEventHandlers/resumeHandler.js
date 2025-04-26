const handleResume = (io, socket, quizState, tournamentState, tournamentHandler, logger) => ({ quizId }) => {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to resume quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Resuming quiz ${quizId}`);
    quizState[quizId].chrono.running = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    // Find the linked tournament code
    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        // Trigger resume in the tournament handler
        tournamentHandler.triggerTournamentResume(io, code);
        logger.info(`Triggered resume for linked tournament ${code}`);
    } else {
        logger.debug(`No tournament linked to quiz ${quizId} found for resume action.`);
    }
};

module.exports = handleResume;