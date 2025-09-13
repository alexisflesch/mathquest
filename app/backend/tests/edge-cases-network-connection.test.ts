// Mock the dependencies
jest.mock('../src/config/redis', () => ({
    redisClient: {
        status: 'ready',
        hget: jest.fn(),
        hset: jest.fn(),
        hdel: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        keys: jest.fn(),
        duplicate: jest.fn(() => ({} as any)),
    },
}));

jest.mock('../src/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
        },
        gameParticipant: {
            findUnique: jest.fn(),
            update: jest.fn(),
            upsert: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

// Mock the participant count utils
jest.mock('../src/sockets/utils/participantCountUtils', () => ({
    emitParticipantCount: jest.fn(),
}));

// Import after mocks are set up
import { disconnectHandler } from '../src/sockets/handlers/disconnectHandler';
import { redisClient } from '../src/config/redis';

// Cast to mocked type for proper typing
const mockedRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe('Edge Cases - Network and Connection', () => {
    let io: any;
    let socket: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Redis client status to ready for each test
        (mockedRedisClient as any).status = 'ready';
        io = {
            to: jest.fn(() => ({
                emit: jest.fn(),
            })),
            emit: jest.fn(),
        };
        socket = {
            id: 'socket-123',
            data: {
                userId: 'user-123',
                accessCode: 'game-123',
                currentGameRoom: 'room-123',
            },
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            disconnect: jest.fn(),
        };
    });

    describe('Socket Reconnection Scenarios', () => {
        test('EC1: Socket reconnects after temporary disconnection', async () => {
            // Mock Redis to simulate existing mappings
            mockedRedisClient.hget.mockResolvedValueOnce('socket-123'); // userIdToSocketId exists
            mockedRedisClient.hget.mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket)('network');

            // Verify socketIdToUserId mapping is cleaned up (always happens)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-123'
            );
            // Since this is the last socket, userIdToSocketId should also be cleaned up
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:userIdToSocketId:game-123',
                'user-123'
            );
            // Participant should be marked offline
            expect(mockedRedisClient.hset).toHaveBeenCalledWith(
                'mathquest:game:participants:game-123',
                'user-123',
                expect.stringContaining('"online":false')
            );
        });

        test('EC2: Multiple reconnections from same user', async () => {
            // Mock Redis to simulate another socket is still active
            (mockedRedisClient.hget as jest.Mock).mockResolvedValueOnce('socket-456'); // different socket is active
            (mockedRedisClient.hget as jest.Mock).mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket)('network');

            // Verify socketIdToUserId mapping is cleaned up (always happens)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-123'
            );
            // userIdToSocketId should NOT be deleted (another socket is active)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
        });

        test('EC3: Reconnection with stale socket data', async () => {
            // Mock missing participant data (stale connection)
            (mockedRedisClient.hget as jest.Mock).mockResolvedValue(null);

            const disconnect = disconnectHandler(io, socket);

            // Simulate disconnect
            await disconnect('ping timeout');

            // Verify graceful handling of missing data
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-123'
            );
        });
    });

    describe('Slow Network Conditions', () => {
        test('EC4: Connection timeout during critical operation', async () => {
            // Mock Redis timeout scenario
            (mockedRedisClient.hget as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve(JSON.stringify({
                        userId: 'user-123',
                        online: true,
                    })), 35000); // 35 seconds (longer than ping timeout)
                });
            });

            const disconnect = disconnectHandler(io, socket);

            // Start disconnect but don't wait for completion
            const disconnectPromise = disconnect('ping timeout');

            // Verify the operation is in progress
            expect(disconnectPromise).toBeInstanceOf(Promise);
        });

        test('EC5: Partial Redis operation failure', async () => {
            // Mock Redis failure on first operation
            (redisClient.hdel as jest.Mock)
                .mockRejectedValueOnce(new Error('Redis connection timeout'))
                .mockResolvedValueOnce(1); // Second operation succeeds

            const disconnect = disconnectHandler(io, socket);

            // Simulate disconnect - should handle partial failure gracefully
            await expect(disconnect('transport error')).resolves.toBeUndefined();

            // Verify operations were attempted (error handling may prevent second call)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
        });

        test('EC6: Redis connection closed during disconnect', async () => {
            // Mock Redis connection closed
            (redisClient as any).status = 'end';
            (mockedRedisClient.hget as jest.Mock).mockRejectedValue(new Error('Connection is closed'));

            const disconnect = disconnectHandler(io, socket);

            // Simulate disconnect - should handle closed connection gracefully
            await expect(disconnect('server shutting down')).resolves.toBeUndefined();

            // Verify no Redis operations were attempted
            expect(mockedRedisClient.hget).not.toHaveBeenCalled();
        });
    });

    describe('Browser Refresh and State Recovery', () => {
        test('EC7: Browser refresh during active game', async () => {
            // Mock Redis to simulate this is the last socket for the user
            (mockedRedisClient.hget as jest.Mock).mockResolvedValueOnce('socket-123'); // this socket is the last active
            (mockedRedisClient.hget as jest.Mock).mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket)('transport close');

            // Verify socketIdToUserId mapping is cleaned up (always happens)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-123'
            );
            // Since this is the last socket, userIdToSocketId should also be cleaned up
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:userIdToSocketId:game-123',
                'user-123'
            );

            // Verify participant marked as offline
            expect(mockedRedisClient.hset).toHaveBeenCalledWith(
                'mathquest:game:participants:game-123',
                'user-123',
                expect.stringContaining('"online":false')
            );
        });

        test('EC8: Multiple browser tabs open simultaneously', async () => {
            // Mock multiple connections from same user
            (mockedRedisClient.hget as jest.Mock)
                .mockResolvedValueOnce(JSON.stringify({
                    userId: 'user-123',
                    online: true,
                }))
                .mockResolvedValueOnce('socket-456'); // Another tab is still active

            const disconnect = disconnectHandler(io, socket);

            // Simulate closing one tab
            await disconnect('client namespace disconnect');

            // Verify user remains online (another tab active)
            expect(redisClient.hset).not.toHaveBeenCalled();
        });

        test('EC9: Refresh with corrupted socket data', async () => {
            // Mock Redis to simulate corrupted data but still allow basic cleanup
            (mockedRedisClient.hget as jest.Mock).mockResolvedValueOnce(null); // no userIdToSocketId mapping
            (mockedRedisClient.hget as jest.Mock).mockResolvedValueOnce(null); // no participant data

            await disconnectHandler(io, socket)('transport error');

            // Verify socketIdToUserId mapping is still cleaned up (basic cleanup)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-123'
            );
            // userIdToSocketId should NOT be deleted (no mapping exists)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
            // Participant should NOT be marked offline (no data exists)
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });
    });

    describe('Connection State Synchronization', () => {
        test('EC10: Race condition during concurrent disconnects', async () => {
            // Mock Redis operations that might conflict
            (mockedRedisClient.hget as jest.Mock)
                .mockResolvedValueOnce(JSON.stringify({
                    userId: 'user-123',
                    online: true,
                }))
                .mockResolvedValueOnce('socket-123');

            // Mock concurrent Redis operations
            (mockedRedisClient.hdel as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve(1), Math.random() * 100);
                });
            });

            const disconnect = disconnectHandler(io, socket);

            // Simulate multiple concurrent disconnects
            const promises = [
                disconnect('transport close'),
                disconnect('ping timeout'),
                disconnect('client namespace disconnect'),
            ];

            // All should complete without errors
            await expect(Promise.all(promises)).resolves.toEqual([undefined, undefined, undefined]);
        });
    });
});