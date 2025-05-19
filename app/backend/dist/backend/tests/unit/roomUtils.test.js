"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roomUtils_1 = require("@/sockets/utils/roomUtils");
const redis_1 = require("@/config/redis");
const globals_1 = require("@jest/globals");
// Mock Redis client
globals_1.jest.mock('@/config/redis', () => ({
    redisClient: {
        hset: globals_1.jest.fn(),
        hdel: globals_1.jest.fn(),
        hgetall: globals_1.jest.fn(),
        exists: globals_1.jest.fn()
    }
}));
// Mock logger
globals_1.jest.mock('@/utils/logger', () => {
    return globals_1.jest.fn().mockImplementation(() => ({
        debug: globals_1.jest.fn(),
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn()
    }));
});
describe('Room Utils', () => {
    globals_1.jest.setTimeout(3000);
    let mockSocket;
    let mockIO;
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
        // Create mock socket
        mockSocket = {
            id: 'socket-123',
            data: {
                user: {
                    userId: 'player-123',
                    role: 'player'
                }
            },
            join: globals_1.jest.fn().mockImplementation(() => Promise.resolve(undefined)), // Changed mock
            leave: globals_1.jest.fn().mockImplementation(() => Promise.resolve(undefined)), // Changed mock
            emit: globals_1.jest.fn()
        };
        // Create mock IO
        mockIO = {
            to: globals_1.jest.fn().mockReturnThis(),
            except: globals_1.jest.fn().mockReturnThis(),
            emit: globals_1.jest.fn()
        };
    });
    describe('joinRoom', () => {
        it('should join socket to a room and store in Redis', async () => {
            redis_1.redisClient.hset.mockResolvedValue(1); // Added 'as never' to satisfy mockResolvedValue type
            await (0, roomUtils_1.joinRoom)(mockSocket, 'test-room', { customData: 'test' });
            expect(mockSocket.join).toHaveBeenCalledWith('test-room');
            expect(redis_1.redisClient.hset).toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('room_joined', expect.any(Object));
        });
        it('should handle errors during room join', async () => {
            mockSocket.join.mockRejectedValue(new Error('Join failed')); // Added 'as never'
            await expect((0, roomUtils_1.joinRoom)(mockSocket, 'test-room'))
                .rejects.toThrow('Join failed');
        });
    });
    describe('leaveRoom', () => {
        it('should remove socket from room and Redis', async () => {
            redis_1.redisClient.hdel.mockResolvedValue(1); // Added 'as never'
            await (0, roomUtils_1.leaveRoom)(mockSocket, 'test-room');
            expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
            expect(redis_1.redisClient.hdel).toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('room_left', expect.any(Object));
        });
    });
    describe('getRoomMembers', () => {
        it('should get room members from Redis', async () => {
            const mockMembers = {
                'socket-1': JSON.stringify({ socketId: 'socket-1', userId: 'player-1' }),
                'socket-2': JSON.stringify({ socketId: 'socket-2', userId: 'player-2' })
            };
            redis_1.redisClient.hgetall.mockResolvedValue(mockMembers); // Added 'as never'
            const members = await (0, roomUtils_1.getRoomMembers)('test-room');
            expect(redis_1.redisClient.hgetall).toHaveBeenCalled();
            expect(members).toHaveLength(2);
            expect(members[0].socketId).toBe('socket-1');
        });
        it('should return empty array when room has no members', async () => {
            redis_1.redisClient.hgetall.mockResolvedValue(null); // Added 'as never'
            const members = await (0, roomUtils_1.getRoomMembers)('empty-room');
            expect(members).toEqual([]);
        });
    });
    describe('roomExists', () => {
        it('should check if room exists in Redis', async () => {
            redis_1.redisClient.exists.mockResolvedValue(1); // Added 'as never'
            const exists = await (0, roomUtils_1.roomExists)('test-room');
            expect(redis_1.redisClient.exists).toHaveBeenCalled();
            expect(exists).toBe(true);
        });
        it('should return false when room does not exist', async () => {
            redis_1.redisClient.exists.mockResolvedValue(0); // Added 'as never'
            const exists = await (0, roomUtils_1.roomExists)('nonexistent-room');
            expect(exists).toBe(false);
        });
    });
    describe('broadcastToRoom', () => {
        it('should broadcast to all in room', () => {
            (0, roomUtils_1.broadcastToRoom)(mockIO, 'test-room', 'test-event', { message: 'test' });
            expect(mockIO.to).toHaveBeenCalledWith('test-room');
            expect(mockIO.emit).toHaveBeenCalledWith('test-event', { message: 'test' });
        });
        it('should exclude specified socket when broadcasting', () => {
            (0, roomUtils_1.broadcastToRoom)(mockIO, 'test-room', 'test-event', { message: 'test' }, 'socket-to-exclude');
            expect(mockIO.to).toHaveBeenCalledWith('test-room');
            expect(mockIO.except).toHaveBeenCalledWith('socket-to-exclude');
            expect(mockIO.emit).toHaveBeenCalledWith('test-event', { message: 'test' });
        });
    });
});
