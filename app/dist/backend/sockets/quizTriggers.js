"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuestionToTournament = sendQuestionToTournament;
exports.triggerQuizTimerAction = triggerQuizTimerAction;
exports.triggerQuizSetTimer = triggerQuizSetTimer;
const quizUtils_1 = require("@sockets/quizUtils"); // Assuming quizUtils.ts provides these
const quizState_1 = require("@sockets/quizState"); // Assuming quizState.ts or its bridge provides these
// const tournamentHandler = require('@sockets/tournamentHandler.js'); // Changed from import to require
// const { tournamentState } = tournamentHandler; // Destructure tournamentState
// Try importing the JS file directly and see if TS can infer types or if we need to cast
const Thandler = __importStar(require("@sockets/tournamentHandler.js"));
const tournamentHandler = Thandler; // Use an alias and cast to any for now.
const _logger_1 = __importDefault(require("@logger")); // Changed to import and alias
const sendTournamentQuestion_1 = require("@sockets/tournamentUtils/sendTournamentQuestion"); // Bridge to sendTournamentQuestion.ts
const { triggerTournamentQuestion } = require('@sockets/tournamentUtils/tournamentTriggers'); // Bridge to tournamentTriggers.ts
const logger = (0, _logger_1.default)('QuizTriggers');
// In-memory object to track countdown timeouts per quiz/question
const quizTimerCountdowns = {};
function clearQuizCountdown(quizId, questionId) {
    if (quizTimerCountdowns[quizId] && quizTimerCountdowns[quizId][questionId]) {
        clearTimeout(quizTimerCountdowns[quizId][questionId]);
        quizTimerCountdowns[quizId][questionId] = null;
    }
}
/**
 * Sends the current question to the tournament room if the quiz is linked to a tournament.
 */
function sendQuestionToTournament(io, quizId, questionId) {
    if (!quizState_1.quizState[quizId]) {
        logger.warn('[sendQuestionToTournament] Quiz state not found for ' + quizId);
        return;
    }
    let code = quizState_1.quizState[quizId].tournament_code;
    if (!code) {
        // MODIFIED: Access tournamentState via tournamentHandler
        const linkedTournamentCode = Object.keys(tournamentHandler.tournamentState).find(c => tournamentHandler.tournamentState[c] && tournamentHandler.tournamentState[c].linkedQuizId === quizId);
        if (!linkedTournamentCode) {
            logger.debug('[sendQuestionToTournament] No linked tournament found for quiz ' + quizId);
            return;
        }
        code = linkedTournamentCode;
    }
    // MODIFIED: Access tournamentState via tournamentHandler
    if (!tournamentHandler.tournamentState[code]) {
        logger.warn('[sendQuestionToTournament] Tournament state not found for code ' + code);
        return;
    }
    // MODIFIED: Access tournamentState via tournamentHandler
    if (!tournamentHandler.tournamentState[code].questions || !Array.isArray(tournamentHandler.tournamentState[code].questions)) {
        logger.warn('[sendQuestionToTournament] Tournament ' + code + ' questions array not initialized');
        return;
    }
    const question = tournamentHandler.tournamentState[code].questions.find((q) => q.uid === questionId);
    if (!question) {
        logger.warn('[sendQuestionToTournament] Question ' + questionId + ' not found in tournament ' + code);
        return;
    }
    tournamentHandler.tournamentState[code].currentQuestionUid = questionId;
    const index = tournamentHandler.tournamentState[code].questions.findIndex((q) => q.uid === questionId);
    const total = tournamentHandler.tournamentState[code].questions.length;
    logger.info('[sendQuestionToTournament] Sending question ' + questionId + ' to live_' + code + '. Index: ' + index + ', Total: ' + total);
    try {
        const timer = (0, quizState_1.getQuestionTimer)(quizId, questionId);
        const timeLeft = timer ? timer.timeLeft : (question.temps || 20);
        const questionStateStatus = timer ? (timer.status === 'play' ? 'active' : timer.status) : 'stopped';
        // Use triggerTournamentQuestion from tournamentUtils to ensure proper state update
        triggerTournamentQuestion(io, code, index, quizId, timeLeft, questionId); // Pass index, it might be used or ignored if questionId is primary
        // Then also directly send to ensure immediate update
        const targetEmitter = io.to(`live_${code}`);
        const tournoiStateFromQuiz = questionStateStatus === 'active' ? 'running' : questionStateStatus;
        const payload = {
            code,
            question,
            timer: timeLeft,
            tournoiState: tournoiStateFromQuiz,
            questionIndex: index,
            questionId
        };
        (0, sendTournamentQuestion_1.sendTournamentQuestion)(targetEmitter, payload);
        logger.info('[sendQuestionToTournament] Successfully sent question ' + questionId + ' to live_' + code);
    }
    catch (err) {
        logger.error('[sendQuestionToTournament] Error sending question: ' + (err.message || err));
    }
}
/**
 * Triggers the timer action for a quiz question (play, pause, stop).
 */
