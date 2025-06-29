"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectionLeaderboardUpdatePayloadSchema = void 0;
const zod_1 = require("zod");
const leaderboardEntry_zod_1 = require("../core/leaderboardEntry.zod");
/**
 * Canonical payload for projector:projection_leaderboard_update event
 * Used for leaderboard snapshot updates on the projection page
 */
exports.ProjectionLeaderboardUpdatePayloadSchema = zod_1.z.object({
    leaderboard: zod_1.z.array(leaderboardEntry_zod_1.LeaderboardEntrySchema)
});
