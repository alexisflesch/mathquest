/**
 * quizEvents.js - Quiz Socket Event Registration
 *
 * This module imports individual event handlers for quiz-related actions
 * and registers them with the Socket.IO socket instance.
 */

// Import required modules and state
const createLogger = require('../logger');
const logger = createLogger('QuizEvents');
// Import individual handlers
const handleJoinQuiz = require('./quizEventHandlers/joinQuizHandler');
const handleSetQuestion = require('./quizEventHandlers/setQuestionHandler');
const handleTimerAction = require('./quizEventHandlers/timerActionHandler');
const handleSetTimer = require('./quizEventHandlers/setTimerHandler');
const handleLock = require('./quizEventHandlers/lockHandler');
const handleUnlock = require('./quizEventHandlers/unlockHandler');
const handleEnd = require('./quizEventHandlers/endHandler');
const handlePause = require('./quizEventHandlers/pauseHandler');
const handleResume = require('./quizEventHandlers/resumeHandler');
const handleDisconnecting = require('./quizEventHandlers/disconnectingHandler'); // Added

function registerQuizEvents(io, socket, prisma) {
    logger.info(`[DEBUG] registerQuizEvents for socket.id=${socket.id}`);
    // Register handlers
    socket.on("join_quiz", (payload) => handleJoinQuiz(io, socket, prisma, payload));
    socket.on("quiz_set_question", (payload) => handleSetQuestion(io, socket, prisma, payload));
    socket.on("quiz_timer_action", (payload) => handleTimerAction(io, socket, prisma, payload));
    socket.on("quiz_set_timer", (payload) => handleSetTimer(io, socket, prisma, payload));
    socket.on("quiz_lock", (payload) => handleLock(io, socket, prisma, payload));
    socket.on("quiz_unlock", (payload) => handleUnlock(io, socket, prisma, payload));
    socket.on("quiz_end", (payload) => handleEnd(io, socket, prisma, payload));
    socket.on("quiz_pause", (payload) => handlePause(io, socket, prisma, payload));
    socket.on("quiz_resume", (payload) => handleResume(io, socket, prisma, payload));
    socket.on("disconnecting", () => handleDisconnecting(io, socket, prisma)); // Pass prisma if needed by handler

    // Add handler for get_quiz_state event
    socket.on("get_quiz_state", ({ quizId }) => {
        const quizState = require('./quizState');
        logger.info(`Socket ${socket.id} requested quiz state for quiz ${quizId}`);
        if (quizState[quizId]) {
            socket.emit("quiz_state", quizState[quizId]);
            logger.debug(`Sent quiz state for quiz ${quizId}`, quizState[quizId]);
        } else {
            logger.warn(`Quiz state requested for non-existent quiz ${quizId}`);
        }
    });

    socket.on("quiz_reset_ended", ({ quizId }) => {
        const quizState = require('./quizState');
        if (quizState[quizId]) {
            // Reset all relevant fields for a fresh session
            quizState[quizId].ended = false;
            quizState[quizId].locked = false;
            quizState[quizId].currentQuestionIdx = null;
            quizState[quizId].chrono = { timeLeft: null, running: false };
            quizState[quizId].stats = {};
            quizState[quizId].timerStatus = null;
            quizState[quizId].timerQuestionId = null;
            quizState[quizId].timerTimeLeft = null;
            quizState[quizId].timerTimestamp = null;
            // Optionally, keep profTeacherId and questions
            logger.info(`Quiz ${quizId} state fully reset for new session`);
            io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
        }
    });
}

module.exports = registerQuizEvents;