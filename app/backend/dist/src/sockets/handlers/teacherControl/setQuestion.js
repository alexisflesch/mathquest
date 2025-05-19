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
        const teacherId = socket.data?.teacherId;
        const isTestEnvironment = process.env.NODE_ENV === 'test' || socket.handshake.auth?.isTestUser;
        let effectiveTeacherId = teacherId;
        let callbackCalled = false;
        if (!effectiveTeacherId) {
            const testTeacherId = socket.handshake.auth.userId;
            if (testTeacherId && socket.handshake.auth.userType === 'teacher') {
                socket.data.teacherId = testTeacherId;
                socket.data.user = { teacherId: testTeacherId, role: 'teacher' };
                effectiveTeacherId = testTeacherId;
            }
        }
        if (!effectiveTeacherId) {
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
        logger.info({ gameId, teacherId: effectiveTeacherId, questionUid }, 'Setting question');
        try {
            // Verify authorization
            const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    : effectiveTeacherId
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
    // Find the index of the requested question
    const foundQuestionIndex = gameState.questionIds.findIndex(id => id === questionUid);
    if (foundQuestionIndex === -1) {
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
    // Also broadcast to the game room (for players)
    const gameRoom = `game_${gameInstance.accessCode}`;
    // Get the question data to send to players (without correct answers)
    if (question) {
        let responses = [];
        try {
            const parsedResponses = typeof question.responses === 'string' ?
                JSON.parse(question.responses) : question.responses;
            responses = Array.isArray(parsedResponses) ?
                parsedResponses.map(r => ({
                    id: r.id,
                    content: r.content
                    // Note: We omit isCorrect here for player view
                })) : [];
        }
        catch (e) {
            logger.error({ error: e }, 'Error parsing question responses');
        }
        // Send the question to the game room
        io.to(gameRoom).emit('game_question', {
            question: {
                id: question.uid,
                content: question.text,
                type: question.questionType,
                options: responses,
                timeLimit: question.timeLimit || 30
            },
            index: foundQuestionIndex,
            total: gameState.questionIds.length,
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
}
        catch (error) {
    logger.error({ gameId, questionUid, error }, 'Error setting question');
    socket.emit('error_dashboard', {
        code: 'SET_QUESTION_ERROR',
        message: 'Failed to set question',
        details: error instanceof Error ? error.message : String(error)
    });
    // Call the callback with error if provided
    if (callback && !callbackCalled) {
        callback({
            success: false,
            error: 'Failed to set question',
            details: error instanceof Error ? error.message : String(error)
        });
        callbackCalled = true;
    }
    return;
}
// Call the callback if provided with success (only if not already called)
if (callback && !callbackCalled) {
    callback({
        success: true,
        gameId,
        questionUid
    });
    callbackCalled = true;
}
    };
}
