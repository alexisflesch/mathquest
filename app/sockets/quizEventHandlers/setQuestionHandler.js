/**
 * setQuestionHandler.js - Handler for setting the active question in a quiz
 * 
 * Updates the quiz state with the new question index and timer settings.
 * If linked to a tournament, it triggers the corresponding question update
 * and starts the timer in the tournament state using trigger functions.
 */
const createLogger = require('../../logger');
const logger = createLogger('SetQuestionHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentQuestion, triggerTournamentTimerSet } = require('../tournamentHandler'); // Ensure triggerTournamentTimerSet is imported
const prisma = require('../../db'); // Ensure prisma is required

async function handleSetQuestion(io, socket, prisma, { quizId, questionUid, chrono, code, teacherId }) {
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[SetQuestion] Unauthorized access for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        return;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    const idx = quizState[quizId].questions.findIndex(q => q.uid === questionUid);
    if (idx === -1) {
        logger.warn(`[SetQuestion] Question UID ${questionUid} not found in quiz ${quizId}`);
        return;
    }

    const initialTime = typeof chrono === 'number' ? chrono : null;
    logger.info(`[SetQuestion] Setting question ${questionUid} (idx: ${idx}) for quiz ${quizId}, time: ${initialTime}, code: ${code || 'none'}`);

    // --- Update Quiz State --- 
    quizState[quizId].currentQuestionIdx = idx;
    quizState[quizId].timerQuestionId = questionUid;
    quizState[quizId].timerStatus = 'play'; // Assume play when setting a new question
    quizState[quizId].chrono = initialTime !== null
        ? { timeLeft: initialTime, running: true }
        : { timeLeft: null, running: false };
    quizState[quizId].timerTimeLeft = initialTime;
    quizState[quizId].timerTimestamp = Date.now();
    quizState[quizId].locked = false;
    quizState[quizId].ended = false;

    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
    logger.debug(`[SetQuestion] Emitted quiz_state update for ${quizId}`);

    // --- Initialize or Update Tournament State using Triggers --- 
    // Always use the *actual live* tournament code for quiz-linked tournaments
    let liveTournamentCode = code;
    if (quizId) {
        const found = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        if (found) liveTournamentCode = found;
    }
    if (liveTournamentCode) {
        try {
            // Check if tournament state needs initialization
            if (!tournamentState[liveTournamentCode]) {
                logger.info(`[SetQuestion] Initializing tournament state for code=${liveTournamentCode}`);
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
                    // Ensure consistent order if needed, e.g., by order in questions_ids
                    // This requires fetching questions individually or sorting post-fetch
                    // For simplicity, using default order for now.
                });

                // Reorder questions based on tournoi.questions_ids
                const orderedQuestions = tournoi.questions_ids.map(uid => questions.find(q => q.uid === uid)).filter(q => q);

                if (orderedQuestions.length !== tournoi.questions_ids.length) {
                    logger.warn(`[SetQuestion] Mismatch between questions_ids and found questions for tournoi ${liveTournamentCode}. Some questions might be missing.`);
                }

                tournamentState[liveTournamentCode] = {
                    participants: {},
                    questions: orderedQuestions, // Use ordered questions
                    currentIndex: -1, // Will be set below
                    started: true,
                    answers: {},
                    timer: null,
                    questionStart: null,
                    socketToJoueur: {},
                    paused: false,
                    pausedRemainingTime: null,
                    linkedQuizId: quizId,
                    currentQuestionDuration: null,
                    stopped: false,
                    statut: tournoi.statut, // Initialize status from DB
                };
                logger.info(`[SetQuestion] Tournament state initialized for ${liveTournamentCode} with ${orderedQuestions.length} questions.`);
                // Emit redirect/started event *after* initialization and status update
                // This logic is moved down to ensure state exists before emitting
            }

            // Now tournamentState[liveTournamentCode] is guaranteed to exist
            const tournamentIdx = tournamentState[liveTournamentCode].questions.findIndex(q => q.uid === questionUid);
            if (tournamentIdx === -1) {
                logger.error(`[SetQuestion] Question UID ${questionUid} not found in initialized tournamentState[${liveTournamentCode}].questions`);
            } else {
                logger.info(`[SetQuestion] Triggering question and timer for linked tournament ${liveTournamentCode}`);
                // 1. Trigger the question update (sends question data, sets state)
                triggerTournamentQuestion(io, liveTournamentCode, tournamentIdx, quizId, initialTime);
                // 2. If a timer duration is provided, start the timer
                if (initialTime !== null) {
                    triggerTournamentTimerSet(io, liveTournamentCode, initialTime, true);
                }
            }

            // --- Always mark as started and emit redirect for quiz-linked tournaments ---
            const tournoi = await prisma.tournoi.findUnique({ where: { code: liveTournamentCode } });
            if (tournoi && tournoi.linkedQuizId && tournamentState[liveTournamentCode].statut !== 'en cours') {
                logger.info(`[SetQuestion] Forcing statut 'en cours' and emitting redirect_to_tournament for quiz-linked tournament ${liveTournamentCode}`);
                await prisma.tournoi.update({
                    where: { code: liveTournamentCode },
                    data: { statut: "en cours" }
                });
                tournamentState[liveTournamentCode].statut = 'en cours';
                io.to(`lobby_${liveTournamentCode}`).emit("redirect_to_tournament", { code: liveTournamentCode });
            }

            // Update DB status if needed (now happens after state initialization)
            if (tournamentState[liveTournamentCode].statut !== 'en cours') {
                logger.info(`[SetQuestion] Attempting to update Tournoi ${liveTournamentCode} status to 'en cours'...`);
                await prisma.tournoi.update({
                    where: { code: liveTournamentCode },
                    data: { statut: "en cours" }
                });
                tournamentState[liveTournamentCode].statut = 'en cours'; // Update in-memory status
                logger.info(`[SetQuestion] Tournoi ${liveTournamentCode} status updated to "en cours"`);

                // Emit redirect/started event *after* status update
                const isQuizLinked = await prisma.quiz.findFirst({ where: { tournament_code: liveTournamentCode } });
                if (isQuizLinked) {
                    logger.info(`[SetQuestion] Emitting redirect_to_tournament for quiz-linked tournament ${liveTournamentCode} to lobby_${liveTournamentCode}`);
                    io.to(`lobby_${liveTournamentCode}`).emit("redirect_to_tournament", { code: liveTournamentCode });
                } else {
                    // This case might not be relevant if handleSetQuestion is only for quiz-linked?
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
}

module.exports = handleSetQuestion;
