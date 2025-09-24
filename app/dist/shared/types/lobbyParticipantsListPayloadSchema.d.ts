import { z } from 'zod';
export declare const lobbyParticipantsListPayloadSchema: z.ZodObject<{
    participants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        socketId: z.ZodOptional<z.ZodString>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        userId: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        attemptCount?: number | undefined;
    }, {
        username: string;
        userId: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        attemptCount?: number | undefined;
    }>, "many">;
    creator: z.ZodObject<{
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        username: string;
        userId: string;
        avatarEmoji: string;
    }, {
        username: string;
        userId: string;
        avatarEmoji: string;
    }>;
}, "strip", z.ZodTypeAny, {
    creator: {
        username: string;
        userId: string;
        avatarEmoji: string;
    };
    participants: {
        username: string;
        userId: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        attemptCount?: number | undefined;
    }[];
}, {
    creator: {
        username: string;
        userId: string;
        avatarEmoji: string;
    };
    participants: {
        username: string;
        userId: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        attemptCount?: number | undefined;
    }[];
}>;
