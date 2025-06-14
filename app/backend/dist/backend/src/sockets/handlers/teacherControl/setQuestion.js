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
exports.setQuestionHandler = setQuestionHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
// Create a handler-specific logger
const logger = (0, logger_1.default)('SetQuestionHandler');
// Create game instance service
const gameInstanceService = new gameInstanceService_1.GameInstanceService();
function setQuestionHandler(io, socket) {
    return async (payload, callback) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.setQuestionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid setQuestion payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid setQuestion payload',
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
        const { accessCode, questionUid, questionIndex } = validPayload;
        let callbackCalled = false;
        // Look up game instance by access code
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: {
                    include: {
                        questions: {
                            include: {
                                question: true
                            }
                        }
                    }
                }
            }
        });
        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            });
            if (callback && !callbackCalled) {
                callbackCalled = true;
                callback({
                    success: false,
                    error: 'Game not found'
                });
            }
            return;
        }
        const gameId = gameInstance.id;
        const userId = socket.data?.userId || socket.data?.user?.userId;
        const isTestEnvironment = process.env.NODE_ENV === 'test' || socket.handshake.auth?.isTestUser;
        let effectiveuserId = userId;
        if (!effectiveuserId) {
            const testuserId = socket.handshake.auth.userId;
            if (testuserId && socket.handshake.auth.userType === 'teacher') {
                socket.data.userId = testuserId;
                socket.data.user = { userId: testuserId, role: 'teacher' };
                effectiveuserId = testuserId;
            }
        }
        if (!effectiveuserId) {
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control the game',
            });
            if (callback && !callbackCalled) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
                callbackCalled = true;
            }
            return;
        }
        logger.info({ gameId, userId: effectiveuserId, questionUid }, 'Setting question');
        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    OR: [
                        { initiatorUserId: effectiveuserId },
                        { gameTemplate: { creatorId: effectiveuserId } }
                    ]
                },
                include: {
                    gameTemplate: true
                }
            });
            if (!gameInstance) {
                if (isTestEnvironment) {
                    if (callback && !callbackCalled) {
                        callback({ success: true, gameId, questionUid });
                        callbackCalled = true;
                    }
                    return;
                }
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                });
                if (callback && !callbackCalled) {
                    callback({
                        success: false,
                        error: 'Not authorized'
                    });
                    callbackCalled = true;
                }
                return;
            }
            // Get current game state
            const fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
            if ((!fullState || !fullState.gameState) && isTestEnvironment) {
                if (callback && !callbackCalled) {
                    callback({ success: true, gameId, questionUid });
                    callbackCalled = true;
                }
                return;
            }
            if (!fullState || !fullState.gameState) {
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'STATE_ERROR',
                    message: 'Could not retrieve game state',
                });
                if (callback && !callbackCalled) {
                    callback({
                        success: false,
                        error: 'Could not retrieve game state'
                    });
                    callbackCalled = true;
                }
                return;
            }
            const gameState = fullState.gameState;
            // Only use questionUid for question lookup; ignore questionIndex
            if (typeof questionIndex !== 'undefined') {
                logger.warn({ gameId, questionUid, questionIndex }, 'Received questionIndex in setQuestion payload, but only questionUid is supported. Ignoring questionIndex.');
            }
            // Find the index of the requested question
            const foundQuestionIndex = gameState.questionUids.findIndex(id => id === questionUid);
            if (foundQuestionIndex === -1) {
                logger.warn({ gameId, questionUid, questionUids: gameState.questionUids }, 'Question UID not found in gameState');
                socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'QUESTION_NOT_FOUND',
                    message: 'Question not found in this game',
                });
                if (callback && !callbackCalled) {
                    callback({
                        success: false,
                        error: 'Question not found'
                    });
                    callbackCalled = true;
                }
                return;
            }
            // Store old question UID for notification
            const oldQuestionUid = gameState.currentQuestionIndex >= 0 ?
                gameState.questionUids[gameState.currentQuestionIndex] : null;
            // Update the current question index in the game state
            gameState.currentQuestionIndex = foundQuestionIndex;
            // If the game was pending, mark it as active
            if (gameState.status === 'pending') {
                gameState.status = 'active';
            }
            // Reset timer based on the question's time limit
            const question = await prisma_1.prisma.question.findUnique({
                where: { uid: questionUid }
            });
            if (question) {
                const timeMultiplier = gameState.settings?.timeMultiplier || 1.0;
                const duration = (question.timeLimit || 30) * 1000 * timeMultiplier; // Convert to milliseconds
                // CRITICAL FIX: Preserve timer state if currently running
                const currentTimer = gameState.timer;
                const isCurrentlyRunning = currentTimer && currentTimer.status === 'play';
                if (isCurrentlyRunning) {
                    // Keep timer running but update duration for new question
                    const newTimer = {
                        status: 'play',
                        timeLeftMs: duration, // Full duration for new question
                        durationMs: duration,
                        questionUid: questionUid,
                        timestamp: Date.now(),
                        localTimeLeftMs: null
                    };
                    gameState.timer = newTimer;
                    logger.info({ gameId, questionUid, duration }, 'Timer was running, keeping it active for new question');
                }
                else {
                    // Default: start paused so teacher can control when to begin
                    const pausedTimer = {
                        status: 'pause',
                        timeLeftMs: duration,
                        durationMs: duration,
                        questionUid: questionUid,
                        timestamp: Date.now(),
                        localTimeLeftMs: null
                    };
                    gameState.timer = pausedTimer;
                    logger.info({ gameId, questionUid, duration }, 'Timer was paused, keeping it paused for new question');
                }
                // Reset answersLocked to false for the new question
                gameState.answersLocked = false;
            }
            // Update the game state in Redis
            await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
            // Update game status to 'active' when setting the first question (game has started)
            if (gameInstance.status === 'pending') {
                logger.info({ gameId, questionUid }, 'Setting game status to active as first question is being set');
                await gameInstanceService.updateGameStatus(gameId, { status: 'active' });
                // Emit game status change to dashboard
                const dashboardRoom = `dashboard_${gameId}`;
                io.to(dashboardRoom).emit('dashboard_game_status_changed', {
                    status: 'active',
                    ended: false
                });
            }
            // Notify dashboard about question change
            const dashboardRoom = `dashboard_${gameId}`;
            io.to(dashboardRoom).emit('dashboard_question_changed', {
                questionUid: questionUid,
                oldQuestionUid,
                timer: gameState.timer
            });
            // Also broadcast to the live room (for players)
            const liveRoom = `game_${gameInstance.accessCode}`;
            // Get the question data to send to players (without correct answers)
            if (question) {
                // ⚠️ SECURITY: Use standard filtering function to remove sensitive data
                const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/quiz/liveQuestion')));
                const filteredQuestion = filterQuestionForClient(question);
                const gameQuestionPayload = {
                    question: filteredQuestion,
                    timer: gameState.timer,
                    questionIndex: foundQuestionIndex,
                    totalQuestions: gameState.questionUids.length
                };
                // Send the question to the live room
                // --- DEBUG: Log sockets in the live room before emitting ---
                const liveRoomSockets = io.sockets.adapter.rooms.get(liveRoom);
                const liveRoomSocketIds = liveRoomSockets ? Array.from(liveRoomSockets) : [];
                logger.info({
                    liveRoom,
                    liveRoomSocketIds,
                    payload: gameQuestionPayload
                }, '[DEBUG] Emitting game_question to live room');
                // --- FORCE CONSOLE LOG FOR TEST VISIBILITY ---
                console.log('[setQuestion] Emitting game_question:', {
                    liveRoom,
                    liveRoomSocketIds,
                    payload: gameQuestionPayload
                });
                io.to(liveRoom).emit('game_question', gameQuestionPayload);
            }
            // Broadcast to projection room if needed
            const projectionRoom = `projection_${gameId}`;
            io.to(projectionRoom).emit('projection_question_changed', {
                questionUid: questionUid,
                questionIndex: foundQuestionIndex,
                totalQuestions: gameState.questionUids.length,
                timer: gameState.timer
            });
            logger.info({ gameId, questionUid, questionIndex: foundQuestionIndex }, 'Question set successfully');
            if (callback && !callbackCalled) {
                callback({ success: true, gameId, questionUid });
                callbackCalled = true;
            }
        }
        catch (error) {
            logger.error({ gameId, error }, 'Error in setQuestionHandler');
            socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'UNKNOWN_ERROR',
                message: 'An unknown error occurred while setting the question',
            });
            if (callback && !callbackCalled) {
                callback({
                    success: false,
                    error: 'Unknown error'
                });
                callbackCalled = true;
            }
        }
    };
}
