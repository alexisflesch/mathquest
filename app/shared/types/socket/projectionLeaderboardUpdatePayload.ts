import { z } from 'zod';
import { LeaderboardEntrySchema } from '../core/leaderboardEntry.zod';

/**
 * Canonical payload for projector:projection_leaderboard_update event
 * Used for leaderboard snapshot updates on the projection page
 */
export const ProjectionLeaderboardUpdatePayloadSchema = z.object({
    leaderboard: z.array(LeaderboardEntrySchema)
});

export type ProjectionLeaderboardUpdatePayload = z.infer<typeof ProjectionLeaderboardUpdatePayloadSchema>;
