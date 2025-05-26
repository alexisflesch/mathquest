import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/gameStateService';
import createLogger from '@/utils/logger';
import { TimerActionPayload } from './types';

// Create a handler-specific logger
const logger = createLogger('TimerActionHandler');

export function timerActionHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: TimerActionPayload) => {
        logger.info({ payload }, 'Received quiz_timer_action event');
        // Only support gameId, do not allow quizId for timer actions
        const { gameId, action, duration } = payload;
        const userId = socket.data?.userId;

        logger.info({ gameId, userId, action, duration }, 'Timer action handler entered');

        if (!gameId) {
            logger.warn({ action }, 'No gameId provided in payload, aborting timer action');
            socket.emit('error_dashboard', {
                code: 'GAME_ID_REQUIRED',
                message: 'gameId is required to control the timer',
            });
            return;
        }

        if (!userId) {
            logger.warn({ gameId, action }, 'No userId on socket, aborting timer action');
            socket.emit('error_dashboard', {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control the timer',
            });
            return;
        }

        logger.info({ gameId, userId, action, duration }, 'Timer action requested');

        try {
            // Verify authorization
            const gameInstance = await prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    initiatorUserId: userId
                }
            });

            if (!gameInstance) {
                logger.warn({ gameId, userId, action }, 'Not authorized for this game, aborting timer action');
                socket.emit('error_dashboard', {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                });
                return;
            }

            // Get current game state
            const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
            if (!fullState || !fullState.gameState) {
                logger.warn({ gameId, userId, action }, 'No game state found, aborting timer action');
                socket.emit('error_dashboard', {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
                return;
            }

            const gameState = fullState.gameState;
            // Initialize timer with safe defaults if undefined
            let timer = gameState.timer ? { ...gameState.timer } : {
                startedAt: 0,
                duration: 30000, // Default 30 seconds
                isPaused: true
            };
            const now = Date.now();

            // Validate duration if provided
            const validDuration = duration && duration > 0 ? duration : undefined;

            // Update timer based on the action
            switch (action) {
                case 'start':
                    logger.info({ gameId, action, now, validDuration, timer }, '[TIMER_ACTION] Processing start action');
                    timer = {
                        startedAt: now,
                        duration: validDuration ? validDuration * 1000 : (timer.duration || 30000), // Convert to ms if provided
                        isPaused: false
                    };
                    logger.info({ gameId, action, timer }, '[TIMER_ACTION] Timer object after start processing');
                    break;

                case 'pause':
                    if (!timer.isPaused) {
                        const elapsed = timer.startedAt ? now - timer.startedAt : 0;
                        const timeRemaining = Math.max(0, (timer.duration || 30000) - elapsed);
                        timer = {
                            ...timer,
                            isPaused: true,
                            pausedAt: now,
                            timeRemaining
                        };
                    }
                    break;

                case 'resume':
                    // Handle resume even if timeRemaining is not defined
                    if (timer.isPaused) {
                        timer = {
                            startedAt: now,
                            duration: timer.timeRemaining || timer.duration || 30000,
                            isPaused: false
                        };
                    }
                    break;

                case 'stop':
                    timer = {
                        startedAt: 0,
                        duration: timer.duration || 30000,
                        isPaused: true,
                        timeRemaining: 0
                    };
                    break;

                case 'set_duration':
                    if (validDuration) {
                        timer = {
                            ...timer,
                            duration: validDuration * 1000 // Convert to ms
                        };
                    }
                    break;
            }

            logger.info({ gameId, action, timer }, 'Timer state after action');

            // Update game state with new timer
            gameState.timer = timer;
            await gameStateService.updateGameState(gameInstance.accessCode, gameState);

            // Broadcast timer update to all relevant rooms
            const dashboardRoom = `dashboard_${gameId}`;
            const liveRoom = `game_${gameInstance.accessCode}`; // Ensure gameInstance.accessCode is correct
            const projectionRoom = `projection_${gameId}`;

            logger.info({ gameId, action, dashboardRoom, liveRoom, projectionRoom, timer }, '[TIMER_ACTION] Emitting timer updates to rooms');

            // To dashboard
            io.to(dashboardRoom).emit('dashboard_timer_updated', { timer });
            logger.info({ gameId, action, dashboardRoom, timer }, '[TIMER_ACTION] Emitted to dashboardRoom');

            // To live room (for quiz players)
            io.to(liveRoom).emit('game_timer_updated', { timer });
            logger.info({ gameId, action, liveRoom, timer }, '[TIMER_ACTION] Emitted to liveRoom');

            // To projection room
            io.to(projectionRoom).emit('projection_timer_updated', { timer });
            logger.info({ gameId, action, projectionRoom, timer }, '[TIMER_ACTION] Emitted to projectionRoom');

            logger.info({ gameId, action }, 'Timer updated successfully');
        } catch (error) {
            logger.error({ gameId, action, error }, 'Error updating timer');
            socket.emit('error_dashboard', {
                code: 'TIMER_ERROR',
                message: 'Failed to update timer',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };
}
