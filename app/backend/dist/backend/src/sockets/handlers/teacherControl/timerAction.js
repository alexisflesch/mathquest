"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerActionHandler = timerActionHandler;
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const gameStateService_1 = __importStar(require("@/core/services/gameStateService"));
const canonicalTimerService_1 = require("@/core/services/canonicalTimerService");
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const logger_1 = __importDefault(require("@/utils/logger"));
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_2 = require("@shared/types/socketEvents.zod");
const helpers_1 = require("./helpers");
const projectionShowStats_1 = require("@shared/types/socket/projectionShowStats");
// Create a handler-specific logger
const logger = (0, logger_1.default)('TimerActionHandler');
// Redis key prefix for game state
const GAME_KEY_PREFIX = 'mathquest:game:';
// Create GameInstanceService instance
const gameInstanceService = new gameInstanceService_1.GameInstanceService();
// CanonicalTimerService instance
const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
// Timer management for automatic expiry
const activeTimers = new Map();
/**
 * Clear an existing timer for a game
 */
function clearGameTimer(gameId) {
    const existingTimer = activeTimers.get(gameId);
    if (existingTimer) {
        clearTimeout(existingTimer);
        activeTimers.delete(gameId);
        logger.info({ gameId }, '[TIMER_EXPIRY] Cleared existing timer');
    }
}
/**
 * Start automatic timer expiry for a game
 */
