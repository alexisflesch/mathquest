// Canonical type and Zod schema for the PROJECTION_SHOW_STATS event payload
import { z } from 'zod';

// Schema for multiple choice question stats (legacy format)
export const MultipleChoiceStatsSchema = z.object({
    type: z.literal('multipleChoice'),
    stats: z.record(z.string(), z.number()), // e.g. { "A": 3, "B": 5 }
    totalUsers: z.number()
});

// Schema for numeric question stats (new format)
export const NumericStatsSchema = z.object({
    type: z.literal('numeric'),
    values: z.array(z.number()), // Array of all numeric values
    totalAnswers: z.number()
});

// Union schema for backward compatibility
export const ProjectionShowStatsStatsSchema = z.union([
    // Legacy format for backward compatibility (multiple choice questions)
    z.record(z.string(), z.number()),
    // New format with type discrimination
    MultipleChoiceStatsSchema,
    NumericStatsSchema
]);

export const ProjectionShowStatsPayloadSchema = z.object({
    questionUid: z.string().optional(), // Allow missing questionUid for hide events
    show: z.boolean(),
    stats: ProjectionShowStatsStatsSchema,
    timestamp: z.number()
});

export type ProjectionShowStatsPayload = z.infer<typeof ProjectionShowStatsPayloadSchema>;
export type MultipleChoiceStats = z.infer<typeof MultipleChoiceStatsSchema>;
export type NumericStats = z.infer<typeof NumericStatsSchema>;
