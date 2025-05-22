"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTeacherControlHandlers = registerTeacherControlHandlers;
const joinDashboard_1 = require("./joinDashboard");
const setQuestion_1 = require("./setQuestion");
const timerAction_1 = require("./timerAction");
const lockAnswers_1 = require("./lockAnswers");
const endGame_1 = require("./endGame");
const startTimer_1 = require("./startTimer");
const pauseTimer_1 = require("./pauseTimer");
const disconnect_1 = require("./disconnect");
/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function registerTeacherControlHandlers(io, socket) {
    // Teacher joining the dashboard for a game
    socket.on('join_dashboard', (0, joinDashboard_1.joinDashboardHandler)(io, socket));
    // Set a specific question
    socket.on('set_question', (0, setQuestion_1.setQuestionHandler)(io, socket));
    // Support legacy/test event name for integration tests
    socket.on('quiz_set_question', (0, setQuestion_1.setQuestionHandler)(io, socket));
    // Timer actions (start, pause, resume, stop, set_duration)
    socket.on('quiz_timer_action', (0, timerAction_1.timerActionHandler)(io, socket));
    // Lock or unlock answers
    socket.on('lock_answers', (0, lockAnswers_1.lockAnswersHandler)(io, socket));
    // End the game
    socket.on('end_game', (0, endGame_1.endGameHandler)(io, socket));
    // Handle start_timer event
    socket.on('start_timer', (0, startTimer_1.startTimerHandler)(io, socket));
    // Handle pause_timer event
    socket.on('pause_timer', (0, pauseTimer_1.pauseTimerHandler)(io, socket));
    // Handle disconnect
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
}
exports.default = registerTeacherControlHandlers;
