"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLeaderboardSnapshot = initLeaderboardSnapshot;
exports.getLeaderboardSnapshot = getLeaderboardSnapshot;
exports.setLeaderboardSnapshot = setLeaderboardSnapshot;
exports.addUserToSnapshot = addUserToSnapshot;
exports.computeFullLeaderboardAndSnapshot = computeFullLeaderboardAndSnapshot;
exports.syncSnapshotWithLiveData = syncSnapshotWithLiveData;
exports.emitLeaderboardFromSnapshot = emitLeaderboardFromSnapshot;
const redis_1 = require("@/config/redis");
const prisma_1 = require("@/db/prisma");
const projectionLeaderboardUpdatePayload_1 = require("@shared/types/socket/projectionLeaderboardUpdatePayload");
const sharedLeaderboard_1 = require("@/sockets/handlers/sharedLeaderboard");
const logger_1 = require("@/utils/logger");
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
    // If game is active, use Redis-based leaderboard calculation
    if (gameInstance.status === 'active') {
        const redisLeaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
        // Fetch participant details from database for additional metadata
        const participants = await prisma_1.prisma.gameParticipant.findMany({
            where: { gameInstance: { accessCode } },
            include: { user: true }
        });
        // Build leaderboard entries with additional metadata
        const leaderboardEntries = redisLeaderboard.map((entry, index) => {
            const participant = participants.find(p => p.userId === entry.userId);
            return {
                userId: entry.userId,
                username: entry.username,
                avatarEmoji: entry.avatarEmoji,
                score: entry.score,
                participationType: 'LIVE',
                attemptCount: participant?.nbAttempts || 1,
                participationId: participant?.id || '',
                rank: index + 1
            };
        });
        // Store in Redis
        await setLeaderboardSnapshot(accessCode, leaderboardEntries);
        return { leaderboard: leaderboardEntries };
    }
    // For completed games, use database-based calculation
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
    // Store in Redis
    await setLeaderboardSnapshot(accessCode, leaderboard);
    return { leaderboard: leaderboard };
}
/**
 * Sync the snapshot with current live leaderboard data
 * This should be called at specific sync points:
 * - After each question ends (when scores are finalized)
 * - When a new user joins (to include them in the snapshot)
 * - When the game starts (to initialize from database)
 */
async function syncSnapshotWithLiveData(accessCode) {
    try {
        // Calculate current leaderboard from live Redis data
        const liveLeaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
        // Fetch participant details from database for additional metadata
        const participants = await prisma_1.prisma.gameParticipant.findMany({
            where: { gameInstance: { accessCode } },
            include: { user: true }
        });
        // Build leaderboard entries with additional metadata
        const leaderboardEntries = liveLeaderboard.map((entry, index) => {
            const participant = participants.find(p => p.userId === entry.userId);
            return {
                userId: entry.userId,
                username: entry.username,
                avatarEmoji: entry.avatarEmoji,
                score: entry.score,
                participationType: 'LIVE',
                attemptCount: participant?.nbAttempts || 1,
                participationId: participant?.id || '',
                rank: index + 1
            };
        });
        // Update the snapshot with current live data
        await setLeaderboardSnapshot(accessCode, leaderboardEntries);
        return leaderboardEntries;
    }
    catch (error) {
        logger_1.logger.error({ accessCode, error }, '[SNAPSHOT] Error syncing snapshot with live data');
        // Return current snapshot as fallback
        return await getLeaderboardSnapshot(accessCode);
    }
}
/**
 * Emit leaderboard update using the snapshot as source of truth
 * This ensures consistency and prevents race conditions
 */
async function emitLeaderboardFromSnapshot(io, accessCode, targetRooms, context = 'default') {
    try {
        const snapshot = await getLeaderboardSnapshot(accessCode);
        if (snapshot.length === 0) {
            logger_1.logger.warn({ accessCode, context }, '[SNAPSHOT] No leaderboard data in snapshot, skipping emission');
            return;
        }
        // Create canonical leaderboard_update payload
        const leaderboardPayload = { leaderboard: snapshot };
        // Validate with Zod before emitting
        const parseResult = projectionLeaderboardUpdatePayload_1.ProjectionLeaderboardUpdatePayloadSchema.safeParse(leaderboardPayload);
        if (!parseResult.success) {
            logger_1.logger.error({
                accessCode,
                context,
                errors: parseResult.error.issues,
                snapshot: snapshot.slice(0, 3) // Log first 3 entries for debugging
            }, '[SNAPSHOT] Invalid leaderboard payload from snapshot, not emitting');
            return;
        }
        // Emit to all target rooms
        for (const room of targetRooms) {
            io.to(room).emit('leaderboard_update', leaderboardPayload);
        }
        logger_1.logger.info({
            accessCode,
            context,
            targetRooms,
            leaderboardCount: snapshot.length,
            event: 'leaderboard_update'
        }, '[SNAPSHOT] Emitted leaderboard from snapshot to target rooms');
    }
    catch (error) {
        logger_1.logger.error({ accessCode, context, error }, '[SNAPSHOT] Error emitting leaderboard from snapshot');
    }
}
