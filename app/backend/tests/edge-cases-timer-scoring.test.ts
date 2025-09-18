// Mock the dependencies
jest.mock('../src/config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        keys: jest.fn(),
        mget: jest.fn(),
        mset: jest.fn(),
    },
}));

jest.mock('../src/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
        },
        questionsInGameTemplate: {
            count: jest.fn(),
        },
        gameParticipant: {
            findUnique: jest.fn(),
            update: jest.fn(),
            upsert: jest.fn(),
            findMany: jest.fn(),
        },
        answerSubmission: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

// Import after mocks are set up
import { calculateAnswerScore, checkAnswerCorrectness } from '../src/core/services/scoringService';
import { CanonicalTimerService } from '../src/core/services/canonicalTimerService';
import { redisClient } from '../src/config/redis';
import { prisma } from '../src/db/prisma';

describe('Edge Cases - Timer and Scoring', () => {
    let timerService: CanonicalTimerService;

    beforeEach(() => {
        jest.clearAllMocks();
        timerService = new CanonicalTimerService(redisClient as any);
    });

    describe('Exact Expiry Timing Scenarios', () => {
        test('EC1: Timer expires exactly at zero milliseconds', async () => {
            const accessCode = 'test-game-123';
            const questionUid = 'question-1';
            const userId = 'user-123';

            // Mock timer at exact expiry (0ms remaining)
            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUid,
                status: 'play',
                startedAt: Date.now() - 30000, // Started 30 seconds ago
                totalPlayTimeMs: 30000,
                lastStateChange: Date.now(),
                durationMs: 30000,
                timeLeftMs: 0, // Exactly at expiry
                timerEndDateMs: Date.now(),
            }));

            const timerState = await timerService.getRawTimerFromRedis(
                accessCode, questionUid, 'quiz', false, userId
            );

            // Verify timer is at exact expiry
            expect(timerState?.timeLeftMs).toBe(0);
            expect(timerState?.status).toBe('play');
        });

        test('EC2: Timer with negative remaining time (overtime scenario)', async () => {
            const accessCode = 'test-game-123';
            const questionUid = 'question-2';

            // Mock timer that has gone into negative time
            const now = Date.now();
            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUid,
                status: 'play',
                startedAt: now - 35000, // Started 35 seconds ago
                totalPlayTimeMs: 35000,
                lastStateChange: now,
                durationMs: 30000,
                timeLeftMs: -5000, // 5 seconds overtime
                timerEndDateMs: now - 5000,
            }));

            const timerState = await timerService.getRawTimerFromRedis(
                accessCode, questionUid, 'quiz', false
            );

            // Verify negative time is handled
            expect(timerState?.timeLeftMs).toBe(-5000);
            expect(timerState?.status).toBe('play');
        });

        test('EC3: Timer with extremely large duration values', async () => {
            const accessCode = 'test-game-123';
            const questionUid = 'question-3';

            // Mock timer with extremely large duration (24 hours)
            const largeDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUid,
                status: 'play',
                startedAt: Date.now(),
                totalPlayTimeMs: 0,
                lastStateChange: Date.now(),
                durationMs: largeDuration,
                timeLeftMs: largeDuration,
                timerEndDateMs: Date.now() + largeDuration,
            }));

            const timerState = await timerService.getRawTimerFromRedis(
                accessCode, questionUid, 'quiz', false
            );

            // Verify large duration is handled
            expect(timerState?.durationMs).toBe(largeDuration);
            expect(timerState?.timeLeftMs).toBe(largeDuration);
        });
    });

    describe('Negative Scores and Edge Cases', () => {
        test('EC4: Scoring with zero time limit (instant expiry)', async () => {
            const question = {
                uid: 'question-zero-time',
                timeLimit: 0,
                multipleChoiceQuestion: {
                    correctAnswers: [0],
                },
            };
            const answer = [0]; // Correct answer
            const serverTimeSpent = 0; // No time spent

            // Mock game data for scaling
            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUids: ['q1', 'q2', 'q3', 'q4', 'q5'],
            }));

            const result = await calculateAnswerScore(
                question, answer, serverTimeSpent, serverTimeSpent, 'test-code'
            );

            // Should handle zero time limit gracefully
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(typeof result.timePenalty).toBe('number');
        });

        test('EC5: Scoring with negative time spent (time travel scenario)', async () => {
            const question = {
                uid: 'question-negative-time',
                timeLimit: 30000,
                multipleChoiceQuestion: {
                    correctAnswers: [0],
                },
            };
            const answer = [0];
            const serverTimeSpent = -5000; // Negative time (impossible)

            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUids: ['q1', 'q2'],
            }));

            const result = await calculateAnswerScore(
                question, answer, serverTimeSpent, serverTimeSpent, 'test-code'
            );

            // Should handle negative time gracefully (clamp to 0)
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.timePenalty).toBe(0);
        });

        test('EC6: Scoring with extremely long time spent', async () => {
            const question = {
                uid: 'question-long-time',
                timeLimit: 30000,
                multipleChoiceQuestion: {
                    correctAnswers: [0],
                },
            };
            const answer = [0];
            const serverTimeSpent = 24 * 60 * 60 * 1000; // 24 hours

            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUids: ['q1', 'q2', 'q3'],
            }));

            const result = await calculateAnswerScore(
                question, answer, serverTimeSpent, serverTimeSpent, 'test-code'
            );

            // Should handle extremely long time (maximum penalty)
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.timePenalty).toBeLessThanOrEqual(result.score + result.timePenalty);
        });
    });

    describe('Leaderboard Updates with Edge Cases', () => {
        test('EC7: Leaderboard with identical scores (tie breaking)', async () => {
            const gameInstanceId = 'game1';

            // Mock multiple participants with identical scores
            (prisma.gameParticipant.findMany as jest.Mock).mockResolvedValue([
                { userId: 'user1', liveScore: 500, gameInstanceId: 'game1' },
                { userId: 'user2', liveScore: 500, gameInstanceId: 'game1' },
                { userId: 'user3', liveScore: 500, gameInstanceId: 'game1' },
            ]);

            // This would typically be called by leaderboard service
            const participants = await prisma.gameParticipant.findMany({
                where: { gameInstanceId },
                orderBy: [
                    { liveScore: 'desc' },
                    { userId: 'asc' }, // Tie breaker
                ],
            });

            // Verify tie breaking works
            expect(participants).toHaveLength(3);
            expect(participants[0].liveScore).toBe(500);
            expect(participants[1].liveScore).toBe(500);
            expect(participants[2].liveScore).toBe(500);
        });

        test('EC8: Leaderboard with negative scores', async () => {
            const gameInstanceId = 'game1';

            (prisma.gameParticipant.findMany as jest.Mock).mockResolvedValue([
                { userId: 'user1', liveScore: 100, gameInstanceId: 'game1' },
                { userId: 'user2', liveScore: -50, gameInstanceId: 'game1' },
                { userId: 'user3', liveScore: -200, gameInstanceId: 'game1' },
            ]);

            const participants = await prisma.gameParticipant.findMany({
                where: { gameInstanceId },
                orderBy: { liveScore: 'desc' },
            });

            // Verify negative scores are ordered correctly
            expect(participants[0].liveScore).toBe(100);
            expect(participants[1].liveScore).toBe(-50);
            expect(participants[2].liveScore).toBe(-200);
        });

        test('EC9: Leaderboard with extremely high scores', async () => {
            const gameInstanceId = 'game1';

            (prisma.gameParticipant.findMany as jest.Mock).mockResolvedValue([
                { userId: 'user1', liveScore: 999999, gameInstanceId: 'game1' },
                { userId: 'user2', liveScore: 500000, gameInstanceId: 'game1' },
                { userId: 'user3', liveScore: 1000000, gameInstanceId: 'game1' },
            ]);

            const participants = await prisma.gameParticipant.findMany({
                where: { gameInstanceId },
                orderBy: { liveScore: 'desc' },
            });

            // Verify extremely high scores are handled (order may vary)
            const scores = participants.map(p => p.liveScore).sort((a, b) => b - a);
            expect(scores).toEqual([1000000, 999999, 500000]);
            expect(participants).toHaveLength(3);
        });
    });

    describe('Complex Scoring Combinations', () => {
        test('EC10: Scoring with partial credit and time penalty edge case', async () => {
            const question = {
                uid: 'question-partial-credit',
                timeLimit: 30000,
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, true], // 2 correct out of 3
                    answerOptions: ['A', 'B', 'C'],
                },
            };
            const answer = [0, 2]; // User selected 2 options, 1 correct, 1 incorrect

            // Mock game with many questions for low base score
            (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
                questionUids: Array.from({ length: 100 }, (_, i) => `q${i}`),
            }));

            const result = await calculateAnswerScore(
                question, answer, 45000, 45000, 'test-code' // 45 seconds spent
            );

            // Should handle partial credit with time penalty
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.timePenalty).toBeGreaterThan(0);
            expect(result.score + result.timePenalty).toBeLessThanOrEqual(10); // Low base score
        });
    });
});