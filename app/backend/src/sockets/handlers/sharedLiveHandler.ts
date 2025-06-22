import { Server as SocketIOServer, Socket } from 'socket.io';
import { calculateLeaderboard } from './sharedLeaderboard';
import { collectAnswers } from './sharedAnswers';
import createLogger from '@/utils/logger';
import { getFullGameState, GameState } from '@/core/gameStateService';
import { redisClient as redis } from '@/config/redis';
import { GAME_EVENTS, TOURNAMENT_EVENTS, SOCKET_EVENTS } from '@shared/types/socket/events';
import type {
    GameJoinedPayload,
    GameTimerUpdatePayload,
    ErrorPayload,
    ServerToClientEvents,
    ParticipantData,
    SharedJoinPayload,
    SharedAnswerPayload
} from '@shared/types/socketEvents';
import {
    sharedJoinPayloadSchema,
    sharedAnswerPayloadSchema,
    requestParticipantsPayloadSchema,
    answerFeedbackPayloadSchema
} from '@shared/types/socketEvents.zod';
import { z } from 'zod';
import { ScoringService } from '@/core/services/scoringService';

// Derive types from Zod schemas
type AnswerFeedbackPayload = z.infer<typeof answerFeedbackPayloadSchema>;

const logger = createLogger('SharedLiveHandler');

export function registerSharedLiveHandlers(io: SocketIOServer, socket: Socket) {
    // Only register tournament-specific handlers here.
    // All quiz and tournament answer/question events are now handled by canonical handlers in game/index.ts

    // Remove joinHandler and answerHandler for quiz mode.
    // Only keep tournament-specific event registration:
    socket.on(TOURNAMENT_EVENTS.JOIN_TOURNAMENT, (payload: any) => {
        // ...existing code for tournament join...
    });
    socket.on(TOURNAMENT_EVENTS.TOURNAMENT_ANSWER, (payload: any) => {
        // ...existing code for tournament answer...
    });
}
