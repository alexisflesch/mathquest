"use strict";
/**
 * emitQuestionResults.ts - Shared logic for emitting question results.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitQuestionResults = emitQuestionResults;
const logger_1 = __importDefault(require("../../logger")); // Adjust path as necessary
// import { Question } from '../types/quizTypes'; // Or a shared Question type if available
const logger = (0, logger_1.default)('EmitQuestionResults');
/**
 * Emits the results of a question to the specified room.
 *
 * @param io - The Socket.IO server instance.
 * @param roomName - The name of the room (quiz or tournament room)
 * @param params - Object containing question results parameters
 */
function emitQuestionResults(io, roomName, params) {
    const { questionUid, correctAnswers, leaderboard, participantAnswers } = params;
    if (!questionUid) {
        logger.error('[emitQuestionResults] Attempted to emit results with no questionUid.');
        return;
    }
    if (!roomName) {
        logger.error(`[emitQuestionResults] Attempted to emit results for Q_UID ${questionUid} with no roomName.`);
        return;
    }
    logger.info(`[emitQuestionResults] Emitting 'question_results' to room '${roomName}' for Q_UID ${questionUid}`);
    // Send the complete payload with all provided parameters
    io.to(roomName).emit('question_results', Object.assign(Object.assign({ questionUid,
        correctAnswers }, (leaderboard && { leaderboard })), (participantAnswers && { participantAnswers })));
}
