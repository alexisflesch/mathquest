import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinDashboardHandler } from './joinDashboard';
import { setQuestionHandler } from './setQuestion';
import { timerActionHandler } from './timerAction';
import { lockAnswersHandler } from './lockAnswers';
import { endGameHandler } from './endGame';
import { startTimerHandler } from './startTimer';
import { pauseTimerHandler } from './pauseTimer';
import { disconnectHandler } from './disconnect';

/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerTeacherControlHandlers(io: SocketIOServer, socket: Socket): void {
    // Teacher joining the dashboard for a game
    socket.on('join_dashboard', joinDashboardHandler(io, socket));

    // Set a specific question
    socket.on('set_question', setQuestionHandler(io, socket));
    // Support legacy/test event name for integration tests
    socket.on('quiz_set_question', setQuestionHandler(io, socket));

    // Timer actions (start, pause, resume, stop, set_duration)
    socket.on('quiz_timer_action', timerActionHandler(io, socket));

    // Lock or unlock answers
    socket.on('lock_answers', lockAnswersHandler(io, socket));

    // End the game
    socket.on('end_game', endGameHandler(io, socket));

    // Handle start_timer event
    socket.on('start_timer', startTimerHandler(io, socket));

    // Handle pause_timer event
    socket.on('pause_timer', pauseTimerHandler(io, socket));

    // Handle disconnect
    socket.on('disconnect', disconnectHandler(io, socket));
}

export default registerTeacherControlHandlers;
