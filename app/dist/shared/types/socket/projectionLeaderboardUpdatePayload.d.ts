import { z } from 'zod';
/**
 * Canonical payload for projector:projection_leaderboard_update event
 * Used for leaderboard snapshot updates on the projection page
 */
export declare const ProjectionLeaderboardUpdatePayloadSchema: z.ZodObject<{
    leaderboard: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        rank: z.ZodOptional<z.ZodNumber>;
        participationType: z.ZodOptional<z.ZodNativeEnum<typeof import("..").ParticipationType>>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
        participationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        score: number;
        avatarEmoji?: string | undefined;
        rank?: number | undefined;
        attemptCount?: number | undefined;
        participationType?: import("..").ParticipationType | undefined;
        participationId?: string | undefined;
    }, {
        userId: string;
        username: string;
        score: number;
        avatarEmoji?: string | undefined;
        rank?: number | undefined;
        attemptCount?: number | undefined;
        participationType?: import("..").ParticipationType | undefined;
        participationId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    leaderboard: {
        userId: string;
        username: string;
        score: number;
        avatarEmoji?: string | undefined;
        rank?: number | undefined;
        attemptCount?: number | undefined;
        participationType?: import("..").ParticipationType | undefined;
        participationId?: string | undefined;
    }[];
}, {
    leaderboard: {
        userId: string;
        username: string;
        score: number;
        avatarEmoji?: string | undefined;
        rank?: number | undefined;
        attemptCount?: number | undefined;
        participationType?: import("..").ParticipationType | undefined;
        participationId?: string | undefined;
    }[];
}>;
export type ProjectionLeaderboardUpdatePayload = z.infer<typeof ProjectionLeaderboardUpdatePayloadSchema>;
