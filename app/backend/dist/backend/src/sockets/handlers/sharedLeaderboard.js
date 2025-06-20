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
 * Persist the calculated leaderboard to the GameInstance model
 * @param accessCode Game access code
 * @param leaderboard Array of leaderboard entries
 */
async function persistLeaderboardToGameInstance(accessCode, leaderboard) {
    // Find the game instance by accessCode and update the leaderboard field
    await prisma_1.prisma.gameInstance.update({
        where: { accessCode },
        data: { leaderboard: leaderboard },
    });
}
