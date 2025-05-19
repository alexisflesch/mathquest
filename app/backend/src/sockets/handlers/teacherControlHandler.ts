import { Server as SocketIOServer, Socket } from 'socket.io';
import { registerTeacherControlHandlers } from './teacherControl';

/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function teacherControlHandler(io: SocketIOServer, socket: Socket): void {
    // Register all handlers from the refactored module
    registerTeacherControlHandlers(io, socket);
}

export default teacherControlHandler;
