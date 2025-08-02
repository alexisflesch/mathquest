import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import { emitParticipantList } from '../lobbyHandler';
import createLogger from '@/utils/logger';

import { z } from 'zod';

const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const SOCKETID_TO_USERID_KEY_PREFIX = 'mathquest:socketIdToUserId:';
const USERID_TO_SOCKETID_KEY_PREFIX = 'mathquest:userIdToSocketId:';

export function disconnectHandler(io: SocketIOServer, socket: Socket) {
    return async () => {
        const logger = createLogger('DisconnectHandler');

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
        const userId = await redisClient.hget(socketIdToUserIdKey, socket.id);

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
        await redisClient.hdel(userIdToSocketIdKey, userId);
        await redisClient.hdel(socketIdToUserIdKey, socket.id);

        // Check if any other sockets for this userId remain in this game
        const remainingSockets = await redisClient.hvals(userIdToSocketIdKey);
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
                const { prisma } = await import('@/db/prisma');
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
            } catch (dbError) {
                logger.error({
                    userId,
                    accessCode,
                    error: dbError
                }, '[DISCONNECT] Error checking participant status');
            }

            // Handle disconnect based on participant status AND leaderboard presence

            // CRITICAL: Check if user has any score in leaderboard first
            const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`;
            const userScore = await redisClient.zscore(leaderboardKey, userId);
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
                const participantJson = await redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    try {
                        const participantData = JSON.parse(participantJson);
                        participantData.online = false;
                        await redisClient.hset(participantsKey, userId, JSON.stringify(participantData));

                        logger.info({
                            userId,
                            accessCode,
                            note: 'LEADERBOARD-PRESERVATION: Participant with score marked offline but preserved'
                        }, '[DISCONNECT] Participant with leaderboard score preserved');
                    } catch (parseError) {
                        logger.error({
                            userId,
                            accessCode,
                            error: parseError
                        }, '[DISCONNECT] Error marking participant with score as offline');
                    }
                } else {
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
                await redisClient.hdel(participantsKey, userId);

                // Remove from database
                try {
                    const { prisma } = await import('@/db/prisma');
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
                } catch (dbError) {
                    logger.error({
                        userId,
                        accessCode,
                        error: dbError
                    }, '[DISCONNECT] Error removing PENDING participant from database');
                }

                // Emit updated participant list
                await emitParticipantList(io, accessCode);
            } else if (participantStatus === 'ACTIVE') {
                // ACTIVE participants have started playing - keep them in leaderboard but mark offline
                logger.info({ userId, accessCode }, '[DISCONNECT] Marking ACTIVE participant as offline (preserving leaderboard presence)');

                // Get current participant data from Redis
                const participantJson = await redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    try {
                        const participantData = JSON.parse(participantJson);
                        participantData.online = false;
                        // Don't remove from Redis - just mark as offline to preserve leaderboard
                        await redisClient.hset(participantsKey, userId, JSON.stringify(participantData));

                        logger.info({
                            userId,
                            accessCode,
                            note: 'LEADERBOARD-PRESERVATION: ACTIVE participant marked offline but kept in Redis for leaderboard'
                        }, '[DISCONNECT] ACTIVE participant preserved in leaderboard');
                    } catch (parseError) {
                        logger.error({
                            userId,
                            accessCode,
                            error: parseError
                        }, '[DISCONNECT] Error parsing participant data for offline marking');
                    }
                } else {
                    logger.warn({ userId, accessCode }, '[DISCONNECT] No participant data found in Redis for ACTIVE participant');
                }

                // Don't emit participant list update for ACTIVE participants to avoid UI flicker
                // They should remain visible in leaderboards even when offline
            } else {
                // Unknown status or no participant found - conservative approach
                logger.warn({
                    userId,
                    accessCode,
                    participantStatus
                }, '[DISCONNECT] Unknown participant status, taking conservative approach (mark offline only)');

                // Mark as offline but don't remove - this preserves any existing scores
                const participantJson = await redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    try {
                        const participantData = JSON.parse(participantJson);
                        participantData.online = false;
                        await redisClient.hset(participantsKey, userId, JSON.stringify(participantData));
                        logger.info({ userId, accessCode }, '[DISCONNECT] Unknown status participant marked offline');
                    } catch (parseError) {
                        logger.error({ userId, accessCode, error: parseError }, '[DISCONNECT] Error marking unknown status participant offline');
                    }
                }
            }
        }
    };
}
