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

describe('Edge Cases - Multi-Device Scenarios', () => {
    let io: any;
    let socket1: any;
    let socket2: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Redis client status to ready for each test
        (mockedRedisClient as any).status = 'ready';
        // Reset mock implementations
        mockedRedisClient.hget.mockRestore();
        mockedRedisClient.hdel.mockRestore();
        mockedRedisClient.hset.mockRestore();
        io = {
            to: jest.fn(() => ({
                emit: jest.fn(),
            })),
            emit: jest.fn(),
        };
        socket1 = {
            id: 'socket-mobile-123',
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
        socket2 = {
            id: 'socket-desktop-456',
            data: {
                userId: 'user-123', // Same user
                accessCode: 'game-123',
                currentGameRoom: 'room-123',
            },
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            disconnect: jest.fn(),
        };
    });

    describe('Same User Multiple Devices', () => {
        test('MD1: User connects from mobile and desktop simultaneously', async () => {
            // Mock Redis to show both sockets are active for the same user
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-desktop-456') // userIdToSocketId returns desktop socket (another active)
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket1)('client disconnect');

            // Verify socketIdToUserId mapping is cleaned up (mobile socket)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            // userIdToSocketId should NOT be deleted (desktop socket still active)
            // Note: Handler always calls hdel on socketIdToUserId, then conditionally on userIdToSocketId
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
            // Participant should NOT be marked offline (desktop still active)
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });

        test('MD2: Desktop disconnects, mobile remains active', async () => {
            // Mock Redis to simulate desktop disconnecting while mobile stays active
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-mobile-123') // userIdToSocketId returns mobile (other active socket)
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket2)('client disconnect');

            // Verify socketIdToUserId mapping is cleaned up (desktop socket)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-desktop-456'
            );
            // userIdToSocketId should NOT be deleted (mobile socket still active)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
            // Participant should NOT be marked offline (mobile still active)
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });

        test('MD3: Last device disconnects, user goes offline', async () => {
            // Mock Redis to simulate this is the last active socket
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-mobile-123') // userIdToSocketId returns this socket (last one)
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket1)('client disconnect');

            // Verify socketIdToUserId mapping is cleaned up first (always happens)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
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
    });

    describe('Device Switching Scenarios', () => {
        test('MD4: Rapid device switching during game', async () => {
            // Mock Redis to simulate rapid switching between devices
            mockedRedisClient.hget.mockImplementation((key, field) => {
                if (key.includes('userIdToSocketId')) {
                    return Promise.resolve('socket-desktop-456'); // Another socket is active
                } else if (key.includes('participants')) {
                    return Promise.resolve(JSON.stringify({ online: true })); // participant data exists
                }
                return Promise.resolve(null);
            });

            await disconnectHandler(io, socket1)('transport close');

            // Verify socketIdToUserId mapping is cleaned up (mobile socket)
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            // Verify that userIdToSocketId was NOT deleted (since another socket is active)
            expect(mockedRedisClient.hdel).not.toHaveBeenCalledWith(
                'mathquest:game:userIdToSocketId:game-123',
                'user-123'
            );
            // Participant should remain online
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });

        test('MD5: Device switching with network interruption', async () => {
            // Mock Redis to simulate network interruption during device switch
            mockedRedisClient.hget
                .mockResolvedValueOnce(null) // No active socket mapping (network issue)
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket1)('network');

            // Verify socketIdToUserId mapping is cleaned up
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            // userIdToSocketId should NOT be deleted (no mapping exists)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
            // Participant should NOT be marked offline (data exists but no cleanup needed)
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });
    });

    describe('State Synchronization Edge Cases', () => {
        test('MD6: Concurrent operations from multiple devices', async () => {
            // Mock Redis to simulate concurrent operations
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-desktop-456') // Desktop is active
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            // Simulate concurrent disconnects
            const disconnect1 = disconnectHandler(io, socket1);
            const disconnect2 = disconnectHandler(io, socket2);

            await Promise.all([
                disconnect1('client disconnect'),
                disconnect2('client disconnect'),
            ]);

            // Verify both sockets attempted cleanup
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-desktop-456'
            );
        });

        test('MD7: Device switching with stale data', async () => {
            // Mock Redis to simulate stale data from previous session
            mockedRedisClient.hget
                .mockResolvedValueOnce('old-socket-789') // Stale socket ID
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket1)('transport close');

            // Verify current socket mapping is cleaned up
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            // userIdToSocketId should NOT be deleted (stale socket still mapped)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
            // Participant should remain online
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });

        test('MD8: Mixed device types in same session', async () => {
            // Mock Redis to simulate mixed device types
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-desktop-456') // Desktop active
                .mockResolvedValueOnce(JSON.stringify({ online: true })); // participant data exists

            await disconnectHandler(io, socket1)('client disconnect');

            // Verify mobile socket cleanup
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            // Desktop should remain active
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling in Multi-Device Scenarios', () => {
        test('MD9: Redis failure during multi-device cleanup', async () => {
            // Mock Redis to fail during multi-device scenario
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-desktop-456')
                .mockResolvedValueOnce(JSON.stringify({ online: true }));
            mockedRedisClient.hdel.mockRejectedValueOnce(new Error('Redis connection failed'));

            await expect(disconnectHandler(io, socket1)('network')).resolves.toBeUndefined();

            // Verify error is logged but doesn't crash
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
        });

        test('MD10: Partial Redis state in multi-device scenario', async () => {
            // Mock Redis with partial state (missing participant data)
            mockedRedisClient.hget
                .mockResolvedValueOnce('socket-desktop-456') // Socket mapping exists
                .mockResolvedValueOnce(null); // No participant data

            await disconnectHandler(io, socket1)('transport close');

            // Verify socket cleanup still happens
            expect(mockedRedisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:socketIdToUserId:game-123',
                'socket-mobile-123'
            );
            // userIdToSocketId should NOT be deleted (desktop still active)
            expect(mockedRedisClient.hdel).toHaveBeenCalledTimes(1);
            // Participant should NOT be updated (no data exists)
            expect(mockedRedisClient.hset).not.toHaveBeenCalled();
        });
    });
});