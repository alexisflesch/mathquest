"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoom = joinRoom;
exports.leaveRoom = leaveRoom;
exports.getRoomMembers = getRoomMembers;
exports.roomExists = roomExists;
exports.broadcastToRoom = broadcastToRoom;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a utility-specific logger
const logger = (0, logger_1.default)('RoomUtils');
// Key prefix for room data in Redis
const ROOM_KEY_PREFIX = 'mathquest:room:';
/**
 * Join a socket to a room and track it in Redis
 * @param socket Socket instance
 * @param roomName Name of the room to join
 * @param userData Optional user data to store with the room membership
 */
async function joinRoom(socket, roomName, userData) {
    const { id: socketId } = socket;
    const user = socket.data.user || { role: 'anonymous' };
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
        await redis_1.redisClient.hset(roomKey, socketId, JSON.stringify(memberData));
        logger.debug({
            socketId,
            roomName,
            user
        }, 'Socket joined room');
        // Emit an event to the socket that it has joined the room
        socket.emit('room_joined', {
            room: roomName,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
async function leaveRoom(socket, roomName) {
    const { id: socketId } = socket;
    const user = socket.data.user || { role: 'anonymous' };
    try {
        // Leave the Socket.IO room
        await socket.leave(roomName);
        // Remove from Redis tracking
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        await redis_1.redisClient.hdel(roomKey, socketId);
        logger.debug({
            socketId,
            roomName,
            user
        }, 'Socket left room');
        // Emit an event to the socket that it has left the room
        socket.emit('room_left', {
            room: roomName,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
async function getRoomMembers(roomName) {
    try {
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        const members = await redis_1.redisClient.hgetall(roomKey);
        if (!members)
            return [];
        // Parse the JSON values
        return Object.values(members).map(member => JSON.parse(member));
    }
    catch (error) {
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
async function roomExists(roomName) {
    try {
        const roomKey = `${ROOM_KEY_PREFIX}${roomName}`;
        return await redis_1.redisClient.exists(roomKey) > 0;
    }
    catch (error) {
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
function broadcastToRoom(io, roomName, eventName, data, excludeSocketId) {
    try {
        if (excludeSocketId) {
            // Broadcast to all in room except the excluded socket
            io.to(roomName).except(excludeSocketId).emit(eventName, data);
        }
        else {
            // Broadcast to all in room
            io.to(roomName).emit(eventName, data);
        }
        logger.debug({
            roomName,
            eventName,
            excluding: excludeSocketId || 'none'
        }, 'Broadcast to room');
    }
    catch (error) {
        logger.error({
            error,
            roomName,
            eventName
        }, 'Error broadcasting to room');
        throw error;
    }
}
