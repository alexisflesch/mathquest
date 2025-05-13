"use strict";
/**
 * emitParticipantScoreUpdate.ts - Shared logic for emitting a participant's updated score and rank.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitParticipantScoreUpdate = emitParticipantScoreUpdate;
const logger_1 = __importDefault(require("../../logger")); // Adjust path as necessary
const logger = (0, logger_1.default)('EmitParticipantScoreUpdate');
/**
 * Emits an update of the participant's total score and current rank directly to their socket.
 *
 * @param socket - The participant's Socket.IO socket instance.
 * @param data - The payload containing the new total score and current rank.
 */
function emitParticipantScoreUpdate(socket, data) {
    if (!socket) {
        logger.warn('[emitParticipantScoreUpdate] Socket is undefined. Cannot emit score update.');
        return;
    }
    logger.info(`[emitParticipantScoreUpdate] Emitting 'participant_score_update' to socket ${socket.id}. Data: ${JSON.stringify(data)}`);
    socket.emit('participant_score_update', data);
}
