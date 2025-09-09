// Set Redis URL before importing modules that depend on it
process.env.REDIS_URL = "redis://localhost:6379";


import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';

// Integration tests for new scoring strategy across all game modes
describe('New Scoring Strategy - All Game Modes', () => {
    let timerService: CanonicalTimerService;
    let testData: any;

    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
        await redisClient.flushall();
    });

    afterAll(async () => {
        await redisClient.flushall();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        const timestamp = Date.now();
        const uniqueId = `all-modes-${timestamp}`;
        testData = {
            accessCode: `TEST-${uniqueId}`,
            gameId: `game-${uniqueId}`,
            questionUid: `question-${uniqueId}`,
            userId: `user-${uniqueId}`,
            username: 'TestUser'
        };

        // Clean up existing data
        await redisClient.flushall();
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testData.gameId } });
        await prisma.gameTemplate.deleteMany({ where: { creatorId: testData.userId } });
        await prisma.user.deleteMany({ where: { id: testData.userId } });
        await prisma.multipleChoiceQuestion.deleteMany({ where: { questionUid: testData.questionUid } });
        await prisma.question.deleteMany({ where: { uid: testData.questionUid } });

        // Create user
        await prisma.user.create({
            data: {
                id: testData.userId,
                username: testData.username,
                email: `${testData.userId}@test.com`,
                role: 'STUDENT'
            }
        });

        // Create test question
        await prisma.question.create({
            data: {
                uid: testData.questionUid,
                title: 'Test Multiple Choice',
                text: 'Select A and C (correct answers)',
                questionType: 'multiple_choice',
                timeLimit: 30, // 30 seconds
                discipline: 'Math',
                themes: ['Test'],
                difficulty: 1,
                multipleChoiceQuestion: {
                    create: {
                        answerOptions: ['A (Correct)', 'B (Wrong)', 'C (Correct)'],
                        correctAnswers: [true, false, true]
                    }
                }
            }
        });

        // Create game template
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'All Modes Test Template',
                description: 'Test all game modes',
                creator: { connect: { id: testData.userId } }
            }
        });

        // Set up Redis game data
        await redisClient.set(`mathquest:game:${testData.accessCode}`, JSON.stringify({
            questionUids: [testData.questionUid, 'dummy-question-2'] // 2 questions = 500 points each
        }));

        // Set up Redis timer data
        await redisClient.set(`mathquest:timer:${testData.accessCode}:${testData.questionUid}`, JSON.stringify({
            questionUid: testData.questionUid,
            status: 'play',
            startedAt: Date.now(),
            totalPlayTimeMs: 0,
            lastStateChange: Date.now(),
            durationMs: 30000
        }));

        testData.gameTemplateId = gameTemplate.id;
    });

    describe('Quiz Mode', () => {
        beforeEach(async () => {
            // Create quiz game instance
            await prisma.gameInstance.create({
                data: {
                    id: testData.gameId,
                    accessCode: testData.accessCode,
                    name: 'Quiz Mode Test',
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: testData.gameTemplateId
                }
            });

            // Create participant
            await prisma.gameParticipant.create({
                data: {
                    id: testData.userId,
                    gameInstanceId: testData.gameId,
                    userId: testData.userId,
                    status: 'ACTIVE',
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 0,
                    joinedAt: new Date(),
                    lastActiveAt: new Date()
                }
            });
        });

        it('should score correctly in quiz mode', async () => {
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'quiz', false, testData.userId);

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                testData.userId,
                {
                    questionUid: testData.questionUid,
                    answer: [0, 2], // Select A and C (both correct)
                    timeSpent: 2000,
                    accessCode: testData.accessCode,
                    userId: testData.userId
                }
            );

            expect(result.scoreUpdated).toBe(true);
            expect(result.scoreAdded).toBeGreaterThan(450); // ~500 points minus time penalty
            expect(result.scoreAdded).toBeLessThanOrEqual(500);
            expect(result.message).toBe('Score updated');

            // Check Redis participant data
            const participantKey = `mathquest:game:participants:${testData.accessCode}`;
            const participantData = await redisClient.hget(participantKey, testData.userId);
            expect(participantData).toBeTruthy();

            const parsed = JSON.parse(participantData!);
            expect(parsed.score).toBe(result.totalScore);
        });
    });

    describe('Live Tournament Mode', () => {
        beforeEach(async () => {
            // Create live tournament game instance
            await prisma.gameInstance.create({
                data: {
                    id: testData.gameId,
                    accessCode: testData.accessCode,
                    name: 'Live Tournament Test',
                    status: 'active', // Live tournament = active status
                    playMode: 'tournament',
                    gameTemplateId: testData.gameTemplateId
                }
            });

            // Create participant
            await prisma.gameParticipant.create({
                data: {
                    id: testData.userId,
                    gameInstanceId: testData.gameId,
                    userId: testData.userId,
                    status: 'ACTIVE',
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 0,
                    joinedAt: new Date(),
                    lastActiveAt: new Date()
                }
            });
        });

        it('should score correctly in live tournament mode', async () => {
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, testData.userId);

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                testData.userId,
                {
                    questionUid: testData.questionUid,
                    answer: [0, 2], // Select A and C (both correct)
                    timeSpent: 2000,
                    accessCode: testData.accessCode,
                    userId: testData.userId
                }
            );

            expect(result.scoreUpdated).toBe(true);
            expect(result.scoreAdded).toBeGreaterThan(450);
            expect(result.scoreAdded).toBeLessThanOrEqual(500);

            // Check Redis leaderboard (live tournaments update ZSET)
            const leaderboardKey = `mathquest:game:leaderboard:${testData.accessCode}`;
            const score = await redisClient.zscore(leaderboardKey, testData.userId);
            expect(score).toBeTruthy();
            // Redis stores numbers as strings; allow small floating point rounding differences
            expect(parseFloat(score!)).toBeCloseTo(result.totalScore, 2);

            // Check that NO deferred session state was created
            const sessionStateKey = `deferred_session:${testData.accessCode}:${testData.userId}:0`;
            const sessionState = await redisClient.hget(sessionStateKey, 'score');
            expect(sessionState).toBeNull();
        });
    });

    describe('Deferred Tournament Mode', () => {
        beforeEach(async () => {
            // Create deferred tournament game instance
            await prisma.gameInstance.create({
                data: {
                    id: testData.gameId,
                    accessCode: testData.accessCode,
                    name: 'Deferred Tournament Test',
                    status: 'completed', // Deferred tournament = completed status
                    playMode: 'tournament',
                    gameTemplateId: testData.gameTemplateId,
                    differedAvailableFrom: new Date(Date.now() - 3600000), // 1 hour ago
                    differedAvailableTo: new Date(Date.now() + 3600000)    // 1 hour from now
                }
            });

            // Create participant with attempt count
            await prisma.gameParticipant.create({
                data: {
                    id: testData.userId,
                    gameInstanceId: testData.gameId,
                    userId: testData.userId,
                    status: 'ACTIVE',
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 1, // Important: deferred mode uses attempt-based keys
                    joinedAt: new Date(),
                    lastActiveAt: new Date()
                }
            });
        });

        it('should score correctly in deferred tournament mode', async () => {
            const attemptCount = 1;

            // Start timer for deferred mode
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, attemptCount);

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                testData.userId,
                {
                    questionUid: testData.questionUid,
                    answer: [0, 2], // Select A and C (both correct)
                    timeSpent: 2000,
                    accessCode: testData.accessCode,
                    userId: testData.userId
                }
            );

            expect(result.scoreUpdated).toBe(true);
            expect(result.scoreAdded).toBeGreaterThan(450);
            expect(result.scoreAdded).toBeLessThanOrEqual(500);

            // Check that deferred session state was created (NOT global leaderboard)
            const sessionStateKey = `deferred_session:${testData.accessCode}:${testData.userId}:${attemptCount}`;
            const sessionScore = await redisClient.hget(sessionStateKey, 'score');
            expect(sessionScore).toBe(result.totalScore.toString());

            // Check that NO live leaderboard was updated
            const leaderboardKey = `mathquest:game:leaderboard:${testData.accessCode}`;
            const leaderboardScore = await redisClient.zscore(leaderboardKey, testData.userId);
            expect(leaderboardScore).toBeNull();

            // Check that answer was stored with attempt-namespaced key
            const answerKey = `mathquest:game:answers:${testData.accessCode}:${testData.questionUid}:${attemptCount}`;
            const answerData = await redisClient.hget(answerKey, testData.userId);
            expect(answerData).toBeTruthy();

            const parsedAnswer = JSON.parse(answerData!);
            expect(parsedAnswer.answer).toEqual([0, 2]);
            expect(parsedAnswer.score).toBe(result.scoreAdded);
        });

        it('should handle multiple attempts in deferred mode', async () => {
            // First attempt
            const firstAttempt = 1;
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, firstAttempt);

            const firstResult = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                testData.userId,
                {
                    questionUid: testData.questionUid,
                    answer: [0], // Partial answer
                    timeSpent: 3000,
                    accessCode: testData.accessCode,
                    userId: testData.userId
                },
                undefined,
                firstAttempt
            );

            // Update participant for second attempt
            await prisma.gameParticipant.update({
                where: { id: testData.userId },
                data: { nbAttempts: 2 }
            });

            // Second attempt with better answer
            const secondAttempt = 2;
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, secondAttempt);

            const secondResult = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                testData.userId,
                {
                    questionUid: testData.questionUid,
                    answer: [0, 2], // Full correct answer
                    timeSpent: 2000,
                    accessCode: testData.accessCode,
                    userId: testData.userId
                },
                undefined,
                secondAttempt
            );

            // Check that both attempts have separate session states
            const firstSessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:${firstAttempt}`;
            const secondSessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:${secondAttempt}`;

            const firstSessionScore = await redisClient.hget(firstSessionKey, 'score');
            const secondSessionScore = await redisClient.hget(secondSessionKey, 'score');

            expect(firstSessionScore).toBe(firstResult.totalScore.toString());
            expect(secondSessionScore).toBe(secondResult.totalScore.toString());
            expect(secondResult.scoreAdded).toBeGreaterThan(firstResult.scoreAdded); // Better answer = higher score
        });
    });

    describe('Cross-Mode Consistency', () => {
        it('should use same scoring formula across all modes', async () => {
            const scenarios = [
                { mode: 'quiz', status: 'active' },
                { mode: 'tournament', status: 'active' }, // Live tournament
                { mode: 'tournament', status: 'completed' } // Deferred tournament
            ];

            const results: Array<{ mode: string; status: string; scoreAdded: number; totalScore: number }> = [];

            for (const scenario of scenarios) {
                const uniqueId = `consistency-${scenario.mode}-${scenario.status}-${Date.now()}`;
                const gameId = `game-${uniqueId}`;
                const userId = `user-${uniqueId}`;
                const accessCode = `TEST-${uniqueId}`;

                // Create test setup for this scenario
                await prisma.user.create({
                    data: {
                        id: userId,
                        username: `TestUser-${uniqueId}`,
                        email: `${userId}@test.com`,
                        role: 'STUDENT'
                    }
                });

                await prisma.gameInstance.create({
                    data: {
                        id: gameId,
                        accessCode: accessCode,
                        name: `${scenario.mode} ${scenario.status} Test`,
                        status: scenario.status,
                        playMode: scenario.mode as any,
                        gameTemplateId: testData.gameTemplateId
                    }
                });

                await prisma.gameParticipant.create({
                    data: {
                        id: userId,
                        gameInstanceId: gameId,
                        userId: userId,
                        status: 'ACTIVE',
                        liveScore: 0,
                        deferredScore: 0,
                        nbAttempts: scenario.status === 'completed' ? 1 : 0,
                        joinedAt: new Date(),
                        lastActiveAt: new Date()
                    }
                });

                // Set up Redis data
                await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
                    questionUids: [testData.questionUid, 'dummy-question-2']
                }));

                await redisClient.set(`mathquest:timer:${accessCode}:${testData.questionUid}`, JSON.stringify({
                    questionUid: testData.questionUid,
                    status: 'play',
                    startedAt: Date.now(),
                    durationMs: 30000
                }));

                // Start timer and submit answer
                const isDeferred = scenario.mode === 'tournament' && scenario.status === 'completed';
                const attemptCount = isDeferred ? 1 : undefined;

                await timerService.startTimer(accessCode, testData.questionUid, scenario.mode as any, isDeferred, userId, attemptCount);

                const result = await ScoringService.submitAnswerWithScoring(
                    gameId,
                    userId,
                    {
                        questionUid: testData.questionUid,
                        answer: [0, 2], // Same answer across all modes
                        timeSpent: 2000, // Same time across all modes
                        accessCode: accessCode,
                        userId: userId
                    },
                    undefined,
                    attemptCount
                );

                results.push({
                    mode: scenario.mode,
                    status: scenario.status,
                    scoreAdded: result.scoreAdded,
                    totalScore: result.totalScore
                });
            }

            // All modes should produce very similar scores (within small variance due to timing)
            const scores = results.map(r => r.scoreAdded);
            const maxScore = Math.max(...scores);
            const minScore = Math.min(...scores);

            // Should be within 10 points of each other (accounting for tiny timing differences)
            expect(maxScore - minScore).toBeLessThan(10);

            // All should be around 450-500 points (500 base minus time penalty)
            scores.forEach(score => {
                expect(score).toBeGreaterThan(450);
                expect(score).toBeLessThanOrEqual(500);
            });
        });
    });
});
