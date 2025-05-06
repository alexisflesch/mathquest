// computeLeaderboard.js - Utility to compute the leaderboard from tournament participants
// Returns an array of { id, pseudo, avatar, score }
function computeLeaderboard(tState) {
    if (!tState || !tState.participants) return [];
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