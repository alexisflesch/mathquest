import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';

import { z } from 'zod';

const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        // Look up userId for this socket
        const socketIdToUserIdKey = `${SOCKETID_TO_USERID_KEY_PREFIX}`;
        const userId = await redisClient.hget(socketIdToUserIdKey, socket.id);
        if (!userId) return;
        // Remove this socket from userIdToSocketId mapping
        const userIdToSocketIdKey = `${USERID_TO_SOCKETID_KEY_PREFIX}`;
        await redisClient.hdel(userIdToSocketIdKey, userId);
        await redisClient.hdel(socketIdToUserIdKey, socket.id);
        // Check if any other sockets for this userId remain
        const remainingSockets = await redisClient.hvals(userIdToSocketIdKey);
        const stillConnected = remainingSockets.includes(socket.id);
        if (!stillConnected) {
            // Remove participant from all games if no sockets remain for this user
            const keys = await redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);
            for (const key of keys) {
                await redisClient.hdel(key, userId);
                // Extract accessCode from key
                const match = key.match(/mathquest:game:participants:(.+)$/);
                if (match) {
                    const accessCode = match[1];
                    // Fetch all participants for this game
                    const dbParticipants = await import('@/db/prisma').then(m => m.prisma.gameParticipant.findMany({
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
                    const gameInstance = await import('@/db/prisma').then(m => m.prisma.gameInstance.findUnique({ where: { accessCode }, select: { initiatorUserId: true } }));
                    const creator = participants.find(p => p.userId === gameInstance?.initiatorUserId) || participants[0];
                    const payload = { participants, creator };
                    // Validate with Zod
                    const { lobbyParticipantListPayloadSchema } = await import('@shared/types/lobbyParticipantListPayload');
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
