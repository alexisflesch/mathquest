import { Server as SocketIOServer, Socket } from 'socket.io';
import createLogger from '@/utils/logger';
import { registerLobbyHandlers } from './lobbyHandler';
import { registerGameHandlers } from './gameHandler';
import { registerTeacherControlHandlers } from './teacherControlHandler';

// Create a handler-specific logger
const logger = createLogger('ConnectionHandlers');

/**
 * Register connection and disconnection handlers for Socket.IO
 * @param io Socket.IO server instance
 */
export function registerConnectionHandlers(io: SocketIOServer): void {
    io.on('connection', (socket: Socket) => {
        handleConnection(socket);
        handleDisconnection(socket);

        // Register feature-specific handlers
        registerLobbyHandlers(io, socket);
        registerGameHandlers(io, socket);
        registerTeacherControlHandlers(io, socket);
    });
}

/**
 * Handle new socket connection
 * @param socket Connected socket
 */
function handleConnection(socket: Socket): void {
    const { id } = socket;
    const user = socket.data.user || { role: 'anonymous' };

    logger.info({
        socketId: id,
        user,
        address: socket.handshake.address
    }, 'New socket connection established');

    // Emit welcome event to the client
    socket.emit('connection_established', {
        socketId: id,
        timestamp: new Date().toISOString(),
        user: {
            role: user.role,
            ...(user.playerId ? { playerId: user.playerId } : {}),
            ...(user.teacherId ? { isTeacher: true } : {})
        }
    });

    // Register any other connection-specific event handlers here
}

/**
 * Handle socket disconnection
 * @param socket Connected socket
 */
function handleDisconnection(socket: Socket): void {
    socket.on('disconnect', (reason: string) => {
        const { id } = socket;
        const user = socket.data.user || { role: 'anonymous' };

        logger.info({
            socketId: id,
            user,
            reason
        }, 'Socket disconnected');

        // Clean up any resources if needed
        // For example, remove the socket from game rooms
    });
}
