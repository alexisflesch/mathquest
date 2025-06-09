import { Server as SocketIOServer, Socket } from 'socket.io';
import { registerTeacherControlHandlers } from './teacherControl';
import createLogger from '@/utils/logger';

// Create a handler-specific logger
const logger = createLogger('TeacherControlHandler');

/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function teacherControlHandler(io: SocketIOServer, socket: Socket): void {
    logger.info({ socketId: socket.id }, 'teacherControlHandler called');

    // Register all handlers from the refactored module
    registerTeacherControlHandlers(io, socket);

    logger.info({ socketId: socket.id }, 'teacherControlHandler registration complete');
}

export default teacherControlHandler;
