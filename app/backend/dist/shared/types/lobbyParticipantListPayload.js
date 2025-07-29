"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lobbyParticipantListPayloadSchema = exports.lobbyParticipantSchema = void 0;
const zod_1 = require("zod");
exports.lobbyParticipantSchema = zod_1.z.object({
    avatarEmoji: zod_1.z.string(),
    username: zod_1.z.string(),
    userId: zod_1.z.string().optional(), // Optional for now, can be enforced if needed
});
exports.lobbyParticipantListPayloadSchema = zod_1.z.object({
    participants: zod_1.z.array(exports.lobbyParticipantSchema),
    creator: zod_1.z.object({
        avatarEmoji: zod_1.z.string(),
        username: zod_1.z.string(),
        userId: zod_1.z.string(),
    }),
});
