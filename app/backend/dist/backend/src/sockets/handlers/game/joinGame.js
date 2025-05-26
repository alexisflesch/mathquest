"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGameHandler = joinGameHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
// import { GameInstanceService } from '@/core/services/gameInstanceService'; // Not directly used, consider removing if not needed elsewhere
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const logger = (0, logger_1.default)('JoinGameHandler');
// Update handler signature with shared types
function joinGameHandler(io, socket) {
    // Update payload type
    return async (payload) => {
        logger.debug({ payload }, 'Received join_game payload');
        // Zod validation for payload
        const parseResult = socketEvents_zod_1.joinGamePayloadSchema.safeParse(payload);
        logger.debug({ parseResult }, 'Result of joinGamePayloadSchema.safeParse');
        if (!parseResult.success) {
            const errorPayload = {
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
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
                const errorPayload = { message: 'Game not found.' };
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
                    const errorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload }, 'Emitting game_error: differed window not available');
                    socket.emit('game_error', errorPayload);
                    return;
                }
                const existing = await prisma_1.prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId }
                });
                logger.debug({ existing }, 'Existing participant for differed game');
                if (existing && existing.completedAt) {
                    const gameAlreadyPlayedPayload = { accessCode };
                    logger.info({ gameAlreadyPlayedPayload }, 'Emitting game_already_played');
                    socket.emit('game_already_played', gameAlreadyPlayedPayload);
                    return;
                }
            }
            else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz') {
                    roomName = `game_${accessCode}`;
                }
                else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.debug({ roomName, socketId: socket.id }, '[DEBUG] Player joining room');
                await socket.join(roomName);
                // --- DEBUG: Print room membership after join ---
                const joinedRoomSockets = io.sockets.adapter.rooms.get(roomName);
                const joinedRoomSocketIds = joinedRoomSockets ? Array.from(joinedRoomSockets) : [];
                console.log('[joinGame] Player joined room:', { roomName, socketId: socket.id, joinedRoomSocketIds });
                logger.debug({ roomName, socketId: socket.id, rooms: Array.from(socket.rooms) }, '[DEBUG] Player joined room');
                socket.data.currentGameRoom = roomName;
            }
            const participantService = new gameParticipantService_1.GameParticipantService();
            logger.debug({ userId, accessCode, username, avatarUrl }, 'Calling participantService.joinGame');
            const joinResult = await participantService.joinGame(userId, accessCode, username, avatarUrl);
            logger.debug({ joinResult }, 'Result of participantService.joinGame');
            if (!joinResult.success || !joinResult.participant) {
                const errorPayload = { message: joinResult.error || 'Join failed.' };
                logger.warn({ errorPayload }, 'Emitting game_error: join failed');
                socket.emit('game_error', errorPayload);
                return;
            }
            socket.data.userId = userId;
            socket.data.accessCode = accessCode;
            socket.data.username = joinResult.participant.user.username;
            // Redis keys
            const participantsKey = `mathquest:game:participants:${accessCode}`;
            const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
            const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;
            const participantDataForRedis = {
                // id: socket.id, // No longer using socket.id as the primary participant identifier in this hash
                userId: joinResult.participant.userId,
                username: joinResult.participant.user.username,
                avatarUrl: joinResult.participant.user.avatarUrl,
                joinedAt: joinResult.participant.joinedAt.toISOString(),
                score: joinResult.participant.score,
                online: true,
                lastSocketId: socket.id // Keep track of the latest socket ID for this user
            };
            logger.debug({ participantsKey, userId: joinResult.participant.userId, participantDataForRedis }, 'Storing participant in Redis by userId');
            // Store main participant data keyed by userId
            await redis_1.redisClient.hset(participantsKey, joinResult.participant.userId, JSON.stringify(participantDataForRedis));
            // Update mappings
            logger.debug({ userIdToSocketIdKey, userId, socketId: socket.id }, 'Updating userIdToSocketId mapping');
            await redis_1.redisClient.hset(userIdToSocketIdKey, userId, socket.id);
            logger.debug({ socketIdToUserIdKey, socketId: socket.id, userId }, 'Updating socketIdToUserId mapping');
            await redis_1.redisClient.hset(socketIdToUserIdKey, socket.id, userId);
            const gameJoinedPayload = {
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
                gameStatus: gameInstance.status,
                isDiffered: gameInstance.isDiffered,
                differedAvailableFrom: gameInstance.differedAvailableFrom?.toISOString(),
                differedAvailableTo: gameInstance.differedAvailableTo?.toISOString(),
            };
            logger.info({ gameJoinedPayload }, 'Emitting game_joined');
            socket.emit('game_joined', gameJoinedPayload);
            if (!gameInstance.isDiffered && socket.data.currentGameRoom) {
                const playerJoinedPayload = {
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
        }
        catch (err) {
            logger.error({ err, accessCode, userId, stack: err instanceof Error ? err.stack : undefined }, 'Error in joinGameHandler');
            const errorPayload = { message: 'Internal error joining game.' };
            socket.emit('game_error', errorPayload);
        }
    };
}
