"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@/utils/logger"));
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// Create a handler-specific logger
const logger = (0, logger_1.default)('StartTimerHandler');
// REMOVE: Non-canonical startTimerHandler export
// export function startTimerHandler(io: SocketIOServer, socket: Socket) { ... }
// REMOVE: All logic in this file is now obsolete and should be deleted in a future cleanup phase.
function toCanonicalTimer(timer) {
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
function emitCanonicalTimerEvents(io, rooms, payloadBase) {
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
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false
    };
    const validation = socketEvents_zod_1.dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
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
