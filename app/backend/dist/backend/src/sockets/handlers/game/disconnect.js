"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = disconnectHandler;
const redis_1 = require("@/config/redis");
const lobbyHandler_1 = require("../lobbyHandler");
const logger_1 = __importDefault(require("@/utils/logger"));
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';
function disconnectHandler(io, socket) {
    return async () => {
        const logger = (0, logger_1.default)('DisconnectHandler');
        logger.info({ socketId: socket.id }, '[DISCONNECT] User disconnected');
        // Get access code from socket data
        const accessCode = socket.data?.accessCode;
        if (!accessCode) {
            logger.info({ socketId: socket.id }, '[DISCONNECT] No access code found in socket data, skipping cleanup');
            return;
        }
        // Use game-specific Redis keys (consistent with joinGame.ts)
        const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;
        const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
        const participantsKey = `mathquest:game:participants:${accessCode}`;
        // Look up userId for this socket
        const userId = await redis_1.redisClient.hget(socketIdToUserIdKey, socket.id);
        logger.debug({
            socketIdToUserIdKey,
            socketId: socket.id,
            userId,
            accessCode
        }, '[DISCONNECT] Redis lookup result');
        if (!userId) {
            logger.info({ socketId: socket.id, accessCode }, '[DISCONNECT] No userId found for socket, skipping cleanup');
            return;
        }
        logger.info({ socketId: socket.id, userId, accessCode }, '[DISCONNECT] Found userId for disconnected socket');
        // Remove this socket from Redis mappings
        await redis_1.redisClient.hdel(userIdToSocketIdKey, userId);
        await redis_1.redisClient.hdel(socketIdToUserIdKey, socket.id);
        // Check if any other sockets for this userId remain in this game
        const remainingSockets = await redis_1.redisClient.hvals(userIdToSocketIdKey);
        const stillConnected = remainingSockets.includes(socket.id);
        logger.info({
            userId,
            accessCode,
            stillConnected,
            remainingSockets
        }, '[DISCONNECT] Checked for remaining sockets in this game');
        if (!stillConnected) {
            logger.info({ userId, accessCode }, '[DISCONNECT] No remaining sockets for this user in this game');
            // Check participant status in database first
            let participantStatus = null;
            try {
                const { prisma } = await Promise.resolve().then(() => __importStar(require('@/db/prisma')));
                const participant = await prisma.gameParticipant.findFirst({
                    where: {
                        userId,
                        gameInstance: { accessCode }
                    }
                });
                if (participant) {
                    participantStatus = participant.status;
                    logger.info({
                        userId,
                        accessCode,
                        participantStatus
                    }, '[DISCONNECT] Found participant with status');
                }
            }
            catch (dbError) {
                logger.error({
                    userId,
                    accessCode,
                    error: dbError
                }, '[DISCONNECT] Error checking participant status');
            }
            // Handle disconnect based on participant status AND leaderboard presence
            // CRITICAL: Check if user has any score in leaderboard first
            const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`;
            const userScore = await redis_1.redisClient.zscore(leaderboardKey, userId);
            const hasScore = userScore !== null;
            if (hasScore) {
                // User has a score in leaderboard (join-order bonus, answers, etc.) - NEVER remove them
                logger.info({
                    userId,
                    accessCode,
                    userScore,
                    participantStatus,
                    note: 'LEADERBOARD-PRESERVATION: User has score, preserving regardless of status'
                }, '[DISCONNECT] User with leaderboard score - preserving participant data');
                // Get current participant data from Redis and mark offline
                const participantJson = await redis_1.redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    try {
                        const participantData = JSON.parse(participantJson);
                        participantData.online = false;
                        await redis_1.redisClient.hset(participantsKey, userId, JSON.stringify(participantData));
                        logger.info({
                            userId,
                            accessCode,
                            note: 'LEADERBOARD-PRESERVATION: Participant with score marked offline but preserved'
                        }, '[DISCONNECT] Participant with leaderboard score preserved');
                    }
                    catch (parseError) {
                        logger.error({
                            userId,
                            accessCode,
                            error: parseError
                        }, '[DISCONNECT] Error marking participant with score as offline');
                    }
                }
                else {
                    logger.warn({
                        userId,
                        accessCode,
                        note: 'User has leaderboard score but missing participant data'
                    }, '[DISCONNECT] User with score missing participant data - this should not happen');
                }
                // Don't emit participant list update to avoid UI flicker for users with scores
                return;
            }
            // User has no score - safe to handle based on status
            if (participantStatus === 'PENDING') {
                // PENDING participants with no score - safe to remove completely
                logger.info({ userId, accessCode }, '[DISCONNECT] Removing PENDING participant with no score');
                // Remove participant from Redis
                await redis_1.redisClient.hdel(participantsKey, userId);
                // Remove from database
                try {
                    const { prisma } = await Promise.resolve().then(() => __importStar(require('@/db/prisma')));
                    const participant = await prisma.gameParticipant.findFirst({
                        where: {
                            userId,
                            gameInstance: { accessCode },
                            status: 'PENDING'
                        }
                    });
                    if (participant) {
                        await prisma.gameParticipant.delete({
                            where: { id: participant.id }
                        });
                        logger.info({
                            userId,
                            accessCode,
                            participantId: participant.id
                        }, '[DISCONNECT] Removed PENDING participant from database');
                    }
                }
                catch (dbError) {
                    logger.error({
                        userId,
                        accessCode,
                        error: dbError
                    }, '[DISCONNECT] Error removing PENDING participant from database');
                }
                // Emit updated participant list
                await (0, lobbyHandler_1.emitParticipantList)(io, accessCode);
            }
            else if (participantStatus === 'ACTIVE') {
                // ACTIVE participants have started playing - keep them in leaderboard but mark offline
                logger.info({ userId, accessCode }, '[DISCONNECT] Marking ACTIVE participant as offline (preserving leaderboard presence)');
                // Get current participant data from Redis
                const participantJson = await redis_1.redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    try {
                        const participantData = JSON.parse(participantJson);
                        participantData.online = false;
                        // Don't remove from Redis - just mark as offline to preserve leaderboard
                        await redis_1.redisClient.hset(participantsKey, userId, JSON.stringify(participantData));
                        logger.info({
                            userId,
                            accessCode,
                            note: 'LEADERBOARD-PRESERVATION: ACTIVE participant marked offline but kept in Redis for leaderboard'
                        }, '[DISCONNECT] ACTIVE participant preserved in leaderboard');
                    }
                    catch (parseError) {
                        logger.error({
                            userId,
                            accessCode,
                            error: parseError
                        }, '[DISCONNECT] Error parsing participant data for offline marking');
                    }
                }
                else {
                    logger.warn({ userId, accessCode }, '[DISCONNECT] No participant data found in Redis for ACTIVE participant');
                }
                // Don't emit participant list update for ACTIVE participants to avoid UI flicker
                // They should remain visible in leaderboards even when offline
            }
            else {
                // Unknown status or no participant found - conservative approach
                logger.warn({
                    userId,
                    accessCode,
                    participantStatus
                }, '[DISCONNECT] Unknown participant status, taking conservative approach (mark offline only)');
                // Mark as offline but don't remove - this preserves any existing scores
                const participantJson = await redis_1.redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    try {
                        const participantData = JSON.parse(participantJson);
                        participantData.online = false;
                        await redis_1.redisClient.hset(participantsKey, userId, JSON.stringify(participantData));
                        logger.info({ userId, accessCode }, '[DISCONNECT] Unknown status participant marked offline');
                    }
                    catch (parseError) {
                        logger.error({ userId, accessCode, error: parseError }, '[DISCONNECT] Error marking unknown status participant offline');
                    }
                }
            }
        }
    };
}
