"use strict";
/**
 * computeLeaderboard.ts - Utility to compute the leaderboard from tournament participants
 *
 * This module computes a sorted leaderboard based on participant scores in a tournament.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLeaderboard = computeLeaderboard;
// Update to ES6 imports
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('ComputeLeaderboard');
/**
 * Compute a sorted leaderboard from tournament participants
 *
 * @param tState - The tournament state object
 * @param questionStates - Optional states for questions in the tournament
 * @param totalQuestions - Optional total number of questions
 * @returns Array of leaderboard entries sorted by score (highest first)
 */
function computeLeaderboard(tState, questionStates, totalQuestions) {
    if (!tState || !tState.participants)
        return [];
    // Log participants for debugging
    logger.debug(`[computeLeaderboard] Processing ${tState.participants.length} participants`);
    // Log the questionStates for debugging
    if (questionStates) {
        logger.debug(`[computeLeaderboard] Question states: ${JSON.stringify(questionStates)}`);
    }
    // No scaling logic in this version as per original implementation
    logger.info(`[computeLeaderboard] Skipping scaling logic entirely`);
    // Convert participants to leaderboard entries and sort by score
    return Object.values(tState.participants)
        .map((p) => ({
        id: p.id,
        pseudo: p.pseudo,
        avatar: p.avatar ? (p.avatar.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`) : undefined,
        score: p.score || 0
    }))
        .sort((a, b) => (b.score - a.score));
}
// Export default for default imports
exports.default = computeLeaderboard;
// Direct CommonJS export - simpler and more reliable pattern
if (typeof module !== 'undefined' && module.exports) {
    // Direct assignment to avoid issues with circular dependencies
    module.exports = {
        computeLeaderboard,
        default: computeLeaderboard // Keep default as the main function
    };
}
