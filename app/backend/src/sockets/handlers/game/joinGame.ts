import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameParticipantService } from '@/core/services/gameParticipantService';
// import { GameInstanceService } from '@/core/services/gameInstanceService'; // Not directly used, consider removing if not needed elsewhere
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import { z } from 'zod';
// Import shared types
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '@shared/types/socketEvents';
import {
    joinGamePayloadSchema,
    gameJoinedPayloadSchema,
    playerJoinedGamePayloadSchema,
    errorPayloadSchema,
    gameAlreadyPlayedPayloadSchema
} from '@shared/types/socketEvents.zod';

const logger = createLogger('JoinGameHandler');

// Use z.infer for all payload types
export type JoinGamePayload = z.infer<typeof joinGamePayloadSchema>;
export type GameJoinedPayload = z.infer<typeof gameJoinedPayloadSchema>;
export type PlayerJoinedGamePayload = z.infer<typeof playerJoinedGamePayloadSchema>;
export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
export type GameAlreadyPlayedPayload = z.infer<typeof gameAlreadyPlayedPayloadSchema>;

// Update handler signature with shared types
export function joinGameHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    // Update payload type
    return async (payload: JoinGamePayload) => {
        logger.debug({ payload }, 'Received join_game payload');
        // Zod validation for payload
        const parseResult = joinGamePayloadSchema.safeParse(payload);
        logger.debug({ parseResult }, 'Result of joinGamePayloadSchema.safeParse');
        if (!parseResult.success) {
            const errorPayload: ErrorPayload = {
                message: 'Invalid join game payload',
                code: 'INVALID_PAYLOAD',
            };
            logger.warn({ errorPayload }, 'Emitting game_error due to invalid payload');
            socket.emit('game_error', errorPayload);
            return;
        }
        const { accessCode, userId, username, avatarUrl } = parseResult.data;
        try {
            logger.debug({ accessCode, userId, username, avatarUrl }, 'Looking up gameInstance');
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    status: true,
                    initiatorUserId: true,
                    playMode: true
                }
            });
            logger.debug({ gameInstance }, 'Result of gameInstance lookup');
            if (!gameInstance) {
                const errorPayload: ErrorPayload = { message: 'Game not found.' };
                logger.warn({ errorPayload }, 'Emitting game_error: game not found');
                socket.emit('game_error', errorPayload);
                return;
            }
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            if (gameInstance.isDiffered) {
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    const errorPayload: ErrorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload }, 'Emitting game_error: differed window not available');
                    socket.emit('game_error', errorPayload);
                    return;
                }
                const existing = await prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId }
                });
                logger.debug({ existing }, 'Existing participant for differed game');
                if (existing && existing.completedAt) {
                    const gameAlreadyPlayedPayload: GameAlreadyPlayedPayload = { accessCode };
                    logger.info({ gameAlreadyPlayedPayload }, 'Emitting game_already_played');
                    socket.emit('game_already_played', gameAlreadyPlayedPayload);
                    return;
                }
            } else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                } else if (gameInstance.playMode === 'tournament') {
                    roomName = `tournament_${accessCode}`;
                }
                logger.debug({ roomName }, 'Joining socket.io room');
                await socket.join(roomName);
                socket.data.currentGameRoom = roomName;
            }
            const participantService = new GameParticipantService();
            logger.debug({ userId, accessCode, username, avatarUrl }, 'Calling participantService.joinGame');
            const joinResult = await participantService.joinGame(userId, accessCode, username, avatarUrl);
            logger.debug({ joinResult }, 'Result of participantService.joinGame');
            if (!joinResult.success || !joinResult.participant) {
                const errorPayload: ErrorPayload = { message: joinResult.error || 'Join failed.' };
                logger.warn({ errorPayload }, 'Emitting game_error: join failed');
                socket.emit('game_error', errorPayload);
                return;
            }
            socket.data.userId = userId;
            socket.data.accessCode = accessCode;
            socket.data.username = joinResult.participant.user.username;
            const redisKey = `mathquest:game:participants:${accessCode}`;
            const participantDataForRedis = {
                id: socket.id,
                userId: joinResult.participant.userId,
                username: joinResult.participant.user.username,
                avatarUrl: joinResult.participant.user.avatarUrl,
                joinedAt: joinResult.participant.joinedAt.toISOString(),
                score: joinResult.participant.score,
                online: true
            };
            logger.debug({ redisKey, participantDataForRedis }, 'Storing participant in Redis');
            await redisClient.hset(redisKey, socket.id, JSON.stringify(participantDataForRedis));
            const gameJoinedPayload: GameJoinedPayload = {
                accessCode,
                participant: {
                    id: joinResult.participant.id,
                    userId: joinResult.participant.userId,
                    username: joinResult.participant.user.username,
                    avatarUrl: joinResult.participant.user.avatarUrl || undefined,
                    score: joinResult.participant.score,
                    joinedAt: joinResult.participant.joinedAt.toISOString(),
                    online: true,
                },
                gameStatus: gameInstance.status as GameJoinedPayload['gameStatus'],
                isDiffered: gameInstance.isDiffered,
                differedAvailableFrom: gameInstance.differedAvailableFrom?.toISOString(),
                differedAvailableTo: gameInstance.differedAvailableTo?.toISOString(),
            };
            logger.info({ gameJoinedPayload }, 'Emitting game_joined');
            socket.emit('game_joined', gameJoinedPayload);
            if (!gameInstance.isDiffered && socket.data.currentGameRoom) {
                const playerJoinedPayload: PlayerJoinedGamePayload = {
                    participant: {
                        id: joinResult.participant.id,
                        userId: joinResult.participant.userId,
                        username: joinResult.participant.user.username,
                        avatarUrl: joinResult.participant.user.avatarUrl || undefined,
                        score: joinResult.participant.score,
                        online: true
                    }
                };
                logger.info({ playerJoinedPayload, room: socket.data.currentGameRoom }, 'Emitting player_joined_game to room');
                socket.to(socket.data.currentGameRoom).emit('player_joined_game', playerJoinedPayload);
            }
        } catch (err) {
            logger.error({ err, accessCode, userId, stack: err instanceof Error ? err.stack : undefined }, 'Error in joinGameHandler');
            const errorPayload: ErrorPayload = { message: 'Internal error joining game.' };
            socket.emit('game_error', errorPayload);
        }
    };
}
