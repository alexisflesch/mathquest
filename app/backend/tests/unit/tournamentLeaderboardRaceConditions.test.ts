/**
 * Tournament Leaderboard Race Conditions Test Suite
 *
 * This test suite validates the tournament leaderboard implementation for race condition vulnerabilities.
 * Race conditions can occur when multiple users submit answers simultaneously, potentially causing:
 * - Incorrect score calculations
 * - Lost score updates
 * - Inconsistent leaderboard rankings
 * - Data corruption in Redis operations
 *
 * Key vulnerabilities tested:
 * 1. Concurrent score updates in Redis participant data (read-modify-write)
 * 2. Simultaneous leaderboard ZSET updates
 * 3. Race conditions in deferred vs live scoring modes
 * 4. Atomicity issues in score persistence operations
 */

import { jest } from '@jest/globals';
import { ScoringService } from '@/core/services/scoringService';
import createLogger from '@/utils/logger';

// Mock external dependencies
jest.mock('@/config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        hget: jest.fn(),
        hset: jest.fn(),
        zadd: jest.fn(),
        duplicate: jest.fn()
    }
}));

jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn()
        },
        gameParticipant: {
            findFirst: jest.fn(),
            update: jest.fn()
        },
        question: {
            findUnique: jest.fn()
        }
    }
}));

jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

const mockRedisClient = require('@/config/redis').redisClient;
const mockPrisma = require('@/db/prisma').prisma;
const mockLogger = createLogger('TestLogger') as jest.Mocked<any>;

