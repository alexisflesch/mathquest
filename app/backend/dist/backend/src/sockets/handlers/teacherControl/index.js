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
const pauseTimer_1 = require("./pauseTimer");
const disconnect_1 = require("./disconnect");
const showCorrectAnswers_1 = require("./showCorrectAnswers");
const toggleProjectionStats_1 = require("./toggleProjectionStats");
const revealLeaderboardHandler_1 = require("./revealLeaderboardHandler");
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
    logger.info('[DEBUG] registerTeacherControlHandlers called for socket:', socket.id);
    logger.info({ socketId: socket.id }, 'Registering teacher control handlers');
    // Teacher joining the dashboard for a game
    logger.info({ event: events_1.TEACHER_EVENTS.JOIN_DASHBOARD }, 'Registering join_dashboard handler');
    socket.on(events_1.TEACHER_EVENTS.JOIN_DASHBOARD, (0, joinDashboard_1.joinDashboardHandler)(io, socket));
    // Set a specific question
    logger.info({ event: events_1.TEACHER_EVENTS.SET_QUESTION }, 'Registering set_question handler');
    socket.on(events_1.TEACHER_EVENTS.SET_QUESTION, (0, setQuestion_1.setQuestionHandler)(io, socket));
    // Timer actions (canonical)
    logger.info({ event: events_1.TEACHER_EVENTS.TIMER_ACTION }, 'Registering quiz_timer_action handler');
    socket.on(events_1.TEACHER_EVENTS.TIMER_ACTION, (0, timerAction_1.timerActionHandler)(io, socket));
    // Lock or unlock answers
    logger.info({ event: events_1.TEACHER_EVENTS.LOCK_ANSWERS }, 'Registering lock_answers handler');
    socket.on(events_1.TEACHER_EVENTS.LOCK_ANSWERS, (0, lockAnswers_1.lockAnswersHandler)(io, socket));
    // End the game
    logger.info({ event: events_1.TEACHER_EVENTS.END_GAME }, 'Registering end_game handler');
    socket.on(events_1.TEACHER_EVENTS.END_GAME, (0, endGame_1.endGameHandler)(io, socket));
    // Handle pause_timer event
    logger.info({ event: events_1.TEACHER_EVENTS.PAUSE_TIMER }, 'Registering pause_timer handler');
    socket.on(events_1.TEACHER_EVENTS.PAUSE_TIMER, (0, pauseTimer_1.pauseTimerHandler)(io, socket));
    // NEW: Handle show correct answers (trophy button)
    logger.info({ event: events_1.TEACHER_EVENTS.SHOW_CORRECT_ANSWERS }, 'Registering show_correct_answers handler');
    socket.on(events_1.TEACHER_EVENTS.SHOW_CORRECT_ANSWERS, (0, showCorrectAnswers_1.showCorrectAnswersHandler)(io, socket));
    // NEW: Handle toggle projection stats (bar graph button)
    logger.info({ event: events_1.TEACHER_EVENTS.TOGGLE_PROJECTION_STATS }, 'Registering toggle_projection_stats handler');
    socket.on(events_1.TEACHER_EVENTS.TOGGLE_PROJECTION_STATS, (0, toggleProjectionStats_1.toggleProjectionStatsHandler)(io, socket));
    // NEW: Handle reveal leaderboard (trophy button)
    logger.info({ event: events_1.TEACHER_EVENTS.REVEAL_LEADERBOARD }, 'Registering reveal_leaderboard handler');
    socket.on(events_1.TEACHER_EVENTS.REVEAL_LEADERBOARD, (0, revealLeaderboardHandler_1.revealLeaderboardHandler)(io, socket));
    // Handle disconnect
    logger.info('Registering disconnect handler');
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
}
exports.default = registerTeacherControlHandlers;
