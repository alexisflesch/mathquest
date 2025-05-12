"use strict";
/**
 * sharedTournamentUtils.ts - Shared logic for tournament operations
 *
 * This module contains shared functions used by multiple tournament modules.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTournamentQuestion = sendTournamentQuestion;
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('SharedTournamentUtils');
/**
 * Sends a filtered tournament question to students using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator (e.g., io.to(room))
 * @param payload - Question payload with tournament data
 */
function sendTournamentQuestion(targetEmitter, payload) {
    var _a;
    const { code, questionId } = payload;
    // Create filtered payload without sensitive data
    const filteredPayload = {
        type: payload.question.type,
        uid: payload.question.uid,
        question: (_a = payload.question.question) !== null && _a !== void 0 ? _a : '',
        answers: Array.isArray(payload.question.reponses)
            ? payload.question.reponses.map(r => r.texte)
            : [],
        index: payload.questionIndex,
        tournoiState: payload.tournoiState,
        timer: payload.timer,
    };
    // Log what we're sending
    logger.info(`[sendTournamentQuestion] Emitting tournament_question to tournament ${code} with question ${questionId}`);
    // Emit to the already targeted emitter
    targetEmitter.emit('tournament_question', filteredPayload);
}
