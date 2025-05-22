import { Server as SocketIOServer, Socket } from 'socket.io';
import { registerSharedLiveHandlers } from './sharedLiveHandler';

/**
 * Register all game-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function gameHandler(io: SocketIOServer, socket: Socket): void {
    // Register shared live handlers for join/answer
    registerSharedLiveHandlers(io, socket);

    // Import and register game-specific handlers from the ./game directory
    const { registerGameHandlers } = require('./game');
    registerGameHandlers(io, socket);
}

export default gameHandler;
