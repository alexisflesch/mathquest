// filepath: /home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/startTimer.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/services/gameStateService';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';
import { startTimerPayloadSchema, dashboardTimerUpdatedPayloadSchema } from '@shared/types/socketEvents.zod';
import type { ErrorPayload } from '@shared/types/socketEvents';
import type { GameTimerState } from '@shared/types/core/timer';

import { StartTimerPayload } from './types';

// Create a handler-specific logger
const logger = createLogger('StartTimerHandler');

// REMOVE: Non-canonical startTimerHandler export
// export function startTimerHandler(io: SocketIOServer, socket: Socket) { ... }

// REMOVE: All logic in this file is now obsolete and should be deleted in a future cleanup phase.

function toCanonicalTimer(timer: any): any {
    let status = timer && typeof timer.status === 'string' && ['run', 'pause', 'stop'].includes(timer.status) ? timer.status : 'run';
    const canonical = {
        ...timer,
        status,
        questionUid: typeof timer?.questionUid === 'string' && timer.questionUid.length > 0 ? timer.questionUid : 'unknown',
    };
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer input:', timer);
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer output:', canonical);
    return canonical;
}
interface CanonicalTimerRoom {
    room: string;
    event: string;
    extra?: Record<string, unknown>;
}
type CanonicalDashboardTimerUpdatedPayload = {
    accessCode: string;
    timer: any;
    questionUid?: string;
    questionIndex?: number;
    totalQuestions?: number;
    answersLocked?: boolean;
};
function emitCanonicalTimerEvents(
    io: SocketIOServer,
    rooms: CanonicalTimerRoom[],
    payloadBase: CanonicalDashboardTimerUpdatedPayload
) {
    const canonicalQuestionUid = typeof payloadBase.questionUid === 'string' && payloadBase.questionUid.length > 0
        ? payloadBase.questionUid
        : (payloadBase.timer && typeof payloadBase.timer.questionUid === 'string' && payloadBase.timer.questionUid.length > 0
            ? payloadBase.timer.questionUid
            : 'unknown');
    const canonicalPayload = {
        ...payloadBase,
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
        io.to(room).emit(event, { ...canonicalPayload, ...extra });
    }
}

// --- Replace timer event emissions in startTimer.ts ---
// Example:
// emitCanonicalTimerEvents(io, [
//   { room: dashboardRoom, event: 'dashboard_timer_updated', extra: { questionUid: timer.questionUid ?? undefined } },
//   { room: gameRoom, event: 'game_timer_updated', extra: {} },
//   { room: projectionRoom, event: 'dashboard_timer_updated', extra: { questionUid: timer.questionUid ?? undefined } }
// ], {
//   accessCode: accessCodeStr,
//   timer,
//   questionUid: timer.questionUid ?? undefined,
//   questionIndex: gameState.currentQuestionIndex,
//   totalQuestions: gameState.questionUids?.length,
//   answersLocked: gameState.answersLocked
// });
