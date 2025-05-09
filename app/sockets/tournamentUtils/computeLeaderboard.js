const { scaleScoresForQuiz } = require('./scoreUtils');
const logger = require('../../logger')('ComputeLeaderboard');

// computeLeaderboard.js - Utility to compute the leaderboard from tournament participants
// Returns an array of { id, pseudo, avatar, score }
function computeLeaderboard(tState, questionStates, totalQuestions) {
    if (!tState || !tState.participants) return [];

    // Log participants and scaling inputs for debugging
    console.log(`[computeLeaderboard] Participants before scaling:`, tState.participants);

    // Log the questionStates for debugging
    if (questionStates) {
        logger.debug(`[computeLeaderboard] Question states: ${JSON.stringify(questionStates)}`);
    }

    // Remove scaling logic entirely
    logger.info(`[computeLeaderboard] Skipping scaling logic entirely.`);

    return Object.values(tState.participants)
        .map(p => ({
            id: p.id,
            pseudo: p.pseudo,
            avatar: p.avatar ? (p.avatar.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`) : undefined,
            score: p.score
        }))
        .sort((a, b) => b.score - a.score);
}

module.exports = { computeLeaderboard };