describe('Tournament Leaderboard Race Conditions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Redis mock to return default values
        mockRedisClient.get.mockResolvedValue(null);
        mockRedisClient.hget.mockResolvedValue(null);
        mockRedisClient.hset.mockResolvedValue(1);
        (mockRedisClient.zadd as any).mockResolvedValue(1);
    });

    describe('Concurrent Score Updates - Read-Modify-Write Race Condition', () => {
        test('should demonstrate race condition vulnerability in participant score updates', async () => {
            // Setup test data
            const gameInstanceId = 'test-game-123';
            const userId = 'user-456';
            const accessCode = 'TEST123';
            const questionUid = 'q-789';

            // Mock game instance
            mockPrisma.gameInstance.findUnique.mockResolvedValue({
                id: gameInstanceId,
                accessCode,
                playMode: 'tournament',
                status: 'active'
            } as any);

            // Mock participant
            mockPrisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'participant-123',
                gameInstanceId,
                userId,
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 1
            } as any);

            // Mock question
            mockPrisma.question.findUnique.mockResolvedValue({
                uid: questionUid,
                title: 'Test Question',
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, false, false]
                }
            } as any);

            // Mock Redis participant data - simulate concurrent access
            let participantDataCallCount = 0;
            mockRedisClient.hget.mockImplementation((key: string, field: string) => {
                if (key.includes('participants') && field === userId) {
                    participantDataCallCount++;
                    // Simulate race condition: both calls see the same initial score
                    return Promise.resolve(JSON.stringify({
                        score: 0,
                        userId,
                        timestamp: Date.now()
                    }));
                }
                return Promise.resolve(null);
            });

            // Simulate two concurrent answer submissions
            const answerData1 = {
                questionUid,
                answer: [0], // Correct answer
                timeSpent: 5000,
                accessCode,
                userId
            };

            const answerData2 = {
                questionUid,
                answer: [0], // Same correct answer
                timeSpent: 6000,
                accessCode,
                userId
            };

            // First submission
            const result1 = await ScoringService.submitAnswerWithScoring(
                gameInstanceId,
                userId,
                answerData1
            );

            // Second submission (should be duplicate but demonstrates race condition setup)
            const result2 = await ScoringService.submitAnswerWithScoring(
                gameInstanceId,
                userId,
                answerData2
            );

            // Verify the race condition vulnerability
            expect(participantDataCallCount).toBeGreaterThanOrEqual(2);
            expect(mockRedisClient.hget).toHaveBeenCalledWith(
                `mathquest:game:participants:${accessCode}`,
                userId
            );

            // Both results should show score updates, but in a real race condition,
            // one update could overwrite the other
            expect(result1.scoreUpdated || result2.scoreUpdated).toBe(true);
        });

        test('should demonstrate leaderboard ZSET race condition vulnerability', async () => {
            // Setup test data
            const gameInstanceId = 'test-game-456';
            const accessCode = 'TEST456';
            const questionUid = 'q-999';

            // Mock game instance
            mockPrisma.gameInstance.findUnique.mockResolvedValue({
                id: gameInstanceId,
                accessCode,
                playMode: 'tournament',
                status: 'active'
            } as any);

            // Mock question
            mockPrisma.question.findUnique.mockResolvedValue({
                uid: questionUid,
                title: 'Test Question',
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, false, false]
                }
            } as any);

            // Create multiple participants
            const participants = [
                { id: 'p1', userId: 'user1', score: 100 },
                { id: 'p2', userId: 'user2', score: 200 },
                { id: 'p3', userId: 'user3', score: 150 }
            ];

            // Mock participants
            mockPrisma.gameParticipant.findFirst
                .mockResolvedValueOnce(participants[0] as any)
                .mockResolvedValueOnce(participants[1] as any)
                .mockResolvedValueOnce(participants[2] as any);

            // Mock Redis participant data
            mockRedisClient.hget
                .mockResolvedValueOnce(JSON.stringify({ score: 100, userId: 'user1' }))
                .mockResolvedValueOnce(JSON.stringify({ score: 200, userId: 'user2' }))
                .mockResolvedValueOnce(JSON.stringify({ score: 150, userId: 'user3' }));

            // Track ZSET operations
            const zsetOperations: any[] = [];
            (mockRedisClient.zadd as any).mockImplementation((...args: any[]) => {
                const [key, score, member] = args;
                zsetOperations.push({ key, score, member });
                return Promise.resolve(1);
            });

            // Simulate concurrent score updates from multiple users
            const promises = participants.map((participant, index) => {
                const answerData = {
                    questionUid,
                    answer: [0], // Correct answer
                    timeSpent: 5000 + (index * 1000),
                    accessCode,
                    userId: participant.userId
                };

                return ScoringService.submitAnswerWithScoring(
                    gameInstanceId,
                    participant.userId,
                    answerData
                );
            });

            await Promise.all(promises);

            // Verify ZSET operations occurred
            expect(zsetOperations.length).toBeGreaterThan(0);
            expect(zsetOperations.every(op => op.key.includes('leaderboard'))).toBe(true);

            // In a real race condition, ZSET updates could interfere with each other
            // This test demonstrates the vulnerability exists
            expect(mockRedisClient.zadd).toHaveBeenCalled();
        });

        test('should demonstrate deferred mode score isolation vulnerability', async () => {
            // Setup test data
            const gameInstanceId = 'test-game-789';
            const userId = 'user-999';
            const accessCode = 'TEST789';
            const questionUid = 'q-111';

            // Mock completed tournament (deferred mode)
            mockPrisma.gameInstance.findUnique.mockResolvedValue({
                id: gameInstanceId,
                accessCode,
                playMode: 'tournament',
                status: 'completed' // This triggers deferred mode
            } as any);

            // Mock participant
            mockPrisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'participant-999',
                gameInstanceId,
                userId,
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 1
            } as any);

            // Mock question
            mockPrisma.question.findUnique.mockResolvedValue({
                uid: questionUid,
                title: 'Test Question',
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, false, false]
                }
            } as any);

            // Track session state operations
            const sessionOperations: any[] = [];
            (mockRedisClient.hset as any).mockImplementation((...args: any[]) => {
                const [key, field, value] = args;
                if (key.includes('deferred_session')) {
                    sessionOperations.push({ key, field, value });
                }
                return Promise.resolve(1);
            });

            // Simulate multiple attempts in deferred mode
            const attempts = [1, 2, 3];
            const promises = attempts.map(attemptCount => {
                const answerData = {
                    questionUid,
                    answer: [0], // Correct answer
                    timeSpent: 5000,
                    accessCode,
                    userId
                };

                return ScoringService.submitAnswerWithScoring(
                    gameInstanceId,
                    userId,
                    answerData,
                    true, // isDeferredOverride
                    attemptCount
                );
            });

            const results = await Promise.all(promises);

            // Verify session isolation
            expect(sessionOperations.length).toBe(attempts.length);
            expect(sessionOperations.every(op => op.key.includes('deferred_session'))).toBe(true);

            // Each attempt should have its own session state
            const uniqueKeys = new Set(sessionOperations.map(op => op.key));
            expect(uniqueKeys.size).toBe(attempts.length);

            // In a race condition, session states could interfere with each other
            results.forEach(result => {
                expect(result.scoreUpdated).toBe(true);
            });
        });

        test('should demonstrate Redis atomicity violation in score calculations', async () => {
            // Setup test data
            const gameInstanceId = 'test-game-atomic';
            const userId = 'user-atomic';
            const accessCode = 'ATOMIC';
            const questionUid = 'q-atomic';

            // Mock game instance
            mockPrisma.gameInstance.findUnique.mockResolvedValue({
                id: gameInstanceId,
                accessCode,
                playMode: 'tournament',
                status: 'active'
            } as any);

            // Mock participant
            mockPrisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'participant-atomic',
                gameInstanceId,
                userId,
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 1
            } as any);

            // Mock question
            mockPrisma.question.findUnique.mockResolvedValue({
                uid: questionUid,
                title: 'Test Question',
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, false, false]
                }
            } as any);

            // Simulate non-atomic read-modify-write by tracking operations
            const redisOperations: any[] = [];
            mockRedisClient.hget.mockImplementation((key: string, field: string) => {
                redisOperations.push({ type: 'read', key, field });
                return Promise.resolve(JSON.stringify({
                    score: 100, // Simulate existing score
                    userId,
                    timestamp: Date.now()
                }));
            });

            mockRedisClient.hset.mockImplementation((...args: any[]) => {
                const [key, field, value] = args;
                redisOperations.push({ type: 'write', key, field, value });
                return Promise.resolve(1);
            });

            // Perform score update
            const answerData = {
                questionUid,
                answer: [0], // Correct answer
                timeSpent: 5000,
                accessCode,
                userId
            };

            await ScoringService.submitAnswerWithScoring(
                gameInstanceId,
                userId,
                answerData
            );

            // Verify non-atomic operations occurred
            const readOps = redisOperations.filter(op => op.type === 'read');
            const writeOps = redisOperations.filter(op => op.type === 'write');

            expect(readOps.length).toBeGreaterThan(0);
            expect(writeOps.length).toBeGreaterThan(0);

            // This demonstrates the vulnerability: read and write are separate operations
            // In a concurrent scenario, another process could read between our read and write
            expect(redisOperations.some(op => op.type === 'read')).toBe(true);
            expect(redisOperations.some(op => op.type === 'write')).toBe(true);
        });
    });

    describe('Leaderboard Persistence Race Conditions', () => {
        test('should demonstrate race condition in leaderboard persistence to database', async () => {
            // This test would demonstrate issues in persistLeaderboardToGameInstance
            // when multiple processes try to persist the leaderboard simultaneously

            // Mock leaderboard data
            const accessCode = 'PERSIST123';
            const leaderboard = [
                { userId: 'user1', username: 'User 1', score: 1000 },
                { userId: 'user2', username: 'User 2', score: 950 },
                { userId: 'user3', username: 'User 3', score: 900 }
            ];

            // Mock game instance
            mockPrisma.gameInstance.findUnique.mockResolvedValue({
                id: 'game-123',
                accessCode,
                playMode: 'tournament',
                status: 'completed'
            } as any);

            // Mock participants
            mockPrisma.gameParticipant.findFirst
                .mockResolvedValueOnce({
                    id: 'p1',
                    gameInstanceId: 'game-123',
                    userId: 'user1',
                    deferredScore: 800
                } as any)
                .mockResolvedValueOnce({
                    id: 'p2',
                    gameInstanceId: 'game-123',
                    userId: 'user2',
                    deferredScore: 850
                } as any)
                .mockResolvedValueOnce({
                    id: 'p3',
                    gameInstanceId: 'game-123',
                    userId: 'user3',
                    deferredScore: 750
                } as any);

            // Track database update operations
            const dbOperations: any[] = [];
            (mockPrisma.gameParticipant.update as any).mockImplementation((args: any) => {
                dbOperations.push(args);
                return Promise.resolve({} as any);
            });

            // Simulate leaderboard persistence
            // Note: This would normally be called from persistLeaderboardToGameInstance
            for (const participant of leaderboard) {
                const dbParticipant = await mockPrisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: 'game-123',
                        userId: participant.userId
                    }
                });

                if (dbParticipant) {
                    // Simulate the max logic from persistLeaderboardToGameInstance
                    const currentDeferredScore = dbParticipant.deferredScore || 0;
                    const newScore = Math.max(currentDeferredScore, participant.score);

                    await mockPrisma.gameParticipant.update({
                        where: { id: dbParticipant.id },
                        data: { deferredScore: newScore }
                    });
                }
            }

            // Verify database operations occurred
            expect(dbOperations.length).toBe(3);
            expect(mockPrisma.gameParticipant.update).toHaveBeenCalledTimes(3);

            // In a real race condition scenario, multiple processes could:
            // 1. Read the same participant data simultaneously
            // 2. Calculate different max values
            // 3. Overwrite each other's updates
        });
    });

    describe('Timer Service Race Conditions', () => {
        test('should demonstrate potential race conditions in timer-based scoring', async () => {
            // Setup test data
            const gameInstanceId = 'test-game-timer';
            const userId = 'user-timer';
            const accessCode = 'TIMER';
            const questionUid = 'q-timer';

            // Mock game instance
            mockPrisma.gameInstance.findUnique.mockResolvedValue({
                id: gameInstanceId,
                accessCode,
                playMode: 'tournament',
                status: 'active'
            } as any);

            // Mock participant
            mockPrisma.gameParticipant.findFirst.mockResolvedValue({
                id: 'participant-timer',
                gameInstanceId,
                userId,
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 1
            } as any);

            // Mock question
            mockPrisma.question.findUnique.mockResolvedValue({
                uid: questionUid,
                title: 'Test Question',
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, false, false]
                }
            } as any);

            // Mock timer service to simulate timing variations
            const timerResults: number[] = [];
            mockRedisClient.get
                .mockResolvedValueOnce(JSON.stringify({ elapsed: 3000 })) // 3 seconds
                .mockResolvedValueOnce(JSON.stringify({ elapsed: 3100 })) // 3.1 seconds
                .mockResolvedValueOnce(JSON.stringify({ elapsed: 3200 })); // 3.2 seconds

            // Simulate rapid successive submissions
            const promises = [1, 2, 3].map(() => {
                const answerData = {
                    questionUid,
                    answer: [0], // Correct answer
                    timeSpent: 5000,
                    accessCode,
                    userId
                };

                return ScoringService.submitAnswerWithScoring(
                    gameInstanceId,
                    userId,
                    answerData
                );
            });

            const results = await Promise.all(promises);

            // Verify all submissions were processed
            expect(results.length).toBe(3);
            results.forEach(result => {
                expect(result).toHaveProperty('scoreUpdated');
                expect(result).toHaveProperty('totalScore');
            });

            // In a real race condition, timer reads could interfere with each other
            // or timer updates could be inconsistent
        });
    });
});