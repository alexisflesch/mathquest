import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { EndGamePayload } from './types';
import { TEACHER_EVENTS } from '@shared/types/socket/events';

// Create a handler-specific logger
const logger = createLogger('EndGameHandler');

export function endGameHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: EndGamePayload, callback?: (data: any) => void) => {
        const { gameId } = payload;
        const userId = socket.data?.userId || socket.data?.user?.userId;

        if (!userId) {
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to end the game',
            });
            return;
        }

        logger.info({ gameId, userId }, 'Game end requested');

        console.log('[endGame] Handler called with:', { gameId, userId });
        console.log('[endGame] Socket data:', socket.data);

        try {
            // Verify authorization
            const gameInstance = await prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    initiatorUserId: userId
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

            // Update game status
            gameState.status = 'completed';

            // Update game state in Redis
            await gameStateService.updateGameState(gameInstance.accessCode, gameState);

            // Update the database record
            await prisma.gameInstance.update({
                where: { id: gameId },
                data: {
                    status: 'completed',
                    endedAt: new Date()
                }
            });

            // Broadcast to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const gameRoom = `game_${gameInstance.accessCode}`;
            const projectionRoom = `projection_${gameId}`;

            // To dashboard
            io.to(dashboardRoom).emit('dashboard_game_status_changed', {
                status: 'completed'
            });

            // To game room
            io.to(gameRoom).emit('game_status_changed', {
                status: 'completed',
                reason: 'teacher_ended',
                message: 'The teacher has ended the game.'
            });

            // To projection room
            io.to(projectionRoom).emit('projection_game_status_changed', {
                status: 'completed'
            });

            logger.info({ gameId }, 'Game ended successfully');
        } catch (error) {
            logger.error({ gameId, error }, 'Error ending game');
            socket.emit('error_dashboard', {
                code: 'END_GAME_ERROR',
                message: 'Failed to end the game',
                details: error instanceof Error ? error.message : String(error)
            });

            // Call the callback with error if provided
            if (callback) {
                callback({
                    success: false,
                    error: 'Failed to end the game',
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        }

        // Call the callback if provided with success
        if (callback) {
            callback({
                success: true,
                gameId
            });
        }
    };
}
