"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGameHandler = joinGameHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const logger = (0, logger_1.default)('JoinGameHandler');
function joinGameHandler(io, socket) {
    return async (payload) => {
        const { accessCode, playerId, username, avatarUrl, isDiffered } = payload;
        try {
            // Fetch game instance
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    status: true
                }
            });
            if (!gameInstance) {
                socket.emit('game_error', { message: 'Game not found.' });
                return;
            }
            // Differed mode logic
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            const inDifferedWindow = gameInstance.isDiffered && (!from || now >= from) && (!to || now <= to);
            if (gameInstance.isDiffered) {
                if (!inDifferedWindow) {
                    socket.emit('game_error', { message: 'Differed mode not available at this time.' });
                    return;
                }
                // Prevent replay: check if participant already completed
                const existing = await prisma_1.prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, playerId }
                });
                if (existing && existing.completedAt) {
                    socket.emit('game_already_played', { accessCode });
                    return;
                }
                // Join per-user room for differed mode
                const room = `live_${accessCode}_${playerId}`;
                await socket.join(room);
            }
            else {
                // Join shared room for live/classic mode
                await socket.join(`live_${accessCode}`);
            }
            // Register participant (creates if not exists)
            const participantService = new gameParticipantService_1.GameParticipantService();
            const joinResult = await participantService.joinGame(playerId, accessCode);
            if (!joinResult.success) {
                socket.emit('game_error', { message: joinResult.error || 'Join failed.' });
                return;
            }
            // Store participant in Redis for real-time presence
            const redisKey = `mathquest:game:participants:${accessCode}`;
            const participantData = {
                id: socket.id,
                playerId,
                username,
                avatarUrl,
                joinedAt: Date.now(),
                score: joinResult.participant?.score ?? 0,
                online: true
            };
            await redis_1.redisClient.hset(redisKey, socket.id, JSON.stringify(participantData));
            // Emit joined event
            socket.emit('game_joined', { accessCode, participant: joinResult.participant });
            // Optionally emit to room for others
            if (!gameInstance.isDiffered) {
                socket.to(`live_${accessCode}`).emit('player_joined_game', { playerId, username, avatarUrl });
            }
        }
        catch (err) {
            logger.error({ err, accessCode, playerId }, 'Error in joinGameHandler');
            socket.emit('game_error', { message: 'Internal error joining game.' });
        }
    };
}
