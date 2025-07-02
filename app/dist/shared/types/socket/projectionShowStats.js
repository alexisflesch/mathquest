"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectionShowStatsPayloadSchema = exports.ProjectionShowStatsStatsSchema = void 0;
// Canonical type and Zod schema for the PROJECTION_SHOW_STATS event payload
const zod_1 = require("zod");
// The answer stats object is a mapping from answer option (string) to count (number)
exports.ProjectionShowStatsStatsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.number());
exports.ProjectionShowStatsPayloadSchema = zod_1.z.object({
    questionUid: zod_1.z.string(),
    show: zod_1.z.boolean(),
    stats: exports.ProjectionShowStatsStatsSchema, // e.g. { "A": 3, "B": 5 }
    timestamp: zod_1.z.number()
});
