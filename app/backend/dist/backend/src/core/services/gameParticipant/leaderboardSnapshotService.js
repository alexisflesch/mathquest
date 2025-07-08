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
    // Get gameInstance to determine participation type
    const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
        where: { accessCode },
        select: { status: true }
    });
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
    // Fetch game instance to determine participation type
    const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
        where: { accessCode },
        select: { status: true }
    });
    if (!gameInstance)
        return null;
    // Fetch all participants for this game
    const participants = await prisma_1.prisma.gameParticipant.findMany({
        where: { gameInstance: { accessCode } },
        include: { user: true }
    });
    if (!participants)
        return null;
    // Compute scores and build leaderboard entries - create separate entries for live and deferred scores
    const leaderboardEntries = [];
    for (const p of participants) {
        const baseEntry = {
            userId: p.userId,
            username: p.user?.username || 'Unknown Player',
            avatarEmoji: p.user?.avatarEmoji || undefined,
            attemptCount: p.nbAttempts,
            participationId: p.id
        };
        // Add live score entry if it exists and is > 0
        if (p.liveScore && p.liveScore > 0) {
            leaderboardEntries.push({
                ...baseEntry,
                score: p.liveScore,
                participationType: 'LIVE',
                attemptCount: 1 // Live entries always have 1 attempt
            });
        }
        // Add deferred score entry if it exists and is > 0
        if (p.deferredScore && p.deferredScore > 0) {
            leaderboardEntries.push({
                ...baseEntry,
                score: p.deferredScore,
                participationType: 'DEFERRED',
                attemptCount: p.nbAttempts || 1 // Show actual attempt count for deferred
            });
        }
        // If no scores exist, add a single entry with 0 score
        if ((!p.liveScore || p.liveScore === 0) && (!p.deferredScore || p.deferredScore === 0)) {
            const isDeferred = p.status === 'ACTIVE' && gameInstance.status === 'completed';
            leaderboardEntries.push({
                ...baseEntry,
                score: 0,
                participationType: isDeferred ? 'DEFERRED' : 'LIVE',
                attemptCount: p.nbAttempts || 1
            });
        }
    }
    // Sort by score descending, then by username for consistent ordering
    leaderboardEntries.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.username.localeCompare(b.username);
    });
    // Assign ranks after sorting
    const leaderboard = leaderboardEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
    // Sort by score descending, then username
    leaderboard.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
    // Assign ranks (cast to any to allow adding rank property)
    leaderboard.forEach((entry, idx) => { entry.rank = idx + 1; });
    // Store in Redis
    await setLeaderboardSnapshot(accessCode, leaderboard);
    return { leaderboard: leaderboard };
}
