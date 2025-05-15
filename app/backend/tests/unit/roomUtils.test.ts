import { joinRoom, leaveRoom, getRoomMembers, broadcastToRoom, roomExists } from '@/sockets/utils/roomUtils';
import { redisClient } from '@/config/redis';
import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Mock Redis client
jest.mock('@/config/redis', () => ({
    redisClient: {
        hset: jest.fn(),
        hdel: jest.fn(),
        hgetall: jest.fn(),
        exists: jest.fn()
    }
}));

// Mock logger
jest.mock('@/utils/logger', () => {
    return jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }));
});

describe('Room Utils', () => {
    let mockSocket: any;
    let mockIO: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock socket
        mockSocket = {
            id: 'socket-123',
            data: {
                user: {
                    playerId: 'player-123',
                    role: 'player'
                }
            },
            join: jest.fn().mockImplementation(() => Promise.resolve(undefined)), // Changed mock
            leave: jest.fn().mockImplementation(() => Promise.resolve(undefined)), // Changed mock
            emit: jest.fn()
        };

        // Create mock IO
        mockIO = {
            to: jest.fn().mockReturnThis(),
            except: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };
    });

    describe('joinRoom', () => {
        it('should join socket to a room and store in Redis', async () => {
            (redisClient.hset as jest.Mock).mockResolvedValue(1 as never); // Added 'as never' to satisfy mockResolvedValue type

            await joinRoom(mockSocket as unknown as Socket, 'test-room', { customData: 'test' });

            expect(mockSocket.join).toHaveBeenCalledWith('test-room');
            expect(redisClient.hset).toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('room_joined', expect.any(Object));
        });

        it('should handle errors during room join', async () => {
            (mockSocket.join as jest.Mock).mockRejectedValue(new Error('Join failed') as never); // Added 'as never'

            await expect(joinRoom(mockSocket as unknown as Socket, 'test-room'))
                .rejects.toThrow('Join failed');
        });
    });

    describe('leaveRoom', () => {
        it('should remove socket from room and Redis', async () => {
            (redisClient.hdel as jest.Mock).mockResolvedValue(1 as never); // Added 'as never'

            await leaveRoom(mockSocket as unknown as Socket, 'test-room');

            expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
            expect(redisClient.hdel).toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('room_left', expect.any(Object));
        });
    });

    describe('getRoomMembers', () => {
        it('should get room members from Redis', async () => {
            const mockMembers = {
                'socket-1': JSON.stringify({ socketId: 'socket-1', userId: 'player-1' }),
                'socket-2': JSON.stringify({ socketId: 'socket-2', userId: 'player-2' })
            };

            (redisClient.hgetall as jest.Mock).mockResolvedValue(mockMembers as never); // Added 'as never'

            const members = await getRoomMembers('test-room');

            expect(redisClient.hgetall).toHaveBeenCalled();
            expect(members).toHaveLength(2);
            expect(members[0].socketId).toBe('socket-1');
        });

        it('should return empty array when room has no members', async () => {
            (redisClient.hgetall as jest.Mock).mockResolvedValue(null as never); // Added 'as never'

            const members = await getRoomMembers('empty-room');

            expect(members).toEqual([]);
        });
    });

    describe('roomExists', () => {
        it('should check if room exists in Redis', async () => {
            (redisClient.exists as jest.Mock).mockResolvedValue(1 as never); // Added 'as never'

            const exists = await roomExists('test-room');

            expect(redisClient.exists).toHaveBeenCalled();
            expect(exists).toBe(true);
        });

        it('should return false when room does not exist', async () => {
            (redisClient.exists as jest.Mock).mockResolvedValue(0 as never); // Added 'as never'

            const exists = await roomExists('nonexistent-room');

            expect(exists).toBe(false);
        });
    });

    describe('broadcastToRoom', () => {
        it('should broadcast to all in room', () => {
            broadcastToRoom(
                mockIO as unknown as Server,
                'test-room',
                'test-event',
                { message: 'test' }
            );

            expect(mockIO.to).toHaveBeenCalledWith('test-room');
            expect(mockIO.emit).toHaveBeenCalledWith('test-event', { message: 'test' });
        });

        it('should exclude specified socket when broadcasting', () => {
            broadcastToRoom(
                mockIO as unknown as Server,
                'test-room',
                'test-event',
                { message: 'test' },
                'socket-to-exclude'
            );

            expect(mockIO.to).toHaveBeenCalledWith('test-room');
            expect(mockIO.except).toHaveBeenCalledWith('socket-to-exclude');
            expect(mockIO.emit).toHaveBeenCalledWith('test-event', { message: 'test' });
        });
    });
});
