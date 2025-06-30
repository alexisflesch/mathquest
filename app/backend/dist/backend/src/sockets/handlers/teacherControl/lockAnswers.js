"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockAnswersHandler = lockAnswersHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// Create a handler-specific logger
const logger = (0, logger_1.default)('LockAnswersHandler');
function lockAnswersHandler(io, socket) {
    return async (payload, callback) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.lockAnswersPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid lockAnswers payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid lockAnswers payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
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
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: true
            }
        });
        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            });
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
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to lock answers',
            });
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
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                });
                if (callback) {
                    callback({
                        success: false,
                        error: 'Not authorized'
                    });
                }
                return;
            }
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(accessCode);
            if (!fullState || !fullState.gameState) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
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
            await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
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
            // Always include canonical current question in projection_state
            // Fetch all questions for this game instance (ordered)
            const gameInstanceWithQuestions = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: gameId },
                include: {
                    gameTemplate: {
                        include: {
                            questions: {
                                include: { question: true },
                                orderBy: { sequence: 'asc' }
                            }
                        }
                    }
                }
            });
            if (gameState && gameInstanceWithQuestions?.gameTemplate?.questions) {
                const questionsArr = gameInstanceWithQuestions.gameTemplate.questions;
                let questionIndex = typeof gameState.currentQuestionIndex === 'number' && gameState.currentQuestionIndex >= 0 && gameState.currentQuestionIndex < questionsArr.length
                    ? gameState.currentQuestionIndex
                    : -1;
                let currentQuestion = null;
                if (questionIndex !== -1) {
                    currentQuestion = questionsArr[questionIndex]?.question;
                }
                if (currentQuestion) {
                    const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@shared/types/quiz/liveQuestion')));
                    const filteredQuestion = filterQuestionForClient(currentQuestion);
                    gameState.questionData = filteredQuestion;
                }
            }
            // Zod validation for projection_state payload
            const { validateProjectionStatePayload } = require('./validateProjectionStateWithZod');
            const projectionPayload = { gameState, answersLocked: lock };
            const validation = validateProjectionStatePayload(projectionPayload);
            if (!validation.success) {
                logger.error({ errors: validation.error.errors, projectionPayload }, '❌ Zod validation failed for projection_state payload');
            }
            io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, projectionPayload);
            logger.info({ gameId, lock }, 'Answers lock status updated');
        }
        catch (error) {
            logger.error({ gameId, lock, error }, 'Error updating answers lock status');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'LOCK_ERROR',
                message: 'Failed to update answers lock status',
                details: { error: error instanceof Error ? error.message : String(error) }
            });
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
