"use strict";
/**
 * sendQuestion.ts - Centralized helper to emit filtered questions to clients (students, projector)
 *
 * This function ensures only the minimal, non-sensitive fields are sent.
 * It standardizes the question payload for both quiz and tournament modes.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuestion = sendQuestion;
// Import shared types to ensure consistency between frontend and backend
const liveQuestion_1 = require("../../../shared/types/quiz/liveQuestion");
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('SendQuestionShared');
/**
 * Sends a filtered question to the specified room using a pre-configured emitter.
 *
 * @param io - Socket.IO Server instance
 * @param roomName - The name of the room to emit to (e.g., `live_${code}`, `projection_${quizId}`)
 * @param questionObject - The full question object
 * @param timer - Optional timer duration for this question
 * @param questionIndex - Optional index of the current question
 * @param totalQuestions - Optional total number of questions
 * @param modeSpecificData - Optional additional data specific to the mode (quiz/tournament)
 * @param questionState - Optional state of the question (active, paused, etc.)
 */
function sendQuestion(io, roomName, questionObject, timer, questionIndex, totalQuestions, modeSpecificData, questionState) {
    if (!questionObject) {
        logger.error(`[sendQuestion] Attempted to send a null/undefined question to room ${roomName}. Aborting.`);
        return;
    }
    try {
        const filteredQuestion = (0, liveQuestion_1.filterQuestionForClient)(questionObject);
        const payload = {
            question: filteredQuestion,
            timer,
            questionIndex,
            totalQuestions,
            questionState,
            modeSpecificData,
        };
        io.to(roomName).emit('live_question', payload);
        logger.info(`[sendQuestion] Emitted 'live_question' to room ${roomName} for question UID ${questionObject.uid}`);
        logger.debug(`[sendQuestion] Payload for ${roomName}:`, payload);
    }
    catch (error) {
        logger.error(`[sendQuestion] Error sending question to ${roomName}:`, error);
    }
}
// Example of how it might be used (for illustration, not part of this file's direct execution):
/*
function exampleUsage(io: Server, code: string, question: Question, state: any) {
    // For students in a tournament
    sendQuestion(
        io,
        `live_${code}`,
        question,
        state.currentTimerValue,
        state.currentQuestionIndex,
        state.questions.length,
        { tournoiState: state.paused ? 'paused' : 'running' }
    );

    // For a projector in a quiz
    if (state.linkedQuizId) {
        sendQuestion(
            io,
            `projection_${state.linkedQuizId}`,
            question,
            state.quizTimerValue,
            state.quizQuestionIndex,
            state.quizTotalQuestions
        );
    }
}
*/
