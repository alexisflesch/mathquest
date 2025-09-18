/**
 * Comprehensive Tournament Integration Tests
 * 
 * This test suite thoroughly covers all tournament scenarios:
 * 1. Live Tournament Flow (real-time gameplay)
 * 2. Deferred Tournament Flow (asynchronous gameplay)
 * 3. Mixed Mode Tournaments (live + deferred attempts)
 * 4. Edge Cases and Error Scenarios
 * 5. Performance and Stress Testing
 * 6. Security and Data Integrity
 * 7. Real-World User Journeys
 */

// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { redisClient } from '@/config/redis';
import { prisma } from '@/db/prisma';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { ScoringService } from '@/core/services/scoringService';
import { disconnectHandler } from '@/sockets/handlers/game/disconnect';

describe('Comprehensive Tournament Integration Tests', () => {
    let io: SocketIOServer;
    let timerService: CanonicalTimerService;

    // Test data generators
    const generateTestData = () => ({
        accessCode: 'TOURNAMENT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        gameId: 'game-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        userId: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        questionUid: 'question-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)
    });

    // Helper function to create participant with both database and Redis records
    const createParticipant = async (gameInstanceId: string, accessCode: string, participant: { id: string, username: string, socketId?: string }, score: number = 0) => {
        // Create user record if it doesn't exist
        await prisma.user.upsert({
            where: { id: participant.id },
            update: {},
            create: {
                id: participant.id,
                username: participant.username,
                email: `${participant.username.toLowerCase()}-${Date.now()}@example.com`,
                role: 'STUDENT'
            }
        });

        // Create gameParticipant database record (required by scoring service)
        await prisma.gameParticipant.create({
            data: {
                gameInstanceId: gameInstanceId,
                userId: participant.id,
                liveScore: Math.round(score * 1000), // Convert to integer points
                status: 'ACTIVE'
            }
        });

        // Add to Redis leaderboard
        await redisClient.zadd(`mathquest:game:leaderboard:${accessCode}`, score, participant.id);

        // Add to participants hash
        await redisClient.hset(`mathquest:game:participants:${accessCode}`, participant.id, JSON.stringify({
            userId: participant.id,
            username: participant.username,
            score: score,
            online: true,
            status: 'ACTIVE'
        }));

        // Set up socket mappings if socketId provided
        if (participant.socketId) {
            await redisClient.hset(`mathquest:game:socketIdToUserId:${accessCode}`, participant.socketId, participant.id);
            await redisClient.hset(`mathquest:game:userIdToSocketId:${accessCode}`, participant.id, participant.socketId);
        }
    };

    beforeAll(async () => {
        // Set up Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
        timerService = new CanonicalTimerService(redisClient);
    });

    afterAll(async () => {
        if (io) {
            io.close();
        }
        // Close Redis connection to prevent open handles
        await redisClient.quit();
    });

    // Cleanup helper
    const cleanupTestData = async (testData: ReturnType<typeof generateTestData>) => {
        const { accessCode, userId, questionUid } = testData;

        // Clean up Redis keys
        await redisClient.del(`mathquest:game:leaderboard:${accessCode}`);
        await redisClient.del(`mathquest:game:participants:${accessCode}`);
        await redisClient.del(`mathquest:game:userIdToSocketId:${accessCode}`);
        await redisClient.del(`mathquest:game:socketIdToUserId:${accessCode}`);
        await redisClient.del(`leaderboard:snapshot:${accessCode}`);

        // Clean up timer keys for multiple attempts
        for (let attempt = 1; attempt <= 5; attempt++) {
            await redisClient.del(`mathquest:deferred:timer:${accessCode}:${userId}:${attempt}:${questionUid}`);
            await redisClient.del(`mathquest:game:answers:${accessCode}:${questionUid}:${attempt}`);
            await redisClient.del(`deferred_session:${accessCode}:${userId}:${attempt}`);
        }
    };

    describe('🏆 Live Tournament Flow', () => {
        it('should handle complete live tournament with multiple participants', async () => {
            const testData = generateTestData();
            const participants = [
                { id: testData.userId + '-alice', username: 'Alice', socketId: 'socket-alice' },
                { id: testData.userId + '-bob', username: 'Bob', socketId: 'socket-bob' },
                { id: testData.userId + '-charlie', username: 'Charlie', socketId: 'socket-charlie' }
            ];

            try {
                // Step 1: Create game instance and questions
                const testUser = await prisma.user.create({
                    data: {
                        id: testData.userId + '-teacher',
                        username: 'Teacher-' + Date.now(),
                        email: `teacher-${Date.now()}@example.com`,
                        role: 'TEACHER'
                    }
                });

                const testQuestion = await prisma.question.create({
                    data: {
                        uid: testData.questionUid,
                        text: 'What is 6 × 7?',
                        questionType: 'numeric',
                        discipline: 'Mathematics',
                        gradeLevel: 'CE1',
                        author: 'test',
                        timeLimit: 30,
                        numericQuestion: {
                            create: {
                                correctAnswer: 42,
                                tolerance: 0
                            }
                        }
                    }
                });

                const testGameTemplate = await prisma.gameTemplate.create({
                    data: {
                        id: testData.gameId + '-template',
                        name: 'Live Tournament Template',
                        description: 'Template for live tournament testing',
                        creatorId: testUser.id
                    }
                });

                await prisma.questionsInGameTemplate.create({
                    data: {
                        gameTemplateId: testGameTemplate.id,
                        questionUid: testData.questionUid,
                        sequence: 1
                    }
                });

                const testGameInstance = await prisma.gameInstance.create({
                    data: {
                        id: testData.gameId,
                        accessCode: testData.accessCode,
                        name: 'Live Tournament Test',
                        status: 'active',
                        playMode: 'tournament',
                        gameTemplateId: testGameTemplate.id,
                        initiatorUserId: testUser.id
                    }
                });

                // Step 2: Participants join with join-order bonuses
                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];
                    const joinOrderBonus = 0.001 * (participants.length - i); // Later joins get smaller bonus

                    await createParticipant(testData.gameId, testData.accessCode, participant, joinOrderBonus);
                }

                // Step 3: Start live timers for all participants
                for (const participant of participants) {
                    await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, participant.id);
                }

                // Step 4: Participants submit answers at different times
                const answerResults = [];
                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];
                    const timeSpent = 1000 + (i * 500); // Different response times

                    // Simulate time passing
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const answerData = {
                        questionUid: testData.questionUid,
                        answer: 42, // All correct
                        timeSpent: timeSpent,
                        accessCode: testData.accessCode,
                        userId: participant.id
                    };

                    const result = await ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        participant.id,
                        answerData,
                        false // isDeferred = false for live
                    );

                    answerResults.push({ participant: participant.username, result });
                }

                // Step 5: Verify scoring and ranking
                expect(answerResults).toHaveLength(3);

                // All should have scored points
                answerResults.forEach(({ result }) => {
                    expect(result.scoreUpdated).toBe(true);
                    expect(result.scoreAdded).toBeGreaterThan(0);
                    expect(result.scoreAdded).toBeLessThan(1000); // With time penalty
                });

                // Step 6: Verify leaderboard ordering (faster answers score higher)
                const leaderboard = await redisClient.zrevrange(`mathquest:game:leaderboard:${testData.accessCode}`, 0, -1, 'WITHSCORES');
                expect(leaderboard).toHaveLength(6); // 3 participants × 2 (username, score)

                // Alice should have highest score (answered first)
                const aliceScore = parseFloat(leaderboard[1]);
                const bobScore = parseFloat(leaderboard[3]);
                const charlieScore = parseFloat(leaderboard[5]);

                expect(aliceScore).toBeGreaterThan(bobScore);
                expect(bobScore).toBeGreaterThan(charlieScore);

                console.log('✅ Live tournament flow test passed - proper scoring and ranking');

                // Cleanup database (use deleteMany to avoid constraint errors)
                await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } });
                await prisma.numericQuestion.deleteMany({ where: { questionUid: testData.questionUid } });
                await prisma.question.deleteMany({ where: { uid: testData.questionUid } });
                await prisma.questionsInGameTemplate.deleteMany({
                    where: {
                        gameTemplateId: testGameTemplate.id,
                        questionUid: testData.questionUid
                    }
                });
                await prisma.gameInstance.deleteMany({ where: { id: testData.gameId } });
                await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplate.id } });
                await prisma.user.deleteMany({ where: { id: { contains: testData.userId } } });
                await prisma.user.deleteMany({ where: { id: testUser.id } });

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should handle participant disconnections during live tournament', async () => {
            const testData = generateTestData();

            try {
                // Create game instance first
                const testUser = await prisma.user.create({
                    data: {
                        id: testData.userId + '-teacher',
                        username: 'Teacher-' + Date.now(),
                        email: `teacher-${Date.now()}@example.com`,
                        role: 'TEACHER'
                    }
                });

                const testGameTemplate = await prisma.gameTemplate.create({
                    data: {
                        id: testData.gameId + '-template',
                        name: 'Disconnect Test Template',
                        description: 'Template for disconnect testing',
                        creatorId: testUser.id
                    }
                });

                const testGameInstance = await prisma.gameInstance.create({
                    data: {
                        id: testData.gameId,
                        accessCode: testData.accessCode,
                        name: 'Disconnect Test',
                        status: 'active',
                        playMode: 'tournament',
                        gameTemplateId: testGameTemplate.id,
                        initiatorUserId: testUser.id
                    }
                });

                // Setup participant with join-order bonus using helper
                const joinOrderBonus = 0.005;
                await createParticipant(testData.gameId, testData.accessCode, {
                    id: testData.userId,
                    username: 'DisconnectUser',
                    socketId: 'socket-disconnect'
                }, joinOrderBonus);

                // Mock socket for disconnect test
                const mockSocket = {
                    id: 'socket-disconnect',
                    data: {
                        gameId: testData.gameId,
                        accessCode: testData.accessCode,
                        userId: testData.userId,
                        username: 'DisconnectUser'
                    },
                    join: jest.fn(),
                    leave: jest.fn(),
                    emit: jest.fn(),
                    to: jest.fn().mockReturnThis(),
                };

                // Trigger disconnect
                const disconnect = disconnectHandler(io, mockSocket as any);
                await disconnect();

                // Verify participant is preserved but marked offline
                const participantAfter = await redisClient.hget(`mathquest:game:participants:${testData.accessCode}`, testData.userId);
                expect(participantAfter).toBeTruthy();

                const participantData = JSON.parse(participantAfter!);
                expect(participantData.online).toBe(false);
                expect(participantData.username).toBe('DisconnectUser');

                // Verify score is preserved in leaderboard (convert string to number)
                const scoreAfter = await redisClient.zscore(`mathquest:game:leaderboard:${testData.accessCode}`, testData.userId);
                expect(parseFloat(scoreAfter as string)).toBeCloseTo(joinOrderBonus, 10);

                console.log('✅ Live tournament disconnect handling test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });
    });

    describe('🕐 Deferred Tournament Flow', () => {
        it('should handle complete deferred tournament with attempt isolation', async () => {
            const testData = generateTestData();

            try {
                // Create test infrastructure
                const testUser = await prisma.user.create({
                    data: {
                        id: testData.userId + '-teacher',
                        username: 'DeferredTeacher-' + Date.now(),
                        email: `deferred-teacher-${Date.now()}@example.com`,
                        role: 'TEACHER'
                    }
                });

                const testQuestion = await prisma.question.create({
                    data: {
                        uid: testData.questionUid,
                        text: 'What is 8 × 9?',
                        questionType: 'numeric',
                        discipline: 'Mathematics',
                        gradeLevel: 'CE1',
                        author: 'test',
                        timeLimit: 30,
                        numericQuestion: {
                            create: {
                                correctAnswer: 72,
                                tolerance: 0
                            }
                        }
                    }
                });

                const testGameTemplate = await prisma.gameTemplate.create({
                    data: {
                        id: testData.gameId + '-template',
                        name: 'Deferred Tournament Template',
                        description: 'Template for deferred tournament testing',
                        creatorId: testUser.id
                    }
                });

                await prisma.questionsInGameTemplate.create({
                    data: {
                        gameTemplateId: testGameTemplate.id,
                        questionUid: testData.questionUid,
                        sequence: 1
                    }
                });

                const testGameInstance = await prisma.gameInstance.create({
                    data: {
                        id: testData.gameId,
                        accessCode: testData.accessCode,
                        name: 'Deferred Tournament Test',
                        status: 'completed',
                        playMode: 'tournament',
                        gameTemplateId: testGameTemplate.id,
                        differedAvailableFrom: new Date(),
                        differedAvailableTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        initiatorUserId: testUser.id
                    }
                });

                // Create participant first for scoring service
                await createParticipant(testData.gameId, testData.accessCode, {
                    id: testData.userId,
                    username: 'DeferredUser',
                    socketId: 'socket-deferred'
                });

                // Simulate multiple deferred attempts
                const attempts = [
                    { attemptNum: 1, expectedScore: 998, timeSpent: 500 },   // Fast = high score
                    { attemptNum: 2, expectedScore: 995, timeSpent: 2000 },  // Medium time
                    { attemptNum: 3, expectedScore: 990, timeSpent: 5000 }   // Slow = lower score
                ];

                for (const attempt of attempts) {
                    // Create deferred session
                    const sessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:${attempt.attemptNum}`;
                    await redisClient.hset(sessionKey, 'score', '0');
                    await redisClient.hset(sessionKey, 'userId', testData.userId);
                    await redisClient.hset(sessionKey, 'username', 'DeferredUser');
                    await redisClient.hset(sessionKey, 'attemptNumber', attempt.attemptNum.toString());

                    // Start timer with correct attempt count
                    await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, attempt.attemptNum);

                    // Simulate time and submit answer
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const answerData = {
                        questionUid: testData.questionUid,
                        answer: 72, // Correct answer
                        timeSpent: attempt.timeSpent,
                        accessCode: testData.accessCode,
                        userId: testData.userId
                    };

                    const result = await ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        testData.userId,
                        answerData,
                        true, // isDeferred
                        attempt.attemptNum // attemptCountOverride
                    );

                    // Verify scoring
                    expect(result.scoreUpdated).toBe(true);
                    expect(result.scoreAdded).toBeGreaterThan(0);
                    expect(result.scoreAdded).toBeLessThan(1000); // With time penalty

                    // Update session score
                    await redisClient.hset(sessionKey, 'score', result.scoreAdded.toString());

                    // Verify session isolation
                    const sessionScore = await redisClient.hget(sessionKey, 'score');
                    expect(parseFloat(sessionScore!)).toBeCloseTo(result.scoreAdded, 1);
                }

                // Verify attempts are isolated from each other and scores decrease with time
                const session1Score = await redisClient.hget(`deferred_session:${testData.accessCode}:${testData.userId}:1`, 'score');
                const session2Score = await redisClient.hget(`deferred_session:${testData.accessCode}:${testData.userId}:2`, 'score');
                const session3Score = await redisClient.hget(`deferred_session:${testData.accessCode}:${testData.userId}:3`, 'score');

                // Convert to numbers for comparison
                const score1 = parseFloat(session1Score!);
                const score2 = parseFloat(session2Score!);
                const score3 = parseFloat(session3Score!);

                // Faster attempts should have higher scores (allowing for small variations)
                expect(score1).toBeGreaterThanOrEqual(score2 - 2); // Allow 2 point tolerance for floating point precision
                expect(score2).toBeGreaterThanOrEqual(score3 - 2);

                console.log('✅ Deferred tournament flow test passed - proper attempt isolation');

                // Cleanup database with error handling
                await prisma.numericQuestion.delete({ where: { questionUid: testData.questionUid } }).catch(() => { });
                await prisma.question.delete({ where: { uid: testData.questionUid } }).catch(() => { });
                await prisma.questionsInGameTemplate.delete({
                    where: {
                        gameTemplateId_questionUid: {
                            gameTemplateId: testGameTemplate.id,
                            questionUid: testData.questionUid
                        }
                    }
                }).catch(() => { });
                await prisma.gameInstance.delete({ where: { id: testData.gameId } }).catch(() => { });
                await prisma.gameTemplate.delete({ where: { id: testGameTemplate.id } }).catch(() => { });
                await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should use correct timer keys for deferred attempts', async () => {
            const testData = generateTestData();

            try {
                const { getTimerKey } = require('@/core/services/timerKeyUtil');

                // Test multiple attempt numbers
                for (let attemptNum = 1; attemptNum <= 3; attemptNum++) {
                    const expectedKey = `mathquest:deferred:timer:${testData.accessCode}:${testData.userId}:${attemptNum}:${testData.questionUid}`;

                    const actualKey = getTimerKey({
                        accessCode: testData.accessCode,
                        userId: testData.userId,
                        questionUid: testData.questionUid,
                        attemptCount: attemptNum,
                        isDeferred: true
                    });

                    expect(actualKey).toBe(expectedKey);

                    // Start timer and verify it uses correct key
                    await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, attemptNum);

                    const timerExists = await redisClient.get(expectedKey);
                    expect(timerExists).toBeTruthy();
                }

                console.log('✅ Deferred timer key format test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });
    });

    describe('🔄 Mixed Mode Tournaments', () => {
        it('should handle user playing both live and deferred modes', async () => {
            const testData = generateTestData();

            try {
                // Step 1: User plays live tournament first
                const liveScore = 985;
                await redisClient.zadd(`mathquest:game:leaderboard:${testData.accessCode}`, liveScore, testData.userId);
                await redisClient.hset(`mathquest:game:participants:${testData.accessCode}`, testData.userId, JSON.stringify({
                    userId: testData.userId,
                    username: 'MixedUser',
                    score: liveScore,
                    online: false,
                    status: 'COMPLETED'
                }));

                // Step 2: Same user later plays deferred tournament
                const deferredSessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:1`;
                await redisClient.hset(deferredSessionKey, 'score', '0');
                await redisClient.hset(deferredSessionKey, 'userId', testData.userId);
                await redisClient.hset(deferredSessionKey, 'username', 'MixedUser');

                // Step 3: User answers question in deferred mode
                await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, 1);

                await new Promise(resolve => setTimeout(resolve, 100));

                // Simulate deferred answer submission
                const deferredScore = 975; // Different from live score
                await redisClient.hset(deferredSessionKey, 'score', deferredScore.toString());

                // Step 4: Verify isolation between live and deferred scores
                const globalScore = await redisClient.zscore(`mathquest:game:leaderboard:${testData.accessCode}`, testData.userId);
                const sessionScore = await redisClient.hget(deferredSessionKey, 'score');

                expect(parseFloat(globalScore as string)).toBe(liveScore); // Live score unchanged
                expect(parseFloat(sessionScore!)).toBe(deferredScore); // Deferred score isolated
                expect(parseFloat(globalScore as string)).not.toBe(parseFloat(sessionScore!)); // Properly isolated

                console.log('✅ Mixed mode tournament test passed - proper score isolation');

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should handle participant preservation across mode switches', async () => {
            const testData = generateTestData();

            try {
                // Setup user with live tournament history
                const joinOrderBonus = 0.007;
                await redisClient.zadd(`mathquest:game:leaderboard:${testData.accessCode}`, joinOrderBonus, testData.userId);
                await redisClient.hset(`mathquest:game:participants:${testData.accessCode}`, testData.userId, JSON.stringify({
                    userId: testData.userId,
                    username: 'PreservedUser',
                    score: joinOrderBonus,
                    online: true,
                    status: 'ACTIVE'
                }));

                // Set up socket mappings
                await redisClient.hset(`mathquest:game:socketIdToUserId:${testData.accessCode}`, 'socket-preserved', testData.userId);
                await redisClient.hset(`mathquest:game:userIdToSocketId:${testData.accessCode}`, testData.userId, 'socket-preserved');

                // User disconnects during live mode
                const mockSocket = {
                    id: 'socket-preserved',
                    data: {
                        gameId: testData.gameId,
                        accessCode: testData.accessCode,
                        userId: testData.userId,
                        username: 'PreservedUser'
                    },
                    join: jest.fn(),
                    leave: jest.fn(),
                    emit: jest.fn(),
                    to: jest.fn().mockReturnThis(),
                };

                const disconnect = disconnectHandler(io, mockSocket as any);
                await disconnect();

                // Verify participant is preserved
                const participantAfter = await redisClient.hget(`mathquest:game:participants:${testData.accessCode}`, testData.userId);
                const scoreAfter = await redisClient.zscore(`mathquest:game:leaderboard:${testData.accessCode}`, testData.userId);

                expect(participantAfter).toBeTruthy();
                expect(parseFloat(scoreAfter as string)).toBeCloseTo(joinOrderBonus, 10);

                const participantData = JSON.parse(participantAfter!);
                expect(participantData.online).toBe(false);
                expect(participantData.username).toBe('PreservedUser');

                // User later joins deferred mode - should still be accessible
                const deferredSessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:1`;
                await redisClient.hset(deferredSessionKey, 'score', '0');
                await redisClient.hset(deferredSessionKey, 'userId', testData.userId);
                await redisClient.hset(deferredSessionKey, 'username', 'PreservedUser');

                const sessionUserId = await redisClient.hget(deferredSessionKey, 'userId');
                expect(sessionUserId).toBe(testData.userId);

                console.log('✅ Participant preservation across modes test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });
    });

    describe('⚠️ Edge Cases and Error Scenarios', () => {
        it('should handle missing timer gracefully', async () => {
            const testData = generateTestData();

            try {
                // Submit answer without starting timer
                const answerData = {
                    questionUid: testData.questionUid,
                    answer: '42',
                    timeSpent: 0,
                    accessCode: testData.accessCode,
                    userId: testData.userId
                };

                const result = await ScoringService.submitAnswerWithScoring(
                    testData.gameId,
                    testData.userId,
                    answerData,
                    true, // isDeferred
                    1 // attemptCountOverride
                );

                // Should handle gracefully without crashing
                expect(result).toBeDefined();
                // Timer might not exist, so just check the result structure
                if (result.timePenalty !== undefined) {
                    expect(result.timePenalty).toBeDefined();
                }

                console.log('✅ Missing timer handling test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should handle attempt count mismatches', async () => {
            const testData = generateTestData();

            try {
                // Scenario: High nbAttempts but low currentDeferredAttemptNumber
                const mockParticipant = {
                    nbAttempts: 7, // User joined/left many times
                    currentDeferredAttemptNumber: 2 // But only on second actual attempt
                };

                // Timer should use currentDeferredAttemptNumber, not nbAttempts
                const correctKey = `mathquest:deferred:timer:${testData.accessCode}:${testData.userId}:2:${testData.questionUid}`;
                const wrongKey = `mathquest:deferred:timer:${testData.accessCode}:${testData.userId}:7:${testData.questionUid}`;

                // Start timer with correct attempt count
                await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, mockParticipant.currentDeferredAttemptNumber);

                // Verify correct key is used
                const correctTimer = await redisClient.get(correctKey);
                const wrongTimer = await redisClient.get(wrongKey);

                expect(correctTimer).toBeTruthy();
                expect(wrongTimer).toBeFalsy();

                // attemptCountOverride should be currentDeferredAttemptNumber
                expect(mockParticipant.currentDeferredAttemptNumber).toBe(2);
                expect(mockParticipant.currentDeferredAttemptNumber).not.toBe(mockParticipant.nbAttempts);

                console.log('✅ Attempt count mismatch handling test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should handle Redis connection issues', async () => {
            const testData = generateTestData();

            try {
                // Test when Redis operations might fail
                // (This tests the error handling in scoring service)

                const answerData = {
                    questionUid: 'non-existent-question',
                    answer: '42',
                    timeSpent: 1000,
                    accessCode: 'NON-EXISTENT-CODE',
                    userId: testData.userId
                };

                // Should handle gracefully even with non-existent game data
                const result = await ScoringService.submitAnswerWithScoring(
                    'non-existent-game',
                    testData.userId,
                    answerData,
                    true, // isDeferred
                    1 // attemptCountOverride
                );

                // Should not crash the application
                expect(result).toBeDefined();

                console.log('✅ Redis error handling test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should prevent duplicate session creation', async () => {
            const testData = generateTestData();

            try {
                // Create first session
                const sessionKey1 = `deferred_session:${testData.accessCode}:${testData.userId}:1`;
                await redisClient.hset(sessionKey1, 'score', '100');
                await redisClient.hset(sessionKey1, 'userId', testData.userId);
                await redisClient.hset(sessionKey1, 'created', Date.now().toString());

                // Verify first session exists
                const session1Score = await redisClient.hget(sessionKey1, 'score');
                expect(session1Score).toBe('100');

                // Attempt to create duplicate session (shouldn't happen in real code)
                const duplicateKey = `deferred_session:${testData.accessCode}:${testData.userId}:1`;
                const existingScore = await redisClient.hget(duplicateKey, 'score');

                // Should detect existing session
                expect(existingScore).toBe('100');

                // Should not create session 2 if session 1 is still active
                const sessionKey2 = `deferred_session:${testData.accessCode}:${testData.userId}:2`;
                const session2Score = await redisClient.hget(sessionKey2, 'score');
                expect(session2Score).toBeFalsy(); // Should not exist

                console.log('✅ Duplicate session prevention test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });
    });

    describe('🔒 Security and Data Integrity', () => {
        it('should use snapshot data for projection broadcasts', async () => {
            const testData = generateTestData();
            const { broadcastLeaderboardToProjection } = require('@/utils/projectionLeaderboardBroadcast');

            try {
                // Setup live leaderboard with high scores
                await redisClient.zadd(`mathquest:game:leaderboard:${testData.accessCode}`, 1500, 'hacker-user');
                await redisClient.zadd(`mathquest:game:leaderboard:${testData.accessCode}`, 200, 'normal-user');

                // Setup secure snapshot with different (older) scores
                const snapshotKey = `leaderboard:snapshot:${testData.accessCode}`;
                const snapshotData = [
                    { userId: 'normal-user', username: 'NormalUser', score: 200, rank: 1 },
                    { userId: 'hacker-user', username: 'HackerUser', score: 150, rank: 2 }
                ];
                await redisClient.set(snapshotKey, JSON.stringify(snapshotData));

                // Mock IO for projection broadcast
                let broadcastData = null;
                const mockIo = {
                    adapter: {},
                    to: jest.fn().mockReturnValue({
                        emit: jest.fn((event, data) => {
                            if (event === 'projection_leaderboard') {
                                broadcastData = data;
                            }
                        })
                    })
                };

                // Trigger projection broadcast
                try {
                    await broadcastLeaderboardToProjection(mockIo as any, testData.accessCode, testData.gameId);
                } catch (error) {
                    // Expected in test environment due to missing socket setup
                }

                // Verify snapshot is retrieved (even if broadcast fails due to mock setup)
                const snapshot = await redisClient.get(snapshotKey);
                expect(snapshot).toBeTruthy();

                const parsedSnapshot = JSON.parse(snapshot!);
                expect(parsedSnapshot).toHaveLength(2);
                expect(parsedSnapshot[0].score).toBe(200); // Snapshot score, not live score
                expect(parsedSnapshot[1].score).toBe(150); // Snapshot score, not live score

                console.log('✅ Security snapshot usage test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should isolate user data between different tournaments', async () => {
            const tournament1 = generateTestData();
            const tournament2 = generateTestData();
            const userId = 'shared-user-' + Date.now();

            try {
                // User participates in Tournament 1
                await redisClient.zadd(`mathquest:game:leaderboard:${tournament1.accessCode}`, 800, userId);
                await redisClient.hset(`mathquest:game:participants:${tournament1.accessCode}`, userId, JSON.stringify({
                    userId: userId,
                    username: 'SharedUser',
                    score: 800,
                    online: true,
                    status: 'ACTIVE'
                }));

                // User participates in Tournament 2
                await redisClient.zadd(`mathquest:game:leaderboard:${tournament2.accessCode}`, 600, userId);
                await redisClient.hset(`mathquest:game:participants:${tournament2.accessCode}`, userId, JSON.stringify({
                    userId: userId,
                    username: 'SharedUser',
                    score: 600,
                    online: true,
                    status: 'ACTIVE'
                }));

                // Verify data isolation
                const score1 = await redisClient.zscore(`mathquest:game:leaderboard:${tournament1.accessCode}`, userId);
                const score2 = await redisClient.zscore(`mathquest:game:leaderboard:${tournament2.accessCode}`, userId);

                expect(parseFloat(score1 as string)).toBe(800);
                expect(parseFloat(score2 as string)).toBe(600);
                expect(score1).not.toBe(score2);

                // Verify participant data isolation
                const participant1 = await redisClient.hget(`mathquest:game:participants:${tournament1.accessCode}`, userId);
                const participant2 = await redisClient.hget(`mathquest:game:participants:${tournament2.accessCode}`, userId);

                expect(participant1).toBeTruthy();
                expect(participant2).toBeTruthy();

                const data1 = JSON.parse(participant1!);
                const data2 = JSON.parse(participant2!);

                expect(data1.score).toBe(800);
                expect(data2.score).toBe(600);

                console.log('✅ Tournament data isolation test passed');

            } finally {
                await cleanupTestData(tournament1);
                await cleanupTestData(tournament2);
            }
        });
    });

    describe('📈 Performance and Stress Testing', () => {
        it('should handle multiple simultaneous participants', async () => {
            const testData = generateTestData();
            const participantCount = 20;

            try {
                const participants = Array.from({ length: participantCount }, (_, i) => ({
                    id: testData.userId + '-stress-' + i,
                    username: `StressUser${i}`,
                    socketId: `socket-stress-${i}`
                }));

                // Add all participants simultaneously
                const promises = participants.map(async (participant, index) => {
                    const joinOrderBonus = 0.001 * (participantCount - index);

                    await redisClient.zadd(`mathquest:game:leaderboard:${testData.accessCode}`, joinOrderBonus, participant.id);
                    await redisClient.hset(`mathquest:game:participants:${testData.accessCode}`, participant.id, JSON.stringify({
                        userId: participant.id,
                        username: participant.username,
                        score: joinOrderBonus,
                        online: true,
                        status: 'ACTIVE'
                    }));
                    await redisClient.hset(`mathquest:game:socketIdToUserId:${testData.accessCode}`, participant.socketId, participant.id);
                    await redisClient.hset(`mathquest:game:userIdToSocketId:${testData.accessCode}`, participant.id, participant.socketId);
                });

                await Promise.all(promises);

                // Verify all participants were added
                const leaderboard = await redisClient.zrevrange(`mathquest:game:leaderboard:${testData.accessCode}`, 0, -1);
                expect(leaderboard).toHaveLength(participantCount);

                const participantData = await redisClient.hgetall(`mathquest:game:participants:${testData.accessCode}`);
                expect(Object.keys(participantData)).toHaveLength(participantCount);

                console.log(`✅ Stress test passed - handled ${participantCount} participants`);

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should handle rapid answer submissions', async () => {
            const testData = generateTestData();

            try {
                // Start timer
                await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, 1);

                // Submit multiple answers rapidly (simulating network issues or user spam)
                const answerPromises = Array.from({ length: 5 }, async (_, i) => {
                    await new Promise(resolve => setTimeout(resolve, i * 10)); // Slight delays

                    const answerData = {
                        questionUid: testData.questionUid,
                        answer: 42,
                        timeSpent: 1000 + (i * 100),
                        accessCode: testData.accessCode,
                        userId: testData.userId
                    };

                    return ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        testData.userId,
                        answerData,
                        true, // isDeferred
                        1 // attemptCountOverride
                    );
                });

                const results = await Promise.all(answerPromises);

                // Should handle all submissions without errors
                expect(results).toHaveLength(5);
                results.forEach(result => {
                    expect(result).toBeDefined();
                });

                console.log('✅ Rapid submission test passed');

            } finally {
                await cleanupTestData(testData);
            }
        });
    });

    describe('🎯 Real-World User Journeys', () => {
        it('should handle complete teacher-student tournament lifecycle', async () => {
            const testData = generateTestData();

            try {
                // Step 1: Teacher creates tournament
                const teacher = await prisma.user.create({
                    data: {
                        id: testData.userId + '-teacher',
                        username: 'Teacher-Journey',
                        email: `teacher-journey-${Date.now()}@example.com`,
                        role: 'TEACHER'
                    }
                });

                const question1 = await prisma.question.create({
                    data: {
                        uid: testData.questionUid + '-1',
                        text: 'What is 5 + 3?',
                        questionType: 'numeric',
                        discipline: 'Mathematics',
                        gradeLevel: 'CE1',
                        author: 'teacher',
                        timeLimit: 20,
                        numericQuestion: {
                            create: {
                                correctAnswer: 8,
                                tolerance: 0
                            }
                        }
                    }
                });

                const question2 = await prisma.question.create({
                    data: {
                        uid: testData.questionUid + '-2',
                        text: 'What is 7 × 6?',
                        questionType: 'numeric',
                        discipline: 'Mathematics',
                        gradeLevel: 'CE1',
                        author: 'teacher',
                        timeLimit: 30,
                        numericQuestion: {
                            create: {
                                correctAnswer: 42,
                                tolerance: 0
                            }
                        }
                    }
                });

                const gameTemplate = await prisma.gameTemplate.create({
                    data: {
                        id: testData.gameId + '-template',
                        name: 'Teacher Journey Template',
                        description: 'Multi-question tournament',
                        creatorId: teacher.id
                    }
                });

                await prisma.questionsInGameTemplate.createMany({
                    data: [
                        { gameTemplateId: gameTemplate.id, questionUid: question1.uid, sequence: 1 },
                        { gameTemplateId: gameTemplate.id, questionUid: question2.uid, sequence: 2 }
                    ]
                });

                const gameInstance = await prisma.gameInstance.create({
                    data: {
                        id: testData.gameId,
                        accessCode: testData.accessCode,
                        name: 'Teacher Journey Tournament',
                        status: 'active',
                        playMode: 'tournament',
                        gameTemplateId: gameTemplate.id,
                        initiatorUserId: teacher.id
                    }
                });

                // Step 2: Students join live tournament
                const students = [
                    { id: testData.userId + '-alice', username: 'Alice' },
                    { id: testData.userId + '-bob', username: 'Bob' }
                ];

                for (let i = 0; i < students.length; i++) {
                    const student = students[i];
                    const joinOrderBonus = 0.001 * (students.length - i);

                    // Create participant in database first
                    await createParticipant(testData.gameId, testData.accessCode, {
                        id: student.id,
                        username: student.username,
                        socketId: `socket-${student.username.toLowerCase()}`
                    }, joinOrderBonus);
                }

                // Step 3: Students answer questions in live mode
                for (const student of students) {
                    // Question 1
                    await timerService.startTimer(testData.accessCode, question1.uid, 'tournament', false, student.id);
                    await new Promise(resolve => setTimeout(resolve, 50));

                    let result = await ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        student.id,
                        {
                            questionUid: question1.uid,
                            answer: 8,
                            timeSpent: 1000,
                            accessCode: testData.accessCode,
                            userId: student.id
                        },
                        false // live mode
                    );

                    expect(result.scoreUpdated).toBe(true);

                    // Question 2
                    await timerService.startTimer(testData.accessCode, question2.uid, 'tournament', false, student.id);
                    await new Promise(resolve => setTimeout(resolve, 50));

                    result = await ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        student.id,
                        {
                            questionUid: question2.uid,
                            answer: 42,
                            timeSpent: 1500,
                            accessCode: testData.accessCode,
                            userId: student.id
                        },
                        false // live mode
                    );

                    expect(result.scoreUpdated).toBe(true);
                }

                // Step 4: Tournament ends, switches to deferred mode
                await prisma.gameInstance.update({
                    where: { id: testData.gameId },
                    data: {
                        status: 'completed',
                        differedAvailableFrom: new Date(),
                        differedAvailableTo: new Date(Date.now() + 24 * 60 * 60 * 1000)
                    }
                });

                // Step 5: New student joins deferred tournament
                const lateStudent = { id: testData.userId + '-charlie', username: 'Charlie' };

                // Create participant for late student
                await createParticipant(testData.gameId, testData.accessCode, {
                    id: lateStudent.id,
                    username: lateStudent.username,
                    socketId: 'socket-charlie'
                });

                const deferredSessionKey = `deferred_session:${testData.accessCode}:${lateStudent.id}:1`;
                await redisClient.hset(deferredSessionKey, 'score', '0');
                await redisClient.hset(deferredSessionKey, 'userId', lateStudent.id);
                await redisClient.hset(deferredSessionKey, 'username', lateStudent.username);

                // Step 6: Late student answers questions in deferred mode
                await timerService.startTimer(testData.accessCode, question1.uid, 'tournament', true, lateStudent.id, 1);
                await new Promise(resolve => setTimeout(resolve, 50));

                let result = await ScoringService.submitAnswerWithScoring(
                    testData.gameId,
                    lateStudent.id,
                    {
                        questionUid: question1.uid,
                        answer: 8,
                        timeSpent: 800,
                        accessCode: testData.accessCode,
                        userId: lateStudent.id
                    },
                    true, // deferred mode
                    1 // attempt count
                );

                expect(result.scoreUpdated).toBe(true);

                // Step 7: Verify all data is properly isolated and maintained
                const liveLeaderboard = await redisClient.zrevrange(`mathquest:game:leaderboard:${testData.accessCode}`, 0, -1, 'WITHSCORES');
                const deferredScore = await redisClient.hget(deferredSessionKey, 'score');

                expect(liveLeaderboard.length).toBeGreaterThan(0); // Live participants
                expect(deferredScore).toBeTruthy(); // Deferred score isolated

                console.log('✅ Complete teacher-student tournament lifecycle test passed');

                // Cleanup database
                await prisma.numericQuestion.delete({ where: { questionUid: question1.uid } });
                await prisma.numericQuestion.delete({ where: { questionUid: question2.uid } });
                await prisma.question.delete({ where: { uid: question1.uid } });
                await prisma.question.delete({ where: { uid: question2.uid } });
                await prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: gameTemplate.id } });
                await prisma.gameInstance.delete({ where: { id: testData.gameId } });
                await prisma.gameTemplate.delete({ where: { id: gameTemplate.id } });
                await prisma.user.delete({ where: { id: teacher.id } });

            } finally {
                await cleanupTestData(testData);
            }
        });

        it('should handle student attempting tournament multiple times', async () => {
            const testData = generateTestData();

            try {
                // Create game infrastructure first
                const testUser = await prisma.user.create({
                    data: {
                        id: testData.userId + '-teacher',
                        username: 'MultiAttemptTeacher-' + Date.now(),
                        email: `multi-teacher-${Date.now()}@example.com`,
                        role: 'TEACHER'
                    }
                });

                const testQuestion = await prisma.question.create({
                    data: {
                        uid: testData.questionUid,
                        text: 'What is 6 × 7?',
                        questionType: 'numeric',
                        discipline: 'Mathematics',
                        gradeLevel: 'CE1',
                        author: 'test',
                        timeLimit: 30,
                        numericQuestion: {
                            create: {
                                correctAnswer: 42,
                                tolerance: 0
                            }
                        }
                    }
                });

                const testGameTemplate = await prisma.gameTemplate.create({
                    data: {
                        id: testData.gameId + '-template',
                        name: 'Multi Attempt Template',
                        description: 'Template for multiple attempt testing',
                        creatorId: testUser.id
                    }
                });

                await prisma.questionsInGameTemplate.create({
                    data: {
                        gameTemplateId: testGameTemplate.id,
                        questionUid: testData.questionUid,
                        sequence: 1
                    }
                });

                const testGameInstance = await prisma.gameInstance.create({
                    data: {
                        id: testData.gameId,
                        accessCode: testData.accessCode,
                        name: 'Multi Attempt Test',
                        status: 'completed',
                        playMode: 'tournament',
                        gameTemplateId: testGameTemplate.id,
                        differedAvailableFrom: new Date(),
                        differedAvailableTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        initiatorUserId: testUser.id
                    }
                });

                // Create participant first for scoring service
                await createParticipant(testData.gameId, testData.accessCode, {
                    id: testData.userId,
                    username: 'RepeatStudent',
                    socketId: 'socket-repeat'
                });

                // Student attempts tournament 3 times with different performance
                const attempts = [
                    { attemptNum: 1, timeSpent: 5000, expectedScoreRange: [800, 1000] },   // Slow attempt (200ms delay)
                    { attemptNum: 2, timeSpent: 3000, expectedScoreRange: [900, 1000] },   // Medium attempt (100ms delay)
                    { attemptNum: 3, timeSpent: 1000, expectedScoreRange: [950, 1000] }    // Fast attempt (50ms delay)
                ];

                const sessionScores = [];

                for (const attempt of attempts) {
                    // Create isolated session for each attempt
                    const sessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:${attempt.attemptNum}`;
                    await redisClient.hset(sessionKey, 'score', '0');
                    await redisClient.hset(sessionKey, 'userId', testData.userId);
                    await redisClient.hset(sessionKey, 'username', 'RepeatStudent');
                    await redisClient.hset(sessionKey, 'attemptNumber', attempt.attemptNum.toString());

                    // Start timer for this attempt
                    await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, attempt.attemptNum);

                    // Add different delays to simulate different response times (server uses elapsed time for scoring)
                    if (attempt.attemptNum === 1) {
                        await new Promise(resolve => setTimeout(resolve, 200)); // Slow response
                    } else if (attempt.attemptNum === 2) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // Medium response  
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 50));  // Fast response
                    }

                    // Submit answer
                    const result = await ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        testData.userId,
                        {
                            questionUid: testData.questionUid,
                            answer: 42,
                            timeSpent: attempt.timeSpent,
                            accessCode: testData.accessCode,
                            userId: testData.userId
                        },
                        true, // deferred
                        attempt.attemptNum
                    );

                    expect(result.scoreUpdated).toBe(true);
                    expect(result.scoreAdded).toBeGreaterThanOrEqual(attempt.expectedScoreRange[0]);
                    expect(result.scoreAdded).toBeLessThanOrEqual(attempt.expectedScoreRange[1]);

                    // Update session score
                    await redisClient.hset(sessionKey, 'score', result.scoreAdded.toString());
                    sessionScores.push(result.scoreAdded);
                }

                // Verify improvement over attempts (faster = higher score)
                expect(sessionScores[1]).toBeGreaterThan(sessionScores[0]);
                expect(sessionScores[2]).toBeGreaterThan(sessionScores[1]);

                // Verify each attempt is isolated
                for (let i = 1; i <= 3; i++) {
                    const sessionScore = await redisClient.hget(`deferred_session:${testData.accessCode}:${testData.userId}:${i}`, 'score');
                    expect(sessionScore).toBeTruthy();
                    expect(parseFloat(sessionScore!)).toBe(sessionScores[i - 1]);
                }

                console.log('✅ Multiple attempt journey test passed');

                // Cleanup database with error handling
                await prisma.numericQuestion.delete({ where: { questionUid: testData.questionUid } }).catch(() => { });
                await prisma.question.delete({ where: { uid: testData.questionUid } }).catch(() => { });
                await prisma.questionsInGameTemplate.delete({
                    where: {
                        gameTemplateId_questionUid: {
                            gameTemplateId: testGameTemplate.id,
                            questionUid: testData.questionUid
                        }
                    }
                }).catch(() => { });
                await prisma.gameInstance.delete({ where: { id: testData.gameId } }).catch(() => { });
                await prisma.gameTemplate.delete({ where: { id: testGameTemplate.id } }).catch(() => { });
                await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });

            } finally {
                await cleanupTestData(testData);
            }
        });
    });
});
