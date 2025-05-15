import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { registerGameHandlers } from '../handlers/gameHandler';

// Create a handler-specific logger
const logger = createLogger('TeacherControlHandler');

// Redis key prefixes
const GAME_KEY_PREFIX = 'mathquest:game:';
const TEACHER_CONTROL_PREFIX = 'mathquest:teacher_control:';

// Define teacher control event payload types
export interface JoinTeacherControlPayload {
    gameId: string;      // Database ID of the game
    teacherId: string;   // Teacher ID
}

export interface SetQuestionPayload {
    gameId: string;      // Database ID of the game
    questionIndex: number; // Index of the question to show
}

export interface TimerActionPayload {
    gameId: string;      // Database ID of the game
    action: 'start' | 'pause' | 'resume' | 'stop'; // Timer action
}

export interface LockAnswersPayload {
    gameId: string;      // Database ID of the game
    locked: boolean;     // Whether to lock or unlock answers
}

/**
 * Register all teacher control socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerTeacherControlHandlers(io: SocketIOServer, socket: Socket): void {
    // Teacher joining the control panel for a game
    socket.on('join_teacher_control', async (payload: JoinTeacherControlPayload) => {
        const { gameId, teacherId } = payload;
        logger.info({ gameId, teacherId, socketId: socket.id }, 'Teacher joining control panel');

        try {
            // Verify the game exists and belongs to this teacher
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameId }
            });

            if (!gameInstance) {
                logger.warn({ gameId }, 'Game not found');
                socket.emit('error', {
                    code: 'GAME_NOT_FOUND',
                    message: 'Game not found with the provided ID',
                });
                return;
            }

            if (gameInstance.initiatorTeacherId !== teacherId) {
                logger.warn({ gameId, teacherId }, 'Teacher not authorized for this game');
                socket.emit('error', {
                    code: 'NOT_AUTHORIZED',
                    message: 'You are not authorized to control this game',
                });
                return;
            }

            // Join the teacher control room
            const roomName = `teacher_control_${gameId}`;
            await socket.join(roomName);

            // Store teacher control state in Redis if needed
            await redisClient.hset(
                `${TEACHER_CONTROL_PREFIX}${gameId}`,
                socket.id,
                JSON.stringify({
                    id: socket.id,
                    teacherId,
                    joinedAt: Date.now()
                })
            );

            // Send current game state
            const gameStateRaw = await redisClient.get(`${GAME_KEY_PREFIX}${gameInstance.accessCode}`);
            if (gameStateRaw) {
                const gameState = JSON.parse(gameStateRaw);
                socket.emit('game_control_state', {
                    gameId,
                    accessCode: gameInstance.accessCode,
                    status: gameState.status,
                    currentQuestionIndex: gameState.currentQuestionIndex,
                    totalQuestions: gameState.questionIds.length,
                    timer: gameState.timer
                });
            }

            logger.info({ gameId, teacherId, socketId: socket.id }, 'Teacher joined control panel successfully');
        } catch (error) {
            logger.error({ gameId, error }, 'Error handling join_teacher_control event');
            socket.emit('error', {
                code: 'JOIN_CONTROL_ERROR',
                message: 'Failed to join control panel',
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        try {
            // Find which teacher controls this socket might be part of
            const controlKeys = await redisClient.keys(`${TEACHER_CONTROL_PREFIX}*`);

            for (const key of controlKeys) {
                const exists = await redisClient.hexists(key, socket.id);
                if (exists) {
                    // Extract game ID from the key
                    const gameId = key.replace(TEACHER_CONTROL_PREFIX, '');
                    logger.info({ gameId, socketId: socket.id }, 'Teacher disconnected from control panel');

                    // Remove from Redis
                    await redisClient.hdel(key, socket.id);
                }
            }
        } catch (error) {
            logger.error({ error }, 'Error handling teacher control disconnect');
        }
    });
}

export default registerTeacherControlHandlers;
