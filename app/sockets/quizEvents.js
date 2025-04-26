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
    logger.info(`Registering quiz events for socket ${socket.id}`);

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
}

module.exports = registerQuizEvents;