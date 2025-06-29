import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { ZodError } from 'zod';
// Canonical timer event payload type matching Zod schema and projection handler
interface CanonicalTimerUpdatePayload {
    timer: any; // GameTimerState, but allow any for now to avoid circular import issues
    questionUid: string;
    questionIndex: number;
    totalQuestions: number;
    answersLocked: boolean;
    gameId?: string;
}
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import gameStateService, { getCanonicalTimer } from '@/core/services/gameStateService';
import { GameState } from '@shared/types/core';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import createLogger from '@/utils/logger';
import { z } from 'zod';
import { timerActionPayloadSchema } from '@shared/types/socketEvents.zod';
type TimerActionPayload = z.infer<typeof timerActionPayloadSchema>;
import { SOCKET_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';
// (already imported above)
import type { ErrorPayload } from '@shared/types/socketEvents';
import { dashboardTimerUpdatedPayloadSchema } from '@shared/types/socketEvents.zod';

import type { GameTimerState } from '@shared/types/core/timer';
import type { DashboardQuestionChangedPayload } from '@shared/types/socket/dashboardPayloads';

// Create a handler-specific logger
const logger = createLogger('TimerActionHandler');

// Redis key prefix for game state
const GAME_KEY_PREFIX = 'mathquest:game:';

// Create GameInstanceService instance
const gameInstanceService = new GameInstanceService();

// CanonicalTimerService instance
const canonicalTimerService = new CanonicalTimerService(redisClient);

// Timer management for automatic expiry
const activeTimers = new Map<string, NodeJS.Timeout>();

/**
 * Clear an existing timer for a game
 */
function clearGameTimer(gameId: string): void {
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
function startGameTimer(io: SocketIOServer, gameId: string, accessCode: string, timerEndDateMs: number, questionUid: string | null): void {
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
            const gameStateRaw = await redisClient.get(`${GAME_KEY_PREFIX}${accessCode}`);
            if (!gameStateRaw) {
                logger.warn({ gameId, accessCode }, '[TIMER_EXPIRY] Game state not found when timer expired');
                return;
            }

            const gameState: GameState = JSON.parse(gameStateRaw);

            // Update timer to stopped state (canonical)
            const expiredTimer: GameTimerState = {
                status: 'stop',
                timerEndDateMs: timerEndDateMs,
                questionUid: questionUid || 'unknown',
            };

            // Update game state (if needed)
            await gameStateService.updateGameState(accessCode, gameState);

            // Broadcast timer expiry to all rooms using canonical emission helper
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;

            logger.info({ gameId, accessCode, dashboardRoom, liveRoom, projectionRoom, timer: expiredTimer }, '[TIMER_EXPIRY] Broadcasting timer expiry to all rooms');

            const questionIndex = typeof gameState.currentQuestionIndex === 'number' ? gameState.currentQuestionIndex : -1;
            const totalQuestions = Array.isArray(gameState.questionUids) ? gameState.questionUids.length : 0;
            const answersLocked = typeof gameState.answersLocked === 'boolean' ? gameState.answersLocked : false;
            emitCanonicalTimerEvents(io, [
                { room: dashboardRoom, event: TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: expiredTimer.questionUid ?? undefined } },
                { room: liveRoom, event: 'game_timer_updated', extra: {} },
                { room: projectionRoom, event: TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: expiredTimer.questionUid ?? undefined } }
            ], {
                timer: expiredTimer,
                questionUid: expiredTimer.questionUid ?? undefined,
                questionIndex,
                totalQuestions,
                answersLocked
            });

        } catch (error) {
            logger.error({ gameId, accessCode, error }, '[TIMER_EXPIRY] Error handling timer expiry');
        }
    }, msUntilEnd);

    activeTimers.set(gameId, timeout);
}

// Helper: fetch canonical durationMs for a question (ms, from timeLimit)
async function getCanonicalDurationMs(questionUid: string): Promise<number> {
    if (!questionUid) return 30000; // fallback
    const question = await prisma.question.findUnique({ where: { uid: questionUid } });
    // Canonical: durationMs is always ms, but DB only has timeLimit (seconds)
    if (question && typeof question.timeLimit === 'number' && question.timeLimit > 0) {
        return question.timeLimit * 1000;
    }
    return 30000; // fallback default
}

