"use strict";
/**
 * sendTournamentQuestion.ts - Centralized helper to emit filtered tournament questions to students
 *
 * THIS FILE IS NOW DEPRECATED.
 * The shared logic has been moved to /sharedLiveLogic/sendQuestion.ts
 * This file is kept temporarily for reference during transition and will be removed.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTournamentQuestion = localSendTournamentQuestion;
exports.legacySendTournamentQuestion = legacySendTournamentQuestion;
exports.createFilteredQuestionData = createFilteredQuestionData;
const logger_1 = __importDefault(require("../../logger")); // Changed to ES6 import
// import { sendTournamentQuestion } from './sharedTournamentUtils'; // Old import, no longer needed
const logger = (0, logger_1.default)('SendTournamentQuestion_DEPRECATED');
logger.warn("DEPRECATION WARNING: sendTournamentQuestion.ts is deprecated and will be removed. Use sharedLiveLogic/sendQuestion.ts instead.");
/**
 * Creates filtered question data for sending to students. (Internal helper)
 *
 * @param payload - Question payload with tournament data
 * @returns Filtered question data
 */
function createFilteredQuestionData(payload) {
    const { question, timer, tournoiState, questionIndex } = payload;
    return {
        type: question.type, // No change needed here as FilteredQuestionData now allows undefined
        uid: question.uid,
        question: question.text, // Changed from question.question
        answers: Array.isArray(question.answers)
            ? question.answers.map(r => r.text)
            : [],
        index: questionIndex,
        tournoiState,
        timer
    };
}
/**
 * Sends a filtered tournament question to students using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator (e.g., io.to(room))
 * @param payload - Question payload with tournament data
 */
// Rename the local function to avoid conflict
function localSendTournamentQuestion(targetEmitter, // Provide the required type arguments
payload) {
    targetEmitter.emit('tournament_question', payload);
}
/**
 * Legacy format support for backwards compatibility during migration.
 * Sends a filtered tournament question using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator
 * @param questionObj - The question object
 * @param index - Question index
 * @param total - Total questions
 * @param remainingTime - Remaining time for the question
 * @param questionState - Current state of the question
 * @param isQuizMode - Flag if in quiz mode
 */
function legacySendTournamentQuestion(targetEmitter, // Changed type to BroadcastOperator
questionObj, index, total, remainingTime, questionState, isQuizMode) {
    const filteredPayload = {
        type: questionObj.type, // No change needed here
        uid: questionObj.uid,
        question: questionObj.text, // Changed from questionObj.question
        answers: Array.isArray(questionObj.answers)
            ? questionObj.answers.map(r => r.text)
            : [],
        index,
        total,
        remainingTime,
        questionState,
        isQuizMode
    };
    logger.info(`[legacySendTournamentQuestion] Emitting tournament_question (room derived by caller)`);
    targetEmitter.emit('tournament_question', filteredPayload);
}
// Export default for default imports
exports.default = localSendTournamentQuestion;
// Direct CommonJS export - simpler and more reliable pattern
if (typeof module !== 'undefined' && module.exports) {
    // Directly assign to module.exports rather than using a separate object
    module.exports = {
        sendTournamentQuestion: localSendTournamentQuestion,
        legacySendTournamentQuestion,
        createFilteredQuestionData,
        default: localSendTournamentQuestion // Keep default as the main function
    };
}
