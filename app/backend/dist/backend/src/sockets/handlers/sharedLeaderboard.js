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
    // Fetch all participants and their scores from Redis
    const participantsRaw = await redis_1.redisClient.hgetall(`mathquest:game:participants:${accessCode}`);
    if (!participantsRaw)
        return [];
    const participants = Object.values(participantsRaw).map((json) => JSON.parse(json));
    // Sort by score descending
    return participants
        .map((p) => ({
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
async function persistLeaderboardToGameInstance(accessCode, leaderboard) {
    // Find the game instance by accessCode and update the leaderboard field
    await prisma_1.prisma.gameInstance.update({
        where: { accessCode },
        data: { leaderboard: leaderboard },
    });
}
