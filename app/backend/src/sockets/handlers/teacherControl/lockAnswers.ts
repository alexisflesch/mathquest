import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS, TEACHER_EVENTS  } from '@shared/types/socket/events';
import type { ErrorPayload } from '@shared/types/socketEvents';
import { lockAnswersPayloadSchema } from '@shared/types/socketEvents.zod';

// Create a handler-specific logger
const logger = createLogger('LockAnswersHandler');

export function lockAnswersHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: any, callback?: (data: any) => void) => {
        // Runtime validation with Zod
        const parseResult = lockAnswersPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid lockAnswers payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid lockAnswers payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Invalid payload format'
                });
            }
            return;
        }

        const validPayload = parseResult.data;
        const { accessCode, lock } = validPayload;

        // Look up game instance by access code
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: true
            }
        });

        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            } as ErrorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Game not found'
                });
            }
            return;
        }

        const gameId = gameInstance.id;
        const userId = socket.data?.userId || socket.data?.user?.userId;

        if (!userId) {
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to lock answers',
            } as ErrorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
            }
            return;
        }

        logger.info({ gameId, userId, lock, accessCode }, 'Answer lock requested');

        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const authorized = gameInstance.initiatorUserId === userId ||
                gameInstance.gameTemplate.creatorId === userId;

            if (!authorized) {
                logger.warn({ gameId, userId, lock }, 'Not authorized for this game, aborting lock action');
                socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'Not authorized'
                    });
                }
                return;
            }

            // Get current game state
            const fullState = await gameStateService.getFullGameState(accessCode);
            if (!fullState || !fullState.gameState) {
                socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                } as ErrorPayload);
                if (callback) {
                    callback({
                        success: false,
                        error: 'Could not retrieve game state'
                    });
                }
                return;
            }

            const gameState = fullState.gameState;

            // Update answer lock status
            gameState.answersLocked = lock;

            // Update game state in Redis
            await gameStateService.updateGameState(gameInstance.accessCode, gameState);

            // Broadcast to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const gameRoom = `game_${gameInstance.accessCode}`;
            const projectionRoom = `projection_${gameId}`;

            // To dashboard
            io.to(dashboardRoom).emit('dashboard_answers_lock_changed', {
                answersLocked: lock
            });

            // To game room
            io.to(gameRoom).emit('game_answers_lock_changed', {
                answersLocked: lock
            });

            // To projection room
            io.to(projectionRoom).emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, {
                answersLocked: lock
            });

            logger.info({ gameId, lock }, 'Answers lock status updated');
        } catch (error) {
            logger.error({ gameId, lock, error }, 'Error updating answers lock status');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'LOCK_ERROR',
                message: 'Failed to update answers lock status',
                details: { error: error instanceof Error ? error.message : String(error) }
            } as ErrorPayload);

            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to update answers lock status',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
            return;
        }

        // Call the callback if provided with success
        if (callback) {
            callback({
                success: true,
                gameId,
                lock
            });
        }
    };
}
