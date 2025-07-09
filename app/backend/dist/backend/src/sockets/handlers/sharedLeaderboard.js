"use strict";
// Shared leaderboard calculation logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLeaderboard = calculateLeaderboard;
exports.persistLeaderboardToGameInstance = persistLeaderboardToGameInstance;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const prisma_1 = require("@/db/prisma");
const logger = (0, logger_1.default)('LeaderboardUtils');
/**
 * Calculate leaderboard for a game instance
 * @param accessCode Game access code
 * @returns Array of leaderboard entries sorted by score
 */
async function calculateLeaderboard(accessCode) {
    logger.debug({ accessCode }, '📊 [LEADERBOARD-CALC] Starting leaderboard calculation');
    try {
        // Fetch all participants and their scores from Redis
        const participantsKey = `mathquest:game:participants:${accessCode}`;
        const participantsRaw = await redis_1.redisClient.hgetall(participantsKey);
        logger.debug({
            accessCode,
            participantsKey,
            hasParticipants: !!participantsRaw,
            participantKeys: participantsRaw ? Object.keys(participantsRaw) : [],
            participantCount: participantsRaw ? Object.keys(participantsRaw).length : 0
        }, '🔍 [LEADERBOARD-CALC] Raw participants data retrieved');
        if (!participantsRaw || Object.keys(participantsRaw).length === 0) {
            logger.info({ accessCode }, '📭 [LEADERBOARD-CALC] No participants found, returning empty leaderboard');
            return [];
        }
        const participants = Object.values(participantsRaw).map((json, index) => {
            try {
                const parsed = JSON.parse(json);
                logger.debug({
                    accessCode,
                    index,
                    originalJson: json,
                    parsedData: parsed,
                    username: parsed.username,
                    userId: parsed.userId
                }, '🔍 [LEADERBOARD-CALC] Parsing individual participant');
                return parsed;
            }
            catch (parseError) {
                logger.warn({
                    accessCode,
                    json,
                    parseError: parseError instanceof Error ? parseError.message : String(parseError)
                }, '⚠️ [LEADERBOARD-CALC] Failed to parse participant JSON');
                return null;
            }
        }).filter(p => p !== null);
        logger.debug({
            accessCode,
            participantCount: participants.length,
            sampleParticipants: participants.slice(0, 3).map(p => ({ userId: p.userId, username: p.username, score: p.score }))
        }, '🔍 [LEADERBOARD-CALC] Participants parsed');
        // Sort by score descending
        const leaderboard = participants
            .map((p, index) => {
            const leaderboardEntry = {
                userId: p.userId,
                username: p.username,
                avatarEmoji: p.avatarEmoji,
                score: p.score || 0
            };
            logger.debug({
                accessCode,
                index,
                originalParticipant: p,
                leaderboardEntry,
                usernamePresent: !!p.username,
                usernameValue: p.username
            }, '🔍 [LEADERBOARD-CALC] Mapping participant to leaderboard entry');
            return leaderboardEntry;
        })
            .sort((a, b) => b.score - a.score);
        logger.info({
            accessCode,
            leaderboardCount: leaderboard.length,
            topPlayers: leaderboard.slice(0, 5).map(p => ({ username: p.username, score: p.score }))
        }, '✅ [LEADERBOARD-CALC] Leaderboard calculation completed');
        return leaderboard;
    }
    catch (error) {
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
async function persistLeaderboardToGameInstance(accessCode, leaderboard) {
    logger.info({
        accessCode,
        participantCount: leaderboard.length,
        note: 'ANTI-CHEATING: Persisting final scores from Redis to database at game end'
    }, '[ANTI-CHEATING] Starting final score persistence to database');
    try {
        // Get the game instance
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
                const dbParticipant = await prisma_1.prisma.gameParticipant.findFirst({
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
                        await prisma_1.prisma.gameParticipant.update({
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
                    }
                    else {
                        // For live mode, simply update the live score
                        await prisma_1.prisma.gameParticipant.update({
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
                }
                else {
                    logger.warn({
                        accessCode,
                        userId: participant.userId,
                        score: participant.score
                    }, '[ANTI-CHEATING] Participant not found in database for score update');
                }
            }
            catch (error) {
                logger.error({
                    accessCode,
                    userId: participant.userId,
                    error: error instanceof Error ? error.message : String(error)
                }, '[ANTI-CHEATING] Error updating participant score in database');
            }
        }
        // Update the game instance leaderboard field
        await prisma_1.prisma.gameInstance.update({
            where: { accessCode },
            data: { leaderboard: leaderboard },
        });
        logger.info({
            accessCode,
            participantCount: leaderboard.length,
            isDeferred,
            note: 'ANTI-CHEATING: Successfully persisted final scores to database'
        }, '[ANTI-CHEATING] Completed final score persistence to database');
    }
    catch (error) {
        logger.error({
            accessCode,
            error: error instanceof Error ? error.message : String(error)
        }, '[ANTI-CHEATING] Error persisting leaderboard to database');
        throw error;
    }
}
