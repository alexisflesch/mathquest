"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pauseTimerHandler = pauseTimerHandler;
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const canonicalTimerService_1 = require("@/core/services/canonicalTimerService");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// CanonicalTimerService instance
const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
// Create a handler-specific logger
const logger = (0, logger_1.default)('PauseTimerHandler');
// --- CANONICAL TIMER EVENT EMISSION LOGIC (copied from timerAction.ts) ---
function toCanonicalTimer(timer) {
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
function emitCanonicalTimerEvents(io, rooms, payloadBase) {
    const canonicalQuestionUid = typeof payloadBase.questionUid === 'string' && payloadBase.questionUid.length > 0
        ? payloadBase.questionUid
        : (payloadBase.timer && typeof payloadBase.timer.questionUid === 'string' && payloadBase.timer.questionUid.length > 0
            ? payloadBase.timer.questionUid
            : 'unknown'); // Ensure it's never undefined
    const canonicalPayload = {
        timer: toCanonicalTimer(payloadBase.timer),
        questionUid: canonicalQuestionUid,
        questionIndex: typeof payloadBase.questionIndex === 'number' ? payloadBase.questionIndex : 0,
        totalQuestions: typeof payloadBase.totalQuestions === 'number' ? payloadBase.totalQuestions : 1,
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false,
        serverTime: Date.now() + 10000 // Add artificial drift for testing
    };
    const validation = socketEvents_zod_1.dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
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
function pauseTimerHandler(io, socket) {
    return async (_payload, callback) => {
        logger.warn('[MODERNIZATION] pauseTimerHandler is deprecated. All timer pause logic is handled by timerActionHandler (quiz_timer_action event).');
        if (callback) {
            callback({
                success: false,
                error: 'pauseTimerHandler is deprecated. Use quiz_timer_action instead.'
            });
        }
    };
}
exports.default = pauseTimerHandler;
// --- MODERNIZATION: All timer logic now uses CanonicalTimerService. All legacy timer usage is commented above. ---
