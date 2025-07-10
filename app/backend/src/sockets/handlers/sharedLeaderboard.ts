// Shared leaderboard calculation logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers

import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { prisma } from '@/db/prisma';

const logger = createLogger('LeaderboardUtils');

/**
 * Calculate leaderboard for a game instance
 * Uses the leaderboard sorted set as source of truth for scores (not participant data)
 * @param accessCode Game access code
 * @returns Array of leaderboard entries sorted by score
 */
export async function calculateLeaderboard(accessCode: string) {
    logger.debug({ accessCode }, '📊 [LEADERBOARD-CALC] Starting leaderboard calculation');

    try {
        // Fetch scores from the leaderboard sorted set (source of truth for live scores)
        const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`;
        const leaderboardRaw = await redisClient.zrevrange(leaderboardKey, 0, -1, 'WITHSCORES');
        
        // Fetch participant metadata (usernames, avatars, etc.)
        const participantsKey = `mathquest:game:participants:${accessCode}`;
        const participantsRaw = await redisClient.hgetall(participantsKey);

        logger.debug({
            accessCode,
            leaderboardKey,
            participantsKey,
            hasLeaderboard: !!leaderboardRaw && leaderboardRaw.length > 0,
            hasParticipants: !!participantsRaw,
            leaderboardCount: leaderboardRaw ? leaderboardRaw.length / 2 : 0,
            participantCount: participantsRaw ? Object.keys(participantsRaw).length : 0
        }, '🔍 [LEADERBOARD-CALC] Raw leaderboard and participant data retrieved');

        if (!leaderboardRaw || leaderboardRaw.length === 0) {
            logger.info({ accessCode }, '📭 [LEADERBOARD-CALC] No leaderboard data found, returning empty leaderboard');
            return [];
        }

        if (!participantsRaw || Object.keys(participantsRaw).length === 0) {
            logger.info({ accessCode }, '📭 [LEADERBOARD-CALC] No participants metadata found, returning empty leaderboard');
            return [];
        }

        // Parse participant metadata
        const participantsMetadata = new Map();
        Object.entries(participantsRaw).forEach(([userId, json]) => {
            try {
                const parsed = JSON.parse(json as string);
                participantsMetadata.set(userId, {
                    username: parsed.username,
                    avatarEmoji: parsed.avatarEmoji
                });
            } catch (parseError) {
                logger.warn({
                    accessCode,
                    userId,
                    json,
                    parseError: parseError instanceof Error ? parseError.message : String(parseError)
                }, '⚠️ [LEADERBOARD-CALC] Failed to parse participant metadata');
            }
        });

        // Process leaderboard entries (already sorted by score descending from ZREVRANGE)
        const leaderboard = [];
        for (let i = 0; i < leaderboardRaw.length; i += 2) {
            const userId = leaderboardRaw[i];
            const score = parseInt(leaderboardRaw[i + 1], 10);
            const metadata = participantsMetadata.get(userId);
            
            if (metadata) {
                const leaderboardEntry = {
                    userId,
                    username: metadata.username,
                    avatarEmoji: metadata.avatarEmoji,
                    score
                };
                
                logger.debug({
                    accessCode,
                    index: i / 2,
                    userId,
                    score,
                    metadata,
                    leaderboardEntry
                }, '🔍 [LEADERBOARD-CALC] Processing leaderboard entry');
                
                leaderboard.push(leaderboardEntry);
            } else {
                logger.warn({
                    accessCode,
                    userId,
                    score
                }, '⚠️ [LEADERBOARD-CALC] No metadata found for user in leaderboard');
            }
        }

        logger.info({
            accessCode,
            leaderboardCount: leaderboard.length,
            topPlayers: leaderboard.slice(0, 5).map(p => ({ username: p.username, score: p.score }))
        }, '✅ [LEADERBOARD-CALC] Leaderboard calculation completed using live scores');

        return leaderboard;

    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            accessCode
        }, '❌ [LEADERBOARD-CALC] Error calculating leaderboard');
        return [];
    }
}

/**
 * Persist the calculated leaderboard to the GameInstance model and update participant scores
 * @param accessCode Game access code
 * @param leaderboard Array of leaderboard entries
 */
export async function persistLeaderboardToGameInstance(accessCode: string, leaderboard: any[]) {
    logger.info({
        accessCode,
        participantCount: leaderboard.length,
        note: 'ANTI-CHEATING: Persisting final scores from Redis to database at game end'
    }, '[ANTI-CHEATING] Starting final score persistence to database');

    try {
        // Get the game instance
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: { id: true, playMode: true, status: true }
        });

        if (!gameInstance) {
            logger.error({ accessCode }, '[ANTI-CHEATING] Game instance not found for persistence');
            return;
        }

        // Determine if this is deferred mode
        const isDeferred = gameInstance.playMode === 'tournament' && gameInstance.status === 'completed';

        // Update participant scores in database based on final Redis scores
        for (const participant of leaderboard) {
            try {
                // Find the participant in the database
                const dbParticipant = await prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: participant.userId
                    },
                    orderBy: {
                        joinedAt: 'desc'
                    }
                });

                if (dbParticipant) {
                    // Update the appropriate score field based on mode
                    if (isDeferred) {
                        // For deferred mode, keep the maximum between current DB score and new Redis score
                        const currentDeferredScore = dbParticipant.deferredScore || 0;
                        const newScore = Math.max(currentDeferredScore, participant.score);
                        await prisma.gameParticipant.update({
                            where: { id: dbParticipant.id },
                            data: { deferredScore: newScore }
                        });

                        logger.debug({
                            accessCode,
                            userId: participant.userId,
                            participantId: dbParticipant.id,
                            redisScore: participant.score,
                            currentDeferredScore,
                            finalScore: newScore,
                            isDeferred,
                            note: 'DEFERRED: Kept maximum between existing and new score'
                        }, '[ANTI-CHEATING] Updated deferred participant score (max logic)');
                    } else {
                        // For live mode, simply update the live score
                        await prisma.gameParticipant.update({
                            where: { id: dbParticipant.id },
                            data: { liveScore: participant.score }
                        });

                        logger.debug({
                            accessCode,
                            userId: participant.userId,
                            participantId: dbParticipant.id,
                            score: participant.score,
                            isDeferred,
                            note: 'LIVE: Direct score update'
                        }, '[ANTI-CHEATING] Updated live participant score');
                    }
                } else {
                    logger.warn({
                        accessCode,
                        userId: participant.userId,
                        score: participant.score
                    }, '[ANTI-CHEATING] Participant not found in database for score update');
                }
            } catch (error) {
                logger.error({
                    accessCode,
                    userId: participant.userId,
                    error: error instanceof Error ? error.message : String(error)
                }, '[ANTI-CHEATING] Error updating participant score in database');
            }
        }

        // Update the game instance leaderboard field
        await prisma.gameInstance.update({
            where: { accessCode },
            data: { leaderboard: leaderboard as any },
        });

        logger.info({
            accessCode,
            participantCount: leaderboard.length,
            isDeferred,
            note: 'ANTI-CHEATING: Successfully persisted final scores to database'
        }, '[ANTI-CHEATING] Completed final score persistence to database');

    } catch (error) {
        logger.error({
            accessCode,
            error: error instanceof Error ? error.message : String(error)
        }, '[ANTI-CHEATING] Error persisting leaderboard to database');
        throw error;
    }
}
