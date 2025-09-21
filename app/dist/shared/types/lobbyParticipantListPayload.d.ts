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
        userId: string;
        username: string;
        avatarEmoji: string;
    }, {
        userId: string;
        username: string;
        avatarEmoji: string;
    }>;
}, "strip", z.ZodTypeAny, {
    participants: {
        username: string;
        avatarEmoji: string;
        userId?: string | undefined;
    }[];
    creator: {
        userId: string;
        username: string;
        avatarEmoji: string;
    };
}, {
    participants: {
        username: string;
        avatarEmoji: string;
        userId?: string | undefined;
    }[];
    creator: {
        userId: string;
        username: string;
        avatarEmoji: string;
    };
}>;
export type LobbyParticipant = z.infer<typeof lobbyParticipantSchema>;
export type LobbyParticipantListPayload = z.infer<typeof lobbyParticipantListPayloadSchema>;
