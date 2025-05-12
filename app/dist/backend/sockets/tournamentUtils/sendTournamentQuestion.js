"use strict";
/**
 * sendTournamentQuestion.ts - Centralized helper to emit filtered tournament questions to students
 *
 * This function ensures only the minimal, non-sensitive fields are sent to students:
 * - type: question type (e.g., 'choix_simple', 'choix_multiple')
 * - uid: question unique id
 * - question: question text
 * - answers: array of answer texts (no 'correct' field)
 *
 * Usage:
 *   import { sendTournamentQuestion } from './tournamentUtils/sendTournamentQuestion';
 *   sendTournamentQuestion(targetEmitter, payload); // targetEmitter is io.to(room) or socket.to(room)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTournamentQuestion = localSendTournamentQuestion;
exports.legacySendTournamentQuestion = legacySendTournamentQuestion;
exports.createFilteredQuestionData = createFilteredQuestionData;
const logger_1 = __importDefault(require("../../logger")); // Changed to ES6 import
const logger = (0, logger_1.default)('SendTournamentQuestion');
/**
 * Creates filtered question data for sending to students. (Internal helper)
 *
 * @param payload - Question payload with tournament data
 * @returns Filtered question data
 */
function createFilteredQuestionData(payload) {
    var _a;
    const { question, timer, tournoiState, questionIndex } = payload;
    return {
        type: question.type,
        uid: question.uid,
        question: (_a = question.question) !== null && _a !== void 0 ? _a : '', // Handle potentially undefined question text
        answers: Array.isArray(question.reponses)
            ? question.reponses.map(r => r.texte)
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
    var _a;
    const filteredPayload = {
        type: questionObj.type,
        uid: questionObj.uid,
        question: (_a = questionObj.question) !== null && _a !== void 0 ? _a : '', // Handle potentially undefined question text
        answers: Array.isArray(questionObj.reponses)
            ? questionObj.reponses.map(r => r.texte)
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
