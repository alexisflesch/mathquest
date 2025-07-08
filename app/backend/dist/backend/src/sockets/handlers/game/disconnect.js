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
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = disconnectHandler;
const redis_1 = require("@/config/redis");
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';
function disconnectHandler(io, socket) {
    return async () => {
        // Look up userId for this socket
        const socketIdToUserIdKey = `${SOCKETID_TO_USERID_KEY_PREFIX}`;
        const userId = await redis_1.redisClient.hget(socketIdToUserIdKey, socket.id);
        if (!userId)
            return;
        // Remove this socket from userIdToSocketId mapping
        const userIdToSocketIdKey = `${USERID_TO_SOCKETID_KEY_PREFIX}`;
        await redis_1.redisClient.hdel(userIdToSocketIdKey, userId);
        await redis_1.redisClient.hdel(socketIdToUserIdKey, socket.id);
        // Check if any other sockets for this userId remain
        const remainingSockets = await redis_1.redisClient.hvals(userIdToSocketIdKey);
        const stillConnected = remainingSockets.includes(socket.id);
        if (!stillConnected) {
            // Remove participant from all games if no sockets remain for this user
            const keys = await redis_1.redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);
            for (const key of keys) {
                await redis_1.redisClient.hdel(key, userId);
                // Extract accessCode from key
                const match = key.match(/mathquest:game:participants:(.+)$/);
                if (match) {
                    const accessCode = match[1];
                    // Fetch all participants for this game
                    const dbParticipants = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma.gameParticipant.findMany({
                        where: { gameInstance: { accessCode } },
                        include: { user: true }
                    }));
                    // Deduplicate by userId (canonical)
                    const uniqueMap = new Map();
                    for (const p of await dbParticipants) {
                        if (!uniqueMap.has(p.userId)) {
                            uniqueMap.set(p.userId, {
                                avatarEmoji: p.user?.avatarEmoji || '🐼',
                                username: p.user?.username || 'Unknown',
                                userId: p.userId
                            });
                        }
                    }
                    const participants = Array.from(uniqueMap.values());
                    // Find creator (initiatorUserId)
                    const gameInstance = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma.gameInstance.findUnique({ where: { accessCode }, select: { initiatorUserId: true } }));
                    const creator = participants.find(p => p.userId === gameInstance?.initiatorUserId) || participants[0];
                    const payload = { participants, creator };
                    // Validate with Zod
                    const { lobbyParticipantListPayloadSchema } = await Promise.resolve().then(() => __importStar(require('@shared/types/lobbyParticipantListPayload')));
                    const parseResult = lobbyParticipantListPayloadSchema.safeParse(payload);
                    if (parseResult.success) {
                        const roomName = `game_${accessCode}`;
                        io.to(roomName).emit('participants_list', parseResult.data);
                    }
                }
            }
        }
    };
}
