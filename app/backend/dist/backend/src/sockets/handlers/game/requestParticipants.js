"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestParticipantsHandler = requestParticipantsHandler;
const redis_1 = require("@/config/redis");
const zod_1 = require("zod");
const events_1 = require("@shared/types/socket/events");
// Inline schema for request_participants event
const requestParticipantsPayloadSchema = zod_1.z.object({ accessCode: zod_1.z.string().min(1) });
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
function requestParticipantsHandler(io, socket) {
    return async (payload) => {
        // Zod validation for payload
        const parseResult = requestParticipantsPayloadSchema.safeParse(payload);
        if (!parseResult.success)
            return;
        const { accessCode } = parseResult.data;
        const participantsHash = await redis_1.redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);
        const allParticipants = Object.values(participantsHash).map((p) => JSON.parse(p));
        // Deduplicate by userId
        const uniqueParticipantsMap = new Map();
        for (const participant of allParticipants) {
            if (!uniqueParticipantsMap.has(participant.userId)) {
                uniqueParticipantsMap.set(participant.userId, participant);
            }
        }
        const participants = Array.from(uniqueParticipantsMap.values());
        const gameParticipantsPayload = { participants };
        socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_PARTICIPANTS, gameParticipantsPayload);
    };
}
