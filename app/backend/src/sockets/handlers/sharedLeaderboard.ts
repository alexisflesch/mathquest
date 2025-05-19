// Shared leaderboard calculation logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers

import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { prisma } from '@/db/prisma';

const logger = createLogger('LeaderboardUtils');

/**
 * Calculate leaderboard for a game instance
 * @param accessCode Game access code
 * @returns Array of leaderboard entries sorted by score
 */
export async function calculateLeaderboard(accessCode: string) {
    // Fetch all participants and their scores from Redis
    const participantsRaw = await redisClient.hgetall(`mathquest:game:participants:${accessCode}`);
    if (!participantsRaw) return [];
    const participants = Object.values(participantsRaw).map((json: any) => JSON.parse(json));
    // Sort by score descending
    return participants
        .map((p: any) => ({
            userId: p.userId,
            username: p.username,
            avatarUrl: p.avatarUrl,
            score: p.score || 0
        }))
        .sort((a, b) => b.score - a.score);
}

/**
 * Persist the calculated leaderboard to the GameInstance model
 * @param accessCode Game access code
 * @param leaderboard Array of leaderboard entries
 */
export async function persistLeaderboardToGameInstance(accessCode: string, leaderboard: any[]) {
    // Find the game instance by accessCode and update the leaderboard field
    await prisma.gameInstance.update({
        where: { accessCode },
        data: { leaderboard: leaderboard as any },
    });
}
