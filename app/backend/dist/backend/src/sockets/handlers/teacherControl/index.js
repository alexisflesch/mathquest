"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('TeacherControlIndex');
/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function registerTeacherControlHandlers(io, socket) {
    console.log('[DEBUG] registerTeacherControlHandlers called for socket:', socket.id);
    logger.info({ socketId: socket.id }, 'Registering teacher control handlers');
    // Teacher joining the dashboard for a game
    logger.info({ event: events_1.TEACHER_EVENTS.JOIN_DASHBOARD }, 'Registering join_dashboard handler');
    socket.on(events_1.TEACHER_EVENTS.JOIN_DASHBOARD, (0, joinDashboard_1.joinDashboardHandler)(io, socket));
    // Set a specific question
    logger.info({ event: events_1.TEACHER_EVENTS.SET_QUESTION }, 'Registering set_question handler');
    socket.on(events_1.TEACHER_EVENTS.SET_QUESTION, (0, setQuestion_1.setQuestionHandler)(io, socket));
    // Timer actions (start, pause, resume, stop, set_duration)
    logger.info({ event: events_1.TEACHER_EVENTS.TIMER_ACTION }, 'Registering timer_action handler');
    socket.on(events_1.TEACHER_EVENTS.TIMER_ACTION, (0, timerAction_1.timerActionHandler)(io, socket));
    // Lock or unlock answers
    logger.info({ event: events_1.TEACHER_EVENTS.LOCK_ANSWERS }, 'Registering lock_answers handler');
    socket.on(events_1.TEACHER_EVENTS.LOCK_ANSWERS, (0, lockAnswers_1.lockAnswersHandler)(io, socket));
    // End the game
    logger.info({ event: events_1.TEACHER_EVENTS.END_GAME }, 'Registering end_game handler');
    socket.on(events_1.TEACHER_EVENTS.END_GAME, (0, endGame_1.endGameHandler)(io, socket));
    // Handle start_timer event
    logger.info({ event: events_1.TEACHER_EVENTS.START_TIMER }, 'Registering start_timer handler');
    socket.on(events_1.TEACHER_EVENTS.START_TIMER, (0, startTimer_1.startTimerHandler)(io, socket));
    // Handle pause_timer event
    logger.info({ event: events_1.TEACHER_EVENTS.PAUSE_TIMER }, 'Registering pause_timer handler');
    socket.on(events_1.TEACHER_EVENTS.PAUSE_TIMER, (0, pauseTimer_1.pauseTimerHandler)(io, socket));
    // Handle disconnect
    logger.info('Registering disconnect handler');
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
}
exports.default = registerTeacherControlHandlers;
