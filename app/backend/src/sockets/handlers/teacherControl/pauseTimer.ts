import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/services/gameStateService';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';
import { GameTimerState } from '@shared/types/core/timer';
import { pauseTimerPayloadSchema } from '@shared/types/socketEvents.zod';
import type { ErrorPayload, GameTimerUpdatePayload } from '@shared/types/socketEvents';
import { redisClient } from '@/config/redis';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { getCanonicalTimer } from '@/core/services/gameStateService';
import { dashboardTimerUpdatedPayloadSchema } from '@shared/types/socketEvents.zod';

// CanonicalTimerService instance
const canonicalTimerService = new CanonicalTimerService(redisClient);

// Create a handler-specific logger
const logger = createLogger('PauseTimerHandler');

// --- CANONICAL TIMER EVENT EMISSION LOGIC (copied from timerAction.ts) ---
function toCanonicalTimer(timer: any): any {
    const status = timer && typeof timer.status === 'string' && ['run', 'pause', 'stop'].includes(timer.status) ? timer.status : 'run';
    // Always include timeLeftMs for pause, and for debugging optionally for all
    const canonical = {
        ...timer,
        status,
        questionUid: typeof timer?.questionUid === 'string' && timer.questionUid.length > 0 ? timer.questionUid : undefined,
    };
    if (status === 'pause' && typeof timer.timeLeftMs === 'number') {
        canonical.timeLeftMs = timer.timeLeftMs;
    }
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer input:', timer);
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer output:', canonical);
    return canonical;
}
interface CanonicalTimerRoom {
    room: string;
    event: string;
    extra?: Record<string, unknown>;
}
import type { DashboardTimerUpdatedPayload } from '../../../../../shared/types/socket/dashboardPayloads';
function emitCanonicalTimerEvents(
    io: SocketIOServer,
    rooms: CanonicalTimerRoom[],
    payloadBase: DashboardTimerUpdatedPayload
) {
    const canonicalQuestionUid = typeof payloadBase.questionUid === 'string' && payloadBase.questionUid.length > 0
        ? payloadBase.questionUid
        : (payloadBase.timer && typeof payloadBase.timer.questionUid === 'string' && payloadBase.timer.questionUid.length > 0
            ? payloadBase.timer.questionUid
            : 'unknown'); // Ensure it's never undefined
    const canonicalPayload: DashboardTimerUpdatedPayload = {
        timer: toCanonicalTimer(payloadBase.timer),
        questionUid: canonicalQuestionUid,
        questionIndex: typeof payloadBase.questionIndex === 'number' ? payloadBase.questionIndex : 0,
        totalQuestions: typeof payloadBase.totalQuestions === 'number' ? payloadBase.totalQuestions : 1,
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false,
        serverTime: Date.now()
    };
    const validation = dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
    if (!validation.success) {
        logger.error({ error: validation.error.format(), payload: canonicalPayload }, '[TIMER] Invalid canonical timer payload, not emitting');
        return;
    }
    for (const { room, event, extra } of rooms) {
        logger.warn({
            marker: '[SOCKET-EMIT-DEBUG]',
            room,
            event,
            canonicalPayload,
            extra,
            socketIdsInRoom: Array.from(io.sockets.adapter.rooms.get(room) || []),
            allRooms: Array.from(io.sockets.adapter.rooms.keys()),
            emitStack: new Error().stack
        }, '[TIMER][EMIT_DEBUG] Emitting event to room (ENHANCED)');
        io.to(room).emit(event, { ...canonicalPayload, ...extra });
    }
}
// --- END CANONICAL TIMER EVENT EMISSION LOGIC ---

// Canonicalization: This handler is now a no-op. All timer pause logic is handled by timerActionHandler (quiz_timer_action event).
export function pauseTimerHandler(io: SocketIOServer, socket: Socket) {
    return async (_payload: any, callback?: (data: any) => void) => {
        logger.warn('[MODERNIZATION] pauseTimerHandler is deprecated. All timer pause logic is handled by timerActionHandler (quiz_timer_action event).');
        if (callback) {
            callback({
                success: false,
                error: 'pauseTimerHandler is deprecated. Use quiz_timer_action instead.'
            });
        }
    };
}
export default pauseTimerHandler;
// --- MODERNIZATION: All timer logic now uses CanonicalTimerService. All legacy timer usage is commented above. ---