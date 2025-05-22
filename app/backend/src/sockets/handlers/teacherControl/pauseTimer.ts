// filepath: /home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/pauseTimer.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { PauseTimerPayload } from './types';

// Create a handler-specific logger
const logger = createLogger('PauseTimerHandler');

export function pauseTimerHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: PauseTimerPayload, callback?: (data: any) => void) => {
        const { gameId, accessCode } = payload;
        const userId = socket.data?.userId;

        // Variables that will be needed throughout the function
        let gameInstance: any = null;
        let gameAccessCode: string | null = null;

        if (!userId) {
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control timer',
            });
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
                    where: { id: gameId }
                });
                if (gameInstance) {
                    gameAccessCode = gameInstance.accessCode;
                }
            } else if (accessCode) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode }
                });
                if (gameInstance) {
                    gameAccessCode = accessCode;
                }
            } else {
                socket.emit('error_dashboard', {
                    code: 'MISSING_PARAMS',
                    message: 'Either game ID or access code must be provided',
                });
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
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Game not found',
                        message: 'Game not found with the provided ID or access code'
                    });
                }
                return;
            }

            if (gameInstance.initiatorUserId !== userId) {
                socket.emit('error_dashboard', {
                    code: 'NOT_AUTHORIZED',
                    message: 'You are not authorized to control this game',
                });
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
                });
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
                });
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
                duration: 30000, // Default 30 seconds
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

            // Calculate time elapsed since timer started
            const now = Date.now();
            const startedAt = timer.startedAt || 0;
            const elapsed = now - startedAt;
            const timeRemaining = Math.max(0, timer.duration - elapsed);

            // Pause the timer
            timer = {
                ...timer,
                isPaused: true,
                pausedAt: now,
                timeRemaining
            };

            // Update game state
            gameState.timer = timer;
            await gameStateService.updateGameState(accessCodeStr, gameState);

            // Broadcast to all relevant rooms
            const gameRoom = `live_${accessCodeStr}`;
            const dashboardRoom = `dashboard_${gameInstance.id}`;
            const projectionRoom = `projection_${gameInstance.id}`;

            // Broadcast to game room
            io.to(gameRoom).emit('game_timer_updated', { timer });

            // Broadcast to dashboard room
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer });

            // Broadcast to projection room
            io.to(projectionRoom).emit('projection_timer_updated', { timer });

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
                details: error instanceof Error ? error.message : String(error)
            });

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