"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestParticipantsHandler = requestParticipantsHandler;
const redis_1 = require("@/config/redis");
const zod_1 = require("zod");
// Inline schema for request_participants event
const requestParticipantsPayloadSchema = zod_1.z.object({ accessCode: zod_1.z.string().min(1) });
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
// TODO: Import or define type for:
// - game_participants
function requestParticipantsHandler(io, socket) {
    return async (payload) => {
        // Zod validation for payload
        const parseResult = requestParticipantsPayloadSchema.safeParse(payload);
        if (!parseResult.success)
            return;
        const { accessCode } = parseResult.data;
        const participantsHash = await redis_1.redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);
        const participants = Object.values(participantsHash).map((p) => JSON.parse(p));
        socket.emit('game_participants', { participants }); // TODO: Define shared type if missing
    };
}
