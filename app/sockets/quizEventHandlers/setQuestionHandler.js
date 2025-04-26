const handleSetQuestion = (io, socket, prisma, quizState, tournamentState, tournamentHandler, logger) => async ({ quizId, questionIdx, chrono, code }) => {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized access to set question for quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Setting question ${questionIdx} for quiz ${quizId}, chrono: ${chrono}, tournament code: ${code || 'none'}`);
    quizState[quizId].currentQuestionIdx = questionIdx;
    quizState[quizId].locked = false;
    quizState[quizId].ended = false;
    quizState[quizId].chrono = typeof chrono === 'number' ? { timeLeft: chrono, running: true } : { timeLeft: null, running: false };

    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    if (code) {
        if (!tournamentState[code]) {
            logger.info(`Initializing tournament state for code=${code}`);
            const tournoi = await prisma.tournoi.findUnique({ where: { code } });
            if (!tournoi) {
                logger.error(`Tournament ${code} not found for quiz ${quizId}`);
                return;
            }
            const questions = await prisma.question.findMany({
                where: { uid: { in: tournoi.questions_ids } },
                orderBy: [{ niveau: 'asc' }, { theme: 'asc' }],
            });
            tournamentState[code] = {
                participants: {},
                questions,
                currentIndex: questionIdx,
                started: true,
                answers: {},
                timer: null,
                questionStart: null,
                socketToJoueur: {},
                paused: false,
                pausedRemainingTime: null,
                linkedQuizId: quizId,
            };
            // Emit immediate redirect for quiz-linked tournaments
            io.to(code).emit("redirect_to_tournament", { code });
            logger.debug(`Emitted redirect_to_tournament to lobby room ${code}`);
        }

        tournamentState[code].linkedQuizId = quizId;
        tournamentState[code].currentIndex = questionIdx;

        // *** Pass chrono value if it's a number ***
        const initialTime = typeof chrono === 'number' ? chrono : null;
        tournamentHandler.triggerTournamentQuestion(io, code, questionIdx, quizId, initialTime); // Pass initialTime
    }
};

module.exports = handleSetQuestion;
