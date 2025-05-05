const createLogger = require('../../logger');
const logger = createLogger('AnswerTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');

function handleTournamentAnswer(io, socket, { code, questionUid, answerIdx, clientTimestamp }) {
    logger.info(`tournament_answer received`, { code, questionUid, answerIdx, clientTimestamp, socketId: socket.id });
    // Determine the correct state (live or differed)
    let joueurId = null;
    let stateKey = null;
    let state = null;

    // Check live state first
    if (tournamentState[code] && tournamentState[code].socketToJoueur && tournamentState[code].socketToJoueur[socket.id]) {
        stateKey = code;
        state = tournamentState[stateKey];
        joueurId = state.socketToJoueur[socket.id];
    } else {
        // Check differed states
        for (const key in tournamentState) {
            if (key.startsWith(`${code}_`) && tournamentState[key].socketToJoueur && tournamentState[key].socketToJoueur[socket.id]) {
                stateKey = key;
                state = tournamentState[key];
                joueurId = state.socketToJoueur[socket.id];
                break;
            }
        }
    }

    if (!state || !joueurId) {
        logger.warn(`tournament_answer: State or joueurId not found for socket ${socket.id} and code ${code}. Ignoring.`);
        return;
    }

    const qIdx = state.currentIndex;
    if (qIdx < 0 || !state.questions || qIdx >= state.questions.length) {
        logger.warn(`tournament_answer: Invalid question index (${qIdx}) or missing questions for state ${stateKey}. Ignoring.`);
        return;
    }

    const question = state.questions[qIdx];
    // Check if the answer is for the *current* question
    if (question.uid !== questionUid) {
        logger.warn(`tournament_answer: Answer received for wrong question (expected ${question.uid}, got ${questionUid}) for state ${stateKey}. Ignoring.`);
        return;
    }

    // *** Use currentQuestionDuration from state if available ***
    const timeAllowed = state.currentQuestionDuration || question.temps || 20;
    const questionStart = state.questionStart;

    if (!questionStart) {
        logger.warn(`tournament_answer: questionStart missing for state ${stateKey}. Ignoring.`);
        return; // Question hasn't properly started
    }

    // Enhanced logging about quiz/tournament state
    const serverReceiveTime = Date.now();
    const isDiffered = state.isDiffered; // Check state property
    const isPaused = state.paused;
    const isStopped = state.stopped;
    const isQuizMode = !!state.linkedQuizId;
    const elapsed = (serverReceiveTime - questionStart) / 1000;
    const remaining = timeAllowed - elapsed;

    // Log detailed state information to help diagnose timing issues
    logger.info(`tournament_answer: Quiz state details for ${stateKey}:`, {
        isDiffered,
        isPaused,
        isStopped,
        isQuizMode,
        linkedQuizId: state.linkedQuizId,
        elapsed: elapsed.toFixed(2) + 's',
        timeAllowed: timeAllowed + 's',
        remaining: remaining.toFixed(2) + 's',
        questionStart: new Date(questionStart).toISOString(),
        serverReceiveTime: new Date(serverReceiveTime).toISOString(),
        answerTooLate: elapsed > timeAllowed,
        pausedRemainingTime: state.pausedRemainingTime ? state.pausedRemainingTime.toFixed(2) + 's' : 'none'
    });

    // First check if the question is stopped - reject answers if it is
    if (state.stopped) {
        logger.warn(`tournament_answer: Answer rejected because question is stopped for state ${stateKey}`);
        socket.emit("tournament_answer_result", {
            rejected: true,
            reason: "stopped",
            message: "Trop tard !"
        });
        return;
    }

    // Always accept answers when the question is paused, regardless of time elapsed
    if (!state.paused) {
        // Only check timing if the question is NOT paused
        // Check timing using server receive time with grace period
        // *** Use the potentially updated timeAllowed ***
        if ((serverReceiveTime - questionStart) > timeAllowed * 1000 + 500) { // Add 500ms grace period
            logger.warn(`tournament_answer: Answer too late (server time, ${timeAllowed}s allowed) for state ${stateKey}. Ignoring.`);
            // Send rejection response back to client
            socket.emit("tournament_answer_result", {
                correct: false,
                rejected: true,
                reason: "late",
                message: "Trop tard !"
            });
            return;
        }

        // Also check client timestamp relative to question start
        // *** Use the potentially updated timeAllowed ***
        if ((clientTimestamp - questionStart) > timeAllowed * 1000) {
            logger.warn(`tournament_answer: Answer too late (client time, ${timeAllowed}s allowed) for state ${stateKey}. Ignoring.`);
            // Send rejection response back to client
            socket.emit("tournament_answer_result", {
                correct: false,
                rejected: true,
                reason: "late",
                message: "Trop tard !"
            });
            return;
        }
    } else {
        logger.info(`tournament_answer: Accepting answer during pause for state ${stateKey}.`);
    }

    // Store the answer (overwrite previous answer for the same question if any)
    // Defensive: check state.answers and state.answers[joueurId] before accessing
    const alreadyAnswered = !!(state.answers && state.answers[joueurId] && state.answers[joueurId][questionUid]);
    if (!state.answers) state.answers = {};
    if (!state.answers[joueurId]) state.answers[joueurId] = {};
    state.answers[joueurId][questionUid] = { answerIdx, clientTimestamp };
    logger.debug(`Stored answer for joueur ${joueurId} on question ${questionUid} in state ${stateKey}`);

    // --- SCORE IMMEDIATELY IF NOT ALREADY SCORED ---
    if (!alreadyAnswered) {
        const { calculateScore } = require('../tournamentUtils/tournamentHelpers');
        const { baseScore, rapidity, totalScore } = calculateScore(question, { answerIdx, clientTimestamp }, questionStart);
        if (!state.participants[joueurId].scoredQuestions) state.participants[joueurId].scoredQuestions = {};
        if (!state.participants[joueurId].scoredQuestions[questionUid]) {
            state.participants[joueurId].score += totalScore;
            state.participants[joueurId].scoredQuestions[questionUid] = true;
            logger.info(`Scored immediately for joueur ${joueurId} on question ${questionUid}: +${totalScore} (base=${baseScore}, rapidity=${rapidity})`);
        }
    }

    // Always send feedback to the client for accepted answers (quiz or tournament mode)
    socket.emit("tournament_answer_result", {
        message: "Réponse enregistrée",
        received: true
    });
    logger.debug(`Sent receipt confirmation to joueur ${joueurId} for answer on question ${questionUid}`);
    // Note: For regular tournaments (live or differed without quiz link), scoring happens when the timer ends or next question starts.
}

module.exports = handleTournamentAnswer;
