"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lobbyParticipantsListPayloadSchema = void 0;
// Canonical Zod schema for lobby participants list payload
const zod_1 = require("zod");
const socketEvents_zod_1 = require("./socketEvents.zod");
exports.lobbyParticipantsListPayloadSchema = zod_1.z.object({
    participants: zod_1.z.array(socketEvents_zod_1.participantDataSchema),
    creator: zod_1.z.object({
        userId: zod_1.z.string(),
        username: zod_1.z.string(),
        avatarEmoji: zod_1.z.string(),
    }),
});
