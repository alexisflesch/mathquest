import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import { z } from 'zod';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { GameParticipantsPayload } from '@shared/types/socketEvents';

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
        const allParticipants = Object.values(participantsHash).map((p: any) => JSON.parse(p));
        // Deduplicate by userId
        const uniqueParticipantsMap = new Map();
        for (const participant of allParticipants) {
            if (!uniqueParticipantsMap.has(participant.userId)) {
                uniqueParticipantsMap.set(participant.userId, participant);
            }
        }
        const participants = Array.from(uniqueParticipantsMap.values());
        const gameParticipantsPayload: GameParticipantsPayload = { participants };
        socket.emit(SOCKET_EVENTS.GAME.GAME_PARTICIPANTS as any, gameParticipantsPayload);
    };
}
