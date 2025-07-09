import { redisClient } from '@/config/redis';
import type { LeaderboardEntry, ParticipationType } from '@shared/types/core';
import { prisma } from '@/db/prisma';
import { ProjectionLeaderboardUpdatePayload } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import { calculateLeaderboard } from '@/sockets/handlers/sharedLeaderboard';

const LEADERBOARD_SNAPSHOT_PREFIX = 'leaderboard:snapshot:';

/**
 * Get the Redis key for a leaderboard snapshot for a game instance
 */
function getSnapshotKey(accessCode: string) {
    return `${LEADERBOARD_SNAPSHOT_PREFIX}${accessCode}`;
}

/**
 * Initialize the leaderboard snapshot as an empty array
 */
export async function initLeaderboardSnapshot(accessCode: string) {
    await redisClient.set(getSnapshotKey(accessCode), JSON.stringify([]));
}

/**
 * Get the current leaderboard snapshot for a game instance
 */
export async function getLeaderboardSnapshot(accessCode: string): Promise<LeaderboardEntry[]> {
    const raw = await redisClient.get(getSnapshotKey(accessCode));
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Overwrite the leaderboard snapshot for a game instance
 */
export async function setLeaderboardSnapshot(accessCode: string, snapshot: LeaderboardEntry[]) {
    await redisClient.set(getSnapshotKey(accessCode), JSON.stringify(snapshot));
}

/**
 * Add a new user to the snapshot with their join bonus
 * Returns the updated snapshot
 */
export async function addUserToSnapshot(accessCode: string, user: Omit<LeaderboardEntry, 'rank'>, joinBonus: number) {
    const snapshot = await getLeaderboardSnapshot(accessCode);
    // Prevent duplicate users
    if (snapshot.some(e => e.userId === user.userId)) return snapshot;

    // Get gameInstance to determine participation type
    const gameInstance = await prisma.gameInstance.findUnique({
        where: { accessCode },
        select: { status: true }
    });

    const entry: LeaderboardEntry = {
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
export async function computeFullLeaderboardAndSnapshot(accessCode: string): Promise<ProjectionLeaderboardUpdatePayload | null> {
    // Fetch game instance to determine participation type
    const gameInstance = await prisma.gameInstance.findUnique({
        where: { accessCode },
        select: { status: true }
    });

    if (!gameInstance) return null;

    // If game is active, use Redis-based leaderboard calculation
    if (gameInstance.status === 'active') {
        const redisLeaderboard = await calculateLeaderboard(accessCode);

        // Fetch participant details from database for additional metadata
        const participants = await prisma.gameParticipant.findMany({
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
                participationType: 'LIVE' as ParticipationType,
                attemptCount: participant?.nbAttempts || 1,
                participationId: participant?.id || '',
                rank: index + 1
            };
        });

        // Store in Redis
        await setLeaderboardSnapshot(accessCode, leaderboardEntries as any);
        return { leaderboard: leaderboardEntries as any };
    }

    // For completed games, use database-based calculation
    const participants = await prisma.gameParticipant.findMany({
        where: { gameInstance: { accessCode } },
        include: { user: true }
    });
    if (!participants) return null;

    // Compute scores and build leaderboard entries - create separate entries for live and deferred scores
    const leaderboardEntries: any[] = [];

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
                participationType: 'LIVE' as ParticipationType,
                attemptCount: 1 // Live entries always have 1 attempt
            });
        }

        // Add deferred score entry if it exists and is > 0
        if (p.deferredScore && p.deferredScore > 0) {
            leaderboardEntries.push({
                ...baseEntry,
                score: p.deferredScore,
                participationType: 'DEFERRED' as ParticipationType,
                attemptCount: p.nbAttempts || 1 // Show actual attempt count for deferred
            });
        }

        // If no scores exist, add a single entry with 0 score
        if ((!p.liveScore || p.liveScore === 0) && (!p.deferredScore || p.deferredScore === 0)) {
            const isDeferred = p.status === 'ACTIVE' && gameInstance.status === 'completed';
            leaderboardEntries.push({
                ...baseEntry,
                score: 0,
                participationType: isDeferred ? 'DEFERRED' as ParticipationType : 'LIVE' as ParticipationType,
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
    await setLeaderboardSnapshot(accessCode, leaderboard as any);
    return { leaderboard: leaderboard as any };
}
