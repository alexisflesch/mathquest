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
exports.createFilteredQuestionData = exports.legacySendTournamentQuestion = exports.sendTournamentQuestion = void 0;
const logger_1 = __importDefault(require("../../logger")); // Changed to ES6 import
const logger = (0, logger_1.default)('SendTournamentQuestion');
/**
 * Creates filtered question data for sending to students. (Internal helper)
 *
 * @param payload - Question payload with tournament data
 * @returns Filtered question data
 */
function createFilteredQuestionData(payload) {
    const { question, timer, tournoiState, questionIndex } = payload;
    return {
        type: question.type,
        uid: question.uid,
        question: question.question ?? '', // Handle potentially undefined question text
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
function sendTournamentQuestion(targetEmitter, // Changed type to BroadcastOperator
payload) {
    const { code, questionId } = payload;
    // Create filtered payload without sensitive data
    const filteredPayload = createFilteredQuestionData(payload);
    // Log what we're sending
    logger.info(`[sendTournamentQuestion] Emitting tournament_question to tournament ${code} (room derived by caller) with question ${questionId}`);
    logger.debug(`[sendTournamentQuestion] Payload metadata: questionIndex=${filteredPayload.index}, timer=${filteredPayload.timer}, state=${filteredPayload.tournoiState}`);
    // Emit to the already targeted emitter
    targetEmitter.emit('tournament_question', filteredPayload);
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
        type: questionObj.type,
        uid: questionObj.uid,
        question: questionObj.question ?? '', // Handle potentially undefined question text
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
// Define functions without export keyword initially
// createFilteredQuestionData is already defined above
const _sendTournamentQuestion = sendTournamentQuestion;
exports.sendTournamentQuestion = _sendTournamentQuestion;
const _legacySendTournamentQuestion = legacySendTournamentQuestion;
exports.legacySendTournamentQuestion = _legacySendTournamentQuestion;
const _createFilteredQuestionData = createFilteredQuestionData;
exports.createFilteredQuestionData = _createFilteredQuestionData;
// Export object for both patterns
const moduleExports = {
    sendTournamentQuestion: _sendTournamentQuestion,
    legacySendTournamentQuestion: _legacySendTournamentQuestion,
    createFilteredQuestionData: _createFilteredQuestionData
};
// Remove default export for 'moduleExports' as it can be confusing with CommonJS
// export default moduleExports;
// Direct CommonJS export for bridge files
module.exports = moduleExports;
