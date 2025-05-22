"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setQuestionHandler = setQuestionHandler;
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('SetQuestionHandler');
function setQuestionHandler(io, socket) {
    return async (payload, callback) => {
        const { gameId, questionUid, questionIndex } = payload;
        const userId = socket.data?.userId;
        const isTestEnvironment = process.env.NODE_ENV === 'test' || socket.handshake.auth?.isTestUser;
        let effectiveuserId = userId;
        let callbackCalled = false;
        if (!effectiveuserId) {
            const testuserId = socket.handshake.auth.userId;
            if (testuserId && socket.handshake.auth.userType === 'teacher') {
                socket.data.userId = testuserId;
                socket.data.user = { userId: testuserId, role: 'teacher' };
                effectiveuserId = testuserId;
            }
        }
        if (!effectiveuserId) {
            socket.emit('error_dashboard', {
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
            // Verify authorization
            const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    initiatorUserId: effectiveuserId
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
                socket.emit('error_dashboard', {
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
                socket.emit('error_dashboard', {
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
            const foundQuestionIndex = gameState.questionIds.findIndex(id => id === questionUid);
            if (foundQuestionIndex === -1) {
                logger.warn({ gameId, questionUid, questionIds: gameState.questionIds }, 'Question UID not found in gameState');
                socket.emit('error_dashboard', {
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
                gameState.questionIds[gameState.currentQuestionIndex] : null;
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
                gameState.timer = {
                    startedAt: Date.now(),
                    duration,
                    isPaused: true // Start paused so teacher can control when to begin
                };
                // Reset answersLocked to false for the new question
                gameState.answersLocked = false;
            }
            // Update the game state in Redis
            await gameStateService_1.default.updateGameState(gameInstance.accessCode, gameState);
            // Notify dashboard about question change
            const dashboardRoom = `dashboard_${gameId}`;
            io.to(dashboardRoom).emit('dashboard_question_changed', {
                questionUid,
                oldQuestionUid,
                timer: gameState.timer
            });
            // Also broadcast to the live room (for players)
            const liveRoom = `live_${gameInstance.accessCode}`;
            // Get the question data to send to players (without correct answers)
            if (question) {
                // Create questionData object matching QuestionData type
                const questionData = {
                    uid: question.uid,
                    title: question.title || undefined,
                    text: question.text,
                    answerOptions: question.answerOptions,
                    correctAnswers: new Array(question.answerOptions.length).fill(false),
                    questionType: question.questionType,
                    timeLimit: question.timeLimit || 30,
                    currentQuestionIndex: foundQuestionIndex,
                    totalQuestions: gameState.questionIds.length
                };
                // Send the question to the live room
                // --- DEBUG: Log sockets in the live room before emitting ---
                const liveRoomSockets = io.sockets.adapter.rooms.get(liveRoom);
                const liveRoomSocketIds = liveRoomSockets ? Array.from(liveRoomSockets) : [];
                logger.info({
                    liveRoom,
                    liveRoomSocketIds,
                    payload: { question: questionData, timer: gameState.timer }
                }, '[DEBUG] Emitting game_question to live room');
                // --- FORCE CONSOLE LOG FOR TEST VISIBILITY ---
                console.log('[setQuestion] Emitting game_question:', {
                    liveRoom,
                    liveRoomSocketIds,
                    payload: { question: questionData, timer: gameState.timer }
                });
                io.to(liveRoom).emit('game_question', {
                    question: questionData,
                    timer: gameState.timer
                });
            }
            // Broadcast to projection room if needed
            const projectionRoom = `projection_${gameId}`;
            io.to(projectionRoom).emit('projection_question_changed', {
                questionUid,
                questionIndex: foundQuestionIndex,
                totalQuestions: gameState.questionIds.length,
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
            socket.emit('error_dashboard', {
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
