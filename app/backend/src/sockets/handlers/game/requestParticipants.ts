import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import { z } from 'zod';

// Inline schema for request_participants event
const requestParticipantsPayloadSchema = z.object({ accessCode: z.string().min(1) });
export type RequestParticipantsPayload = z.infer<typeof requestParticipantsPayloadSchema>;

const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';

export function requestParticipantsHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: RequestParticipantsPayload) => {
        // Zod validation for payload
        const parseResult = requestParticipantsPayloadSchema.safeParse(payload);
        if (!parseResult.success) return;
        const { accessCode } = parseResult.data;
        const participantsHash = await redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);
        const participants = Object.values(participantsHash).map((p: any) => JSON.parse(p));
        socket.emit('game_participants', { participants });
    };
}
