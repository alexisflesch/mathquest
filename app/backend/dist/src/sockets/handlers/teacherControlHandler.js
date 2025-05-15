"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTeacherControlHandlers = registerTeacherControlHandlers;
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('TeacherControlHandler');
// Redis key prefixes
const GAME_KEY_PREFIX = 'mathquest:game:';
const TEACHER_CONTROL_PREFIX = 'mathquest:teacher_control:';
/**
 * Register all teacher control socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function registerTeacherControlHandlers(io, socket) {
    // Teacher joining the control panel for a game
    socket.on('join_teacher_control', async (payload) => {
        const { gameId, teacherId } = payload;
        logger.info({ gameId, teacherId, socketId: socket.id }, 'Teacher joining control panel');
        try {
            // Verify the game exists and belongs to this teacher
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
            await redis_1.redisClient.hset(`${TEACHER_CONTROL_PREFIX}${gameId}`, socket.id, JSON.stringify({
                id: socket.id,
                teacherId,
                joinedAt: Date.now()
            }));
            // Send current game state
            const gameStateRaw = await redis_1.redisClient.get(`${GAME_KEY_PREFIX}${gameInstance.accessCode}`);
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
        }
        catch (error) {
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
            const controlKeys = await redis_1.redisClient.keys(`${TEACHER_CONTROL_PREFIX}*`);
            for (const key of controlKeys) {
                const exists = await redis_1.redisClient.hexists(key, socket.id);
                if (exists) {
                    // Extract game ID from the key
                    const gameId = key.replace(TEACHER_CONTROL_PREFIX, '');
                    logger.info({ gameId, socketId: socket.id }, 'Teacher disconnected from control panel');
                    // Remove from Redis
                    await redis_1.redisClient.hdel(key, socket.id);
                }
            }
        }
        catch (error) {
            logger.error({ error }, 'Error handling teacher control disconnect');
        }
    });
}
exports.default = registerTeacherControlHandlers;
