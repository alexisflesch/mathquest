import { z } from 'zod';
import { ParticipationType } from '../core/participant';

/**
 * Canonical Zod schema for a leaderboard entry (projection payload)
 * This matches the LeaderboardEntry interface in core/participant.ts
 */
export const LeaderboardEntrySchema = z.object({
    userId: z.string(),
    username: z.string(),
    avatarEmoji: z.string().optional(),
    score: z.number(),
    rank: z.number().optional(),
    participationType: z.nativeEnum(ParticipationType).optional(),
    attemptCount: z.number().optional(),
    participationId: z.string().optional()
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
