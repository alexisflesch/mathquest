/**
 * quizEvents.js - Quiz Socket Event Handlers
 * 
 * This module implements all Socket.IO event handlers related to teacher quiz management:
 * - Joining quiz rooms
 * - Setting active questions
 * - Controlling timer (play/pause/stop)
 * - Locking/unlocking question submissions
 * - Managing quiz completion
 * 
 * It also handles the coordination between the teacher dashboard (quiz) and 
 * student tournament views by:
 * - Linking quiz actions to corresponding tournament actions
 * - Managing state synchronization between quiz and tournament
 * - Emitting appropriate events to both systems
 * 
 * All handlers validate teacher permissions before taking actions
 * to prevent unauthorized modifications.
 */

// Import required modules and state
const createLogger = require('../logger');
const logger = createLogger('QuizEvents');
const quizState = require('./quizState');
const { tournamentState, triggerTournamentQuestion, triggerTournamentPause, triggerTournamentResume, triggerTournamentTimerSet } = require('./tournamentHandler');


function registerQuizEvents(io, socket, prisma) {
    // join_quiz
    socket.on("join_quiz", async ({ quizId, role }) => {
        socket.join(`quiz_${quizId}`);
        logger.info(`Socket ${socket.id} joined room quiz_${quizId} with role ${role}`);
        socket.emit("joined_room", {
            room: `quiz_${quizId}`,
            socketId: socket.id,
            rooms: Array.from(socket.rooms),
        });

        if (!quizState[quizId]) {
            quizState[quizId] = {
                currentQuestionIdx: null,
                questions: [],
                chrono: { timeLeft: null, running: false },
                locked: false,
                ended: false,
                stats: {},
                profSocketId: role === 'prof' ? socket.id : null,
            };

            try {
                const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
                if (quiz && quiz.questions_ids) {
                    const orderedQuestions = [];
                    const questionsData = await prisma.question.findMany({ where: { uid: { in: quiz.questions_ids } } });
                    const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                    quiz.questions_ids.forEach(uid => {
                        if (questionMap.has(uid)) {
                            orderedQuestions.push(questionMap.get(uid));
                        }
                    });
                    quizState[quizId].questions = orderedQuestions;
                    logger.info(`Loaded ${orderedQuestions.length} questions for quiz ${quizId}`);
                }
            } catch (e) {
                logger.error(`Error loading quiz ${quizId} questions:`, e);
            }
        } else if (role === 'prof') {
            quizState[quizId].profSocketId = socket.id;
            logger.info(`Updated professor socket ID for quiz ${quizId}`);
        }

        socket.emit("quiz_state", quizState[quizId]);
    });

    // quiz_set_question
    socket.on("quiz_set_question", async ({ quizId, questionIdx, chrono, code }) => {
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
            triggerTournamentQuestion(io, code, questionIdx, quizId, initialTime); // Pass initialTime
        }
    });


    // quiz_timer_action
    socket.on("quiz_timer_action", async ({ status, questionId, timeLeft, quizId }) => {
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
                    triggerTournamentTimerSet(io, code, 0); // Setting timer to 0 handles stop logic
                    logger.info(`Triggered stop for tournament ${code}`);

                } else if (status === 'pause') {
                    // Use trigger function
                    triggerTournamentPause(io, code);
                    logger.info(`Triggered pause for tournament ${code}`);
                }
            } else {
                logger.warn(`No tournament linked to quiz ${quizId}. Cannot send events or update status.`);
            }
        } catch (err) {
            logger.error(`Error handling quiz_timer_action:`, err);
        }
    });

    // quiz_set_timer
    socket.on("quiz_set_timer", ({ quizId, timeLeft }) => {
        // *** ADDED LOGGING ***
        logger.info(`Received quiz_set_timer for quiz ${quizId} with timeLeft=${timeLeft}s`);

        if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
            logger.warn(`Unauthorized attempt to set timer for quiz ${quizId} from socket ${socket.id}`);
            return;
        }

        logger.info(`Setting timer to ${timeLeft}s for quiz ${quizId}`);

        // Update the main chrono timeLeft value
        quizState[quizId].chrono.timeLeft = timeLeft;

        // For consistency, also update the timer action fields if they exist
        if ('timerTimeLeft' in quizState[quizId]) {
            quizState[quizId].timerTimeLeft = timeLeft;
            logger.debug(`Also updated timerTimeLeft to ${timeLeft}s`);
        }

        // *** FIX: Also update the 'temps' property of the current question in server state ***
        const currentQuestionIdx = quizState[quizId].currentQuestionIdx;
        if (typeof currentQuestionIdx === 'number' && currentQuestionIdx >= 0 && quizState[quizId].questions[currentQuestionIdx]) {
            quizState[quizId].questions[currentQuestionIdx].temps = timeLeft;
            logger.info(`Updated quizState.questions[${currentQuestionIdx}].temps to ${timeLeft}s`);
        } else {
            // Log a warning if we can't find the question to update its temps
            logger.warn(`Could not update temps for question index ${currentQuestionIdx} in quiz ${quizId} state.`);
        }


        // *** ADDED LOGGING ***
        logger.debug(`Quiz state PRE-EMIT for quiz_set_timer:`, quizState[quizId]);

        // Send the updated state to all clients in the quiz room
        io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

        // Also emit a timer update event to ensure clients get the new value
        // This is especially important for paused timers where the value might not
        // be immediately visible in the standard quiz_state update
        if (quizState[quizId].timerQuestionId) {
            io.to(`quiz_${quizId}`).emit("quiz_timer_update", {
                status: quizState[quizId].chrono.running ? 'play' : 'pause',
                questionId: quizState[quizId].timerQuestionId,
                timeLeft: timeLeft,
                timestamp: Date.now()
            });
            logger.debug(`Emitted separate quiz_timer_update with new timeLeft=${timeLeft}`);
        }

        // Update the corresponding tournament timer if linked
        const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        if (code) {
            // For a paused tournament, update the pausedRemainingTime
            if (tournamentState[code] && tournamentState[code].paused) {
                tournamentState[code].pausedRemainingTime = timeLeft;
                logger.info(`Updated paused tournament ${code} timer to ${timeLeft}s`);
            }

            // Update the tournament timer using the trigger function
            triggerTournamentTimerSet(io, code, timeLeft);
        }
    });

    // quiz_lock
    socket.on("quiz_lock", ({ quizId }) => {
        if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
            logger.warn(`Unauthorized attempt to lock quiz ${quizId} from socket ${socket.id}`);
            return;
        }

        logger.info(`Locking quiz ${quizId}`);
        quizState[quizId].locked = true;
        io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
    });

    // quiz_unlock
    socket.on("quiz_unlock", ({ quizId }) => {
        if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
            logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
            return;
        }

        logger.info(`Unlocking quiz ${quizId}`);
        quizState[quizId].locked = false;
        io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
    });

    // quiz_end
    socket.on("quiz_end", ({ quizId }) => {
        if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
            logger.warn(`Unauthorized attempt to end quiz ${quizId} from socket ${socket.id}`);
            return;
        }

        logger.info(`Ending quiz ${quizId}`);
        quizState[quizId].ended = true;
        io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
    });

    // quiz_pause
    socket.on("quiz_pause", ({ quizId }) => {
        if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
            logger.warn(`Unauthorized attempt to pause quiz ${quizId} from socket ${socket.id}`);
            return;
        }

        logger.info(`Pausing quiz ${quizId}`);
        quizState[quizId].chrono.running = false;
        io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

        const code = Object.keys(tournamentState).find(c => tournamentState[c].linkedQuizId === quizId);
        if (code) {
            triggerTournamentPause(io, code);
        }
    });

    // quiz_resume
    socket.on("quiz_resume", ({ quizId }) => {
        if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
            logger.warn(`Unauthorized attempt to resume quiz ${quizId} from socket ${socket.id}`);
            return;
        }

        logger.info(`Resuming quiz ${quizId}`);
        quizState[quizId].chrono.running = true;
        io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

        const code = Object.keys(tournamentState).find(c => tournamentState[c].linkedQuizId === quizId);
        if (code) {
            triggerTournamentResume(io, code);
        }
    });

    // disconnecting
    socket.on("disconnecting", () => {
        for (const quizId in quizState) {
            if (quizState[quizId].profSocketId === socket.id) {
                quizState[quizId].profSocketId = null;
                logger.info(`Professor disconnected from quiz ${quizId}`);
            }
        }
    });
}

module.exports = registerQuizEvents;