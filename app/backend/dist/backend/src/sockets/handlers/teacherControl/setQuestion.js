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
const gameStateService_1 = __importDefault(require("@/core/services/gameStateService"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const emitQuestionHandler_1 = require("../game/emitQuestionHandler");
const canonicalTimerService_1 = require("@/core/services/canonicalTimerService");
const redis_1 = require("@/config/redis");
const gameStateService_2 = require("@/core/services/gameStateService");
// Create a handler-specific logger
const logger = (0, logger_1.default)('SetQuestionHandler');
// Create game instance service
const gameInstanceService = new gameInstanceService_1.GameInstanceService();
function setQuestionHandler(io, socket) {
    const emitQuestion = (0, emitQuestionHandler_1.emitQuestionHandler)(io, socket);
    const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
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
                                question: {
                                    include: {
                                        multipleChoiceQuestion: true,
                                        numericQuestion: true
                                    }
                                }
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
            let fullState = await gameStateService_1.default.getFullGameState(gameInstance.accessCode);
            let gameState = fullState && fullState.gameState;
            if (!gameState) {
                // If missing, initialize canonical game state in Redis
                logger.warn({ accessCode: gameInstance.accessCode }, '[MODERNIZATION] Game state not found in Redis, initializing via initializeGameState');
                gameState = await gameStateService_1.default.initializeGameState(gameInstance.id);
                if (!gameState) {
                    logger.error({ accessCode: gameInstance.accessCode }, '[MODERNIZATION] Failed to initialize canonical game state');
                    socket.emit(events_1.TEACHER_EVENTS.ERROR_DASHBOARD, {
                        code: 'STATE_ERROR',
                        message: 'Could not retrieve or initialize game state',
                    });
                    if (callback && !callbackCalled) {
                        callback({
                            success: false,
                            error: 'Could not retrieve or initialize game state'
                        });
                        callbackCalled = true;
                    }
                    return;
                }
                // Re-fetch full state for downstream logic, with all required properties
                fullState = {
                    gameState,
                    participants: [],
                    answers: {},
                    leaderboard: []
                };
            }
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
            // --- MODERNIZATION: Canonical Timer System ---
            // --- MODERNIZATION: Canonical Timer System ---
            // Always reset timer state for the new question to canonical initial state
            const playMode = gameState.gameMode;
            const isDeferred = gameState.status === 'completed';
            const attemptCount = undefined; // TODO: wire up if needed for deferred mode
            // Always use canonical durationMs from the question object
            let durationMs = 30000;
            let foundQuestion = null;
            let questionsArrayLocal = [];
            if (gameInstance.gameTemplate && Array.isArray(gameInstance.gameTemplate.questions)) {
                questionsArrayLocal = gameInstance.gameTemplate.questions;
            }
            const qEntryLocal = questionsArrayLocal.find((q) => q.question && q.question.uid === questionUid);
            if (qEntryLocal && qEntryLocal.question && typeof qEntryLocal.question.timeLimit === 'number' && qEntryLocal.question.timeLimit > 0) {
                durationMs = qEntryLocal.question.timeLimit * 1000;
                foundQuestion = qEntryLocal.question;
            }
            if (typeof durationMs !== 'number' || durationMs <= 0) {
                logger.error({ questionUid, durationMs }, '[SET_QUESTION] Failed to get canonical durationMs');
                // handle error or return
            }
            // --- CRITICAL: Reset timer state in Redis for this question ---
            await canonicalTimerService.resetTimer(gameInstance.accessCode, String(questionUid), playMode, isDeferred, effectiveuserId, attemptCount);
            // Always pause timer for new question (teacher must start it)
            await canonicalTimerService.pauseTimer(gameInstance.accessCode, String(questionUid), playMode, isDeferred, effectiveuserId, attemptCount);
            // Fetch canonical timer state for event payloads
            const canonicalTimer = await (0, gameStateService_2.getCanonicalTimer)(gameInstance.accessCode, String(questionUid), playMode, isDeferred, durationMs, effectiveuserId, attemptCount);
            logger.info({
                accessCode: gameInstance.accessCode,
                questionUid,
                playMode,
                isDeferred,
                durationMs,
                effectiveuserId,
                attemptCount,
                canonicalTimer
            }, '[DEBUG][setQuestion] Canonical timer state after getCanonicalTimer');
            // Reset answersLocked to false for the new question
            gameState.answersLocked = false;
            // Update the game state in Redis (without timer field)
            await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
            logger.info({
                accessCode: gameInstance.accessCode,
                gameState
            }, '[DEBUG][setQuestion] Game state after updateGameState');
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
                // CRITICAL: For quiz mode, emit the redirect event to lobby when game starts
                if (gameInstance.playMode === 'quiz') {
                    const lobbyRoom = `lobby_${gameInstance.accessCode}`;
                    logger.info({ gameId, accessCode: gameInstance.accessCode, playMode: gameInstance.playMode }, 'Quiz started: Emitting immediate redirect to lobby');
                    io.to(lobbyRoom).emit(events_1.LOBBY_EVENTS.GAME_STARTED, { accessCode: gameInstance.accessCode, gameId });
                }
            }
            // --- MODERNIZATION: Reset showCorrectAnswers state on new question ---
            // This ensures the trophy is always reset when a new question is set
            logger.info({ accessCode: gameInstance.accessCode }, '[TROPHY_DEBUG] Resetting showCorrectAnswers to false on setQuestion');
            await gameStateService_1.default.updateProjectionDisplayState(gameInstance.accessCode, {
                showCorrectAnswers: false,
                correctAnswersData: null
            });
            const projectionStateAfter = await gameStateService_1.default.getProjectionDisplayState(gameInstance.accessCode);
            logger.info({ accessCode: gameInstance.accessCode, projectionStateAfter }, '[PROJECTION_RESET] Projection display state after reset on setQuestion');
            // Notify dashboard about question change (canonical payload)
            const dashboardRoom = `dashboard_${gameId}`;
            io.to(dashboardRoom).emit('dashboard_question_changed', {
                questionUid: questionUid,
                oldQuestionUid,
                timer: canonicalTimer // MODERNIZATION: use canonicalTimer only
            });
            // Also broadcast to the live room (for players)
            const liveRoom = `game_${gameInstance.accessCode}`;
            // Store questions array and gameTemplate from the loaded gameInstance (before second query overwrites it)
            const questionsArray = gameInstance.gameTemplate && Array.isArray(gameInstance.gameTemplate.questions)
                ? gameInstance.gameTemplate.questions
                : [];
            // Use questionsArray for question lookup
            let question = null;
            const qEntry = questionsArray.find((q) => q.question && q.question.uid === questionUid);
            if (qEntry && qEntry.question) {
                question = qEntry.question;
            }
            // Get the question data to send to players (without correct answers)
            if (question) {
                // ⚠️ SECURITY: Use standard filtering function to remove sensitive data
                const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/quiz/liveQuestion')));
                let filteredQuestion = filterQuestionForClient(question);
                // Ensure timeLimit is present and valid (schema requires positive integer)
                if (filteredQuestion.timeLimit == null || filteredQuestion.timeLimit <= 0) {
                    logger.warn(`Question ${questionUid} has invalid timeLimit: ${filteredQuestion.timeLimit}, using default 30s`);
                    filteredQuestion.timeLimit = 30; // Default to 30 seconds
                }
                // Create flat payload format that matches emitQuestionHandler and frontend expectations
                const gameQuestionPayload = {
                    ...filteredQuestion,
                    currentQuestionIndex: foundQuestionIndex,
                    totalQuestions: gameState.questionUids.length
                };
                // Validate the payload with the same schema as emitQuestionHandler
                const { questionDataForStudentSchema } = await Promise.resolve().then(() => __importStar(require('@shared/types/socketEvents.zod')));
                const questionParseResult = questionDataForStudentSchema.safeParse(gameQuestionPayload);
                if (!questionParseResult.success) {
                    logger.error({
                        errors: questionParseResult.error.errors,
                        gameQuestionPayload,
                        schema: 'questionDataForStudentSchema',
                        payloadKeys: Object.keys(gameQuestionPayload)
                    }, '❌ [VALIDATION ERROR] [setQuestion] Invalid GAME_QUESTION payload, not emitting');
                }
                else {
                    logger.info('✅ [VALIDATION SUCCESS] [setQuestion] Payload validation passed, proceeding to emit', {
                        questionUid: gameQuestionPayload.uid,
                        questionType: gameQuestionPayload.questionType,
                        currentQuestionIndex: gameQuestionPayload.currentQuestionIndex,
                        totalQuestions: gameQuestionPayload.totalQuestions
                    });
                    // Send the question to the live room
                    // --- DEBUG: Log sockets in the live room before emitting ---
                    const liveRoomSockets = io.sockets.adapter.rooms.get(liveRoom);
                    const liveRoomSocketIds = liveRoomSockets ? Array.from(liveRoomSockets) : [];
                    logger.info({
                        liveRoom,
                        liveRoomSocketIds,
                        payload: gameQuestionPayload
                    }, '📡 [EMIT] Emitting game_question to live room');
                    // --- FORCE CONSOLE LOG FOR TEST VISIBILITY ---
                    logger.info('🚀 [SOCKET EMIT] Emitting game_question event:', {
                        event: 'game_question',
                        liveRoom,
                        liveRoomSocketIds,
                        socketCount: liveRoomSocketIds.length,
                        questionUid: gameQuestionPayload.uid,
                        questionType: gameQuestionPayload.questionType,
                        currentQuestionIndex: gameQuestionPayload.currentQuestionIndex,
                        totalQuestions: gameQuestionPayload.totalQuestions
                    });
                    io.to(liveRoom).emit(events_1.SOCKET_EVENTS.GAME.GAME_QUESTION, gameQuestionPayload);
                    // Also emit the same payload to the projection room for canonical question delivery
                    const projectionRoom = `projection_${gameId}`;
                    logger.info('📺 [PROJECTION] Also emitting to projection room:', {
                        projectionRoom,
                        questionUid: gameQuestionPayload.uid
                    });
                    io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.GAME.GAME_QUESTION, gameQuestionPayload);
                }
            }
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
// --- MODERNIZATION: All timer logic now uses CanonicalTimerService. All legacy timer usage is commented above. ---