// --- CANONICAL TIMER EVENT EMISSION LOGIC ---
// Use the shared canonicalizer from core/services/toCanonicalTimer
import { toCanonicalTimer as sharedToCanonicalTimer } from '@/core/services/toCanonicalTimer';

// Helper to canonicalize timer for emission (always enforces timeLeftMs and durationMs)
function toCanonicalTimer(timer: any, durationMs?: number): GameTimerState {
    // Use the shared canonicalizer, which now only emits canonical fields
    return sharedToCanonicalTimer(timer, durationMs ?? 0);
}
interface CanonicalTimerRoom {
    room: string;
    event: string;
    extra?: Record<string, unknown>;
}
// (already imported above)
type CanonicalDashboardTimerUpdatedPayload = CanonicalTimerUpdatePayload;
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
    const canonicalPayload: CanonicalDashboardTimerUpdatedPayload = {
        timer: toCanonicalTimer(payloadBase.timer),
        questionUid: canonicalQuestionUid,
        questionIndex: typeof payloadBase.questionIndex === 'number' ? payloadBase.questionIndex : -1,
        totalQuestions: typeof payloadBase.totalQuestions === 'number' ? payloadBase.totalQuestions : 0,
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false,
        gameId: payloadBase.gameId,
    };
    const validation = dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
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

