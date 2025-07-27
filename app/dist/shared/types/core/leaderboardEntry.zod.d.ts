import { z } from 'zod';
import { ParticipationType } from '../core/participant';
/**
 * Canonical Zod schema for a leaderboard entry (projection payload)
 * This matches the LeaderboardEntry interface in core/participant.ts
 */
export declare const LeaderboardEntrySchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    avatarEmoji: z.ZodOptional<z.ZodString>;
    score: z.ZodNumber;
    rank: z.ZodOptional<z.ZodNumber>;
    participationType: z.ZodOptional<z.ZodNativeEnum<typeof ParticipationType>>;
    attemptCount: z.ZodOptional<z.ZodNumber>;
    participationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    username: string;
    score: number;
    avatarEmoji?: string | undefined;
    rank?: number | undefined;
    attemptCount?: number | undefined;
    participationType?: ParticipationType | undefined;
    participationId?: string | undefined;
}, {
    userId: string;
    username: string;
    score: number;
    avatarEmoji?: string | undefined;
    rank?: number | undefined;
    attemptCount?: number | undefined;
    participationType?: ParticipationType | undefined;
    participationId?: string | undefined;
}>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
