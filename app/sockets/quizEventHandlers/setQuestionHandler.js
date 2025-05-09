/**
 * setQuestionHandler.js - Handler for setting the active question in a quiz
 * 
 * Updates the quiz state with the new question index and timer settings.
 * If linked to a tournament, it triggers the corresponding question update
 * and starts the timer in the tournament state using trigger functions.
 * 
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */
const createLogger = require('../../logger');
const logger = createLogger('SetQuestionHandler');
const { quizState, getQuestionTimer } = require('../quizState');
const { tournamentState, triggerTournamentQuestion, triggerTournamentTimerSet } = require('../tournamentHandler');
const prisma = require('../../db');
const {
    patchQuizStateForBroadcast,
    initializeChrono,
    calculateRemainingTime,
    updateQuestionTimer,
    emitQuizTimerUpdate
} = require('../quizUtils');
const { triggerQuizTimerAction } = require('../quizTriggers');

async function handleSetQuestion(io, socket, prisma, { quizId, questionUid, code: tournamentCode, teacherId }) {
    // Initialize quizState if it doesn't exist
    if (!quizState[quizId]) {
        logger.info(`[SetQuestion] Creating new quizState for quizId=${quizId}`);
        quizState[quizId] = {
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: socket.id,
            profTeacherId: teacherId,
            questionTimers: {},
            connectedSockets: new Set(),
        };

        try {
            // Load quiz data
            const quiz = await prisma.quiz.findUnique({
                where: { id: quizId },
                select: { enseignant_id: true, questions_ids: true, tournament_code: true }
            });

            if (quiz) {
                // Update the teacher ID and load questions
                quizState[quizId].profTeacherId = quiz.enseignant_id;

                if (quiz.tournament_code) {
                    quizState[quizId].tournament_code = quiz.tournament_code;
                }

                if (quiz.questions_ids && quiz.questions_ids.length > 0) {
                    // Fetch questions from database
                    const questionsData = await prisma.question.findMany({
                        where: { uid: { in: quiz.questions_ids } }
                    });

                    // Maintain the order from questions_ids
                    const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                    const orderedQuestions = [];

                    quiz.questions_ids.forEach(uid => {
                        if (questionMap.has(uid)) {
                            orderedQuestions.push(questionMap.get(uid));
                        }
                    });

                    quizState[quizId].questions = orderedQuestions;
                }
            }
        } catch (err) {
            logger.error(`[SetQuestion] Error loading quiz data for ${quizId}:`, err);
        }
    }

    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        // Fallback: check DB if teacherId matches quiz owner
        const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { enseignant_id: true } });
        if (!quiz || quiz.enseignant_id !== teacherId) {
            logger.warn(`[SetQuestion] Unauthorized access for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
            return;
        }
        // Update in-memory state for future requests
        if (quizState[quizId]) {
            quizState[quizId].profTeacherId = teacherId;
        } else {
            logger.error(`[SetQuestion] quizState[${quizId}] is still undefined after initialization attempt`);
            return;
        }
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    // Check if questions array is initialized
    if (!quizState[quizId].questions || !Array.isArray(quizState[quizId].questions)) {
        logger.error(`[SetQuestion] Questions array not properly initialized for quiz ${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur: problème de chargement des questions.'
        });
        return;
    }

    const idx = quizState[quizId].questions.findIndex(q => q.uid === questionUid);
    if (idx === -1) {
        logger.warn(`[SetQuestion] Question UID ${questionUid} not found in quiz ${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : question non trouvée.'
        });
        return;
    }

    // Always get the timer value from the question object in the backend
    const questionObj = quizState[quizId].questions[idx];
    const initialTime = questionObj && questionObj.temps ? parseFloat(questionObj.temps.toFixed(1)) : 20.0;

    logger.info(`[SetQuestion] Setting question ${questionUid} (idx: ${idx}) for quiz ${quizId}, time: ${initialTime}s (from question object), code: ${tournamentCode || 'none'}`);

    // Check if we're changing from a different question
    const previousQuestionUid = quizState[quizId].currentQuestionUid;
    const isChangingQuestion = previousQuestionUid !== questionUid;

    // If changing question and there's an active timer for the previous question,
    // save its state before switching to the new question
    if (isChangingQuestion && previousQuestionUid) {
        const prevTimer = getQuestionTimer(quizId, previousQuestionUid);
        if (prevTimer) {
            logger.info(`[SetQuestion] Preserving timer state for previous question ${previousQuestionUid}: status=${prevTimer.status}, timeLeft=${prevTimer.timeLeft}`);
        }
    }

    // --- Strict Timer Reset on Question Switch (Patch) ---
    if (isChangingQuestion && previousQuestionUid) {
        // Forcibly stop previous question's timer if running
        const prevTimer = getQuestionTimer(quizId, previousQuestionUid);
        if (prevTimer && prevTimer.status === 'play') {
            updateQuestionTimer(quizId, previousQuestionUid, 'stop', prevTimer.timeLeft);
            logger.warn(`[SetQuestion][Patch] Forcibly stopped timer for previous question ${previousQuestionUid} (was running on switch)`);
        }
    }

    // --- Update Quiz State ---
    quizState[quizId].currentQuestionIdx = idx;
    // Always set currentQuestionUid in quiz mode (not tournament) BEFORE any timer/chrono logic
    if (!quizState[quizId].tournament_code) {
        quizState[quizId].currentQuestionUid = questionUid;
        logger.debug(`[SetQuestionHandler] Set currentQuestionUid = ${questionUid} for quizId=${quizId} (stack: ${new Error().stack})`);
    }
    quizState[quizId].timerQuestionId = questionUid;  // The question ID for the timer
    quizState[quizId].locked = false;
    quizState[quizId].ended = false;

    // Log current question index and UID
    logger.debug(`[SetQuestion] Updated quizState[${quizId}].currentQuestionUid = ${questionUid}`);


    // --- Handle Question Timer State ---
    // Get this question's existing timer or create a new one
    const questionTimer = getQuestionTimer(quizId, questionUid);

    // Always reset timer to initial value when switching questions in quiz mode
    triggerQuizTimerAction(io, quizId, questionUid, 'stop', initialTime);
    quizState[quizId].chrono = initializeChrono(initialTime);
    quizState[quizId].timerInitialValue = initialTime;
    emitQuizTimerUpdate(io, quizId, 'stop', questionUid, initialTime);

    // Add quiz ID to quizState for use by patchQuizStateForBroadcast
    quizState[quizId].id = quizId;

    // Add validation and logging for currentQuestionUid
    if (!quizState[quizId].currentQuestionUid) {
        logger.error(`[SetQuestionHandler] currentQuestionUid is not set for quiz ${quizId}.`);
        return;
    }
    logger.info(`[SetQuestionHandler] currentQuestionUid updated to ${quizState[quizId].currentQuestionUid} for quiz ${quizId}.`);

    // --- Patch: Recalculate timer for dashboard broadcast ---
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]);
    logger.debug(`[SetQuestion] Emitted quiz_state update for ${quizId}`);

    // --- Initialize or Update Tournament State using Triggers --- 
    // Always use the *actual live* tournament code for quiz-linked tournaments
    let liveTournamentCode = tournamentCode;
    if (!liveTournamentCode && quizId) {
        const found = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        if (found) liveTournamentCode = found;
    }
    if (liveTournamentCode) {
        try {
            const tournoi = await prisma.tournoi.findUnique({ where: { code: liveTournamentCode } });
            if (!tournoi) {
                logger.error(`[SetQuestion] Tournoi with code ${liveTournamentCode} not found in database for initialization.`);
                return;
            }
            if (!tournoi.questions_ids || tournoi.questions_ids.length === 0) {
                logger.error(`[SetQuestion] Tournoi ${liveTournamentCode} has no questions_ids defined.`);
                return;
            }

            const questions = await prisma.question.findMany({
                where: { uid: { in: tournoi.questions_ids } },
            });

            const orderedQuestions = tournoi.questions_ids.map(uid => questions.find(q => q.uid === uid)).filter(q => q);

            if (orderedQuestions.length !== tournoi.questions_ids.length) {
                logger.warn(`[SetQuestion] Mismatch between questions_ids and found questions for tournoi ${liveTournamentCode}. Some questions might be missing.`);
            }

            const prevState = tournamentState[liveTournamentCode] || {};
            const preservedAnswers = prevState.answers && typeof prevState.answers === 'object' ? prevState.answers : {};
            tournamentState[liveTournamentCode] = {
                ...prevState,
                questions: orderedQuestions,
                currentIndex: -1,
                started: true,
                answers: preservedAnswers,
                timer: null,
                questionStart: null,
                paused: false,
                pausedRemainingTime: null,
                linkedQuizId: quizId,
                currentQuestionDuration: null,
                stopped: false,
                statut: tournoi.statut,
            };
            logger.info(`[SetQuestion] Tournament state initialized for ${liveTournamentCode} with ${orderedQuestions.length} questions.`);

            const targetQuestion = orderedQuestions.find(q => q.uid === questionUid);
            if (!targetQuestion) {
                logger.error(`[SetQuestion] Question UID ${questionUid} not found in initialized tournamentState[${liveTournamentCode}].questions`);
            } else {
                logger.info(`[SetQuestion] Triggering question and timer for linked tournament ${liveTournamentCode}`);
                triggerTournamentQuestion(io, liveTournamentCode, null, quizId, initialTime, questionUid);
                if (initialTime !== null) {
                    triggerTournamentTimerSet(io, liveTournamentCode, initialTime, true);
                }
            }

            if (tournoi && tournoi.linkedQuizId && tournamentState[liveTournamentCode].statut !== 'en cours') {
                logger.info(`[SetQuestion] Forcing statut 'en cours' for quiz-linked tournament ${liveTournamentCode}`);
                await prisma.tournoi.update({
                    where: { code: liveTournamentCode },
                    data: { statut: "en cours" }
                });
                tournamentState[liveTournamentCode].statut = 'en cours';
            }

            if (tournoi && tournoi.linkedQuizId) {
                logger.info(`[SetQuestion] Emitting redirect_to_tournament for quiz-linked tournament ${liveTournamentCode} to lobby_${liveTournamentCode}`);
                io.to(`lobby_${liveTournamentCode}`).emit("redirect_to_tournament", { code: liveTournamentCode });
            }

            if (tournamentState[liveTournamentCode].statut !== 'en cours') {
                logger.info(`[SetQuestion] Attempting to update Tournoi ${liveTournamentCode} status to 'en cours'...`);
                await prisma.tournoi.update({
                    where: { code: liveTournamentCode },
                    data: { statut: "en cours" }
                });
                tournamentState[liveTournamentCode].statut = 'en cours';
                logger.info(`[SetQuestion] Tournoi ${liveTournamentCode} status updated to "en cours"`);

                const isQuizLinked = await prisma.quiz.findFirst({ where: { tournament_code: liveTournamentCode } });
                if (isQuizLinked) {
                    logger.info(`[SetQuestion] Emitting redirect_to_tournament for quiz-linked tournament ${liveTournamentCode} to lobby_${liveTournamentCode}`);
                    io.to(`lobby_${liveTournamentCode}`).emit("redirect_to_tournament", { code: liveTournamentCode });
                } else {
                    logger.info(`[SetQuestion] Emitting tournament_started for classic tournament ${liveTournamentCode} to lobby_${liveTournamentCode}`);
                    io.to(`lobby_${liveTournamentCode}`).emit("tournament_started", { code: liveTournamentCode });
                }
            }

        } catch (error) {
            logger.error(`[SetQuestion] Error initializing or updating tournament state for code ${liveTournamentCode}:`, error);
        }
    } else {
        logger.warn(`[SetQuestion] No tournament code provided or found for quiz ${quizId}`);
    }

    quizState[quizId].id = quizId; // This is important for patchQuizStateForBroadcast

    logger.info(`[SetQuestion] Quiz ${quizId} - New question set to index ${newQuestionIndex} (UID: ${newQuestion.uid}) by teacher ${profSocketId}`);
    logger.debug(`[SetQuestion] Quiz ${quizId} state after update:`, { currentQuestionIdx: quizState[quizId].currentQuestionIdx, currentQuestionUid: quizState[quizId].currentQuestionUid, timerQuestionId: quizState[quizId].timerQuestionId });

    // Emit updated state to teacher dashboard and projector view
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]); // Projector gets raw state, no timer recalculation needed here as it mirrors dashboard

    // Determine the target tournament code for student updates
    let studentChannelTournamentCode = quizState[quizId].tournament_code;

    if (!studentChannelTournamentCode) {
        // If not explicitly linked to a separate tournament, this is a standard quiz.
        // Students are in `live_${quizId}` as per user clarification.
        logger.info(`[SetQuestion] Standard quiz (ID: ${quizId}). Student updates will target live_${quizId}.`);
        studentChannelTournamentCode = quizId; // Use quizId as the "code" for the student channel
    } else {
        logger.info(`[SetQuestion] Quiz (ID: ${quizId}) is linked to tournament ${studentChannelTournamentCode}. Student updates will target this tournament.`);
    }

    // Send question to the determined student channel (either linked tournament or tournament_quizId)
    if (studentChannelTournamentCode) {
        logger.info(`[SetQuestion] Sending question to student channel live_${studentChannelTournamentCode} for quiz ${quizId}, question UID ${newQuestion.uid}.`);
        sendQuestionToTournament(io, studentChannelTournamentCode, newQuestionIndex, quizId, newQuestion.uid);
        // Note: sendQuestionToTournament calls triggerTournamentQuestion, which sets up the question
        // in tournamentState (e.g., tournamentState[studentChannelTournamentCode]).
        // It does NOT automatically start/restart the timer for that tournament room.
        // Timer actions (play, pause, set) are typically separate explicit operations.
        // If changing a question should also reset and start the timer for students,
        // an explicit call to triggerTournamentTimerSet would be needed here.
        // For now, focusing on getting question *content* to students.
    } else {
        // This case should ideally not be reached if the default to quizId covers standard quizzes.
        logger.warn(`[SetQuestion] No studentChannelTournamentCode determined for quiz ${quizId}. Students in tournament_X rooms might not receive question updates.`);
    }

    // Log active timers for this quiz
}

module.exports = handleSetQuestion;
