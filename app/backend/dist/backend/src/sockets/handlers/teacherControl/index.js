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
const events_1 = require("@shared/types/socket/events");
/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function registerTeacherControlHandlers(io, socket) {
    // Teacher joining the dashboard for a game
    socket.on(events_1.TEACHER_EVENTS.JOIN_DASHBOARD, (0, joinDashboard_1.joinDashboardHandler)(io, socket));
    // Set a specific question
    socket.on(events_1.TEACHER_EVENTS.SET_QUESTION, (0, setQuestion_1.setQuestionHandler)(io, socket));
    // Timer actions (start, pause, resume, stop, set_duration)
    socket.on(events_1.TEACHER_EVENTS.TIMER_ACTION, (0, timerAction_1.timerActionHandler)(io, socket));
    // Lock or unlock answers
    socket.on(events_1.TEACHER_EVENTS.LOCK_ANSWERS, (0, lockAnswers_1.lockAnswersHandler)(io, socket));
    // End the game
    socket.on(events_1.TEACHER_EVENTS.END_GAME, (0, endGame_1.endGameHandler)(io, socket));
    // Handle start_timer event
    socket.on(events_1.TEACHER_EVENTS.START_TIMER, (0, startTimer_1.startTimerHandler)(io, socket));
    // Handle pause_timer event
    socket.on(events_1.TEACHER_EVENTS.PAUSE_TIMER, (0, pauseTimer_1.pauseTimerHandler)(io, socket));
    // Handle disconnect
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
}
exports.default = registerTeacherControlHandlers;
