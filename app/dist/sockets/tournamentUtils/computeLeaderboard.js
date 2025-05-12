"use strict";
/**
 * computeLeaderboard.ts - Utility to compute the leaderboard from tournament participants
 *
 * This module computes a sorted leaderboard based on participant scores in a tournament.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLeaderboard = computeLeaderboard;
// Import using require for CommonJS compatibility
const { scaleScoresForQuiz } = require('./scoreUtils');
const createLogger = require('../../logger');
const logger = createLogger('ComputeLeaderboard');
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
// Create a module.exports object
const computeLeaderboardExports = {
    computeLeaderboard
};
// Direct CommonJS export for bridge files
module.exports = computeLeaderboardExports;
