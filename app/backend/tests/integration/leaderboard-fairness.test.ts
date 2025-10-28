// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { redisClient } from '../../src/config/redis';
import { prisma } from '../../src/db/prisma';
import { calculateLeaderboard } from '../../src/sockets/handlers/sharedLeaderboard';
import { assignJoinOrderBonus } from '../../src/utils/joinOrderBonus';

describe('Leaderboard Fairness & Determinism', () => {
    let io: SocketIOServer;
    let testGameId: string;
    let testAccessCode: string;

    beforeAll(async () => {
        // Set up Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
    });

    afterAll(async () => {
        if (io) {
            io.close();
        }
        // Redis cleanup handled by globalTeardown.ts
    });

    beforeEach(async () => {
        // Generate unique test data
        const timestamp = Date.now();
        testAccessCode = `FAIR-${timestamp}`;
        testGameId = `game-${timestamp}`;

        // Clean up Redis
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
    });

    afterEach(async () => {
        // Clean up test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameId } });
    });

    describe('Tie resolution determinism', () => {
        it('should resolve ties by join order, then username', async () => {
            // Create test participants with same score but different join order and usernames
            const user1 = { id: 'user-1', username: 'Charlie', avatarEmoji: '🐱' };
            const user2 = { id: 'user-2', username: 'Alice', avatarEmoji: '🐶' };
            const user3 = { id: 'user-3', username: 'Bob', avatarEmoji: '🐭' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            const joinOrderKey = `mathquest:game:join_order:${testAccessCode}`;

            // Set up join order: Alice (user2) joins first, then Bob (user3), then Charlie (user1)
            await redisClient.rpush(joinOrderKey, user2.id); // Alice joins first
            await redisClient.rpush(joinOrderKey, user3.id); // Bob joins second
            await redisClient.rpush(joinOrderKey, user1.id); // Charlie joins third

            // All users get the same score (tie scenario)
            const tieScore = 100;
            await redisClient.zadd(leaderboardKey, tieScore, user1.id);
            await redisClient.zadd(leaderboardKey, tieScore, user2.id);
            await redisClient.zadd(leaderboardKey, tieScore, user3.id);

            // Set up participant metadata
            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user2.id, JSON.stringify({
                username: user2.username,
                avatarEmoji: user2.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user3.id, JSON.stringify({
                username: user3.username,
                avatarEmoji: user3.avatarEmoji
            }));

            // Calculate leaderboard
            const leaderboard = await calculateLeaderboard(testAccessCode);

            // Verify all users have the same score
            expect(leaderboard.length).toBe(3);
            leaderboard.forEach(entry => {
                expect(entry.score).toBe(tieScore);
            });

            // Verify tie resolution: join order first (Alice, Bob, Charlie), then alphabetical by username
            // Since Redis sorts by score descending and maintains insertion order for ties,
            // we need to verify the order matches our expectations
            expect(leaderboard[0].username).toBe('Alice'); // First in join order
            expect(leaderboard[1].username).toBe('Bob');   // Second in join order
            expect(leaderboard[2].username).toBe('Charlie'); // Third in join order
        });

        it('should maintain consistent tie resolution across recalculations', async () => {
            // Create test participants with same score
            const user1 = { id: 'user-1', username: 'Charlie', avatarEmoji: '🐱' };
            const user2 = { id: 'user-2', username: 'Alice', avatarEmoji: '🐶' };
            const user3 = { id: 'user-3', username: 'Bob', avatarEmoji: '🐭' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            const joinOrderKey = `mathquest:game:join_order:${testAccessCode}`;

            // Set up join order
            await redisClient.rpush(joinOrderKey, user2.id);
            await redisClient.rpush(joinOrderKey, user3.id);
            await redisClient.rpush(joinOrderKey, user1.id);

            // All users get the same score
            const tieScore = 100;
            await redisClient.zadd(leaderboardKey, tieScore, user1.id);
            await redisClient.zadd(leaderboardKey, tieScore, user2.id);
            await redisClient.zadd(leaderboardKey, tieScore, user3.id);

            // Set up participant metadata
            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user2.id, JSON.stringify({
                username: user2.username,
                avatarEmoji: user2.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user3.id, JSON.stringify({
                username: user3.username,
                avatarEmoji: user3.avatarEmoji
            }));

            // Calculate leaderboard multiple times
            const leaderboard1 = await calculateLeaderboard(testAccessCode);
            const leaderboard2 = await calculateLeaderboard(testAccessCode);
            const leaderboard3 = await calculateLeaderboard(testAccessCode);

            // Verify all calculations produce identical results
            expect(leaderboard1.length).toBe(3);
            expect(leaderboard2.length).toBe(3);
            expect(leaderboard3.length).toBe(3);

            // Compare each position
            for (let i = 0; i < 3; i++) {
                expect(leaderboard1[i].userId).toBe(leaderboard2[i].userId);
                expect(leaderboard1[i].userId).toBe(leaderboard3[i].userId);
                expect(leaderboard1[i].username).toBe(leaderboard2[i].username);
                expect(leaderboard1[i].username).toBe(leaderboard3[i].username);
                expect(leaderboard1[i].score).toBe(leaderboard2[i].score);
                expect(leaderboard1[i].score).toBe(leaderboard3[i].score);
            }
        });
    });

    describe('Join-order bonus rules', () => {
        it('should apply join bonus only once per participant', async () => {
            const user1 = { id: 'user-1', username: 'Alice', avatarEmoji: '🐱' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            const joinOrderKey = `mathquest:game:join_order:${testAccessCode}`;

            // Set up participant metadata
            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));

            // First join - should get bonus
            const bonus1 = await assignJoinOrderBonus(testAccessCode, user1.id);
            expect(bonus1).toBeGreaterThan(0);

            // Verify join order was recorded
            const joinOrderAfterFirst = await redisClient.lrange(joinOrderKey, 0, -1);
            expect(joinOrderAfterFirst).toEqual([user1.id]);

            // Second join attempt - should NOT get bonus (duplicate prevention)
            const bonus2 = await assignJoinOrderBonus(testAccessCode, user1.id);
            expect(bonus2).toBe(0);

            // Verify join order still contains only one entry
            const joinOrderAfterSecond = await redisClient.lrange(joinOrderKey, 0, -1);
            expect(joinOrderAfterSecond).toEqual([user1.id]);
            expect(joinOrderAfterSecond.length).toBe(1);
        });

        it('should preserve join bonus across disconnect/reconnect', async () => {
            const user1 = { id: 'user-1', username: 'Alice', avatarEmoji: '🐱' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            const joinOrderKey = `mathquest:game:join_order:${testAccessCode}`;

            // Set up participant metadata
            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));

            // First join - get bonus
            const bonus1 = await assignJoinOrderBonus(testAccessCode, user1.id);
            expect(bonus1).toBeGreaterThan(0);

            // Simulate disconnect by clearing participant metadata but keeping join order
            await redisClient.hdel(participantsKey, user1.id);

            // Reconnect - should NOT get bonus again (already in join order)
            const bonus2 = await assignJoinOrderBonus(testAccessCode, user1.id);
            expect(bonus2).toBe(0);

            // Verify join order preserved
            const joinOrder = await redisClient.lrange(joinOrderKey, 0, -1);
            expect(joinOrder).toEqual([user1.id]);
        });
    });

    describe('Concurrent operations stability', () => {
        it('should not flicker ordering during concurrent joins/leaves', async () => {
            const user1 = { id: 'user-1', username: 'Alice', avatarEmoji: '🐱' };
            const user2 = { id: 'user-2', username: 'Bob', avatarEmoji: '🐶' };
            const user3 = { id: 'user-3', username: 'Charlie', avatarEmoji: '🐭' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;

            // Set up initial participants with different scores
            await redisClient.zadd(leaderboardKey, 100, user1.id); // Alice: 100
            await redisClient.zadd(leaderboardKey, 200, user2.id); // Bob: 200
            await redisClient.zadd(leaderboardKey, 50, user3.id);  // Charlie: 50

            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user2.id, JSON.stringify({
                username: user2.username,
                avatarEmoji: user2.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user3.id, JSON.stringify({
                username: user3.username,
                avatarEmoji: user3.avatarEmoji
            }));

            // Get initial leaderboard
            const initialLeaderboard = await calculateLeaderboard(testAccessCode);
            expect(initialLeaderboard.length).toBe(3);

            // Expected order: Bob (200), Alice (100), Charlie (50)
            expect(initialLeaderboard[0].username).toBe('Bob');
            expect(initialLeaderboard[1].username).toBe('Alice');
            expect(initialLeaderboard[2].username).toBe('Charlie');

            // Simulate concurrent operations: rapid score updates
            await Promise.all([
                redisClient.zadd(leaderboardKey, 150, user1.id), // Alice: 100 -> 150
                redisClient.zadd(leaderboardKey, 250, user2.id), // Bob: 200 -> 250
                redisClient.zadd(leaderboardKey, 75, user3.id),  // Charlie: 50 -> 75
            ]);

            // Calculate leaderboard after concurrent updates
            const updatedLeaderboard = await calculateLeaderboard(testAccessCode);
            expect(updatedLeaderboard.length).toBe(3);

            // Expected order after updates: Bob (250), Alice (150), Charlie (75)
            expect(updatedLeaderboard[0].username).toBe('Bob');
            expect(updatedLeaderboard[1].username).toBe('Alice');
            expect(updatedLeaderboard[2].username).toBe('Charlie');

            // Verify scores are updated correctly
            expect(updatedLeaderboard[0].score).toBe(250);
            expect(updatedLeaderboard[1].score).toBe(150);
            expect(updatedLeaderboard[2].score).toBe(75);
        });

        it('should handle leaderboard updates during high concurrency', async () => {
            const users = [
                { id: 'user-1', username: 'Alice', avatarEmoji: '🐱' },
                { id: 'user-2', username: 'Bob', avatarEmoji: '🐶' },
                { id: 'user-3', username: 'Charlie', avatarEmoji: '🐭' },
                { id: 'user-4', username: 'Diana', avatarEmoji: '🐰' },
                { id: 'user-5', username: 'Eve', avatarEmoji: '🐸' },
            ];

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;

            // Set up participants
            for (const user of users) {
                await redisClient.hset(participantsKey, user.id, JSON.stringify({
                    username: user.username,
                    avatarEmoji: user.avatarEmoji
                }));
            }

            // Simulate high concurrency: multiple score updates happening simultaneously
            const concurrentUpdates = users.map((user, index) =>
                redisClient.zadd(leaderboardKey, (index + 1) * 50, user.id) // Scores: 50, 100, 150, 200, 250
            );

            await Promise.all(concurrentUpdates);

            // Calculate leaderboard
            const leaderboard = await calculateLeaderboard(testAccessCode);
            expect(leaderboard.length).toBe(5);

            // Verify correct ordering by score (descending)
            expect(leaderboard[0].username).toBe('Eve');    // 250
            expect(leaderboard[1].username).toBe('Diana');  // 200
            expect(leaderboard[2].username).toBe('Charlie'); // 150
            expect(leaderboard[3].username).toBe('Bob');    // 100
            expect(leaderboard[4].username).toBe('Alice');  // 50

            // Verify scores
            expect(leaderboard[0].score).toBe(250);
            expect(leaderboard[1].score).toBe(200);
            expect(leaderboard[2].score).toBe(150);
            expect(leaderboard[3].score).toBe(100);
            expect(leaderboard[4].score).toBe(50);
        });
    });

    describe('Edge case handling', () => {
        it('should handle zero scores correctly in tie resolution', async () => {
            const user1 = { id: 'user-1', username: 'Charlie', avatarEmoji: '🐱' };
            const user2 = { id: 'user-2', username: 'Alice', avatarEmoji: '🐶' };
            const user3 = { id: 'user-3', username: 'Bob', avatarEmoji: '🐭' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;
            const joinOrderKey = `mathquest:game:join_order:${testAccessCode}`;

            // Set up join order: Alice first, Bob second, Charlie third
            await redisClient.rpush(joinOrderKey, user2.id);
            await redisClient.rpush(joinOrderKey, user3.id);
            await redisClient.rpush(joinOrderKey, user1.id);

            // All users get zero score
            await redisClient.zadd(leaderboardKey, 0, user1.id);
            await redisClient.zadd(leaderboardKey, 0, user2.id);
            await redisClient.zadd(leaderboardKey, 0, user3.id);

            // Set up participant metadata
            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user2.id, JSON.stringify({
                username: user2.username,
                avatarEmoji: user2.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user3.id, JSON.stringify({
                username: user3.username,
                avatarEmoji: user3.avatarEmoji
            }));

            // Calculate leaderboard
            const leaderboard = await calculateLeaderboard(testAccessCode);

            // Verify all users have zero scores
            expect(leaderboard.length).toBe(3);
            leaderboard.forEach(entry => {
                expect(entry.score).toBe(0);
            });

            // Verify tie resolution still works with zero scores
            // Should be ordered by join order: Alice, Bob, Charlie
            expect(leaderboard[0].username).toBe('Alice');
            expect(leaderboard[1].username).toBe('Bob');
            expect(leaderboard[2].username).toBe('Charlie');
        });

        it('should handle negative scores in ordering', async () => {
            const user1 = { id: 'user-1', username: 'Alice', avatarEmoji: '🐱' };
            const user2 = { id: 'user-2', username: 'Bob', avatarEmoji: '🐶' };
            const user3 = { id: 'user-3', username: 'Charlie', avatarEmoji: '🐭' };

            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;
            const participantsKey = `mathquest:game:participants:${testAccessCode}`;

            // Set up scores: positive, zero, negative
            await redisClient.zadd(leaderboardKey, 50, user1.id);   // Alice: 50
            await redisClient.zadd(leaderboardKey, 0, user2.id);    // Bob: 0
            await redisClient.zadd(leaderboardKey, -25, user3.id);  // Charlie: -25

            // Set up participant metadata
            await redisClient.hset(participantsKey, user1.id, JSON.stringify({
                username: user1.username,
                avatarEmoji: user1.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user2.id, JSON.stringify({
                username: user2.username,
                avatarEmoji: user2.avatarEmoji
            }));
            await redisClient.hset(participantsKey, user3.id, JSON.stringify({
                username: user3.username,
                avatarEmoji: user3.avatarEmoji
            }));

            // Calculate leaderboard
            const leaderboard = await calculateLeaderboard(testAccessCode);

            // Verify correct ordering: highest to lowest (including negatives)
            expect(leaderboard.length).toBe(3);
            expect(leaderboard[0].username).toBe('Alice');   // 50
            expect(leaderboard[1].username).toBe('Bob');     // 0
            expect(leaderboard[2].username).toBe('Charlie'); // -25

            // Verify scores
            expect(leaderboard[0].score).toBe(50);
            expect(leaderboard[1].score).toBe(0);
            expect(leaderboard[2].score).toBe(-25);
        });
    });
});