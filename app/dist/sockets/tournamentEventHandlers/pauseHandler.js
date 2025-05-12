"use strict";
/**
 * pauseHandler.ts - Tournament Pause Handler
 *
 * This module handles the tournament_pause event, pausing the current tournament question.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tournamentState_1 = require("../tournamentUtils/tournamentState");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('PauseTournamentHandler');
/**
 * Handle tournament_pause event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The pause payload from the client
 */
function handleTournamentPause(io, socket, { code }) {
    const state = tournamentState_1.tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && !state.paused) {
        // Calculate remaining time based on elapsed time since question start
        const elapsed = state.questionStart ? (Date.now() - state.questionStart) / 1000 : 0;
        // Use currentQuestionDuration if available, otherwise fallback
        const currentQuestion = state.questions.find(q => q.uid === state.currentQuestionUid);
        const timeAllowed = state.currentQuestionDuration || (currentQuestion?.temps || 20);
        state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);
        // Set paused flag to true
        state.paused = true;
        // Clear the existing timer to prevent it from continuing to run in the background
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        logger.info(`Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
        io.to(`live_${code}`).emit("tournament_question_state_update", {
            questionState: "paused",
            remainingTime: state.pausedRemainingTime
        });
    }
    else {
        logger.warn(`Received tournament_pause for ${code}, but state not found, is differed, or already paused.`);
    }
}
exports.default = handleTournamentPause;
