import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';
import type { ErrorPayload } from '@shared/types/socketEvents';
import { endGamePayloadSchema } from '@shared/types/socketEvents.zod';

import { EndGamePayload } from './types';

// Create a handler-specific logger
const logger = createLogger('EndGameHandler');

export function endGameHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: EndGamePayload, callback?: (data: any) => void) => {
        // Runtime validation with Zod
        const parseResult = endGamePayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid endGame payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid endGame payload',
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
        const { accessCode } = validPayload;

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
                message: 'Authentication required to end the game',
            } as ErrorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
            }
            return;
        }

        logger.info({ gameId, userId, accessCode }, 'Game end requested');

        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const authorized = gameInstance.initiatorUserId === userId ||
                gameInstance.gameTemplate.creatorId === userId;

            if (!authorized) {
                logger.warn({ gameId, userId }, 'Not authorized for this game, aborting end game action');
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

            // Update game status to completed
            gameState.status = 'completed';

            // Update game state in Redis
            await gameStateService.updateGameState(accessCode, gameState);

            // Update game instance in database
            await prisma.gameInstance.update({
                where: { id: gameId },
                data: {
                    status: 'ended',
                    endedAt: new Date()
                }
            });

            const endedAt = Date.now();

            // Broadcast to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const gameRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameId}`;

            // To dashboard
            io.to(dashboardRoom).emit('dashboard_game_ended', {
                gameId,
                accessCode,
                endedAt
            });

            // To game room
            io.to(gameRoom).emit('game_ended', {
                accessCode,
                endedAt
            });

            // To projection room
            io.to(projectionRoom).emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, {
                gameId,
                accessCode,
                endedAt
            });

            logger.info({ gameId, accessCode }, 'Game ended successfully');

            // Call the callback if provided with success
            if (callback) {
                callback({
                    success: true,
                    gameId,
                    accessCode,
                    endedAt
                });
            }

        } catch (error) {
            logger.error({ gameId, accessCode, error }, 'Error ending game');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'END_GAME_ERROR',
                message: 'Failed to end game',
                details: { error: error instanceof Error ? error.message : String(error) }
            } as ErrorPayload);

            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to end game',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        }
    };
}
