import { redisClient } from '@/config/redis';
import type { LeaderboardEntry } from '@shared/types/core';
import { prisma } from '@/db/prisma';
import { ProjectionLeaderboardUpdatePayload } from '@shared/types/socket/projectionLeaderboardUpdatePayload';

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
    // Fetch all participants for this game
    const participants = await prisma.gameParticipant.findMany({
        where: { gameInstance: { accessCode } },
        include: { user: true }
    });
    if (!participants) return null;
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
    (leaderboard as any).forEach((entry: any, idx: number) => { entry.rank = idx + 1; });
    // Store in Redis
    await setLeaderboardSnapshot(accessCode, leaderboard as any);
    return { leaderboard: leaderboard as any };
}
