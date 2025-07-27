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
        id: string;
        userId: string;
        username: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        joinedAt?: string | number | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        attemptCount?: number | undefined;
    }, {
        id: string;
        userId: string;
        username: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        joinedAt?: string | number | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        attemptCount?: number | undefined;
    }>, "many">;
    creator: z.ZodObject<{
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        avatarEmoji: string;
    }, {
        userId: string;
        username: string;
        avatarEmoji: string;
    }>;
}, "strip", z.ZodTypeAny, {
    creator: {
        userId: string;
        username: string;
        avatarEmoji: string;
    };
    participants: {
        id: string;
        userId: string;
        username: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        joinedAt?: string | number | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        attemptCount?: number | undefined;
    }[];
}, {
    creator: {
        userId: string;
        username: string;
        avatarEmoji: string;
    };
    participants: {
        id: string;
        userId: string;
        username: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        joinedAt?: string | number | undefined;
        avatarEmoji?: string | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        attemptCount?: number | undefined;
    }[];
}>;
