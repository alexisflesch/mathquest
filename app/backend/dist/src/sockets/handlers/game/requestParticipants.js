"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestParticipantsHandler = requestParticipantsHandler;
const redis_1 = require("@/config/redis");
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
function requestParticipantsHandler(io, socket) {
    return async (payload) => {
        const { accessCode } = payload;
        if (!accessCode)
            return;
        const participantsHash = await redis_1.redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);
        const participants = Object.values(participantsHash).map((p) => JSON.parse(p));
        socket.emit('game_participants', { participants });
    };
}
