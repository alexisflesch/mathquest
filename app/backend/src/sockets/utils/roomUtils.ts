import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { ErrorPayload, RoomJoinedPayload, RoomLeftPayload } from '@shared/types/socketEvents';

// Create a utility-specific logger
const logger = createLogger('RoomUtils');

// Key prefix for room data in Redis
const ROOM_KEY_PREFIX = 'mathquest:room:';

/**
 * Join a socket to a room and track it in Redis
 * @param socket Socket instance
 * @param roomName Name of the room to join
 * @param userData Optional user data to store with the room membership
 */
export async function joinRoom(socket: Socket, roomName: string, userData?: Record<string, any>): Promise<void> {
    const { id: socketId } = socket;
    const user = socket.data.user || { role: 'GUEST' };

    try {
        // Join the Socket.IO room
        await socket.join(roomName);

        // Store user data in Redis for persistence across server instances
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        const memberData = {
            socketId,
            userId: user.userId || user.userId || 'anonymous',
            userRole: user.role,
            joinedAt: Date.now(),
            ...userData
        };

        // Store as a Redis hash where field is socketId and value is serialized member data
        await redisClient.hset(roomKey, socketId, JSON.stringify(memberData));

        logger.debug({
            socketId,
            roomName,
            user
        }, 'Socket joined room');

        // Emit an event to the socket that it has joined the room
        const roomJoinedPayload: RoomJoinedPayload = {
            room: roomName,
            timestamp: new Date().toISOString()
        };
        // socket.emit(SOCKET_EVENTS.LOBBY.ROOM_JOINED, roomJoinedPayload); // Modernized: handled by participant_list
    } catch (error) {
        logger.error({
            error,
            socketId,
            roomName,
            user
        }, 'Error joining room');

        // Re-throw for handling by the caller
        throw error;
    }
}

/**
 * Leave a room and remove tracking from Redis
 * @param socket Socket instance
 * @param roomName Name of the room to leave
 */
export async function leaveRoom(socket: Socket, roomName: string): Promise<void> {
    const { id: socketId } = socket;
    const user = socket.data.user || { role: 'GUEST' };

    try {
        // Leave the Socket.IO room
        await socket.leave(roomName);

        // Remove from Redis tracking
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        await redisClient.hdel(roomKey, socketId);

        logger.debug({
            socketId,
            roomName,
            user
        }, 'Socket left room');

        // Emit an event to the socket that it has left the room
        const roomLeftPayload: RoomLeftPayload = {
            room: roomName,
            timestamp: new Date().toISOString()
        };
        // socket.emit(SOCKET_EVENTS.LOBBY.ROOM_LEFT, roomLeftPayload); // Modernized: handled by participant_list
    } catch (error) {
        logger.error({
            error,
            socketId,
            roomName,
            user
        }, 'Error leaving room');

        // Re-throw for handling by the caller
        throw error;
    }
}

/**
 * Get all members of a room from Redis
 * @param roomName Name of the room
 * @returns Array of member data objects
 */
export async function getRoomMembers(roomName: string): Promise<any[]> {
    try {
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        const members = await redisClient.hgetall(roomKey);

        if (!members) return [];

        // Parse the JSON values
        return Object.values(members).map(member => JSON.parse(member as string));
    } catch (error) {
        logger.error({
            error,
            roomName
        }, 'Error getting room members');

        throw error;
    }
}

/**
 * Check if a room exists in Redis
 * @param roomName Name of the room to check
 * @returns Boolean indicating if the room exists
 */
export async function roomExists(roomName: string): Promise<boolean> {
    try {
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        return await redisClient.exists(roomKey) > 0;
    } catch (error) {
        logger.error({
            error,
            roomName
        }, 'Error checking if room exists');

        throw error;
    }
}

/**
 * Broadcast a message to all sockets in a room
 * @param io Socket.IO server instance
 * @param roomName Room name
 * @param eventName Event name
 * @param data Event data
 * @param excludeSocketId Optional socket ID to exclude from broadcast
 */
export function broadcastToRoom(
    io: SocketIOServer,
    roomName: string,
    eventName: string,
    data: any,
    excludeSocketId?: string
): void {
    try {
        if (excludeSocketId) {
            // Broadcast to all in room except the excluded socket
            io.to(roomName).except(excludeSocketId).emit(eventName, data);
        } else {
            // Broadcast to all in room
            io.to(roomName).emit(eventName, data);
        }

        logger.debug({
            roomName,
            eventName,
            excluding: excludeSocketId || 'none'
        }, 'Broadcast to room');
    } catch (error) {
        logger.error({
            error,
            roomName,
            eventName
        }, 'Error broadcasting to room');

        throw error;
    }
}
