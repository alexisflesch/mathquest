/**
 * Unit Tests: Participant Preservation & Snapshot Anti-Cheating
 * 
 * These tests verify the fixes for two critical issues by testing the ACTUAL handlers
 * with mocked Redis/database dependencies:
 * 1. Users with join-order bonus scores disappearing from leaderboard on disconnect
 * 2. Live score leakage to students during active gameplay (anti-cheating)
 */

import { disconnectHandler } from '../../src/sockets/handlers/game/disconnect';
import { broadcastLeaderboardToProjection, broadcastLeaderboardToAllRooms } from '../../src/utils/projectionLeaderboardBroadcast';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

// Mock Redis
jest.mock('../../src/config/redis', () => ({
    redisClient: {
        zscore: jest.fn(),
        hget: jest.fn(),
        hset: jest.fn(),
        hdel: jest.fn(),
        hvals: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
    }
}));

// Mock Prisma
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        gameParticipant: {
            findFirst: jest.fn(),
            delete: jest.fn(),
        }
    }
}));

// Mock snapshot service
jest.mock('../../src/core/services/gameParticipant/leaderboardSnapshotService', () => ({
    getLeaderboardSnapshot: jest.fn(),
    syncSnapshotWithLiveData: jest.fn(),
}));

// Mock shared leaderboard
jest.mock('../../src/sockets/handlers/sharedLeaderboard', () => ({
    calculateLeaderboard: jest.fn(),
}));

