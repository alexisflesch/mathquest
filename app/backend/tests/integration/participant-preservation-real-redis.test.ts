/**
 * Integration Tests: Real Redis & Socket Handler Testing
 * 
 * These tests actually use Redis and test the real handlers to verify the fixes work
 * with the actual database and socket operations.
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { redisClient } from '@/config/redis';
import { disconnectHandler } from '@/sockets/handlers/game/disconnect';
import { broadcastLeaderboardToProjection } from '@/utils/projectionLeaderboardBroadcast';

describe('Integration: Real Redis & Socket Handler Tests', () => {
    let io: SocketIOServer;
    let mockSocket: any;
    const testAccessCode = 'INTEG-TEST-' + Date.now();
    const testGameId = 'game-test-' + Date.now();
    const testUserId = 'user-test-' + Date.now();
    
    beforeAll(async () => {
        // Set up Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
        
        // Clean up any existing test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`leaderboard:snapshot:${testAccessCode}`);
    });

    afterAll(async () => {
        // Clean up test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`leaderboard:snapshot:${testAccessCode}`);
        
        if (io) {
            io.close();
        }
    });

    beforeEach(() => {
        mockSocket = {
            id: 'test-socket-123',
            data: {
                gameId: testGameId,
                accessCode: testAccessCode,
                userId: testUserId,
                username: 'TestUser'
            },
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
        };
    });

    describe('Issue 1: Real Participant Preservation Test', () => {
        it('should preserve user with join-order bonus in real Redis', async () => {
            // Setup: Create user with join-order bonus in Redis leaderboard
            const joinOrderBonus = 0.009;
            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            
            // Add user to leaderboard with join-order bonus
            await redisClient.zadd(leaderboardKey, joinOrderBonus, testUserId);
            
            // Add user to participants hash
            const participantData = {
                userId: testUserId,
                username: 'Clémence',
                score: joinOrderBonus,
                online: true,
                status: 'PENDING'
            };
            await redisClient.hset(participantsKey, testUserId, JSON.stringify(participantData));
            
            // Mock Redis operations for socket ID mapping
            await redisClient.hset(`socketIdToUserId:${testAccessCode}`, mockSocket.id, testUserId);
            
            // Verify user exists before disconnect
            const scoreBefore = await redisClient.zscore(leaderboardKey, testUserId);
            const participantBefore = await redisClient.hget(participantsKey, testUserId);
            
            expect(scoreBefore).toBe(joinOrderBonus.toString());
            expect(participantBefore).toBeTruthy();
            
            // Call real disconnect handler
            const disconnect = disconnectHandler(io, mockSocket);
            await disconnect();
            
            // Verify user is preserved in leaderboard (FIXED BEHAVIOR)
            const scoreAfter = await redisClient.zscore(leaderboardKey, testUserId);
            const participantAfter = await redisClient.hget(participantsKey, testUserId);
            
            expect(scoreAfter).toBe(joinOrderBonus.toString()); // Score preserved
            expect(participantAfter).toBeTruthy(); // Participant preserved
            
            // Verify participant is marked offline but not removed
            const participantDataAfter = JSON.parse(participantAfter!);
            expect(participantDataAfter.online).toBe(false);
            expect(participantDataAfter.username).toBe('Clémence');
        });

        it('should remove user without score in real Redis', async () => {
            const userIdNoScore = testUserId + '-no-score';
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            
            // Add user to participants but NOT to leaderboard (no score)
            const participantData = {
                userId: userIdNoScore,
                username: 'UserNoScore',
                online: true,
                status: 'PENDING'
            };
            await redisClient.hset(participantsKey, userIdNoScore, JSON.stringify(participantData));
            await redisClient.hset(`socketIdToUserId:${testAccessCode}`, 'socket-no-score', userIdNoScore);
            
            // Mock socket for user without score
            const mockSocketNoScore = {
                ...mockSocket,
                id: 'socket-no-score',
                data: { ...mockSocket.data, userId: userIdNoScore }
            };
            
            // Verify user exists before disconnect
            const participantBefore = await redisClient.hget(participantsKey, userIdNoScore);
            expect(participantBefore).toBeTruthy();
            
            // Call real disconnect handler
            const disconnect = disconnectHandler(io, mockSocketNoScore);
            await disconnect();
            
            // Verify user is removed (EXPECTED BEHAVIOR)
            const participantAfter = await redisClient.hget(participantsKey, userIdNoScore);
            expect(participantAfter).toBe(null); // Participant removed
        });
    });

    describe('Issue 2: Real Snapshot Security Test', () => {
        it('should use snapshot data for projection broadcast with real Redis', async () => {
            // Setup: Create live leaderboard data
            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            await redisClient.zadd(leaderboardKey, 980, 'josephine-id'); // High live score
            await redisClient.zadd(leaderboardKey, 150, 'claudia-id');
            
            // Setup: Create snapshot data (lower scores)
            const snapshotKey = `leaderboard:snapshot:${testAccessCode}`;
            const snapshotData = [
                { userId: 'josephine-id', username: 'Joséphine', score: 0.009, rank: 1 },
                { userId: 'maxime-id', username: 'Maxime', score: 0.01, rank: 2 }
            ];
            await redisClient.set(snapshotKey, JSON.stringify(snapshotData));
            
            // Mock IO for capturing emissions
            let emittedData: any = null;
            const mockIo = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn().mockImplementation((event, data) => {
                    emittedData = data;
                })
            };
            
            // Call real projection broadcast
            await broadcastLeaderboardToProjection(mockIo as any, testAccessCode, testGameId);
            
            // Verify projection received SNAPSHOT data, not live data
            expect(mockIo.to).toHaveBeenCalledWith(`projection_${testGameId}`);
            expect(mockIo.emit).toHaveBeenCalledWith('projection_leaderboard_update', expect.any(Object));
            expect(emittedData).toBeTruthy();
            
            // Critical: Verify Joséphine shows snapshot score (0.009), not live score (980)
            const josephineInProjection = emittedData.leaderboard?.find((p: any) => p.username === 'Joséphine');
            expect(josephineInProjection).toBeTruthy();
            expect(josephineInProjection.score).toBe(0.009); // Snapshot score (FIXED)
            expect(josephineInProjection.score).not.toBe(980); // Not live score
        });
    });

    describe('Real-World Scenario Tests', () => {
        it('should handle complete Clémence scenario with real Redis', async () => {
            const clemenceUserId = 'clemence-' + Date.now();
            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            
            // Step 1: Clémence joins and gets join-order bonus
            const joinOrderBonus = 0.009;
            await redisClient.zadd(leaderboardKey, joinOrderBonus, clemenceUserId);
            await redisClient.hset(participantsKey, clemenceUserId, JSON.stringify({
                userId: clemenceUserId,
                username: 'Clémence',
                score: joinOrderBonus,
                online: true,
                status: 'PENDING' // In lobby, game not started
            }));
            await redisClient.hset(`socketIdToUserId:${testAccessCode}`, 'clemence-socket', clemenceUserId);
            
            // Step 2: Clémence disconnects before game starts
            const clemenceSocket = {
                ...mockSocket,
                id: 'clemence-socket',
                data: { ...mockSocket.data, userId: clemenceUserId, username: 'Clémence' }
            };
            
            const disconnect = disconnectHandler(io, clemenceSocket);
            await disconnect();
            
            // Step 3: Verify Clémence is preserved (FIXED BEHAVIOR)
            const scoreAfter = await redisClient.zscore(leaderboardKey, clemenceUserId);
            const participantAfter = await redisClient.hget(participantsKey, clemenceUserId);
            
            expect(scoreAfter).toBe(joinOrderBonus.toString());
            expect(participantAfter).toBeTruthy();
            
            const clemenceData = JSON.parse(participantAfter!);
            expect(clemenceData.username).toBe('Clémence');
            expect(clemenceData.online).toBe(false); // Marked offline but not removed
        });

        it('should handle Joséphine live score leak scenario with real Redis', async () => {
            const josephineUserId = 'josephine-' + Date.now();
            const claudiaUserId = 'claudia-' + Date.now();
            
            // Setup: Joséphine has high live score, but snapshot is old
            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            await redisClient.zadd(leaderboardKey, 980, josephineUserId); // Live score
            await redisClient.zadd(leaderboardKey, 150, claudiaUserId);
            
            // Setup: Old snapshot with low scores
            const snapshotKey = `leaderboard:snapshot:${testAccessCode}`;
            const snapshotData = [
                { userId: josephineUserId, username: 'Joséphine', score: 0.009, rank: 1 },
                { userId: 'maxime-id', username: 'Maxime', score: 0.01, rank: 2 }
            ];
            await redisClient.set(snapshotKey, JSON.stringify(snapshotData));
            
            // Simulate Claudia joining and triggering projection broadcast
            const mockIo = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
            
            await broadcastLeaderboardToProjection(mockIo as any, testAccessCode, testGameId);
            
            // Verify projection used snapshot, not live data (FIXED)
            expect(mockIo.to).toHaveBeenCalledWith(`projection_${testGameId}`);
            expect(mockIo.emit).toHaveBeenCalledWith(
                'projection_leaderboard_update',
                expect.objectContaining({
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({
                            username: 'Joséphine',
                            score: 0.009 // Snapshot score, not 980
                        })
                    ])
                })
            );
        });
    });
});
