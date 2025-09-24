/**
 * Socket Service
 *
 * Service for managing Socket.IO operations including room management and event emission.
 * Provides a clean interface for socket operations used throughout the application.
 */

import { getIO } from '@/sockets';
import createLogger from '@/utils/logger';
import { Server as SocketIOServer } from 'socket.io';

const logger = createLogger('SocketService');

/**
 * Socket service class for managing Socket.IO operations
 */
export class SocketService {
    private io: SocketIOServer | null = null;

    constructor() {
        this.io = getIO();
    }

    /**
     * Emit an event to a specific room
     * @param room The room name to emit to
     * @param event The event name
     * @param data The data to emit
     */
    async emitToRoom(room: string, event: string, data: any): Promise<void> {
        if (!this.io) {
            logger.warn('Socket.IO server not initialized, cannot emit to room');
            return;
        }

        try {
            this.io.to(room).emit(event, data);
            logger.debug(`Emitted ${event} to room ${room}`);
        } catch (error) {
            logger.error(`Failed to emit ${event} to room ${room}:`, error);
        }
    }

    /**
     * Emit an event to a specific socket
     * @param socketId The socket ID to emit to
     * @param event The event name
     * @param data The data to emit
     */
    async emitToSocket(socketId: string, event: string, data: any): Promise<void> {
        if (!this.io) {
            logger.warn('Socket.IO server not initialized, cannot emit to socket');
            return;
        }

        try {
            this.io.to(socketId).emit(event, data);
            logger.debug(`Emitted ${event} to socket ${socketId}`);
        } catch (error) {
            logger.error(`Failed to emit ${event} to socket ${socketId}:`, error);
        }
    }

    /**
     * Join a socket to a room
     * @param socketId The socket ID to join
     * @param room The room name to join
     */
    async joinRoom(socketId: string, room: string): Promise<void> {
        if (!this.io) {
            logger.warn('Socket.IO server not initialized, cannot join room');
            return;
        }

        try {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(room);
                logger.debug(`Socket ${socketId} joined room ${room}`);
            } else {
                logger.warn(`Socket ${socketId} not found, cannot join room ${room}`);
            }
        } catch (error) {
            logger.error(`Failed to join socket ${socketId} to room ${room}:`, error);
        }
    }

    /**
     * Remove a socket from a room
     * @param socketId The socket ID to leave
     * @param room The room name to leave
     */
    async leaveRoom(socketId: string, room: string): Promise<void> {
        if (!this.io) {
            logger.warn('Socket.IO server not initialized, cannot leave room');
            return;
        }

        try {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(room);
                logger.debug(`Socket ${socketId} left room ${room}`);
            } else {
                logger.warn(`Socket ${socketId} not found, cannot leave room ${room}`);
            }
        } catch (error) {
            logger.error(`Failed to remove socket ${socketId} from room ${room}:`, error);
        }
    }

    /**
     * Get all sockets in a room
     * @param room The room name
     * @returns Array of socket IDs in the room
     */
    getSocketsInRoom(room: string): string[] {
        if (!this.io) {
            logger.warn('Socket.IO server not initialized, cannot get sockets in room');
            return [];
        }

        try {
            const roomSockets = this.io.sockets.adapter.rooms.get(room);
            if (roomSockets) {
                return Array.from(roomSockets);
            }
            return [];
        } catch (error) {
            logger.error(`Failed to get sockets in room ${room}:`, error);
            return [];
        }
    }

    /**
     * Check if a socket is connected
     * @param socketId The socket ID to check
     * @returns True if the socket is connected
     */
    isSocketConnected(socketId: string): boolean {
        if (!this.io) {
            return false;
        }

        try {
            const socket = this.io.sockets.sockets.get(socketId);
            return socket !== undefined && socket.connected;
        } catch (error) {
            logger.error(`Failed to check if socket ${socketId} is connected:`, error);
            return false;
        }
    }

    /**
     * Get the Socket.IO server instance
     * @returns The Socket.IO server instance
     */
    getIO(): SocketIOServer | null {
        return this.io;
    }

    /**
     * Update the Socket.IO server instance (used for testing)
     * @param io The Socket.IO server instance
     */
    setIO(io: SocketIOServer | null): void {
        this.io = io;
    }
}

// Export a singleton instance
export const socketService = new SocketService();