function triggerQuizTimerAction(io, quizId, questionId, action, timeLeft) {
    logger.info('[triggerQuizTimerAction] Called with: quizId = ' + quizId + ', questionId = ' + questionId + ', action = ' + action + ', timeLeft = ' + timeLeft);
    logger.debug('[triggerQuizTimerAction] Debug: Initial state of quizTimerCountdowns: ' + Object.keys(quizTimerCountdowns).length + ' quiz(zes), ' + (quizTimerCountdowns[quizId] ? Object.keys(quizTimerCountdowns[quizId]).length : 0) + ' timers for this quiz');
    (0, quizUtils_1.updateQuestionTimer)(quizId, questionId, action, timeLeft);
    if (!quizTimerCountdowns[quizId]) {
        logger.debug('[triggerQuizTimerAction] Debug: Initializing quizTimerCountdowns for quizId = ' + quizId);
        quizTimerCountdowns[quizId] = {};
    }
    logger.info('[triggerQuizTimerAction] Clearing existing countdown for quizId = ' + quizId + ', questionId = ' + questionId);
    clearQuizCountdown(quizId, questionId);
    const timer = (0, quizState_1.getQuestionTimer)(quizId, questionId);
    if (!timer) {
        logger.error('[triggerQuizTimerAction] Timer not found for quizId = ' + quizId + ', questionId = ' + questionId + '. Cannot proceed with action ' + action + '.');
        return;
    }
    logger.info('[triggerQuizTimerAction] After update: quizId = ' + quizId + ', questionId = ' + questionId + ', action = ' + action + ', status = ' + timer.status + ', timeLeft = ' + timer.timeLeft + ', timestamp = ' + timer.timestamp);
    logger.debug('[triggerQuizTimerAction] Debug: Timer object immediately after fetching: ' + JSON.stringify(timer));
    logger.debug('[triggerQuizTimerAction] Debug: Condition check: action = ' + action + ', timer.timeLeft = ' + timer.timeLeft + ', timer.status = ' + timer.status);
    if (action === 'play' && timer.timeLeft && timer.timeLeft > 0 && timer.status === 'play') {
        const msLeft = Math.max(0, Math.round(timer.timeLeft * 1000));
        logger.info('[triggerQuizTimerAction] Starting countdown for quizId = ' + quizId + ', questionId = ' + questionId + ', msLeft = ' + msLeft);
        logger.debug('[triggerQuizTimerAction] Debug: Setting timeout for quizId = ' + quizId + ', questionId = ' + questionId + ', msLeft = ' + msLeft);
        quizTimerCountdowns[quizId][questionId] = setTimeout(() => {
            logger.info('[triggerQuizTimerAction] Countdown expired for quizId = ' + quizId + ', questionId = ' + questionId);
            (0, quizUtils_1.updateQuestionTimer)(quizId, questionId, 'stop', 0);
            (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'stop', questionId, 0);
            if (quizState_1.quizState[quizId]) {
                // Ensure 'id' or 'quizId' is part of the state for patchQuizStateForBroadcast if needed
                // quizState[quizId].id = quizId; 
                io.to(`dashboard_${quizId}`).emit('quiz_state', (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
            }
        }, msLeft);
        logger.debug('[triggerQuizTimerAction] Debug: Timeout set for quizId = ' + quizId + ', questionId = ' + questionId);
    }
    else {
        if (action === 'play') {
            logger.info('[triggerQuizTimerAction] Not starting countdown: action = play, but timer.status = ' + timer.status + ', timeLeft = ' + timer.timeLeft);
        }
    }
    const activeTimers = quizTimerCountdowns[quizId] ? Object.keys(quizTimerCountdowns[quizId]).filter(qId => quizTimerCountdowns[quizId][qId] !== null) : [];
    logger.debug('[triggerQuizTimerAction] Debug: Final state of quizTimerCountdowns: ' + activeTimers.length + ' active timers. Active question IDs: [' + activeTimers.join(', ') + ']');
    (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, action, questionId, timer.timeLeft);
    if (quizState_1.quizState[quizId]) {
        io.to(`dashboard_${quizId}`).emit('quiz_state', (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
    }
}
/**
 * Sets the timer value for a quiz question (edit duration).
 */
function triggerQuizSetTimer(io, quizId, questionId, timeLeft) {
    const timer = (0, quizState_1.getQuestionTimer)(quizId, questionId);
    if (timer) {
        timer.timeLeft = timeLeft;
        timer.initialTime = timeLeft; // Also update initialTime if this means resetting the timer's origin
        (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, timer.status, questionId, timeLeft);
        if (quizState_1.quizState[quizId]) {
            io.to(`dashboard_${quizId}`).emit('quiz_state', (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
        }
    }
    else {
        logger.warn('[triggerQuizSetTimer] Timer not found for quizId = ' + quizId + ', questionId = ' + questionId);
    }
}
