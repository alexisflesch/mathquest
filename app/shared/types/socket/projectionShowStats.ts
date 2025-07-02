// Canonical type and Zod schema for the PROJECTION_SHOW_STATS event payload
import { z } from 'zod';

// The answer stats object is a mapping from answer option (string) to count (number)
export const ProjectionShowStatsStatsSchema = z.record(z.string(), z.number());

export const ProjectionShowStatsPayloadSchema = z.object({
    questionUid: z.string().optional(), // Allow missing questionUid for hide events
    show: z.boolean(),
    stats: ProjectionShowStatsStatsSchema, // e.g. { "A": 3, "B": 5 }
    timestamp: z.number()
});

export type ProjectionShowStatsPayload = z.infer<typeof ProjectionShowStatsPayloadSchema>;