function startGameTimer(io, gameId, accessCode, timerEndDateMs, questionUid) {
    // Clear any existing timer first
    clearGameTimer(gameId);
    const now = Date.now();
    const msUntilEnd = timerEndDateMs - now;
    if (msUntilEnd <= 0) {
        logger.warn({ gameId, accessCode, timerEndDateMs, now }, '[TIMER_EXPIRY] timerEndDateMs is in the past or now, skipping timer scheduling');
        return;
    }
    logger.info({ gameId, accessCode, timerEndDateMs, msUntilEnd, questionUid }, '[TIMER_EXPIRY] Starting automatic timer expiry');
    const timeout = setTimeout(async () => {
        try {
            logger.info({ gameId, accessCode, questionUid }, '[TIMER_EXPIRY] Timer expired, auto-stopping');
            // Remove from active timers
            activeTimers.delete(gameId);
            // Get current game state
            const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
            if (!gameStateRaw) {
                logger.warn({ gameId, accessCode }, '[TIMER_EXPIRY] Game state not found when timer expired');
                return;
            }
            const gameState = JSON.parse(gameStateRaw);
            // Update timer to stopped state (canonical)
            const expiredTimer = {
                status: 'stop',
                timerEndDateMs: timerEndDateMs,
                questionUid: questionUid || 'unknown',
            };
            // Update game state (if needed)
            await gameStateService_1.default.updateGameState(accessCode, gameState);
            // Broadcast timer expiry to all rooms using canonical emission helper
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;
            logger.info({ gameId, accessCode, dashboardRoom, liveRoom, projectionRoom, timer: expiredTimer }, '[TIMER_EXPIRY] Broadcasting timer expiry to all rooms');
            const questionIndex = typeof gameState.currentQuestionIndex === 'number' ? gameState.currentQuestionIndex : -1;
            const totalQuestions = Array.isArray(gameState.questionUids) ? gameState.questionUids.length : 0;
            const answersLocked = typeof gameState.answersLocked === 'boolean' ? gameState.answersLocked : false;
            emitCanonicalTimerEvents(io, [
                { room: dashboardRoom, event: events_1.TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: expiredTimer.questionUid ?? undefined } },
                { room: liveRoom, event: 'game_timer_updated', extra: {} },
                { room: projectionRoom, event: events_1.TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: expiredTimer.questionUid ?? undefined } }
            ], {
                timer: expiredTimer,
                questionUid: expiredTimer.questionUid ?? undefined,
                questionIndex,
                totalQuestions,
                answersLocked,
                serverTime: Date.now()
            });
        }
        catch (error) {
            logger.error({ gameId, accessCode, error }, '[TIMER_EXPIRY] Error handling timer expiry');
        }
    }, msUntilEnd);
    activeTimers.set(gameId, timeout);
}
// Helper: fetch canonical durationMs for a question (ms, from timeLimit)
async function getCanonicalDurationMs(questionUid) {
    if (!questionUid) {
        logger.warn({ questionUid }, '[getCanonicalDurationMs] No questionUid provided, using fallback 30000ms');
        return 30000; // fallback
    }
    // Only scan keys that match the canonical game state pattern: mathquest:game:<accessCode> (no extra colons)
    const redisKeys = await redis_1.redisClient.keys(`${GAME_KEY_PREFIX}*`);
    let foundGameState = null;
    let foundAccessCode = null;
    for (const key of redisKeys) {
        // Only consider keys with exactly one colon after the prefix (i.e., no extra colons)
        const suffix = key.replace(GAME_KEY_PREFIX, '');
        if (suffix.includes(':'))
            continue; // skip keys like mathquest:game:answers:...
        const raw = await redis_1.redisClient.get(key);
        if (!raw)
            continue;
        try {
            const state = JSON.parse(raw);
            if (state && state.questionTimeLimits && state.questionTimeLimits[questionUid] !== undefined) {
                foundGameState = state;
                foundAccessCode = suffix;
                break;
            }
        }
        catch (e) {
            logger.error({ key, error: e }, '[getCanonicalDurationMs] Failed to parse game state JSON');
        }
    }
    if (foundGameState && foundGameState.questionTimeLimits && foundGameState.questionTimeLimits[questionUid] !== undefined) {
        const overrideSec = foundGameState.questionTimeLimits[questionUid];
        const overrideMs = Math.round(Number(overrideSec) * 1000);
        logger.info({ questionUid, overrideSec, overrideMs, accessCode: foundAccessCode }, '[getCanonicalDurationMs] Using override from Redis gameState.questionTimeLimits');
        if (overrideMs > 0)
            return overrideMs;
    }
    // Fallback to DB
    const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionUid } });
    logger.warn({ questionUid, question, timeLimit: question?.timeLimit }, '[getCanonicalDurationMs] Fetched question for canonical duration (DB fallback)');
    if (question && typeof question.timeLimit === 'number' && question.timeLimit > 0) {
        logger.warn({ questionUid, timeLimit: question.timeLimit, durationMs: question.timeLimit * 1000 }, '[getCanonicalDurationMs] Using question.timeLimit for canonical durationMs (DB fallback)');
        return question.timeLimit * 1000;
    }
    logger.warn({ questionUid, question }, '[getCanonicalDurationMs] No valid timeLimit, using fallback 30000ms');
    return 30000; // fallback default
}
// --- CANONICAL TIMER EVENT EMISSION LOGIC ---
// Use the shared canonicalizer from core/services/toCanonicalTimer
const toCanonicalTimer_1 = require("@/core/services/toCanonicalTimer");
// Helper to canonicalize timer for emission (always enforces timeLeftMs and durationMs)
function toCanonicalTimer(timer, durationMs) {
    // Use the shared canonicalizer, which now only emits canonical fields
    return (0, toCanonicalTimer_1.toCanonicalTimer)(timer, durationMs ?? 0);
}
function emitCanonicalTimerEvents(io, rooms, payloadBase) {
    const canonicalQuestionUid = typeof payloadBase.questionUid === 'string' && payloadBase.questionUid.length > 0
        ? payloadBase.questionUid
        : (payloadBase.timer && typeof payloadBase.timer.questionUid === 'string' && payloadBase.timer.questionUid.length > 0
            ? payloadBase.timer.questionUid
            : 'unknown');
    const canonicalPayload = {
        timer: toCanonicalTimer(payloadBase.timer),
        questionUid: canonicalQuestionUid,
        questionIndex: typeof payloadBase.questionIndex === 'number' ? payloadBase.questionIndex : -1,
        totalQuestions: typeof payloadBase.totalQuestions === 'number' ? payloadBase.totalQuestions : 0,
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false,
        gameId: payloadBase.gameId,
        serverTime: Date.now()
    };
    const validation = socketEvents_zod_2.dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
    if (!validation.success) {
        logger.error({ error: validation.error.format(), payload: canonicalPayload }, '[TIMER] Invalid canonical timer payload, not emitting');
        return;
    }
    for (const { room, event, extra } of rooms) {
        // --- ENHANCED DEBUG LOGGING FOR TEST INVESTIGATION ---
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
        // --- NEW: LOG ALL CONNECTED SOCKETS AND THEIR ROOMS AFTER EMIT ---
        const sockets = Array.from(io.sockets.sockets.values());
        const socketRoomMap = sockets.map(s => ({
            id: s.id,
            rooms: Array.from(s.rooms)
        }));
        logger.warn({
            marker: '[SOCKET-ROOMS-POST-EMIT]',
            allSocketRoomMemberships: socketRoomMap
        }, '[TIMER][EMIT_DEBUG] All connected sockets and their rooms after timer event emission');
    }
}
// --- END CANONICAL TIMER EVENT EMISSION LOGIC ---
// --- MODERNIZATION: Canonical Timer System ---
// All timer logic below uses CanonicalTimerService only. All legacy gameState.timer logic is commented out above.
// Only import getCanonicalTimer and CanonicalTimerService once at the top of the file
// import { getCanonicalTimer } from '@/core/services/gameStateService';
// import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
// Modernization: Canonical imports for question filtering and validation
const liveQuestion_1 = require("@/../../shared/types/quiz/liveQuestion");
const socketEvents_zod_3 = require("@/../../shared/types/socketEvents.zod");
function timerActionHandler(io, socket) {
    return async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.timerActionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid timerAction payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid timerAction payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            logger.warn({
                socketId: socket.id,
                errorPayload,
                branch: 'early return: invalid payload',
                location: 'timerActionHandler:parseResult.fail'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to invalid payload');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }
        const validPayload = parseResult.data;
        logger.info({ payload: validPayload }, 'Received quiz_timer_action event');
        // Look up game instance by access code
        const { accessCode, action, timerEndDateMs, questionUid } = validPayload;
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode }
        });
        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            const errorPayload = {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            };
            logger.warn({
                accessCode,
                errorPayload,
                branch: 'early return: gameInstance not found',
                location: 'timerActionHandler:gameInstance.null'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to missing gameInstance');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }
        const gameId = gameInstance.id;
        const userId = socket.data?.userId || socket.data?.user?.userId;
        // ...existing code...
        logger.info({ gameId, userId, action, timerEndDateMs, questionUid }, 'Timer action handler entered');
        if (!gameId) {
            logger.warn({ action }, 'No gameId provided in payload, aborting timer action');
            const errorPayload = {
                message: 'gameId is required to control the timer',
                code: 'GAME_ID_REQUIRED'
            };
            logger.warn({
                action,
                errorPayload,
                branch: 'early return: no gameId',
                location: 'timerActionHandler:gameId.null'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to missing gameId');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }
        if (!userId) {
            logger.warn({ gameId, action }, 'No userId on socket, aborting timer action');
            const errorPayload = {
                message: 'Authentication required to control the timer',
                code: 'AUTHENTICATION_REQUIRED'
            };
            logger.warn({
                gameId,
                action,
                errorPayload,
                branch: 'early return: no userId',
                location: 'timerActionHandler:userId.null'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to missing userId');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }
        logger.info({ gameId, userId, action, timerEndDateMs }, 'Timer action requested');
        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const authorizedGameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    OR: [
                        { initiatorUserId: userId },
                        { gameTemplate: { creatorId: userId } }
                    ]
                },
                include: {
                    gameTemplate: true
                }
            });
            if (!authorizedGameInstance) {
                logger.warn({ gameId, userId, action }, 'Not authorized for this game, aborting timer action');
                const errorPayload = {
                    message: 'Not authorized to control this game',
                    code: 'NOT_AUTHORIZED'
                };
                logger.warn({
                    gameId,
                    userId,
                    action,
                    errorPayload,
                    branch: 'early return: not authorized',
                    location: 'timerActionHandler:not.authorized'
                }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to not authorized');
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
                return;
            }
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
            if (!fullState || !fullState.gameState) {
                logger.warn({ gameId, userId, action }, 'No game state found, aborting timer action');
                const errorPayload = {
                    message: 'Could not retrieve game state',
                    code: 'STATE_ERROR'
                };
                logger.warn({
                    gameId,
                    userId,
                    action,
                    errorPayload,
                    branch: 'early return: no game state',
                    location: 'timerActionHandler:gameState.null'
                }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to missing game state');
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
                return;
            }
            const gameState = fullState.gameState;
            // Determine canonical timer context
            const playMode = gameState.gameMode;
            const isDiffered = gameState.status === 'completed'; // Business rule: treat completed as differed
            const attemptCount = undefined; // TODO: wire up if needed for deferred mode
            let canonicalTimer = null;
            const canonicalQuestionUid = (questionUid && typeof questionUid === 'string' ? questionUid : (gameState.questionUids && gameState.currentQuestionIndex >= 0 ? gameState.questionUids[gameState.currentQuestionIndex] : null));
            if (!canonicalQuestionUid) {
                logger.error({ accessCode, questionUid, gameState }, '[TIMER_ACTION] No valid questionUid for canonical timer');
                // handle error or return
            }
            // Use canonical durationMs for timer actions (from question definition)
            let canonicalDurationMs = 0;
            if (canonicalQuestionUid) {
                canonicalDurationMs = await getCanonicalDurationMs(String(canonicalQuestionUid));
            }
            if (canonicalDurationMs <= 0) {
                logger.error({ canonicalQuestionUid, canonicalDurationMs }, '[TIMER_ACTION] Failed to get canonical durationMs');
                // handle error or return
            }
            switch (action) {
                case 'run': {
                    // --- MODERNIZATION: Always use teacher's requested durationMs for timer run ---
                    let effectiveDurationMs;
                    effectiveDurationMs = validPayload.durationMs && typeof validPayload.durationMs === 'number' && validPayload.durationMs > 0
                        ? validPayload.durationMs
                        : canonicalDurationMs;
                    logger.info({
                        accessCode,
                        questionUid: String(canonicalQuestionUid),
                        effectiveDurationMs,
                        canonicalDurationMs,
                        msg: '[DEBUG][RUN] Before startTimer, about to persist durationMs, values:'
                    }, '[DEBUG][RUN] effectiveDurationMs and canonicalDurationMs before persistence');
                    // --- MODERNIZATION: Mark quiz as active if pending ---
                    logger.info({ accessCode, currentStatus: gameState.status }, '[TIMER_ACTION][RUN] Checking if game status is pending before starting timer');
                    // [TROPHY_DEBUG] Reset showCorrectAnswers to false on every timer run action (projection display state)
                    logger.info({
                        accessCode,
                        gameId,
                        action,
                        marker: '[TROPHY_DEBUG]',
                        message: '[TROPHY_DEBUG] About to reset showCorrectAnswers to false and emit show_correct_answers { show: false }'
                    }, '[TROPHY_DEBUG] About to reset showCorrectAnswers to false and emit show_correct_answers { show: false }');
                    try {
                        await gameStateService_1.default.updateProjectionDisplayState(accessCode, {
                            showCorrectAnswers: false,
                            correctAnswersData: null
                        });
                        const projectionStateAfter = await gameStateService_1.default.getProjectionDisplayState(accessCode);
                        logger.info({
                            accessCode,
                            gameId,
                            action,
                            projectionStateAfter,
                            marker: '[TROPHY_DEBUG]',
                            message: '[TROPHY_DEBUG] showCorrectAnswers reset to false on timer run action (projection display state)'
                        }, '[TROPHY_DEBUG] showCorrectAnswers reset to false on timer run action (projection display state)');
                        // Emit to dashboard room so teacher UI updates trophy state (reset to false)
                        const dashboardRoom = `dashboard_${gameId}`;
                        // Fetch current terminatedQuestions from Redis (canonical)
                        let terminatedQuestions = {};
                        try {
                            const terminatedKey = `mathquest:game:terminatedQuestions:${accessCode}`;
                            const terminatedSet = await redis_1.redisClient.smembers(terminatedKey);
                            if (Array.isArray(terminatedSet)) {
                                terminatedSet.forEach((uid) => {
                                    terminatedQuestions[uid] = true;
                                });
                            }
                        }
                        catch (err) {
                            logger.error({ err }, '[TROPHY_DEBUG] Failed to fetch terminatedQuestions for show: false');
                        }
                        io.to(dashboardRoom).emit(events_1.TEACHER_EVENTS.SHOW_CORRECT_ANSWERS, { show: false, terminatedQuestions });
                        logger.info({
                            dashboardRoom,
                            show: false,
                            terminatedQuestions,
                            event: events_1.TEACHER_EVENTS.SHOW_CORRECT_ANSWERS
                        }, '[TROPHY_DEBUG] Emitted show_correct_answers { show: false, terminatedQuestions } to dashboard room (timer run reset)');
                    }
                    catch (err) {
                        logger.error({
                            accessCode,
                            gameId,
                            action,
                            err,
                            marker: '[TROPHY_DEBUG]',
                            message: '[TROPHY_DEBUG] Failed to reset showCorrectAnswers on timer run action (projection display state)'
                        }, '[TROPHY_DEBUG] Failed to reset showCorrectAnswers on timer run action (projection display state)');
                    }
                    if (gameState.status === 'pending') {
                        logger.info({ accessCode, previousStatus: 'pending' }, '[TIMER_ACTION][RUN] Game status is pending, updating to active');
                        gameState.status = 'active';
                        try {
                            await gameStateService_1.default.updateGameState(accessCode, gameState);
                            logger.info({ accessCode, newStatus: gameState.status }, '[TIMER_ACTION][RUN] Game status updated to active and persisted in Redis');
                            // --- Update game status in the database as well ---
                            await prisma_1.prisma.gameInstance.update({
                                where: { id: gameId },
                                data: { status: 'active' }
                            });
                            logger.info({ accessCode, gameId }, '[TIMER_ACTION][RUN] Game status updated to active in database');
                        }
                        catch (err) {
                            logger.error({ accessCode, err }, '[TIMER_ACTION][RUN] Failed to persist game status change to active');
                        }
                    }
                    else {
                        logger.info({ accessCode, currentStatus: gameState.status }, '[TIMER_ACTION][RUN] Game status is not pending, no update needed');
                    }
                    // --- MODERNIZATION: Always use teacher's requested durationMs for timer run ---
                    // (moved declaration above)
                    if (validPayload.durationMs && typeof validPayload.durationMs === 'number' && validPayload.durationMs > 0) {
                        logger.info({
                            accessCode,
                            questionUid: String(canonicalQuestionUid),
                            requestedDurationMs: validPayload.durationMs,
                            canonicalDurationMs,
                        }, '[TIMER_ACTION][RUN] Using teacher\'s requested durationMs from payload (canonical, ignoring Redis/DB values)');
                    }
                    else {
                        logger.warn({
                            accessCode,
                            questionUid: String(canonicalQuestionUid),
                            canonicalDurationMs
                        }, '[TIMER_ACTION][RUN] No valid durationMs in payload, using canonicalDurationMs from DB');
                    }
                    // Pass effectiveDurationMs as the 7th argument (durationMsOverride), not as attemptCount
                    await canonicalTimerService.startTimer(accessCode, String(canonicalQuestionUid), playMode, isDiffered, userId, undefined, effectiveDurationMs);
                    logger.info({
                        accessCode,
                        questionUid: String(canonicalQuestionUid),
                        effectiveDurationMs,
                        msg: '[DEBUG][RUN] After startTimer, before persisting durationMs in Redis'
                    }, '[DEBUG][RUN] After startTimer, before persisting durationMs in Redis');
                    logger.info({
                        accessCode,
                        questionUid: String(canonicalQuestionUid),
                        msg: '[DEBUG][RUN] About to fetch gameStateRaw from Redis for duration persistence'
                    }, '[DEBUG][RUN] About to fetch gameStateRaw from Redis for duration persistence');
                    // --- Persist canonical duration in game state in Redis for ALL questions (per-question map) ---
                    try {
                        const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
                        if (gameStateRaw) {
                            const gameState = JSON.parse(gameStateRaw);
                            logger.info({
                                accessCode,
                                questionUid: canonicalQuestionUid,
                                gameStateBefore: gameState,
                                msg: '[DEBUG][RUN] gameState before updating questionTimeLimits'
                            }, '[DEBUG][RUN] gameState before updating questionTimeLimits');
                            let oldValue = undefined;
                            if (canonicalQuestionUid && gameState.questionTimeLimits && typeof gameState.questionTimeLimits === 'object') {
                                oldValue = gameState.questionTimeLimits[canonicalQuestionUid];
                            }
                            logger.info({
                                accessCode,
                                questionUid: canonicalQuestionUid,
                                oldValue,
                                newValue: effectiveDurationMs / 1000,
                                msg: '[DEBUG][RUN] Updating questionTimeLimits for questionUid'
                            }, '[DEBUG][RUN] Updating questionTimeLimits for questionUid');
                            // Canonical: persist all per-question time edits in a map
                            if (!gameState.questionTimeLimits || typeof gameState.questionTimeLimits !== 'object') {
                                gameState.questionTimeLimits = {};
                            }
                            if (canonicalQuestionUid) {
                                gameState.questionTimeLimits[canonicalQuestionUid] = effectiveDurationMs / 1000;
                            }
                            // Also update questionData.timeLimit if this is the current question (for legacy consumers)
                            if (gameState.questionData && gameState.questionData.uid === canonicalQuestionUid) {
                                logger.info({
                                    accessCode,
                                    questionUid: canonicalQuestionUid,
                                    oldValue: gameState.questionData.timeLimit,
                                    newValue: effectiveDurationMs / 1000,
                                    msg: '[DEBUG][RUN] Updating questionData.timeLimit for current question'
                                }, '[DEBUG][RUN] Updating questionData.timeLimit for current question');
                                gameState.questionData.timeLimit = effectiveDurationMs / 1000;
                            }
                            await gameStateService_1.default.updateGameState(accessCode, gameState);
                            logger.info({
                                accessCode,
                                questionUid: canonicalQuestionUid,
                                gameStateAfter: gameState,
                                msg: '[DEBUG][RUN] gameState after updating questionTimeLimits and persisting to Redis'
                            }, '[DEBUG][RUN] gameState after updating questionTimeLimits and persisting to Redis');
                            logger.info({ accessCode, questionUid: canonicalQuestionUid, effectiveDurationMs }, '[TIMER_ACTION][RUN] Persisted timer durationMs in gameState.questionTimeLimits in Redis');
                        }
                        else {
                            logger.warn({ accessCode, questionUid: canonicalQuestionUid }, '[TIMER_ACTION][RUN] Could not fetch game state from Redis to persist durationMs');
                        }
                    }
                    catch (err) {
                        logger.error({ accessCode, questionUid: canonicalQuestionUid, err }, '[TIMER_ACTION][RUN] Failed to persist timer durationMs in game state in Redis');
                    }
                    logger.info({
                        accessCode,
                        questionUid: String(canonicalQuestionUid),
                        playMode,
                        isDiffered,
                        effectiveDurationMs,
                        msg: '[DEBUG][RUN] About to call getCanonicalTimer with effectiveDurationMs'
                    }, '[DEBUG][RUN] About to call getCanonicalTimer with effectiveDurationMs');
                    canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, String(canonicalQuestionUid), playMode, isDiffered, effectiveDurationMs);
                    logger.info({
                        accessCode,
                        questionUid: String(canonicalQuestionUid),
                        canonicalTimer,
                        msg: '[DEBUG][RUN] canonicalTimer after getCanonicalTimer'
                    }, '[DEBUG][RUN] canonicalTimer after getCanonicalTimer');
                    break;
                }
                case 'pause':
                    await canonicalTimerService.pauseTimer(accessCode, String(canonicalQuestionUid), playMode, isDiffered);
                    canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, String(canonicalQuestionUid), playMode, isDiffered, canonicalDurationMs);
                    break;
                case 'stop':
                    // Set timer to STOP state in Redis and emit canonical STOP timer
                    await canonicalTimerService.stopTimer(accessCode, String(canonicalQuestionUid), playMode, isDiffered);
                    canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, String(canonicalQuestionUid), playMode, isDiffered, canonicalDurationMs);
                    // Force canonicalTimer fields for STOP
                    canonicalTimer.status = 'stop';
                    canonicalTimer.timeLeftMs = 0;
                    canonicalTimer.timerEndDateMs = 0;
                    break;
                case 'edit': {
                    // Canonical timer edit action
                    logger.info({ accessCode, questionUid: canonicalQuestionUid, durationMs: validPayload.durationMs, action }, '[TIMER_ACTION][EDIT] Received canonical edit action');
                    logger.debug({ payload: validPayload }, '[TIMER_ACTION][EDIT] Full payload received');
                    const editDurationMs = validPayload.durationMs;
                    if (!editDurationMs || !canonicalQuestionUid) {
                        logger.error({ accessCode, questionUid: canonicalQuestionUid, editDurationMs }, '[TIMER_ACTION][EDIT] Missing required durationMs or questionUid');
                        logger.debug({ payload: validPayload }, '[TIMER_ACTION][EDIT] Invalid edit payload');
                        break;
                    }
                    // Determine if editing current question
                    const isCurrent = (gameState.questionUids && gameState.currentQuestionIndex >= 0 && gameState.questionUids[gameState.currentQuestionIndex] === canonicalQuestionUid);
                    const timerState = await (0, gameStateService_1.getCanonicalTimer)(accessCode, String(canonicalQuestionUid), playMode, isDiffered, editDurationMs);
                    logger.debug({ isCurrent, timerState, gameState }, '[TIMER_ACTION][EDIT] Edit context and timer state');
                    // Pass isCurrent to CanonicalTimerService via globalThis (hacky but avoids signature change)
                    globalThis._canonicalEditTimerOptions = { isCurrent };
                    await canonicalTimerService.editTimer(accessCode, String(canonicalQuestionUid), playMode, isDiffered, editDurationMs, userId);
                    // --- Persist canonical duration in game state in Redis for ALL questions (per-question map) ---
                    try {
                        const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
                        if (gameStateRaw) {
                            const gameState = JSON.parse(gameStateRaw);
                            // Canonical: persist all per-question time edits in a map
                            if (!gameState.questionTimeLimits || typeof gameState.questionTimeLimits !== 'object') {
                                gameState.questionTimeLimits = {};
                            }
                            if (canonicalQuestionUid) {
                                gameState.questionTimeLimits[canonicalQuestionUid] = editDurationMs / 1000;
                            }
                            // Also update questionData.timeLimit if this is the current question (for legacy consumers)
                            if (gameState.questionData && gameState.questionData.uid === canonicalQuestionUid) {
                                gameState.questionData.timeLimit = editDurationMs / 1000;
                            }
                            await gameStateService_1.default.updateGameState(accessCode, gameState);
                            logger.info({ accessCode, questionUid: canonicalQuestionUid, editDurationMs }, '[TIMER_ACTION][EDIT] Persisted edited durationMs in gameState.questionTimeLimits in Redis');
                        }
                        else {
                            logger.warn({ accessCode, questionUid: canonicalQuestionUid }, '[TIMER_ACTION][EDIT] Could not fetch game state from Redis to persist durationMs');
                        }
                    }
                    catch (err) {
                        logger.error({ accessCode, questionUid: canonicalQuestionUid, err }, '[TIMER_ACTION][EDIT] Failed to persist edited durationMs in game state in Redis');
                    }
                    delete globalThis._canonicalEditTimerOptions;
                    // Re-fetch canonical timer after edit
                    canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, String(canonicalQuestionUid), playMode, isDiffered, editDurationMs);
                    logger.debug({ canonicalTimer }, '[TIMER_ACTION][EDIT] Canonical timer after edit');
                    // Determine timer status
                    const status = canonicalTimer.status;
                    // Emit logic per requirements
                    if (isCurrent) {
                        if (status === 'run') {
                            // Update duration and time left, emit to all rooms, update timer expiry
                            logger.info({ accessCode, questionUid: canonicalQuestionUid, editDurationMs }, '[TIMER_ACTION][EDIT] Editing running timer, emitting to all rooms and updating expiry');
                            logger.debug({ canonicalTimer }, '[TIMER_ACTION][EDIT] Emitting to all rooms and updating expiry');
                            // Restart timer expiry
                            startGameTimer(io, gameId, accessCode, canonicalTimer.timerEndDateMs, canonicalQuestionUid);
                            // Emission handled below (all rooms)
                        }
                        else if (status === 'pause') {
                            // Update only timeLeftMs, emit to all rooms
                            logger.info({ accessCode, questionUid: canonicalQuestionUid, editDurationMs }, '[TIMER_ACTION][EDIT] Editing paused timer (current), emitting to all rooms (only timeLeftMs updated)');
                            logger.debug({ canonicalTimer }, '[TIMER_ACTION][EDIT] Emitting to all rooms (paused, only timeLeftMs updated)');
                            // Emission handled below (all rooms)
                        }
                        else if (status === 'stop') {
                            // Update duration, emit only to dashboard
                            logger.info({ accessCode, questionUid: canonicalQuestionUid, editDurationMs }, '[TIMER_ACTION][EDIT] Editing stopped timer, emitting only to dashboard');
                            logger.debug({ canonicalTimer }, '[TIMER_ACTION][EDIT] Emitting only to dashboard (stopped)');
                            // Emission handled below (dashboard only)
                        }
                    }
                    else {
                        // Editing a non-current question: update only timeLeftMs, emit only to dashboard
                        logger.info({ accessCode, questionUid: canonicalQuestionUid, editDurationMs }, '[TIMER_ACTION][EDIT] Editing non-current question, emitting only to dashboard (only timeLeftMs updated)');
                        logger.debug({ canonicalTimer }, '[TIMER_ACTION][EDIT] Emitting only to dashboard (non-current, only timeLeftMs updated)');
                        // Emission handled below (dashboard only)
                    }
                    break;
                }
            }
            logger.info({ gameId, action, canonicalTimer }, 'Timer state after action');
            // Use canonicalTimer for all event payloads below
            // Get the current question UID for timer updates
            // If questionUid is provided in the payload, use it; otherwise use current question
            let targetQuestionUid = questionUid;
            // ...existing code...
            if (targetQuestionUid) {
                // Check if this is a different question than currently active
                const currentQuestionUid = gameState.currentQuestionIndex >= 0 &&
                    gameState.questionUids &&
                    gameState.questionUids[gameState.currentQuestionIndex]
                    ? gameState.questionUids[gameState.currentQuestionIndex] || null
                    : null;
                // ...existing code...
                if (currentQuestionUid !== targetQuestionUid) {
                    // Switch to the new question
                    const targetQuestionIndex = gameState.questionUids?.indexOf(targetQuestionUid);
                    if (targetQuestionIndex !== undefined && targetQuestionIndex >= 0) {
                        logger.info({ gameId, action, oldQuestion: currentQuestionUid, newQuestion: targetQuestionUid }, '[TIMER_ACTION] Switching to new question for timer action');
                        // Update current question index
                        gameState.currentQuestionIndex = targetQuestionIndex;
                        // Reset answersLocked to false for the new question
                        gameState.answersLocked = false;
                        // Update game state with the new current question
                        await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
                        // Get the question data to send to players (without correct answers)
                        const question = await prisma_1.prisma.question.findUnique({
                            where: { uid: targetQuestionUid },
                            include: {
                                multipleChoiceQuestion: true,
                                numericQuestion: true
                            }
                        });
                        // Declare liveRoom and projectionRoom before use
                        const liveRoom = `game_${gameInstance.accessCode}`;
                        const projectionRoom = `projection_${gameId}`;
                        if (question) {
                            // Filter question and ensure timeLimit is valid
                            let filteredQuestion = (0, liveQuestion_1.filterQuestionForClient)(question);
                            // Ensure timeLimit is present and valid (schema requires positive integer)
                            if (filteredQuestion.timeLimit == null || filteredQuestion.timeLimit <= 0) {
                                logger.warn(`Question ${question.uid} has invalid timeLimit: ${filteredQuestion.timeLimit}, using default 30s`);
                                filteredQuestion.timeLimit = 30; // Default to 30 seconds
                            }
                            const canonicalPayload = {
                                ...filteredQuestion,
                                currentQuestionIndex: typeof gameState.currentQuestionIndex === 'number' ? gameState.currentQuestionIndex : 0,
                                totalQuestions: Array.isArray(gameState.questionUids) ? gameState.questionUids.length : 1
                            };
                            const parseResult = socketEvents_zod_3.questionDataForStudentSchema.safeParse(canonicalPayload);
                            if (!parseResult.success) {
                                logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
                            }
                            else {
                                io.to([liveRoom, projectionRoom]).emit('game_question', canonicalPayload);
                                logger.info({ gameId, targetQuestionUid, liveRoom, projectionRoom, canonicalPayload, message: '[TIMER_ACTION] Sent canonical game_question to live and projection rooms' }, '[TIMER_ACTION] Sent canonical game_question to live and projection rooms');
                            }
                        }
                        // Broadcast question change to dashboard
                        const dashboardRoom = `dashboard_${gameId}`;
                        const questionChangedPayload = {
                            questionUid: targetQuestionUid,
                            oldQuestionUid: currentQuestionUid,
                            timer: canonicalTimer // MODERNIZATION: use canonicalTimer only
                        };
                        // Use canonical event constant for dashboard_question_changed
                        io.to(dashboardRoom).emit(events_1.TEACHER_EVENTS.DASHBOARD_QUESTION_CHANGED, questionChangedPayload);
                        logger.info({ gameId, targetQuestionUid, targetQuestionIndex }, '[TIMER_ACTION] Question switched and dashboard notified');
                        // Check if stats are shown and update them for the new question
                        try {
                            const projectionState = await gameStateService_1.default.getProjectionDisplayState(accessCode);
                            if (projectionState?.showStats) {
                                logger.info({ accessCode, targetQuestionUid, showStats: projectionState.showStats }, '[TIMER_ACTION] Stats are shown, updating for new question');
                                const newStats = await (0, helpers_1.getAnswerStats)(accessCode, targetQuestionUid);
                                await gameStateService_1.default.updateProjectionDisplayState(accessCode, {
                                    showStats: true,
                                    currentStats: newStats,
                                    statsQuestionUid: targetQuestionUid,
                                    showCorrectAnswers: projectionState.showCorrectAnswers,
                                    correctAnswersData: projectionState.correctAnswersData
                                });
                                // Emit updated stats to projection room
                                const projectionRoom = `projection_${gameId}`;
                                const statsPayload = {
                                    questionUid: targetQuestionUid,
                                    show: true,
                                    stats: newStats,
                                    timestamp: Date.now()
                                };
                                // Validate the payload with Zod schema
                                const validation = projectionShowStats_1.ProjectionShowStatsPayloadSchema.safeParse(statsPayload);
                                if (validation.success) {
                                    io.to(projectionRoom).emit('projection_show_stats', validation.data);
                                    logger.info({ accessCode, targetQuestionUid, statsPayload: validation.data }, '[TIMER_ACTION] Updated and emitted validated stats for new question');
                                }
                                else {
                                    logger.error({
                                        accessCode,
                                        targetQuestionUid,
                                        error: validation.error.format(),
                                        payload: statsPayload
                                    }, '[TIMER_ACTION] Invalid stats payload, not emitting');
                                }
                            }
                        }
                        catch (error) {
                            logger.error({ error, accessCode, targetQuestionUid }, '[TIMER_ACTION] Error updating stats for new question');
                        }
                    }
                    else {
                        logger.warn({ gameId, targetQuestionUid, availableQuestions: gameState.questionUids }, '[TIMER_ACTION] Target question UID not found in game questions');
                        // Continue with timer action but don't switch questions
                    }
                }
            }
            else {
                // No specific question requested, use current question
                const currentQuestionFromState = gameState.currentQuestionIndex >= 0 &&
                    gameState.questionUids &&
                    gameState.questionUids[gameState.currentQuestionIndex]
                    ? gameState.questionUids[gameState.currentQuestionIndex]
                    : null;
                targetQuestionUid = currentQuestionFromState || '';
            }
            // Update timer object with resolved questionUid before broadcasting
            canonicalTimer.questionUid = targetQuestionUid || null;
            // Canonicalize timer for emission
            const timer = toCanonicalTimer(canonicalTimer);
            // Broadcast updated timer to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;
            // --- MODERNIZATION: Only emit to dashboard for STOP on different question ---
            let emitRooms = [
                { room: dashboardRoom, event: events_1.TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: timer.questionUid ?? undefined } }
            ];
            // Determine if this is a STOP action on a different question
            const isStopOnDifferentQuestion = (action === 'stop' &&
                typeof questionUid === 'string' &&
                questionUid.length > 0 &&
                gameState.questionUids?.[gameState.currentQuestionIndex] !== questionUid);
            if (!isStopOnDifferentQuestion) {
                emitRooms.push({ room: liveRoom, event: 'game_timer_updated', extra: {} }, { room: projectionRoom, event: events_1.TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: timer.questionUid ?? undefined } });
            }
            emitCanonicalTimerEvents(io, emitRooms, {
                timer: canonicalTimer,
                questionUid: timer.questionUid ?? undefined,
                questionIndex: typeof gameState.currentQuestionIndex === 'number' ? gameState.currentQuestionIndex : -1,
                totalQuestions: Array.isArray(gameState.questionUids) ? gameState.questionUids.length : 0,
                answersLocked: typeof gameState.answersLocked === 'boolean' ? gameState.answersLocked : false,
                gameId,
                serverTime: Date.now()
            });
            logger.info({
                action,
                gameId,
                timerStateAfterEmit: JSON.stringify(timer),
                gameStateAfterEmit: JSON.stringify(gameState)
            }, '[DEBUG] After emitting canonical timer events (EXTRA DEBUG)');
        }
        catch (error) {
            logger.error({ gameId, action, error }, '[TIMER_ACTION] Unhandled error in timerActionHandler');
            const errorPayload = {
                message: 'Unhandled error in timer action handler',
                code: 'TIMER_ACTION_ERROR',
                details: { message: error instanceof Error ? error.message : String(error) }
            };
            logger.error({
                gameId,
                action,
                errorPayload,
                branch: 'catch: unhandled error',
                location: 'timerActionHandler:catch'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to unhandled error');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
        }
    }; // close returned async function
} // close timerActionHandler
