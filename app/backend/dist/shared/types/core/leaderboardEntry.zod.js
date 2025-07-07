"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardEntrySchema = void 0;
const zod_1 = require("zod");
const participant_1 = require("../core/participant");
/**
 * Canonical Zod schema for a leaderboard entry (projection payload)
 * This matches the LeaderboardEntry interface in core/participant.ts
 */
exports.LeaderboardEntrySchema = zod_1.z.object({
    userId: zod_1.z.string(),
    username: zod_1.z.string(),
    avatarEmoji: zod_1.z.string().optional(),
    score: zod_1.z.number(),
    rank: zod_1.z.number().optional(),
    participationType: zod_1.z.nativeEnum(participant_1.ParticipationType).optional(),
    attemptCount: zod_1.z.number().optional(),
    participationId: zod_1.z.string().optional()
});
