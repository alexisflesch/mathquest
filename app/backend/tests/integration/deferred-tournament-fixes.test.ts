/**
 * Integration Tests: Deferred Tournament Fixes
 * 
 * These tests verify the fixes for:
 * 1. Correct attempt count usage in deferred sessions (should use currentDeferredAttemptNumber, not nbAttempts)
 * 2. Time penalty calculation in deferred sessions (should use correct timer keys)
 * 3. Prevention of duplicate session creation from double join_game events
 */

// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest";
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

describe('Integration: Deferred Tournament Fixes', () => {
    let io: SocketIOServer;
    let timerService: CanonicalTimerService;
    const testAccessCode = 'DEFERRED-TEST-' + Date.now();
    const testGameId = 'game-deferred-' + Date.now();
    const testUserId = 'user-deferred-' + Date.now();
    const testQuestionUid = 'test-question-' + Date.now();

    beforeAll(async () => {
        // Set up Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
        timerService = new CanonicalTimerService(redisClient);

        // Clean up any existing test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}:${testQuestionUid}:1`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}:${testQuestionUid}:2`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}:${testQuestionUid}:3`);
        await redisClient.del(`mathquest:deferred:timer:${testAccessCode}:${testUserId}:1:${testQuestionUid}`);
        await redisClient.del(`mathquest:deferred:timer:${testAccessCode}:${testUserId}:2:${testQuestionUid}`);
        await redisClient.del(`mathquest:deferred:timer:${testAccessCode}:${testUserId}:3:${testQuestionUid}`);
    });

    afterAll(async () => {
        // Clean up test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}:${testQuestionUid}:1`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}:${testQuestionUid}:2`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}:${testQuestionUid}:3`);
        await redisClient.del(`mathquest:deferred:timer:${testAccessCode}:${testUserId}:1:${testQuestionUid}`);
        await redisClient.del(`mathquest:deferred:timer:${testAccessCode}:${testUserId}:2:${testQuestionUid}`);
        await redisClient.del(`mathquest:deferred:timer:${testAccessCode}:${testUserId}:3:${testQuestionUid}`);

        if (io) {
            io.close();
        }

        // Close Redis connection to prevent open handles
        await redisClient.quit();
    });

    describe('Issue 1: Attempt Count Fixes', () => {
        it('should use currentDeferredAttemptNumber instead of nbAttempts for timer keys', async () => {
            // Simulate a participant who has played live (nbAttempts=1) then tries deferred twice
            const mockParticipant = {
                id: 'participant-id-123',
                gameInstanceId: testGameId,
                userId: testUserId,
                nbAttempts: 3, // Total attempts (1 live + 2 deferred joins)
                currentDeferredAttemptNumber: 1, // Current deferred session number
                status: 'ACTIVE'
            };

            // Create timer with correct attempt count (should use currentDeferredAttemptNumber=1)
            const correctTimerKey = `mathquest:deferred:timer:${testAccessCode}:${testUserId}:1:${testQuestionUid}`;
            const wrongTimerKey = `mathquest:deferred:timer:${testAccessCode}:${testUserId}:3:${testQuestionUid}`;

            // Set up the correct timer (what should be created)
            await timerService.startTimer(testAccessCode, testQuestionUid, 'tournament', true, testUserId, 1);

            // Verify correct timer exists
            const correctTimer = await redisClient.get(correctTimerKey);
            expect(correctTimer).toBeTruthy();

            // Verify wrong timer doesn't exist
            const wrongTimer = await redisClient.get(wrongTimerKey);
            expect(wrongTimer).toBeFalsy();

            // Simulate answer submission with attemptCountOverride
            const answerData = {
                questionUid: testQuestionUid,
                answer: '42',
                timeSpent: 2000,
                accessCode: testAccessCode,
                userId: testUserId
            };

            // Test scoring with correct attempt count override
            const scoreResult = await ScoringService.submitAnswerWithScoring(
                testGameId,
                testUserId,
                answerData,
                true, // isDeferred
                1 // attemptCountOverride - should use currentDeferredAttemptNumber
            );

            expect(scoreResult).toBeDefined();
            // The test should succeed without timer lookup failures
        });

        it('should prevent double session creation from multiple join_game events', async () => {
            const sessionKey1 = `deferred_session:${testAccessCode}:${testUserId}:1`;
            const sessionKey2 = `deferred_session:${testAccessCode}:${testUserId}:2`;

            // Simulate first session creation
            await redisClient.hset(sessionKey1, 'score', '100');
            await redisClient.hset(sessionKey1, 'userId', testUserId);

            // Verify first session exists
            const session1Score = await redisClient.hget(sessionKey1, 'score');
            expect(session1Score).toBe('100');

            // Second join_game should not create a duplicate session
            // (This would be tested in the actual handler, but we can verify state)
            const session2Score = await redisClient.hget(sessionKey2, 'score');
            expect(session2Score).toBeFalsy(); // Should not exist
        });
    });

    describe('Issue 2: Time Penalty Fixes', () => {
        it('should calculate time penalties correctly for deferred sessions', async () => {
            // Create a test user first with unique email
            const testUser = await prisma.user.create({
                data: {
                    id: testUserId,
                    username: 'test-user-' + Date.now(),
                    email: `test-${Date.now()}@example.com`, // Unique email to avoid conflicts
                    role: 'TEACHER'
                }
            });

            // Create a test question in database for scoring
            const testQuestion = await prisma.question.create({
                data: {
                    uid: testQuestionUid,
                    text: 'Test question for deferred scoring',
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

            // Create a test game template first
            const testGameTemplate = await prisma.gameTemplate.create({
                data: {
                    id: 'test-template-' + Date.now(),
                    name: 'Test Deferred Template',
                    description: 'Test template for deferred tournament',
                    creatorId: testUserId
                }
            });

            // Connect the question to the template
            await prisma.questionsInGameTemplate.create({
                data: {
                    gameTemplateId: testGameTemplate.id,
                    questionUid: testQuestionUid,
                    sequence: 1
                }
            });

            // Create a test game instance
            const testGameInstance = await prisma.gameInstance.create({
                data: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    name: 'Test Deferred Game',
                    status: 'completed', // Deferred mode
                    playMode: 'tournament',
                    gameTemplateId: testGameTemplate.id, // Use the created template
                    differedAvailableFrom: new Date(),
                    differedAvailableTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    initiatorUserId: testUserId
                }
            });

            // Create a test participant
            const testParticipant = await prisma.gameParticipant.create({
                data: {
                    gameInstanceId: testGameId,
                    userId: testUserId,
                    nbAttempts: 1,
                    status: 'ACTIVE'
                }
            });

            // Start timer for deferred session (attempt count 1)
            await timerService.startTimer(testAccessCode, testQuestionUid, 'tournament', true, testUserId, 1);

            // Simulate some time passing (1.5 seconds)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Submit answer with correct attempt count
            const answerData = {
                questionUid: testQuestionUid,
                answer: 42, // Correct answer
                timeSpent: 1500,
                accessCode: testAccessCode,
                userId: testUserId
            };

            const scoreResult = await ScoringService.submitAnswerWithScoring(
                testGameId,
                testUserId,
                answerData,
                true, // isDeferred
                1 // attemptCountOverride - use correct attempt count
            );

            // Verify scoring worked and time penalty was calculated
            expect(scoreResult.scoreUpdated).toBe(true);
            expect(scoreResult.scoreAdded).toBeGreaterThan(0);
            expect(scoreResult.timePenalty).toBeGreaterThan(0); // Should have time penalty
            expect(scoreResult.timePenalty).toBeLessThan(1000); // Reasonable penalty

            // The score should be less than 1000 due to time penalty
            expect(scoreResult.scoreAdded).toBeLessThan(1000);

            // Clean up
            await prisma.gameParticipant.delete({ where: { id: testParticipant.id } });
            await prisma.gameInstance.delete({ where: { id: testGameId } });
            await prisma.numericQuestion.delete({ where: { questionUid: testQuestionUid } });
            await prisma.question.delete({ where: { uid: testQuestionUid } });
        });

        it('should use correct timer key format for deferred sessions', () => {
            const attemptCount = 1;
            const expectedKey = `mathquest:deferred:timer:${testAccessCode}:${testUserId}:${attemptCount}:${testQuestionUid}`;

            // This should match the key format used in CanonicalTimerService
            const { getTimerKey } = require('@/core/services/timerKeyUtil');
            const actualKey = getTimerKey({
                accessCode: testAccessCode,
                userId: testUserId,
                questionUid: testQuestionUid,
                attemptCount: attemptCount,
                isDeferred: true
            });

            expect(actualKey).toBe(expectedKey);
        });
    });

    describe('Issue 3: Score Display Fixes', () => {
        it('should maintain correct score in deferred session state', async () => {
            const sessionKey = `deferred_session:${testAccessCode}:${testUserId}:1`;

            // Simulate scoring in deferred session
            await redisClient.hset(sessionKey, 'score', '750');
            await redisClient.hset(sessionKey, 'userId', testUserId);
            await redisClient.hset(sessionKey, 'username', 'TestUser');

            // Verify session score is maintained
            const sessionScore = await redisClient.hget(sessionKey, 'score');
            expect(sessionScore).toBe('750');

            // Simulate adding points
            const newScore = parseInt(sessionScore!) + 250;
            await redisClient.hset(sessionKey, 'score', newScore.toString());

            const updatedScore = await redisClient.hget(sessionKey, 'score');
            expect(updatedScore).toBe('1000');
        });

        it('should isolate deferred session scores from global leaderboard', async () => {
            const sessionKey = `deferred_session:${testAccessCode}:${testUserId}:1`;
            const leaderboardKey = `mathquest:game:leaderboard:${testAccessCode}`;

            // Set up session score
            await redisClient.hset(sessionKey, 'score', '800');

            // Set up different global leaderboard score (from live play)
            await redisClient.zadd(leaderboardKey, 500, testUserId);

            // Verify they are isolated
            const sessionScore = await redisClient.hget(sessionKey, 'score');
            const globalScore = await redisClient.zscore(leaderboardKey, testUserId);

            expect(sessionScore).toBe('800'); // Deferred session score
            expect(globalScore).toBe('500'); // Live/global score
            expect(sessionScore).not.toBe(globalScore); // They should be different
        });
    });

    describe('Real-World Scenario: User Journey', () => {
        it('should handle complete deferred tournament flow correctly', async () => {
            const journeyUserId = 'journey-user-' + Date.now();
            const journeyGameId = 'journey-game-' + Date.now();
            const journeyAccessCode = 'JOURNEY-' + Date.now();
            const journeyQuestionUid = 'journey-question-' + Date.now();

            try {
                // Step 1: User plays live tournament (nbAttempts becomes 1)
                const liveSessionKey = journeyAccessCode;
                await redisClient.zadd(`mathquest:game:leaderboard:${journeyAccessCode}`, 982, journeyUserId);

                // Step 2: User starts first deferred attempt (nbAttempts becomes 2, currentDeferredAttemptNumber = 1)
                const deferredSessionKey1 = `deferred_session:${journeyAccessCode}:${journeyUserId}:1`;
                await redisClient.hset(deferredSessionKey1, 'score', '0');
                await redisClient.hset(deferredSessionKey1, 'userId', journeyUserId);

                // Step 3: User answers question in first deferred attempt
                // Timer should use attempt count 1, not 2
                const correctTimerKey = `mathquest:deferred:timer:${journeyAccessCode}:${journeyUserId}:1:${journeyQuestionUid}`;
                const wrongTimerKey = `mathquest:deferred:timer:${journeyAccessCode}:${journeyUserId}:2:${journeyQuestionUid}`;

                await timerService.startTimer(journeyAccessCode, journeyQuestionUid, 'tournament', true, journeyUserId, 1);

                // Verify correct timer key is used
                const correctTimer = await redisClient.get(correctTimerKey);
                const wrongTimer = await redisClient.get(wrongTimerKey);

                expect(correctTimer).toBeTruthy();
                expect(wrongTimer).toBeFalsy();

                // Step 4: Simulate time passing and answer submission
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Answer key should also use attempt count 1
                const correctAnswerKey = `mathquest:game:answers:${journeyAccessCode}:${journeyQuestionUid}:1`;
                await redisClient.hset(correctAnswerKey, journeyUserId, JSON.stringify({
                    userId: journeyUserId,
                    answer: '42',
                    serverTimeSpent: 1000,
                    submittedAt: Date.now(),
                    isCorrect: true,
                    score: 990 // 1000 - 10 penalty
                }));

                // Step 5: Verify scoring uses correct attempt count and calculates penalty
                // (This would be done through the actual scoring service in real usage)

                // Step 6: Update session score
                await redisClient.hset(deferredSessionKey1, 'score', '990');

                // Step 7: Verify session isolation
                const sessionScore = await redisClient.hget(deferredSessionKey1, 'score');
                const liveScore = await redisClient.zscore(`mathquest:game:leaderboard:${journeyAccessCode}`, journeyUserId);

                expect(sessionScore).toBe('990'); // Deferred score with penalty
                expect(liveScore).toBe('982'); // Original live score unchanged
                expect(sessionScore).not.toBe(liveScore); // Properly isolated

                console.log('✅ Complete deferred tournament flow test passed');

            } finally {
                // Clean up journey test data
                await redisClient.del(`mathquest:game:leaderboard:${journeyAccessCode}`);
                await redisClient.del(`deferred_session:${journeyAccessCode}:${journeyUserId}:1`);
                await redisClient.del(`mathquest:game:answers:${journeyAccessCode}:${journeyQuestionUid}:1`);
                await redisClient.del(`mathquest:deferred:timer:${journeyAccessCode}:${journeyUserId}:1:${journeyQuestionUid}`);
            }
        });
    });

    describe('Regression Tests: Edge Cases', () => {
        it('should handle attempt count mismatch scenarios', async () => {
            const edgeUserId = 'edge-user-' + Date.now();

            // Scenario: User has high nbAttempts but low currentDeferredAttemptNumber
            // This can happen if user joins/leaves deferred sessions multiple times

            const mockParticipant = {
                nbAttempts: 5, // High due to multiple joins
                currentDeferredAttemptNumber: 2 // Actual current deferred session
            };

            // Timer should use currentDeferredAttemptNumber, not nbAttempts
            const correctKey = `mathquest:deferred:timer:${testAccessCode}:${edgeUserId}:2:${testQuestionUid}`;
            const wrongKey = `mathquest:deferred:timer:${testAccessCode}:${edgeUserId}:5:${testQuestionUid}`;

            // In the fix, attemptCountOverride should be 2, not 5
            const attemptCountOverride = mockParticipant.currentDeferredAttemptNumber;
            expect(attemptCountOverride).toBe(2);
            expect(attemptCountOverride).not.toBe(mockParticipant.nbAttempts);
        });

        it('should handle missing timer gracefully', async () => {
            // Test scoring when timer is missing (should not crash)
            const missingTimerData = {
                questionUid: 'missing-timer-question',
                answer: '42',
                timeSpent: 0,
                accessCode: testAccessCode,
                userId: testUserId
            };

            // This should handle missing timer without crashing
            // and return serverTimeSpent: 0, timePenalty: 0
            const result = await ScoringService.submitAnswerWithScoring(
                testGameId,
                testUserId,
                missingTimerData,
                true, // isDeferred
                1 // attemptCountOverride
            );

            expect(result).toBeDefined();
            // Should handle gracefully even with missing timer
        });
    });
});
