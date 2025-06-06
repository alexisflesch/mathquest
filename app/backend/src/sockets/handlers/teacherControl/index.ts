import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinDashboardHandler } from './joinDashboard';
import { setQuestionHandler } from './setQuestion';
import { timerActionHandler } from './timerAction';
import { lockAnswersHandler } from './lockAnswers';
import { endGameHandler } from './endGame';
import { startTimerHandler } from './startTimer';
import { pauseTimerHandler } from './pauseTimer';
import { disconnectHandler } from './disconnect';
import { TEACHER_EVENTS } from '@shared/types/socket/events';

/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerTeacherControlHandlers(io: SocketIOServer, socket: Socket): void {
    // Teacher joining the dashboard for a game
    socket.on(TEACHER_EVENTS.JOIN_DASHBOARD, joinDashboardHandler(io, socket));

    // Set a specific question
    socket.on(TEACHER_EVENTS.SET_QUESTION, setQuestionHandler(io, socket));

    // Timer actions (start, pause, resume, stop, set_duration)
    socket.on(TEACHER_EVENTS.TIMER_ACTION, timerActionHandler(io, socket));

    // Lock or unlock answers
    socket.on(TEACHER_EVENTS.LOCK_ANSWERS, lockAnswersHandler(io, socket));

    // End the game
    socket.on(TEACHER_EVENTS.END_GAME, endGameHandler(io, socket));

    // Handle start_timer event
    socket.on(TEACHER_EVENTS.START_TIMER, startTimerHandler(io, socket));

    // Handle pause_timer event
    socket.on(TEACHER_EVENTS.PAUSE_TIMER, pauseTimerHandler(io, socket));

    // Handle disconnect
    socket.on('disconnect', disconnectHandler(io, socket));
}

export default registerTeacherControlHandlers;
