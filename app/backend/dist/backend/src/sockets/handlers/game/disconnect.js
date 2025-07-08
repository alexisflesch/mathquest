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
            logger.info({ userId, accessCode }, '[DISCONNECT] No remaining sockets for this user in this game, removing participant');
            // Remove participant from Redis
            await redis_1.redisClient.hdel(participantsKey, userId);
            // Remove from database if they're still in PENDING status
            // Don't remove ACTIVE participants as they might have started playing
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
                else {
                    logger.info({
                        userId,
                        accessCode
                    }, '[DISCONNECT] No PENDING participant found in database to remove');
                }
            }
            catch (dbError) {
                logger.error({
                    userId,
                    accessCode,
                    error: dbError
                }, '[DISCONNECT] Error removing participant from database');
            }
            // Emit updated participant list
            logger.info({ userId, accessCode }, '[DISCONNECT] Emitting updated participant list');
            await (0, lobbyHandler_1.emitParticipantList)(io, accessCode);
        }
    };
}
