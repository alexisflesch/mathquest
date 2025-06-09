"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = disconnectHandler;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const participantCountUtils_1 = require("@/sockets/utils/participantCountUtils");
const logger = (0, logger_1.default)('DisconnectHandler');
function disconnectHandler(io, socket) {
    return async (reason) => {
        logger.info({ socketId: socket.id, userId: socket.data.userId, accessCode: socket.data.accessCode, reason }, 'Client disconnected');
        const { userId, accessCode, currentGameRoom } = socket.data;
        if (!userId || !accessCode) {
            logger.warn({ socketId: socket.id, reason }, 'Disconnected socket had no userId or accessCode in socket.data. Cannot process participant update.');
            return; // Exit early, don't try to emit participant count without accessCode
        }
        const participantsKey = `mathquest:game:participants:${accessCode}`;
        const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
        const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;
        try {
            // Check if Redis client is still connected before proceeding
            if (redis_1.redisClient.status === 'end' || redis_1.redisClient.status === 'close') {
                logger.warn({ socketId: socket.id, userId, accessCode, redisStatus: redis_1.redisClient.status }, 'Redis connection is closed, skipping disconnect cleanup');
                return;
            }
            // 1. Clean up socketIdToUserId mapping
            logger.debug({ socketIdToUserIdKey, socketId: socket.id }, 'Removing socketId from socketIdToUserId mapping');
            await redis_1.redisClient.hdel(socketIdToUserIdKey, socket.id);
            // 2. Check if this was the last active socket for the user
            const lastActiveSocketId = await redis_1.redisClient.hget(userIdToSocketIdKey, userId);
            if (lastActiveSocketId === socket.id) {
                // This was the primary/last known socket for the user. Mark as offline or remove.
                logger.info({ userId, accessCode, socketId: socket.id }, 'Disconnected socket was the last known active socket for the user.');
                // Remove from userIdToSocketId mapping as this socket is gone
                logger.debug({ userIdToSocketIdKey, userId }, 'Removing user from userIdToSocketId mapping as their last socket disconnected');
                await redis_1.redisClient.hdel(userIdToSocketIdKey, userId);
                // Update participant status in the main hash
                const participantJson = await redis_1.redisClient.hget(participantsKey, userId);
                if (participantJson) {
                    const participantData = JSON.parse(participantJson);
                    participantData.online = false;
                    // Optionally, update lastSeen or similar timestamp
                    // participantData.lastSeen = new Date().toISOString();
                    logger.debug({ participantsKey, userId, participantDataUpdate: { online: false } }, 'Updating participant to offline in Redis');
                    await redis_1.redisClient.hset(participantsKey, userId, JSON.stringify(participantData));
                    // Notify other clients in the game room (if applicable)
                    if (currentGameRoom) {
                        const playerLeftPayload = { userId, socketId: socket.id }; // Added socketId
                        logger.info({ playerLeftPayload, room: currentGameRoom }, 'Emitting player_left_game to room');
                        io.to(currentGameRoom).emit('player_left_game', playerLeftPayload);
                    }
                    // Emit updated participant count to teacher dashboard
                    await (0, participantCountUtils_1.emitParticipantCount)(io, accessCode);
                }
                else {
                    logger.warn({ participantsKey, userId }, 'Participant data not found in Redis for disconnected user. Cannot mark as offline.');
                }
            }
            else {
                // Another socket is still active for this user, or this was an old/stale socket.
                logger.info({ userId, accessCode, disconnectedSocketId: socket.id, currentActiveSocketId: lastActiveSocketId }, 'Disconnected socket was not the last known active socket for the user. No "offline" status change needed based on this disconnect.');
            }
            // Additional cleanup: if the game instance itself needs to know about disconnections,
            // e.g., for live games to end if all players leave, that logic would go here or be triggered.
        }
        catch (err) {
            // Check if the error is related to Redis being closed
            if (err instanceof Error && (err.message.includes('Connection is closed') || err.message.includes('Connection is already closed'))) {
                logger.warn({ socketId: socket.id, userId, accessCode }, 'Redis connection closed during disconnect handling, skipping cleanup');
                return;
            }
            logger.error({ err, socketId: socket.id, userId, accessCode, stack: err instanceof Error ? err.stack : undefined }, 'Error in disconnectHandler');
        }
    };
}
