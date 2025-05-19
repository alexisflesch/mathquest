import { z } from 'zod';
import { joinGamePayloadSchema, gameAnswerPayloadSchema } from '@shared/types/socketEvents.zod';

export type JoinGamePayload = z.infer<typeof joinGamePayloadSchema>;
export type GameAnswerPayload = z.infer<typeof gameAnswerPayloadSchema>;
