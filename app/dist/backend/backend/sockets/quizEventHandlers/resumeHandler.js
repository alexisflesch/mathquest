"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("@sockets/quizState");
const tournamentState_1 = require("@sockets/tournamentUtils/tournamentState");
const quizUtils_1 = require("@sockets/quizUtils");
const tournamentTriggers_1 = require("@sockets/tournamentUtils/tournamentTriggers");
const _logger_1 = __importDefault(require("@logger"));
const logger = (0, _logger_1.default)('ResumeQuizHandler');
function handleResume(io, socket, prisma, { quizId, teacherId, tournamentCode }) {
    if (!quizState_1.quizState[quizId] || quizState_1.quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[ResumeQuiz] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }
    // Update profSocketId to current socket
    quizState_1.quizState[quizId].profSocketId = socket.id;
    logger.info(`[ResumeQuiz] Resuming quiz ${quizId}`);
    // Get the tournament code if not provided
    const code = tournamentCode || Object.keys(tournamentState_1.tournamentState).find(c => tournamentState_1.tournamentState[c] && tournamentState_1.tournamentState[c].linkedQuizId === quizId);
    // Get the correct timeLeft from the backend state as the single source of truth
    let timeLeft = null;
    if (code && tournamentState_1.tournamentState[code] && tournamentState_1.tournamentState[code].pausedRemainingTime !== undefined && tournamentState_1.tournamentState[code].pausedRemainingTime > 0) {
        // Use tournament's stored pausedRemainingTime as the source of truth
        timeLeft = tournamentState_1.tournamentState[code].pausedRemainingTime;
        logger.info(`[ResumeQuiz] Using tournament pausedRemainingTime=${timeLeft}s as source of truth`);
        // Update quiz state with the tournament's time
        quizState_1.quizState[quizId].chrono.timeLeft = timeLeft || null;
        quizState_1.quizState[quizId].timerTimeLeft = timeLeft;
    }
    else {
        // Fallback to quiz state if no tournament
        timeLeft = quizState_1.quizState[quizId].chrono.timeLeft || 0;
        logger.info(`[ResumeQuiz] No tournament or pausedRemainingTime, using quizState timeLeft=${timeLeft}s`);
    }
    logger.info(`[ResumeQuiz] Resuming with timeLeft=${timeLeft}s from paused state`);
    // Add logging for any assignment to currentQuestionUid
    Object.defineProperty(quizState_1.quizState[quizId], 'currentQuestionUid', {
        set(value) {
            logger.debug(`[ResumeHandler] Set currentQuestionUid = ${value} for quizId=${quizId} (stack: ${new Error().stack})`);
            this._currentQuestionUid = value;
        },
        get() {
            return this._currentQuestionUid;
        },
        configurable: true
    });
    // Update quiz state flags
    const updatedQuizState = (0, quizUtils_1.updateChrono)(quizState_1.quizState[quizId], timeLeft, 'play');
    if (updatedQuizState) {
        quizState_1.quizState[quizId] = updatedQuizState;
        quizState_1.quizState[quizId].timerStatus = 'play';
        quizState_1.quizState[quizId].timerTimestamp = Date.now(); // Reset timestamp for the new run period
        quizState_1.quizState[quizId].timerInitialValue = timeLeft; // Store for calculation reference
    }
    else {
        logger.warn(`[ResumeQuiz] Failed to update chrono for quiz ${quizId}`);
    }
    // First emit the quiz_state (with updated values) to clients
    io.to(`dashboard_${quizId}`).emit("quiz_state", (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState_1.quizState[quizId]);
    // Then emit the timer update separately for precise timing
    const currentQuestionUid = quizState_1.quizState[quizId].timerQuestionId || quizState_1.quizState[quizId].currentQuestionUid;
    // Ensure timeLeft and currentQuestionUid are not null/undefined
    const safeTimeLeft = typeof timeLeft === 'number' ? timeLeft : 0;
    // Ensure currentQuestionUid is not null
    if (currentQuestionUid) {
        (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'play', currentQuestionUid, safeTimeLeft);
    }
    else {
        logger.warn(`[ResumeQuiz] Missing currentQuestionUid for quiz ${quizId}`);
        (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'play', '', safeTimeLeft);
    }
    logger.debug(`[ResumeQuiz] Emitted quiz_state and timer update for ${quizId}`);
    // Emit success message after resuming the quiz
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz resumed successfully.'
    });
    // If we have a tournament, handle its timer separately
    if (code) {
        logger.info(`[ResumeQuiz] Triggering timer set (resume) for linked tournament ${code} with timeLeft=${timeLeft}s`);
        // Ensure timeLeft is not undefined before passing it
        const safeTimeLeft = typeof timeLeft === 'number' ? timeLeft : 0;
        (0, tournamentTriggers_1.triggerTournamentTimerSet)(io, code, safeTimeLeft, 'running'); // MODIFIED
    }
    else {
        logger.warn(`[ResumeQuiz] No linked tournament found for quiz ${quizId}`);
    }
    // Mark this quiz as explicitly handled by resumeHandler to avoid duplicate processing
    quizState_1.quizState[quizId].resumeHandled = Date.now();
}
exports.default = handleResume;
