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
    // Optionally: registerGameHandlers(io, socket); // keep if there are other game-specific events
}

export default gameHandler;
