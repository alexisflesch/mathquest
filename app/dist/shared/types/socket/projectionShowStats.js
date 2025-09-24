"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectionShowStatsPayloadSchema = exports.ProjectionShowStatsStatsSchema = exports.NumericStatsSchema = exports.MultipleChoiceStatsSchema = void 0;
// Canonical type and Zod schema for the PROJECTION_SHOW_STATS event payload
const zod_1 = require("zod");
// Schema for multiple choice question stats (legacy format)
exports.MultipleChoiceStatsSchema = zod_1.z.object({
    type: zod_1.z.literal('multipleChoice'),
    stats: zod_1.z.record(zod_1.z.string(), zod_1.z.number()), // e.g. { "A": 3, "B": 5 }
    totalUsers: zod_1.z.number()
});
// Schema for numeric question stats (new format)
exports.NumericStatsSchema = zod_1.z.object({
    type: zod_1.z.literal('numeric'),
    values: zod_1.z.array(zod_1.z.number()), // Array of all numeric values
    totalAnswers: zod_1.z.number()
});
// Union schema for backward compatibility
exports.ProjectionShowStatsStatsSchema = zod_1.z.union([
    // Legacy format for backward compatibility (multiple choice questions)
    zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    // New format with type discrimination
    exports.MultipleChoiceStatsSchema,
    exports.NumericStatsSchema
]);
exports.ProjectionShowStatsPayloadSchema = zod_1.z.object({
    questionUid: zod_1.z.string().optional(), // Allow missing questionUid for hide events
    show: zod_1.z.boolean(),
    stats: exports.ProjectionShowStatsStatsSchema,
    timestamp: zod_1.z.number()
});
