import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinDashboardHandler } from './joinDashboard';
import { setQuestionHandler } from './setQuestion';
import { timerActionHandler } from './timerAction';
import { lockAnswersHandler } from './lockAnswers';
import { endGameHandler } from './endGame';
import { startTimerHandler } from './startTimer';
import { pauseTimerHandler } from './pauseTimer';
import { disconnectHandler } from './disconnect';
import { showCorrectAnswersHandler } from './showCorrectAnswers';
import { toggleProjectionStatsHandler } from './toggleProjectionStats';
import { TEACHER_EVENTS } from '@shared/types/socket/events';
import createLogger from '@/utils/logger';

// Create a handler-specific logger
const logger = createLogger('TeacherControlIndex');

/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerTeacherControlHandlers(io: SocketIOServer, socket: Socket): void {
    console.log('[DEBUG] registerTeacherControlHandlers called for socket:', socket.id);
    logger.info({ socketId: socket.id }, 'Registering teacher control handlers');

    // Teacher joining the dashboard for a game
    logger.info({ event: TEACHER_EVENTS.JOIN_DASHBOARD }, 'Registering join_dashboard handler');
    socket.on(TEACHER_EVENTS.JOIN_DASHBOARD, joinDashboardHandler(io, socket));

    // Set a specific question
    logger.info({ event: TEACHER_EVENTS.SET_QUESTION }, 'Registering set_question handler');
    socket.on(TEACHER_EVENTS.SET_QUESTION, setQuestionHandler(io, socket));

    // Timer actions (start, pause, resume, stop, set_duration)
    logger.info({ event: TEACHER_EVENTS.TIMER_ACTION }, 'Registering timer_action handler');
    socket.on(TEACHER_EVENTS.TIMER_ACTION, timerActionHandler(io, socket));

    // Lock or unlock answers
    logger.info({ event: TEACHER_EVENTS.LOCK_ANSWERS }, 'Registering lock_answers handler');
    socket.on(TEACHER_EVENTS.LOCK_ANSWERS, lockAnswersHandler(io, socket));

    // End the game
    logger.info({ event: TEACHER_EVENTS.END_GAME }, 'Registering end_game handler');
    socket.on(TEACHER_EVENTS.END_GAME, endGameHandler(io, socket));

    // Handle start_timer event
    logger.info({ event: TEACHER_EVENTS.START_TIMER }, 'Registering start_timer handler');
    socket.on(TEACHER_EVENTS.START_TIMER, startTimerHandler(io, socket));

    // Handle pause_timer event
    logger.info({ event: TEACHER_EVENTS.PAUSE_TIMER }, 'Registering pause_timer handler');
    socket.on(TEACHER_EVENTS.PAUSE_TIMER, pauseTimerHandler(io, socket));

    // NEW: Handle show correct answers (trophy button)
    logger.info({ event: TEACHER_EVENTS.SHOW_CORRECT_ANSWERS }, 'Registering show_correct_answers handler');
    socket.on(TEACHER_EVENTS.SHOW_CORRECT_ANSWERS, showCorrectAnswersHandler(io, socket));

    // NEW: Handle toggle projection stats (bar graph button)
    logger.info({ event: TEACHER_EVENTS.TOGGLE_PROJECTION_STATS }, 'Registering toggle_projection_stats handler');
    socket.on(TEACHER_EVENTS.TOGGLE_PROJECTION_STATS, toggleProjectionStatsHandler(io, socket));

    // Handle disconnect
    logger.info('Registering disconnect handler');
    socket.on('disconnect', disconnectHandler(io, socket));
}

export default registerTeacherControlHandlers;
