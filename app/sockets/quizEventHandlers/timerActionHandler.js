const handleTimerAction = (io, socket, prisma, quizState, tournamentState, tournamentHandler, logger) => async ({ status, questionId, timeLeft, quizId }) => {
    logger.info(`Received quiz_timer_action: status=${status}, question=${questionId}, timeLeft=${timeLeft}, quizId=${quizId}`);

    if (!quizState[quizId]) {
        logger.info(`Quiz state not found for quizId=${quizId}, initializing it...`);
        quizState[quizId] = {
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: socket.id,
            timerStatus: null,
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
        };
    }

    // If this is a resume action (play after pause), check if the timer has been updated
    if (status === 'play' && quizState[quizId].timerStatus === 'pause' && quizState[quizId].timerQuestionId === questionId) {
        // Find the current question index
        const currentQuestionIdx = quizState[quizId].currentQuestionIdx;
        if (typeof currentQuestionIdx === 'number' && currentQuestionIdx >= 0) {
            // Check if the question has a stored temps value that's different from the current timeLeft
            const currentQuestion = quizState[quizId].questions[currentQuestionIdx];

            // If question exists and the chrono.timeLeft doesn't match what's coming in
            if (currentQuestion && typeof currentQuestion.temps === 'number' &&
                currentQuestion.temps !== timeLeft && quizState[quizId].chrono.timeLeft !== currentQuestion.temps) {
                // Log that we're updating to the edited value
                logger.info(`Resuming with updated timer value: ${currentQuestion.temps}s instead of ${timeLeft}s`);

                // Update the timeLeft from the edited value
                timeLeft = currentQuestion.temps;
            }
        }
    }

    // Update the timer status and time left for the quiz
    quizState[quizId].timerStatus = status;
    quizState[quizId].timerQuestionId = questionId;
    quizState[quizId].timerTimeLeft = timeLeft;
    quizState[quizId].timerTimestamp = Date.now();

    // Also update the main chrono timeLeft to keep it in sync
    quizState[quizId].chrono.timeLeft = timeLeft;
    quizState[quizId].chrono.running = status === 'play';

    io.to(`quiz_${quizId}`).emit("quiz_timer_update", {
        status,
        questionId,
        timeLeft,
        timestamp: quizState[quizId].timerTimestamp,
    });
    logger.debug(`Emitted quiz_timer_update to quiz_${quizId}`);

    // Also emit the updated quiz state to ensure all state is in sync
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    // Look up the tournament_code
    try {
        logger.debug(`Looking up tournament_code for quiz ${quizId} in database...`);
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { tournament_code: true }
        });

        let code = null;
        if (quiz && quiz.tournament_code) {
            code = quiz.tournament_code;
            logger.debug(`Found tournament_code in database: ${code}`);
        } else {
            // Fallback to memory-based lookup
            code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
            logger.debug(`No tournament_code in database, memory lookup result: ${code || 'not found'}`);
        }

        if (code) {
            // Emit to lobby to redirect to tournament
            io.to(code).emit("redirect_to_tournament", { code });
            logger.debug(`Emitted redirect_to_tournament to lobby room ${code}`);

            // Emit to tournament room
            io.to(`tournament_${code}`).emit("quiz_update", {
                status,
                questionId,
                timeLeft,
                timestamp: quizState[quizId].timerTimestamp,
            });
            logger.debug(`Emitted quiz_update to tournament_${code}`);

            // If this is a play action, also update tournament state AND DATABASE STATUS
            if (status === 'play') {
                // *** ADDED: Logging before DB update ***
                logger.info(`Attempting to update Tournoi ${code} status to 'en cours' in database...`);
                try {
                    const updateResult = await prisma.tournoi.update({
                        where: { code: code },
                        data: { statut: 'en cours' },
                    });
                    // *** ADDED: Logging after successful DB update ***
                    logger.info(`Successfully updated Tournoi ${code} status to 'en cours'. Result:`, updateResult);
                } catch (dbError) {
                    // *** ADDED: More detailed logging on DB error ***
                    logger.error(`Failed to update Tournoi ${code} status to 'en cours' in database:`, dbError);
                    // Decide if we should proceed or return an error
                }
                // *** END ADDED ***

                // Initialize or update tournament state
                if (!tournamentState[code]) {
                    logger.info(`Initializing tournament state for code=${code}`);
                    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                    if (tournoi) {
                        const questions = await prisma.question.findMany({
                            where: { uid: { in: tournoi.questions_ids || [] } },
                            orderBy: [{ niveau: 'asc' }, { theme: 'asc' }]
                        });

                        const questionIndex = questions.findIndex(q => q.uid === questionId);

                        tournamentState[code] = {
                            participants: {},
                            questions,
                            currentIndex: questionIndex >= 0 ? questionIndex : 0,
                            started: true,
                            answers: {},
                            timer: null,
                            questionStart: Date.now(),
                            socketToJoueur: {},
                            paused: false,
                            pausedRemainingTime: null,
                            linkedQuizId: quizId
                        };

                        // Notify lobby participants
                        io.to(code).emit("tournament_started");
                        logger.info(`Emitted tournament_started to lobby room ${code}`);

                        // Send question to tournament room
                        const question = questions[tournamentState[code].currentIndex];
                        if (question) {
                            io.to(`tournament_${code}`).emit("tournament_question", {
                                question,
                                index: tournamentState[code].currentIndex,
                                total: questions.length,
                                remainingTime: timeLeft,
                                questionState: "active"
                            });
                            logger.info(`Sent question ${question.uid} to tournament_${code}`);
                        }
                    }
                } else {
                    // Update existing tournament state
                    const questionIndex = tournamentState[code].questions.findIndex(q => q.uid === questionId);
                    if (questionIndex >= 0) {
                        tournamentState[code].currentIndex = questionIndex;
                        tournamentState[code].paused = false;
                        tournamentState[code].stopped = false; // Reset stopped state when starting/restarting a question
                        tournamentState[code].questionStart = Date.now();

                        // *** Explicitly update currentQuestionDuration on 'play' ***
                        tournamentState[code].currentQuestionDuration = timeLeft;
                        logger.info(`Updated currentQuestionDuration to ${timeLeft}s on 'play' action for tournament ${code}`);

                        const question = tournamentState[code].questions[questionIndex];
                        io.to(`tournament_${code}`).emit("tournament_question", {
                            question,
                            index: questionIndex,
                            total: tournamentState[code].questions.length,
                            remainingTime: timeLeft,
                            questionState: "active"
                        });
                        logger.info(`Sent question ${question.uid} to tournament_${code}`);
                    }
                }
            } else if (status === 'stop') {
                // Use trigger function
                tournamentHandler.triggerTournamentTimerSet(io, code, 0); // Setting timer to 0 handles stop logic
                logger.info(`Triggered stop for tournament ${code}`);

            } else if (status === 'pause') {
                // Use trigger function
                tournamentHandler.triggerTournamentPause(io, code);
                logger.info(`Triggered pause for tournament ${code}`);
            }
        } else {
            logger.warn(`No tournament linked to quiz ${quizId}. Cannot send events or update status.`);
        }
    } catch (err) {
        logger.error(`Error handling quiz_timer_action:`, err);
    }
};

module.exports = handleTimerAction;
