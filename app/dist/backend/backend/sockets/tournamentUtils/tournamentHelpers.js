"use strict";
/**
 * tournamentHelpers.ts - Utility functions for tournament operations
 *
 * This module provides helper functions for tournament operations like:
 * - Managing tournament state
 * - Sending questions to participants
 * - Handling timer expiration
 * - Computing statistics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmitTarget = getEmitTarget;
exports.handleTimerExpiration = handleTimerExpiration;
exports.sendQuestionWithState = sendQuestionWithState;
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('TournamentHelpers');
const tournamentState_1 = require("./tournamentState");
const scoreUtils_1 = require("./scoreUtils");
const sendTournamentQuestion_1 = require("./sendTournamentQuestion");
const db_1 = __importDefault(require("../../db"));
/**
 * Gets the target to emit events to - handles live/differed mode
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param targetRoom - Optional specific room to target
 * @param isDiffered - Whether the tournament is in differed mode
 * @returns The Socket.IO broadcast target
 */
function getEmitTarget(io, code, targetRoom = null, isDiffered = false) {
    return targetRoom ? io.to(targetRoom) : io.to(isDiffered ? `differed_${code}` : `live_${code}`);
}
/**
 * Centralized timer expiration logic
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param targetRoom - Optional specific room to target
 */
