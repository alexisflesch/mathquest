import { z } from 'zod';

export const lobbyParticipantSchema = z.object({
    avatarEmoji: z.string(),
    username: z.string(),
    userId: z.string().optional(), // Optional for now, can be enforced if needed
});

export const lobbyParticipantListPayloadSchema = z.object({
    participants: z.array(lobbyParticipantSchema),
    creator: z.object({
        avatarEmoji: z.string(),
        username: z.string(),
        userId: z.string(),
    }),
});

export type LobbyParticipant = z.infer<typeof lobbyParticipantSchema>;
export type LobbyParticipantListPayload = z.infer<typeof lobbyParticipantListPayloadSchema>;
