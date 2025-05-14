"use strict";
/**
 * answerHandler.ts - Tournament Answer Handler
 *
 * This module handles the tournament_answer event, which is emitted when a participant
 * submits an answer to a tournament question.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tournamentState_1 = require("../tournamentUtils/tournamentState");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('AnswerTournamentHandler');
/**
 * Handle tournament_answer event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The answer payload from the client
 */
function handleTournamentAnswer(io, socket, { code, questionUid, answerIdx, clientTimestamp, isDeferred }) {
    var _a, _b;
    logger.info(`tournament_answer received for Q_UID: ${questionUid} from socket ${socket.id}`);
    const serverReceiveTime = Date.now(); // Capture server receive time
    // Determine the correct state (live or differed)
    let joueurId = null;
    let stateKey = null;
    let state = null;
    // Check live state first
    if (tournamentState_1.tournamentState[code] &&
        tournamentState_1.tournamentState[code].socketToPlayerId &&
        tournamentState_1.tournamentState[code].socketToPlayerId[socket.id]) {
        stateKey = code;
        state = tournamentState_1.tournamentState[stateKey];
        if (state && state.socketToPlayerId) {
            joueurId = state.socketToPlayerId[socket.id];
        }
    }
    else {
        // Check differed states
        for (const key in tournamentState_1.tournamentState) {
            if (key.startsWith(`${code}_`) &&
                ((_a = tournamentState_1.tournamentState[key]) === null || _a === void 0 ? void 0 : _a.socketToPlayerId) &&
                tournamentState_1.tournamentState[key].socketToPlayerId[socket.id]) {
                stateKey = key;
                state = tournamentState_1.tournamentState[key];
                if (state && state.socketToPlayerId) {
                    joueurId = state.socketToPlayerId[socket.id];
                }
                break;
            }
        }
    }
    if (!state || !joueurId) {
        logger.warn(`tournament_answer: State or joueurId not found for socket ${socket.id} and code ${code}. Ignoring.`);
        // Emit a rejection to the client
        socket.emit("tournament_answer_result", {
            questionUid,
            rejected: true,
            reason: "state_error",
            message: "Erreur de session, impossible de traiter la réponse."
        });
        return;
    }
    // No need to check for `!state` again, it's covered above.
    const question = state.questions.find(q => q.uid === state.currentQuestionUid);
    if (!question) {
        logger.error(`[AnswerHandler] Question UID ${state.currentQuestionUid} not found in tournament state.`);
        return;
    }
    // Update all references to question properties
    const qIdx = state.questions.indexOf(question);
    if (qIdx < 0 || !state.questions || qIdx >= state.questions.length) {
        logger.warn(`tournament_answer: Invalid question index (${qIdx}) or missing questions for state ${stateKey}. Ignoring.`);
        socket.emit("tournament_answer_result", {
            questionUid,
            rejected: true,
            reason: "invalid_question_index",
            message: "Question non valide ou non trouvée."
        });
        return;
    }
    // Check if the answer is for the *current* question
    if (question.uid !== questionUid) {
        logger.warn(`tournament_answer: Answer received for wrong question (expected ${question.uid}, got ${questionUid}) for state ${stateKey}. Ignoring.`);
        socket.emit("tournament_answer_result", {
            questionUid,
            rejected: true,
            reason: "wrong_question",
            message: "Réponse à une question incorrecte."
        });
        return;
    }
    const timeAllowed = state.currentQuestionDuration || question.time || 20;
    const questionStart = state.questionStart;
    if (!questionStart) {
        logger.warn(`tournament_answer: questionStart missing for state ${stateKey}. Ignoring.`);
        socket.emit("tournament_answer_result", {
            questionUid,
            rejected: true,
            reason: "question_not_started",
            message: "La question n'a pas encore démarré."
        });
        return;
    }
    // Enhanced logging about quiz/tournament state
    const isPaused = state.paused;
    const isStopped = state.stopped;
    const isQuizMode = !!state.linkedQuizId;
    const elapsed = (serverReceiveTime - questionStart) / 1000;
    const remaining = timeAllowed - elapsed;
    logger.debug(`tournament_answer: Received answer for questionUid=${questionUid}, answerIdx=${answerIdx}, clientTimestamp=${clientTimestamp}`);
    // First check if the question is stopped - reject answers if it is
    if (state.stopped) {
        logger.warn(`tournament_answer: Answer rejected because question is stopped for state ${stateKey}`);
        socket.emit("tournament_answer_result", {
            questionUid,
            rejected: true,
            reason: "stopped",
            message: "Trop tard, la question est terminée !"
        });
        return;
    }
    // Always accept answers when the question is paused, regardless of time elapsed
    if (!state.paused) {
        // Only check timing if the question is NOT paused
        // Check timing using server receive time with grace period
        if ((serverReceiveTime - questionStart) > timeAllowed * 1000 + 500) { // Add 500ms grace period
            logger.warn(`tournament_answer: Answer too late (server time, ${timeAllowed}s allowed) for state ${stateKey}. Ignoring.`);
            // Send rejection response back to client
            socket.emit("tournament_answer_result", {
                questionUid,
                rejected: true,
                reason: "late_server",
                message: "Trop tard ! (heure serveur)"
            });
            return;
        }
        // Also check client timestamp relative to question start
        if ((clientTimestamp - questionStart) > timeAllowed * 1000) {
            logger.warn(`tournament_answer: Answer too late (client time, ${timeAllowed}s allowed) for state ${stateKey}. Ignoring.`);
            // Send rejection response back to client
            socket.emit("tournament_answer_result", {
                questionUid,
                rejected: true,
                reason: "late_client",
                message: "Trop tard ! (heure client)"
            });
            return;
        }
    }
    else {
        logger.info(`tournament_answer: Accepting answer during pause for state ${stateKey}.`);
    }
    // Store the answer (overwrite previous answer for the same question if any)
    // Defensive: check state.answers and state.answers[joueurId] before accessing
    const alreadyAnswered = !!(state.answers && state.answers[joueurId] && state.answers[joueurId][questionUid]);
    if (!state.answers) {
        logger.warn(`tournament_answer: Initializing state.answers for stateKey=${stateKey}`);
        state.answers = {};
    }
    if (!state.answers[joueurId]) {
        logger.warn(`tournament_answer: Initializing state.answers[${joueurId}] for stateKey=${stateKey}`);
        state.answers[joueurId] = {};
    }
    logger.debug(`tournament_answer: Storing answer for joueurId=${joueurId}, questionUid=${questionUid}, answerIdx=${answerIdx}, clientTimestamp=${clientTimestamp}, serverReceiveTime=${serverReceiveTime}`);
    state.answers[joueurId][questionUid] = { answerIdx, clientTimestamp, serverReceiveTime }; // Store serverReceiveTime
    logger.debug(`Stored answer for joueur ${joueurId} on question ${questionUid} in state ${stateKey}. Already answered: ${alreadyAnswered}`);
    // --- SCORE CALCULATION, LEADERBOARD, AND DB SAVE REMOVED FROM HERE ---
    // This logic will now be handled in handleTimerExpiration (tournaments) 
    // or closeQuestionHandler (quizzes linked to tournaments).
    // Send confirmation of answer registration
    socket.emit("tournament_answer_result", {
        questionUid,
        registered: true,
        message: alreadyAnswered ? "Réponse mise à jour." : "Réponse enregistrée.",
        updated: alreadyAnswered
    });
    logger.info(`tournament_answer: Answer registered for joueur ${joueurId}, question ${questionUid}, state ${stateKey}.`);
    // Ensure participant exists, primarily for logging or if needed for other non-scoring logic
    const participant = (_b = state.participants) === null || _b === void 0 ? void 0 : _b.find(p => p.id === joueurId);
    if (!joueurId || !participant) {
        logger.error(`[AnswerHandler] Invalid joueurId ${joueurId} or participant not found for tournament ${code} after answer registration.`);
        // This should ideally not happen if initial checks passed.
        return;
    }
    // If participant.scoredQuestions was used for something else other than immediate scoring,
    // that logic would need to be re-evaluated. For now, it's assumed it was only for immediate scoring.
    // if (!participant.scoredQuestions) {
    //     participant.scoredQuestions = {};
    // }
    // No longer setting participant.scoredQuestions[questionUid] here.
}
exports.default = handleTournamentAnswer;