async function handleTimerExpiration(io, code, targetRoom = null) {
    var _a, _b, _c;
    logger.info(`[handleTimerExpiration] ENTERED for code=${code}`);
    logger.info(`[handleTimerExpiration] START for code=${code} at ${new Date().toISOString()}`);
    const state = tournamentState_1.tournamentState[code];
    if (!state || state.paused || state.stopped) {
        logger.debug(`[handleTimerExpiration] Early return for code=${code}. paused=${state === null || state === void 0 ? void 0 : state.paused}, stopped=${state === null || state === void 0 ? void 0 : state.stopped}`);
        return; // Ignore if paused, stopped, or state doesn't exist
    }
    const question = state.questions.find((q) => q.uid === state.currentQuestionUid);
    if (!question) {
        logger.error(`[handleTimerExpiration] Question UID ${state.currentQuestionUid} not found in tournament state.`);
        return;
    }
    logger.info(`Timer expired for question ${state.currentQuestionUid} (uid: ${question === null || question === void 0 ? void 0 : question.uid}) in tournament ${code}`);
    // --- SCORING ---
    // Set default score for participants who didn't answer
    for (const participant of state.participants || []) {
        if (!participant.answers) {
            participant.answers = [];
        }
        // Check if the participant has already answered this question
        const existingAnswer = participant.answers.find((a) => a.questionUid === state.currentQuestionUid);
        if (!existingAnswer) {
            // Create a default "no answer" submission
            const defaultAnswer = {
                questionUid: state.currentQuestionUid,
                value: null,
                timeMs: 0,
                timestamp: Date.now(),
                isCorrect: false,
                score: 0,
                baseScore: 0,
                timePenalty: 0
            };
            participant.answers.push(defaultAnswer);
            logger.debug(`[handleTimerExpiration] Added default "no answer" for participant ${participant.id}`);
        }
        // Recalculate total score across all answers
        let totalScore = 0;
        if (participant.answers && participant.answers.length > 0) {
            totalScore = participant.answers.reduce((sum, ans) => sum + (ans.score || 0), 0);
        }
        participant.score = totalScore;
        // Save score to database for persistent tournaments
        if (state.tournoiId && participant.id) {
            (0, scoreUtils_1.saveParticipantScore)(db_1.default, state.tournoiId, participant) // Added prisma
                .catch((err) => logger.error(`[handleTimerExpiration] Error saving score: ${err.message}`));
        }
    }
    // --- STOPPING CONDITION ---
    // Check if we've reached the end of the questions
    if (((_a = state.settings) === null || _a === void 0 ? void 0 : _a.autoProgress) && state.askedQuestions.size >= state.questions.length) {
        logger.info(`[handleTimerExpiration] Tournament ${code} has shown all questions. autoProgress=${(_b = state.settings) === null || _b === void 0 ? void 0 : _b.autoProgress}, asked=${state.askedQuestions.size}, total=${state.questions.length}`);
        // In auto-progress mode, stop the tournament when all questions have been shown
        state.stopped = true;
        // Emit a special event to mark the end of the tournament
        io.to(`live_${code}`).emit('tournament_finished', {
            message: 'Le tournoi est terminé !'
        });
        logger.info(`[handleTimerExpiration] Marked tournament ${code} as stopped and emitted tournament_finished event`);
        // For linked quiz mode, we would not progress automatically but would wait for teacher actions
        if (state.linkedQuizId) {
            logger.info(`[handleTimerExpiration] Tournament ${code} is linked to quiz ${state.linkedQuizId}, not sending any more questions automatically`);
        }
        return;
    }
    // --- AUTO PROGRESSION ---
    // Find the next question index
    if (!((_c = state.settings) === null || _c === void 0 ? void 0 : _c.autoProgress)) {
        logger.info(`[handleTimerExpiration] Tournament ${code} is not set to auto-progress. Waiting for manual advancement.`);
        return;
    }
    if (state.linkedQuizId) {
        logger.info(`[handleTimerExpiration] Tournament ${code} is linked to quiz ${state.linkedQuizId}, not advancing automatically`);
        return;
    }
    // Auto-progress logic (non-linked tournaments only)
    let nextIndex = -1;
    const currentIndex = state.questions.findIndex((q) => q.uid === state.currentQuestionUid);
    if (currentIndex !== -1) {
        // Simple progression: move to the next question in the array
        nextIndex = currentIndex + 1;
    }
    // Check if we have a valid next question
    if (nextIndex >= 0 && nextIndex < state.questions.length) {
        logger.info(`[handleTimerExpiration] Auto-advancing to next question (index ${nextIndex}) for tournament ${code}`);
        const nextQuestion = state.questions[nextIndex];
        const nextQuestionUid = nextQuestion.uid;
        // Record that we've asked this question
        state.askedQuestions.add(nextQuestionUid);
        logger.info(`[handleTimerExpiration] Added question UID ${nextQuestionUid} to askedQuestions for tournament ${code}`);
        logger.debug(`[handleTimerExpiration] Current asked questions: ${Array.from(state.askedQuestions).join(', ')}`);
        // Send the next question
        try {
            sendQuestionWithState(io, code, nextIndex, nextQuestionUid);
        }
        catch (error) {
            logger.error(`[handleTimerExpiration] Error in sendQuestionWithState: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    else {
        // No more questions left - we should have caught this above, but just in case
        logger.info(`[handleTimerExpiration] No more questions to show for tournament ${code}. Stopping...`);
        state.stopped = true;
        io.to(`live_${code}`).emit('tournament_finished', {
            message: 'Le tournoi est terminé !'
        });
    }
    logger.info(`[handleTimerExpiration] END for code=${code} at ${new Date().toISOString()}`);
}
/**
 * Sends a question to tournament participants with the current state
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param questionIndex - Index of the question to send
 * @param questionUid - UID of the question to send
 * @param targetRoom - Optional specific room to target
 * @param isDiffered - Whether the tournament is in differed mode
 */
function sendQuestionWithState(io, code, questionIndex, questionUid = undefined, targetRoom = null, isDiffered = false) {
    var _a, _b, _c;
    const state = tournamentState_1.tournamentState[code];
    if (!state || !state.questions || state.questions.length === 0) {
        logger.error(`[sendQuestionWithState] Invalid state for code ${code}`);
        return;
    }
    // If questionIndex is out of bounds, warn but continue with clamped value
    if (questionIndex < 0 || questionIndex >= state.questions.length) {
        logger.warn(`[sendQuestionWithState] Question index ${questionIndex} out of bounds for tournament ${code}. Clamping to valid range.`);
        questionIndex = Math.max(0, Math.min(questionIndex, state.questions.length - 1));
    }
    // Update the current question in the tournament state
    const question = questionUid
        ? state.questions.find((q) => q.uid === questionUid)
        : state.questions[questionIndex];
    if (!question) {
        logger.error(`[sendQuestionWithState] Could not find question at index ${questionIndex} or UID ${questionUid} for tournament ${code}`);
        return;
    }
    const questionId = question.uid;
    state.currentQuestionUid = questionId;
    state.currentQuestionIndex = questionIndex;
    const timer = ((_a = state.settings) === null || _a === void 0 ? void 0 : _a.timer) || 60;
    logger.info(`[sendQuestionWithState] Sending question ${questionId} to tournament ${code} with timer=${timer}s`);
    // Initialize or update the question timer with the full time
    if (!state.questionTimers) {
        state.questionTimers = {};
    }
    state.questionTimers[questionId] = {
        timeLeft: timer,
        initialTime: timer,
        lastUpdateTime: Date.now(),
        status: (state.paused || state.stopped) ? 'pause' : 'play'
    };
    // Get the target for emitting events (either specific room or based on mode)
    const target = getEmitTarget(io, code, targetRoom, isDiffered);
    // Send the question data to clients
    try {
        (0, sendTournamentQuestion_1.sendTournamentQuestion)(target, {
            code,
            question,
            timer,
            tournoiState: state.paused ? 'paused' : state.stopped ? 'stopped' : 'running',
            questionIndex,
            questionId
        });
    }
    catch (err) {
        logger.error(`[sendQuestionWithState] Error sending question: ${err instanceof Error ? err.message : String(err)}`);
    }
    logger.info(`[sendQuestionWithState] Successfully sent question ${questionId} to tournament ${code}`);
    // For logging and debugging
    const participantsCount = ((_b = state.participants) === null || _b === void 0 ? void 0 : _b.length) || 0;
    const answeredCount = ((_c = state.participants) === null || _c === void 0 ? void 0 : _c.filter((p) => { var _a; return (_a = p.answers) === null || _a === void 0 ? void 0 : _a.some((a) => a.questionUid === questionId); }).length) || 0;
    logger.debug(`[sendQuestionWithState] Tournament ${code} has ${participantsCount} participants, ${answeredCount} have answered question ${questionId}`);
}
