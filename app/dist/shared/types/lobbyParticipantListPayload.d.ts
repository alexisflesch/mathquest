import { z } from 'zod';
export declare const lobbyParticipantSchema: z.ZodObject<{
    avatarEmoji: z.ZodString;
    username: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    avatarEmoji: string;
    userId?: string | undefined;
}, {
    username: string;
    avatarEmoji: string;
    userId?: string | undefined;
}>;
export declare const lobbyParticipantListPayloadSchema: z.ZodObject<{
    participants: z.ZodArray<z.ZodObject<{
        avatarEmoji: z.ZodString;
        username: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        avatarEmoji: string;
        userId?: string | undefined;
    }, {
        username: string;
        avatarEmoji: string;
        userId?: string | undefined;
    }>, "many">;
    creator: z.ZodObject<{
        avatarEmoji: z.ZodString;
        username: z.ZodString;
        userId: z.ZodString;
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
        avatarEmoji: string;
        userId?: string | undefined;
    }[];
}, {
    creator: {
        username: string;
        userId: string;
        avatarEmoji: string;
    };
    participants: {
        username: string;
        avatarEmoji: string;
        userId?: string | undefined;
    }[];
}>;
export type LobbyParticipant = z.infer<typeof lobbyParticipantSchema>;
export type LobbyParticipantListPayload = z.infer<typeof lobbyParticipantListPayloadSchema>;
