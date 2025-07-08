import { z } from 'zod';
export declare const lobbyParticipantsListPayloadSchema: z.ZodObject<{
    participants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodString;
        score: z.ZodNumber;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        socketId: z.ZodOptional<z.ZodString>;
        isDeferred: z.ZodOptional<z.ZodBoolean>;
        cookieId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        userId: string;
        avatarEmoji: string;
        id: string;
        score: number;
        cookieId?: string | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
    }, {
        username: string;
        userId: string;
        avatarEmoji: string;
        id: string;
        score: number;
        cookieId?: string | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
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
        avatarEmoji: string;
        id: string;
        score: number;
        cookieId?: string | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
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
        avatarEmoji: string;
        id: string;
        score: number;
        cookieId?: string | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
    }[];
}>;
