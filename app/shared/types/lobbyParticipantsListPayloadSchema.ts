// Canonical Zod schema for lobby participants list payload
import { z } from 'zod';
import { participantDataSchema } from './socketEvents.zod';

export const lobbyParticipantsListPayloadSchema = z.object({
    participants: z.array(participantDataSchema),
    creator: z.object({
        userId: z.string(),
        username: z.string(),
        avatarEmoji: z.string(),
    }),
});
