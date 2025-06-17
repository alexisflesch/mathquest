// filepath: /home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/pauseTimer.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS, TEACHER_EVENTS  } from '@shared/types/socket/events';
import { GameTimerState } from '@shared/types/core/timer';
import { pauseTimerPayloadSchema } from '@shared/types/socketEvents.zod';
import type { ErrorPayload, GameTimerUpdatePayload } from '@shared/types/socketEvents';

// Create a handler-specific logger
const logger = createLogger('PauseTimerHandler');

export function pauseTimerHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: any, callback?: (data: any) => void) => {
        // Runtime validation with Zod
        const parseResult = pauseTimerPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid pauseTimer payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid pauseTimer payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit('error_dashboard', errorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Invalid payload format'
                });
            }
            return;
        }

        const { gameId, accessCode } = parseResult.data;
        const userId = socket.data?.userId;

        // Variables that will be needed throughout the function
        let gameInstance: any = null;
        let gameAccessCode: string | null = null;

        if (!userId) {
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control timer',
            } as ErrorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
            }
            return;
        }

        logger.info({ accessCode, gameId, userId }, 'Pausing timer');

        try {
            // Find the game instance by gameId or accessCode
            if (gameId) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { id: gameId },
                    include: { gameTemplate: true }
                });
                if (gameInstance) {
                    gameAccessCode = gameInstance.accessCode;
                }
            } else if (accessCode) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode },
                    include: { gameTemplate: true }
                });
                if (gameInstance) {
                    gameAccessCode = accessCode;
                }
            } else {
                socket.emit('error_dashboard', {
                    code: 'MISSING_PARAMS',
                    message: 'Either game ID or access code must be provided',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'Missing parameters',
                        message: 'Either game ID or access code must be provided'
                    });
                }
                return;
            }

            if (!gameInstance) {
                socket.emit('error_dashboard', {
                    code: 'GAME_NOT_FOUND',
                    message: 'Game not found with the provided ID or access code',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'Game not found',
                        message: 'Game not found with the provided ID or access code'
                    });
                }
                return;
            }

            // Check authorization - user must be either the game initiator or the template creator
            const isAuthorized = gameInstance.initiatorUserId === userId ||
                gameInstance.gameTemplate?.creatorId === userId;

            if (!isAuthorized) {
                socket.emit('error_dashboard', {
                    code: 'NOT_AUTHORIZED',
                    message: 'You are not authorized to control this game',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'Not authorized',
                        message: 'You are not authorized to control this game'
                    });
                }
                return;
            }

            // Need accessCode for game state operations
            if (!gameAccessCode) {
                socket.emit('error_dashboard', {
                    code: 'MISSING_ACCESS_CODE',
                    message: 'Access code is required to manage game state',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'Missing access code',
                        message: 'Access code is required to manage game state'
                    });
                }
                return;
            }

            // Now we know gameAccessCode is not null
            const accessCodeStr = gameAccessCode;

            // Get current game state
            const fullState = await gameStateService.getFullGameState(accessCodeStr);
            if (!fullState || !fullState.gameState) {
                socket.emit('error_dashboard', {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'State error',
                        message: 'Could not retrieve game state'
                    });
                }
                return;
            }

            const gameState = fullState.gameState;

            // Initialize timer with safe defaults if undefined
            let timer = gameState.timer ? { ...gameState.timer } : {
                startedAt: 0,
                durationMs: 30000, // Default 30 seconds
                isPaused: true
            };

            // Skip if timer is already paused
            if (timer.isPaused) {
                // If already paused, just return current state
                socket.emit('timer_update_response', {
                    success: true,
                    timer
                });
                if (callback) {
                    callback({
                        success: true,
                        timer
                    });
                }
                return;
            }

            // Calculate time remaining from current timer state
            const now = Date.now();
            let timeRemaining = 0;
            let questionUid: string | null = null;

            // Handle both old and new timer formats during transition
            if ('timeLeftMs' in timer) {
                // New format
                timeRemaining = timer.timeLeftMs || 0;
                questionUid = timer.questionUid || null;
            } else {
                // Old format - calculate from startedAt
                const startedAt = timer.startedAt || 0;
                const elapsed = now - startedAt;
                timeRemaining = Math.max(0, timer.durationMs - elapsed);
            }

            // Create paused timer using shared GameTimerState format
            const pausedTimer: GameTimerState = {
                status: 'pause',
                timeLeftMs: timeRemaining,
                durationMs: timer.durationMs,
                questionUid: questionUid,
                timestamp: now,
                localTimeLeftMs: null
            };

            // Update game state
            gameState.timer = pausedTimer;
            await gameStateService.updateGameState(accessCodeStr, gameState);

            // Broadcast to all relevant rooms
            const gameRoom = `game_${accessCodeStr}`;
            const dashboardRoom = `dashboard_${gameInstance.id}`;
            const projectionRoom = `projection_${gameInstance.id}`;

            // Broadcast to game room
            io.to(gameRoom).emit('game_timer_updated', { timer: { ...pausedTimer, isPaused: true } } as GameTimerUpdatePayload); // TODO: Ensure isPaused is set

            // Broadcast to dashboard room
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer: { ...pausedTimer, isPaused: true } }); // TODO: Define shared type if missing

            // Broadcast to projection room
            io.to(projectionRoom).emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, { timer: { ...pausedTimer, isPaused: true } }); // TODO: Define shared type if missing

            // Call the callback if provided with success
            if (callback) {
                callback({
                    success: true,
                    timer
                });
            }
        } catch (error) {
            logger.error({ accessCode, error }, 'Error pausing timer');
            socket.emit('error_dashboard', {
                code: 'TIMER_ERROR',
                message: 'Failed to pause timer',
                details: { error: error instanceof Error ? error.message : String(error) }
            } as ErrorPayload);

            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to pause timer',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        }
    };
}
export default pauseTimerHandler;