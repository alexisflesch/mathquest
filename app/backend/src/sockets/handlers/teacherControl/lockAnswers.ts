import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { LockAnswersPayload } from './types';

// Create a handler-specific logger
const logger = createLogger('LockAnswersHandler');

export function lockAnswersHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: LockAnswersPayload, callback?: (data: any) => void) => {
        const { gameId, lock } = payload;
        const teacherId = socket.data?.teacherId;

        if (!teacherId) {
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to lock answers',
            });
            return;
        }

        logger.info({ gameId, teacherId, lock }, 'Answer lock requested');

        try {
            // Verify authorization
            const gameInstance = await prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    initiatorUserId: teacherId
                }
            });

            if (!gameInstance) {
                socket.emit('error_dashboard', {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                });
                return;
            }

            // Get current game state
            const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
            if (!fullState || !fullState.gameState) {
                socket.emit('error_dashboard', {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
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
            io.to(projectionRoom).emit('projection_answers_lock_changed', {
                answersLocked: lock
            });

            logger.info({ gameId, lock }, 'Answers lock status updated');
        } catch (error) {
            logger.error({ gameId, lock, error }, 'Error updating answers lock status');
            socket.emit('error_dashboard', {
                code: 'LOCK_ERROR',
                message: 'Failed to update answers lock status',
                details: error instanceof Error ? error.message : String(error)
            });

            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to update answers lock status',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
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