export function timerActionHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: TimerActionPayload) => {
        // Runtime validation with Zod
        const parseResult = timerActionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid timerAction payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
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
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }

        const validPayload = parseResult.data;
        logger.warn('🔥 CRITICAL DEBUG: Backend timer action received', {
            payload: validPayload,
            'payload.questionUid': validPayload.questionUid,
            'payload.questionUid type': typeof validPayload.questionUid,
            'payload.questionUid length': validPayload.questionUid ? validPayload.questionUid.length : 'null/undefined',
            'payload.action': validPayload.action,
            'payload.accessCode': validPayload.accessCode,
            'JSON.stringify(payload)': JSON.stringify(validPayload)
        });

        logger.info({ payload: validPayload }, 'Received quiz_timer_action event');

        // Look up game instance by access code
        const { accessCode, action, timerEndDateMs, questionUid } = validPayload;
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode }
        });

        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            const errorPayload = {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            } as ErrorPayload;
            logger.warn({
                accessCode,
                errorPayload,
                branch: 'early return: gameInstance not found',
                location: 'timerActionHandler:gameInstance.null'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to missing gameInstance');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            return;
        }

        const gameId = gameInstance.id;
        const userId = socket.data?.userId || socket.data?.user?.userId;

        logger.warn('🔥 CRITICAL DEBUG: Destructured backend values', {
            gameId,
            action,
            timerEndDateMs,
            questionUid,
            'questionUid type': typeof questionUid,
            'questionUid length': questionUid ? questionUid.length : 'null/undefined',
            userId
        });

        logger.info({ gameId, userId, action, timerEndDateMs, questionUid }, 'Timer action handler entered');

        if (!gameId) {
            logger.warn({ action }, 'No gameId provided in payload, aborting timer action');
            const errorPayload: ErrorPayload = {
                message: 'gameId is required to control the timer',
                code: 'GAME_ID_REQUIRED'
            };
            logger.warn({
                action,
                errorPayload,
                branch: 'early return: no gameId',
                location: 'timerActionHandler:gameId.null'
            }, '[DEBUG] Emitting TEACHER_EVENTS.ERROR_DASHBOARD due to missing gameId');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD as any, errorPayload);
            return;
        }

        if (!userId) {
            logger.warn({ gameId, action }, 'No userId on socket, aborting timer action');
            const errorPayload: ErrorPayload = {
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
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD as any, errorPayload);
            return;
        }

        logger.info({ gameId, userId, action, timerEndDateMs }, 'Timer action requested');

        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const gameInstance = await prisma.gameInstance.findFirst({
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

            if (!gameInstance) {
                logger.warn({ gameId, userId, action }, 'Not authorized for this game, aborting timer action');
                const errorPayload: ErrorPayload = {
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
                socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD as any, errorPayload);
                return;
            }

            // Get current game state
            const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
            if (!fullState || !fullState.gameState) {
                logger.warn({ gameId, userId, action }, 'No game state found, aborting timer action');
                const errorPayload: ErrorPayload = {
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
                socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD as any, errorPayload);
                return;
            }

            const gameState = fullState.gameState;
            // Determine canonical timer context
            const playMode = gameState.gameMode;
            const isDeferred = gameState.status === 'completed'; // Business rule: treat completed as deferred
            const attemptCount = undefined; // TODO: wire up if needed for deferred mode

            let canonicalTimer: any = null;
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
                case 'run':
                    await canonicalTimerService.startTimer(accessCode, String(canonicalQuestionUid), playMode, isDeferred, userId, canonicalDurationMs);
                    canonicalTimer = await getCanonicalTimer(
                        accessCode,
                        String(canonicalQuestionUid),
                        playMode,
                        isDeferred,
                        canonicalDurationMs
                    );
                    break;
                case 'pause':
                    await canonicalTimerService.pauseTimer(accessCode, String(canonicalQuestionUid), playMode, isDeferred);
                    canonicalTimer = await getCanonicalTimer(
                        accessCode,
                        String(canonicalQuestionUid),
                        playMode,
                        isDeferred,
                        canonicalDurationMs
                    );
                    break;
                case 'stop':
                    await canonicalTimerService.pauseTimer(accessCode, String(canonicalQuestionUid), playMode, isDeferred);
                    canonicalTimer = await getCanonicalTimer(
                        accessCode,
                        String(canonicalQuestionUid),
                        playMode,
                        isDeferred,
                        canonicalDurationMs
                    );
                    break;
                // Remove unsupported 'edit_timer' and 'set' cases from the switch statement
            }

            logger.info({ gameId, action, canonicalTimer }, 'Timer state after action');

            // Use canonicalTimer for all event payloads below
            // Get the current question UID for timer updates
            // If questionUid is provided in the payload, use it; otherwise use current question
            let targetQuestionUid = questionUid;

            logger.warn('🔥 CRITICAL DEBUG: Question UID logic', {
                'payload questionUid': questionUid,
                'targetQuestionUid': targetQuestionUid,
                'gameState.currentQuestionIndex': gameState.currentQuestionIndex,
                'gameState.questionUids': gameState.questionUids,
                'gameState.questionUids length': gameState.questionUids ? gameState.questionUids.length : 'null'
            });

            if (targetQuestionUid) {
                // Check if this is a different question than currently active
                const currentQuestionUid = gameState.currentQuestionIndex >= 0 &&
                    gameState.questionUids &&
                    gameState.questionUids[gameState.currentQuestionIndex]
                    ? gameState.questionUids[gameState.currentQuestionIndex] || null
                    : null;

                logger.warn('🔥 CRITICAL DEBUG: Current vs target question comparison', {
                    currentQuestionUid,
                    targetQuestionUid,
                    'are they different': currentQuestionUid !== targetQuestionUid,
                    'gameState.currentQuestionIndex': gameState.currentQuestionIndex,
                    'questionUids at currentIndex': gameState.questionUids?.[gameState.currentQuestionIndex]
                });

                if (currentQuestionUid !== targetQuestionUid) {
                    // Switch to the new question
                    const targetQuestionIndex = gameState.questionUids?.indexOf(targetQuestionUid);
                    if (targetQuestionIndex !== undefined && targetQuestionIndex >= 0) {
                        logger.info({ gameId, action, oldQuestion: currentQuestionUid, newQuestion: targetQuestionUid },
                            '[TIMER_ACTION] Switching to new question for timer action');

                        // Update current question index
                        gameState.currentQuestionIndex = targetQuestionIndex;

                        // Reset answersLocked to false for the new question
                        gameState.answersLocked = false;

                        // Update game state with the new current question
                        await gameStateService.updateGameState(gameInstance.accessCode, gameState);

                        // Get the question data to send to players (without correct answers)
                        const question = await prisma.question.findUnique({
                            where: { uid: targetQuestionUid }
                        });

                        // Declare liveRoom and projectionRoom before use
                        const liveRoom = `game_${gameInstance.accessCode}`;
                        const projectionRoom = `projection_${gameId}`;

                        if (question) {
                            // Prepare canonical gameQuestionPayload using shared types and Zod validation
                            const gameQuestionPayload = {
                                question: question, // Use canonical Question type from shared/types
                                questionState: 'active' as const,
                                questionUid: targetQuestionUid,
                                // Add any other required canonical fields from shared/types/socket/events
                            };
                            // Send question to both live and projection rooms using canonical event name
                            io.to([liveRoom, projectionRoom]).emit('game_question', gameQuestionPayload);
                            logger.info({ gameId, targetQuestionUid, liveRoom, projectionRoom, message: '[TIMER_ACTION] Sent new question to live and projection rooms' },
                                '[TIMER_ACTION] Sent new question to live and projection rooms');
                        }

                        // Broadcast question change to dashboard
                        const dashboardRoom = `dashboard_${gameId}`;
                        const questionChangedPayload: DashboardQuestionChangedPayload = {
                            questionUid: targetQuestionUid,
                            oldQuestionUid: currentQuestionUid,
                            timer: canonicalTimer // MODERNIZATION: use canonicalTimer only
                        };
                        // Use canonical event constant for dashboard_question_changed
                        io.to(dashboardRoom).emit(TEACHER_EVENTS.DASHBOARD_QUESTION_CHANGED, questionChangedPayload);

                        logger.info({ gameId, targetQuestionUid, targetQuestionIndex },
                            '[TIMER_ACTION] Question switched and dashboard notified');
                    } else {
                        logger.warn({ gameId, targetQuestionUid, availableQuestions: gameState.questionUids },
                            '[TIMER_ACTION] Target question UID not found in game questions');
                        // Continue with timer action but don't switch questions
                    }
                }
            } else {
                // No specific question requested, use current question
                const currentQuestionFromState = gameState.currentQuestionIndex >= 0 &&
                    gameState.questionUids &&
                    gameState.questionUids[gameState.currentQuestionIndex]
                    ? gameState.questionUids[gameState.currentQuestionIndex]
                    : null;
                targetQuestionUid = currentQuestionFromState || undefined;
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
            let emitRooms: CanonicalTimerRoom[] = [
                { room: dashboardRoom, event: TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: timer.questionUid ?? undefined } }
            ];
            // Determine if this is a STOP action on a different question
            const isStopOnDifferentQuestion = (
                action === 'stop' &&
                typeof questionUid === 'string' &&
                questionUid.length > 0 &&
                gameState.questionUids?.[gameState.currentQuestionIndex] !== questionUid
            );
            if (!isStopOnDifferentQuestion) {
                emitRooms.push(
                    { room: liveRoom, event: 'game_timer_updated', extra: {} },
                    { room: projectionRoom, event: TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, extra: { questionUid: timer.questionUid ?? undefined } }
                );
            }
            emitCanonicalTimerEvents(io, emitRooms, {
                timer: canonicalTimer,
                questionUid: timer.questionUid ?? undefined,
                questionIndex: typeof gameState.currentQuestionIndex === 'number' ? gameState.currentQuestionIndex : -1,
                totalQuestions: Array.isArray(gameState.questionUids) ? gameState.questionUids.length : 0,
                answersLocked: typeof gameState.answersLocked === 'boolean' ? gameState.answersLocked : false,
                gameId
            });
            logger.info({
                action,
                gameId,
                timerStateAfterEmit: JSON.stringify(timer),
                gameStateAfterEmit: JSON.stringify(gameState)
            }, '[DEBUG] After emitting canonical timer events (EXTRA DEBUG)');

        } catch (error) {
            logger.error({ gameId, action, error }, '[TIMER_ACTION] Unhandled error in timerActionHandler');
            const errorPayload: ErrorPayload = {
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
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD as any, errorPayload);
        }
    }; // close returned async function
} // close timerActionHandler
