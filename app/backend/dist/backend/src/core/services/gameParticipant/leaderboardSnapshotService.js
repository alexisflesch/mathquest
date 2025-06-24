"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLeaderboardSnapshot = initLeaderboardSnapshot;
exports.getLeaderboardSnapshot = getLeaderboardSnapshot;
exports.setLeaderboardSnapshot = setLeaderboardSnapshot;
exports.addUserToSnapshot = addUserToSnapshot;
exports.computeFullLeaderboardAndSnapshot = computeFullLeaderboardAndSnapshot;
const redis_1 = require("@/config/redis");
const prisma_1 = require("@/db/prisma");
const LEADERBOARD_SNAPSHOT_PREFIX = 'leaderboard:snapshot:';
/**
 * Get the Redis key for a leaderboard snapshot for a game instance
 */
function getSnapshotKey(accessCode) {
    return `${LEADERBOARD_SNAPSHOT_PREFIX}${accessCode}`;
}
/**
 * Initialize the leaderboard snapshot as an empty array
 */
async function initLeaderboardSnapshot(accessCode) {
    await redis_1.redisClient.set(getSnapshotKey(accessCode), JSON.stringify([]));
}
/**
 * Get the current leaderboard snapshot for a game instance
 */
async function getLeaderboardSnapshot(accessCode) {
    const raw = await redis_1.redisClient.get(getSnapshotKey(accessCode));
    if (!raw)
        return [];
    try {
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
/**
 * Overwrite the leaderboard snapshot for a game instance
 */
async function setLeaderboardSnapshot(accessCode, snapshot) {
    await redis_1.redisClient.set(getSnapshotKey(accessCode), JSON.stringify(snapshot));
}
/**
 * Add a new user to the snapshot with their join bonus
 * Returns the updated snapshot
 */
async function addUserToSnapshot(accessCode, user, joinBonus) {
    const snapshot = await getLeaderboardSnapshot(accessCode);
    // Prevent duplicate users
    if (snapshot.some(e => e.userId === user.userId))
        return snapshot;
    const entry = {
        ...user,
        score: joinBonus,
        rank: snapshot.length + 1,
        // ...other fields as needed
    };
    const updated = [...snapshot, entry];
    await setLeaderboardSnapshot(accessCode, updated);
    return updated;
}
/**
 * Compute the full leaderboard (join bonus + answer points), update the snapshot, and return the canonical payload
 */
async function computeFullLeaderboardAndSnapshot(accessCode) {
    // Fetch all participants for this game
    const participants = await prisma_1.prisma.gameParticipant.findMany({
        where: { gameInstance: { accessCode } },
        include: { user: true }
    });
    if (!participants)
        return null;
    // Compute scores and build leaderboard entries
    const leaderboard = participants.map((p) => ({
        userId: p.userId,
        username: p.user?.username || 'Unknown Player',
        avatarEmoji: p.user?.avatarEmoji || undefined,
        score: p.score || 0,
        participationType: p.participationType,
        attemptCount: p.attemptCount,
        participationId: p.id
    }));
    // Sort by score descending, then username
    leaderboard.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
    // Assign ranks (cast to any to allow adding rank property)
    leaderboard.forEach((entry, idx) => { entry.rank = idx + 1; });
    // Store in Redis
    await setLeaderboardSnapshot(accessCode, leaderboard);
    return { leaderboard: leaderboard };
}