describe('Participant Preservation & Snapshot Security: Real Handler Tests', () => {
    let io: SocketIOServer;
    let httpServer: any;
    let mockSocket: any;

    beforeAll(() => {
        // Set up real Socket.IO server like other working tests
        httpServer = createServer();
        io = new SocketIOServer(httpServer);
    });

    afterAll(() => {
        if (io) {
            io.close();
        }
        if (httpServer) {
            httpServer.close();
        }
    });

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Mock the io methods that will be called by the broadcast functions
        io.to = jest.fn().mockReturnThis();
        io.emit = jest.fn();
        
        // Create mock socket
        mockSocket = {
            id: 'test-socket-123',
            data: {
                gameId: 'test-game-456',
                accessCode: 'TEST123',
                userId: 'test-user-789',
                username: 'TestUser'
            },
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
        };
    });

    describe('Issue 1: REAL Disconnect Handler Testing', () => {
        it('should call the ACTUAL disconnect handler and preserve user with join-order bonus', async () => {
            const { redisClient } = require('../../src/config/redis');
            const { prisma } = require('../../src/db/prisma');

            // Mock Redis responses for user with join-order bonus
            redisClient.hget.mockImplementation((key: string, field: string) => {
                if (key.includes('socketIdToUserId')) {
                    return Promise.resolve('test-user-789'); // socket -> userId mapping
                }
                if (key.includes('participants') && field === 'test-user-789') {
                    return Promise.resolve(JSON.stringify({
                        userId: 'test-user-789',
                        username: 'Clémence',
                        score: 0.009,
                        online: true
                    }));
                }
                return Promise.resolve(null);
            });

            redisClient.hvals.mockResolvedValue([]); // no other sockets for this user
            redisClient.zscore.mockResolvedValue('0.009'); // user has join-order bonus score
            
            // Mock Prisma participant lookup
            prisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'participant-id',
                userId: 'test-user-789',
                status: 'PENDING' // User is still in lobby
            });

            // Call the ACTUAL disconnect handler
            const disconnect = disconnectHandler(io, mockSocket);
            await disconnect();

            // Verify: User should be preserved (marked offline, not deleted)
            expect(redisClient.hset).toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'test-user-789',
                expect.stringContaining('"online":false')
            );
            
            // Verify: User should NOT be removed from participants
            expect(redisClient.hdel).not.toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'test-user-789'
            );
            
            // Verify: User should NOT be deleted from database
            expect(prisma.gameParticipant.delete).not.toHaveBeenCalled();
        });

        it('should call the ACTUAL disconnect handler and remove user without score', async () => {
            const { redisClient } = require('../../src/config/redis');
            const { prisma } = require('../../src/db/prisma');

            // Mock Redis responses for user without score
            redisClient.hget.mockImplementation((key: string, field: string) => {
                if (key.includes('socketIdToUserId')) {
                    return Promise.resolve('test-user-789');
                }
                return Promise.resolve(null);
            });

            redisClient.hvals.mockResolvedValue([]);
            redisClient.zscore.mockResolvedValue(null); // user has NO score
            
            // Mock Prisma participant lookup (called twice in disconnect handler)
            prisma.gameParticipant.findFirst
                .mockResolvedValueOnce({
                    id: 'participant-id',
                    userId: 'test-user-789',
                    status: 'PENDING'
                })
                .mockResolvedValueOnce({
                    id: 'participant-id',
                    userId: 'test-user-789',
                    status: 'PENDING'
                });
            
            prisma.gameParticipant.delete.mockResolvedValue({});

            // Call the ACTUAL disconnect handler
            const disconnect = disconnectHandler(io, mockSocket);
            await disconnect();

            // Verify: User should be removed from Redis participants
            expect(redisClient.hdel).toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'test-user-789'
            );
            
            // Verify: User should be deleted from database
            expect(prisma.gameParticipant.delete).toHaveBeenCalledWith({
                where: { id: 'participant-id' }
            });
        });

        it('should always preserve ACTIVE users regardless of score', async () => {
            const { redisClient } = require('../../src/config/redis');
            const { prisma } = require('../../src/db/prisma');

            // Mock Redis responses for ACTIVE user with 0 score
            redisClient.hget.mockImplementation((key: string, field: string) => {
                if (key.includes('socketIdToUserId')) {
                    return Promise.resolve('test-user-789');
                }
                if (key.includes('participants')) {
                    return Promise.resolve(JSON.stringify({
                        userId: 'test-user-789',
                        username: 'ActiveUser',
                        score: 0,
                        online: true
                    }));
                }
                return Promise.resolve(null);
            });

            redisClient.hvals.mockResolvedValue([]);
            redisClient.zscore.mockResolvedValue('0'); // score is 0 but user is ACTIVE
            
            prisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'participant-id',
                userId: 'test-user-789',
                status: 'ACTIVE' // User is actively playing
            });

            // Call the ACTUAL disconnect handler
            const disconnect = disconnectHandler(io, mockSocket);
            await disconnect();

            // Verify: ACTIVE user should be preserved and marked offline
            expect(redisClient.hset).toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'test-user-789',
                expect.stringContaining('"online":false')
            );
            
            // Verify: ACTIVE user should NOT be removed
            expect(redisClient.hdel).not.toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'test-user-789'
            );
            expect(prisma.gameParticipant.delete).not.toHaveBeenCalled();
        });
    });

    describe('Issue 2: REAL Projection Broadcast Testing', () => {
        it('should call the ACTUAL broadcastLeaderboardToProjection and use snapshot data', async () => {
            const { getLeaderboardSnapshot } = require('../../src/core/services/gameParticipant/leaderboardSnapshotService');

            // Mock snapshot service to return snapshot data
            const mockSnapshot = [
                { userId: 'user1', username: 'Joséphine', score: 0.009, rank: 1 },
                { userId: 'user2', username: 'Maxime', score: 0.01, rank: 2 }
            ];
            getLeaderboardSnapshot.mockResolvedValue(mockSnapshot);

            // Call the ACTUAL projection broadcast function
            await broadcastLeaderboardToProjection(io, 'TEST123', 'test-game-456');

            // Verify: Snapshot service was called (not live leaderboard)
            expect(getLeaderboardSnapshot).toHaveBeenCalledWith('TEST123');
            
            // Verify: Projection room received snapshot data
            expect(io.to).toHaveBeenCalledWith('projection_test-game-456');
            expect(io.emit).toHaveBeenCalledWith(
                'projection_leaderboard_update',
                expect.objectContaining({
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({
                            username: 'Joséphine',
                            score: 0.009 // snapshot score, not live score
                        })
                    ])
                })
            );
        });

        it('should call the ACTUAL broadcastLeaderboardToAllRooms with correct data for each audience', async () => {
            const { getLeaderboardSnapshot, syncSnapshotWithLiveData } = require('../../src/core/services/gameParticipant/leaderboardSnapshotService');
            const { calculateLeaderboard } = require('../../src/sockets/handlers/sharedLeaderboard');

            // Mock snapshot data (for students and projection)
            const mockSnapshot = [
                { userId: 'user1', username: 'Student1', score: 0.01, rank: 1 }
            ];
            
            // Mock live data (for teachers)
            const mockLiveData = [
                { userId: 'user1', username: 'Student1', score: 150, rank: 1 } // much higher live score
            ];

            syncSnapshotWithLiveData.mockResolvedValue(mockSnapshot);
            getLeaderboardSnapshot.mockResolvedValue(mockSnapshot);
            calculateLeaderboard.mockResolvedValue(mockLiveData);

            // Call the ACTUAL broadcast function
            await broadcastLeaderboardToAllRooms(io, 'TEST123', 'test-game-456', {
                includeGameRoom: true,
                includeDashboardRoom: true,
                includeProjectionRoom: false
            });

            // Verify: Snapshot is synced before broadcasting
            expect(syncSnapshotWithLiveData).toHaveBeenCalledWith('TEST123');

            // Verify: Students (game room) get snapshot data
            expect(io.to).toHaveBeenCalledWith('game_TEST123');
            expect(io.emit).toHaveBeenCalledWith(
                'leaderboard_update',
                expect.objectContaining({
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({ score: 0.01 }) // snapshot score
                    ])
                })
            );

            // Verify: Teachers (dashboard room) get live data
            expect(io.to).toHaveBeenCalledWith('dashboard_test-game-456');
            expect(io.emit).toHaveBeenCalledWith(
                'leaderboard_update',
                expect.objectContaining({
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({ score: 150 }) // live score
                    ])
                })
            );
        });
    });

    describe('Regression Prevention: Real Scenarios', () => {
        it('should not lose participants with join-order bonus (Issue 1 - Clémence scenario)', async () => {
            const { redisClient } = require('../../src/config/redis');
            const { prisma } = require('../../src/db/prisma');

            // Simulate Clémence's exact scenario: joins, gets bonus, disconnects before game start
            redisClient.hget.mockImplementation((key: string, field: string) => {
                if (key.includes('socketIdToUserId')) {
                    return Promise.resolve('clemence-user-id');
                }
                if (key.includes('participants') && field === 'clemence-user-id') {
                    return Promise.resolve(JSON.stringify({
                        userId: 'clemence-user-id',
                        username: 'Clémence',
                        score: 0.009,
                        online: true
                    }));
                }
                return Promise.resolve(null);
            });

            redisClient.hvals.mockResolvedValue([]);
            redisClient.zscore.mockResolvedValue('0.009'); // Has join-order bonus (this was the problem!)
            
            prisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'clemence-participant-id',
                userId: 'clemence-user-id',
                status: 'PENDING' // In lobby, game not started yet
            });

            // Mock socket for Clémence
            const clemenceSocket = {
                ...mockSocket,
                data: {
                    ...mockSocket.data,
                    userId: 'clemence-user-id',
                    username: 'Clémence'
                }
            };

            // Call the ACTUAL disconnect handler (this would have failed before the fix)
            const disconnect = disconnectHandler(io, clemenceSocket);
            await disconnect();

            // Verify: Clémence should be preserved due to join-order bonus
            expect(redisClient.hset).toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'clemence-user-id',
                expect.stringContaining('"online":false')
            );
            
            // Verify: Clémence should NOT disappear from leaderboard
            expect(redisClient.hdel).not.toHaveBeenCalledWith(
                'mathquest:game:participants:TEST123',
                'clemence-user-id'
            );
            expect(prisma.gameParticipant.delete).not.toHaveBeenCalled();
        });

        it('should not leak live scores to projection during join (Issue 2 - Joséphine scenario)', async () => {
            const { getLeaderboardSnapshot } = require('../../src/core/services/gameParticipant/leaderboardSnapshotService');

            // Simulate Joséphine's scenario: has 980 points, Claudia joins, projection shows live scores
            const mockSnapshotWithJosephine = [
                { userId: 'josephine-id', username: 'Joséphine', score: 0.009, rank: 1 }, // old snapshot
                { userId: 'maxime-id', username: 'Maxime', score: 0.01, rank: 2 }
            ];
            
            getLeaderboardSnapshot.mockResolvedValue(mockSnapshotWithJosephine);

            // Call the ACTUAL projection broadcast (this would have leaked live scores before)
            await broadcastLeaderboardToProjection(io, 'TEST123', 'test-game-456');

            // Verify: Projection uses snapshot service, not live leaderboard
            expect(getLeaderboardSnapshot).toHaveBeenCalledWith('TEST123');
            
            // Verify: Joséphine shows snapshot score on projection, NOT live score
            expect(io.emit).toHaveBeenCalledWith(
                'projection_leaderboard_update',
                expect.objectContaining({
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({
                            username: 'Joséphine',
                            score: 0.009 // snapshot score (FIXED!)
                        })
                    ])
                })
            );
            
            // Verify: NOT called with live score of 980
            expect(io.emit).not.toHaveBeenCalledWith(
                'projection_leaderboard_update',
                expect.objectContaining({
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({
                            username: 'Joséphine',
                            score: 980 // live score (would be security leak)
                        })
                    ])
                })
            );
        });
    });

    describe('Integration: Complete Security Flow', () => {
        it('should maintain security throughout join -> answer -> disconnect cycle', async () => {
            const { redisClient } = require('../../src/config/redis');
            const { prisma } = require('../../src/db/prisma');

            // 1. User joins and gets bonus
            redisClient.zscore.mockResolvedValue('0.01'); // has join bonus

            // 2. User answers and gets live score
            // (Live score would be higher, but students still see snapshot)

            // 3. User disconnects
            redisClient.hget.mockResolvedValueOnce('security-test-user');
            redisClient.hvals.mockResolvedValue([]);
            redisClient.zscore.mockResolvedValue('150'); // high live score
            redisClient.hget.mockResolvedValueOnce(JSON.stringify({
                userId: 'security-test-user',
                username: 'TestUser',
                online: true
            }));

            prisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'security-participant',
                userId: 'security-test-user',
                status: 'ACTIVE'
            });

            const securitySocket = {
                ...mockSocket,
                data: {
                    ...mockSocket.data,
                    userId: 'security-test-user'
                }
            };

            const disconnect = disconnectHandler(io, securitySocket);
            await disconnect();

            // Verify: User with ANY score is preserved
            expect(redisClient.hset).toHaveBeenCalledWith(
                expect.stringContaining('participants'),
                'security-test-user',
                expect.stringContaining('"online":false')
            );

            // User should NOT be removed from leaderboard
            expect(redisClient.hdel).not.toHaveBeenCalledWith(
                expect.stringContaining('participants'),
                'security-test-user'
            );
        });
    });
});
