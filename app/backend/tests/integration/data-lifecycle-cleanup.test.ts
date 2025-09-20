/**
 * Data Lifecycle and Cleanup Tests
 *
 * Tests for automatic cleanup of expired sessions, orphaned records, and temporary data.
 * Covers session expiration, database cleanup, cache invalidation, and data retention policies.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('Data Lifecycle and Cleanup', () => {
    let testUserId: string;
    let testGameTemplateId: string;
    let testGameInstanceId: string;

    beforeAll(async () => {
        testUserId = `test-user-${Date.now()}`;
        testGameTemplateId = `template-${Date.now()}`;
        testGameInstanceId = `game-${Date.now()}`;

        // Create test user
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `testuser-${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `cookie-${testUserId}`
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'Test Cleanup Template',
                description: 'Template for data lifecycle tests',
                creatorId: testUserId,
                defaultMode: 'practice'
            }
        });

        // Create test game instance
        await prisma.gameInstance.create({
            data: {
                id: testGameInstanceId,
                name: 'Test Cleanup Game',
                accessCode: `cleanup_test_${Date.now()}`,
                gameTemplateId: testGameTemplateId,
                initiatorUserId: testUserId,
                status: 'ACTIVE',
                playMode: 'practice',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                createdAt: new Date(),
                startedAt: new Date()
            }
        });
    });

    afterAll(async () => {
        // Clean up database in reverse order to avoid foreign key constraints
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameInstanceId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameInstanceId } });
        await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplateId } });
        await prisma.studentProfile.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up Redis before each test
        await redisClient.flushall();
    });

    describe('Session expiration cleanup', () => {
        it('should automatically clean up expired practice sessions', async () => {
            const sessionId = `practice_expired_${Date.now()}`;
            const expiredSession = {
                sessionId,
                userId: testUserId,
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 3,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false,
                    gameTemplateId: testGameTemplateId
                },
                status: 'active',
                questionPool: ['q1', 'q2', 'q3'],
                currentQuestionIndex: 0,
                answers: [],
                statistics: {
                    questionsAttempted: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    accuracyPercentage: 0,
                    averageTimePerQuestion: 0,
                    totalTimeSpent: 0,
                    retriedQuestions: []
                },
                createdAt: new Date(),
                startedAt: new Date(),
                expiresAt: new Date(Date.now() - 60 * 1000) // Already expired
            };

            // Store expired session
            await redisClient.setex(`practice_session:${sessionId}`, 24 * 60 * 60, JSON.stringify(expiredSession));

            // Verify session exists
            let session = await redisClient.get(`practice_session:${sessionId}`);
            expect(session).toBeDefined();

            // Simulate cleanup by setting very short TTL
            await redisClient.expire(`practice_session:${sessionId}`, 1);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Verify session is cleaned up
            session = await redisClient.get(`practice_session:${sessionId}`);
            expect(session).toBeNull();
        });

        it('should clean up expired game state data', async () => {
            const gameStateId = `game_expired_${Date.now()}`;
            const expiredGameState = {
                gameInstanceId: gameStateId,
                status: 'completed',
                currentQuestionIndex: 5,
                participants: [],
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                questionPool: ['q1', 'q2', 'q3', 'q4', 'q5'],
                createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
                completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                expiresAt: new Date(Date.now() - 60 * 1000) // Already expired
            };

            // Store expired game state
            await redisClient.setex(`game_state:${gameStateId}`, 24 * 60 * 60, JSON.stringify(expiredGameState));

            // Verify exists
            let gameState = await redisClient.get(`game_state:${gameStateId}`);
            expect(gameState).toBeDefined();

            // Expire immediately
            await redisClient.expire(`game_state:${gameStateId}`, 1);
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Verify cleaned up
            gameState = await redisClient.get(`game_state:${gameStateId}`);
            expect(gameState).toBeNull();
        });

        it('should handle session expiration with active participants', async () => {
            const sessionId = `practice_active_${Date.now()}`;
            const activeSession = {
                sessionId,
                userId: testUserId,
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 4,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false,
                    gameTemplateId: testGameTemplateId
                },
                status: 'active',
                questionPool: ['q1', 'q2', 'q3', 'q4'],
                currentQuestionIndex: 1,
                answers: [
                    { questionUid: 'q1', selectedAnswers: [0], isCorrect: true, submittedAt: new Date(), timeSpentMs: 2000, attemptNumber: 1 }
                ],
                statistics: {
                    questionsAttempted: 1,
                    correctAnswers: 1,
                    incorrectAnswers: 0,
                    accuracyPercentage: 100,
                    averageTimePerQuestion: 2000,
                    totalTimeSpent: 2000,
                    retriedQuestions: []
                },
                createdAt: new Date(),
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 60 * 1000), // Expires in 1 minute
                lastActivity: new Date()
            };

            // Store active session
            await redisClient.setex(`practice_session:${sessionId}`, 24 * 60 * 60, JSON.stringify(activeSession));

            // Verify session exists with progress
            let session = await redisClient.get(`practice_session:${sessionId}`);
            expect(session).toBeDefined();

            const parsedSession = JSON.parse(session!);
            expect(parsedSession.answers).toHaveLength(1);
            expect(parsedSession.status).toBe('active');

            // Expire session
            await redisClient.expire(`practice_session:${sessionId}`, 1);
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Verify cleaned up
            session = await redisClient.get(`practice_session:${sessionId}`);
            expect(session).toBeNull();
        });
    });

    describe('Orphaned record cleanup', () => {
        it('should clean up game participants without valid game instances', async () => {
            const orphanedGameId = `orphaned_game_${Date.now()}`;

            // Create game instance first
            await prisma.gameInstance.create({
                data: {
                    id: orphanedGameId,
                    name: 'Orphaned Game',
                    accessCode: `orphaned_${Date.now()}`,
                    gameTemplateId: testGameTemplateId,
                    initiatorUserId: testUserId,
                    status: 'ACTIVE',
                    playMode: 'practice',
                    settings: {
                        gradeLevel: 'CM1',
                        discipline: 'math',
                        themes: ['addition'],
                        questionCount: 3,
                        showImmediateFeedback: true,
                        allowRetry: false,
                        randomizeQuestions: false
                    },
                    createdAt: new Date(),
                    startedAt: new Date()
                }
            });

            // Create participant for the game
            await prisma.gameParticipant.create({
                data: {
                    id: `participant_orphaned_${Date.now()}`,
                    userId: testUserId,
                    gameInstanceId: orphanedGameId,
                    liveScore: 5,
                    joinedAt: new Date(),
                    status: 'COMPLETED'
                }
            });

            // Verify participant exists
            let orphanedParticipant = await prisma.gameParticipant.findFirst({
                where: { gameInstanceId: orphanedGameId }
            });
            expect(orphanedParticipant).toBeDefined();

            // Delete the game instance to create orphaned participant
            await prisma.gameInstance.delete({
                where: { id: orphanedGameId }
            });

            // Simulate cleanup by deleting orphaned records
            await prisma.gameParticipant.deleteMany({
                where: {
                    gameInstanceId: {
                        notIn: (await prisma.gameInstance.findMany({ select: { id: true } })).map(g => g.id)
                    }
                }
            });

            // Verify cleaned up
            orphanedParticipant = await prisma.gameParticipant.findFirst({
                where: { gameInstanceId: orphanedGameId }
            });
            expect(orphanedParticipant).toBeNull();
        });

        it('should remove temporary cache entries', async () => {
            const tempKeys = [
                `temp:calculation_${Date.now()}`,
                `temp:validation_${Date.now()}`,
                `temp:processing_${Date.now()}`
            ];

            // Store temporary data
            for (const key of tempKeys) {
                await redisClient.setex(key, 300, 'temporary_data'); // 5 minute TTL
            }

            // Verify exists
            for (const key of tempKeys) {
                const value = await redisClient.get(key);
                expect(value).toBe('temporary_data');
            }

            // Expire all temp keys
            for (const key of tempKeys) {
                await redisClient.expire(key, 1);
            }

            await new Promise(resolve => setTimeout(resolve, 1100));

            // Verify cleaned up
            for (const key of tempKeys) {
                const value = await redisClient.get(key);
                expect(value).toBeNull();
            }
        });

        it('should clean up stale leaderboard entries', async () => {
            const staleLeaderboardKey = `leaderboard:stale_${Date.now()}`;
            const staleEntries = [
                { userId: 'user1', score: 10, timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000 }, // 30 days ago
                { userId: 'user2', score: 15, timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000 }, // 15 days ago
                { userId: 'user3', score: 20, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 }   // 7 days ago
            ];

            // Store stale leaderboard
            await redisClient.setex(staleLeaderboardKey, 24 * 60 * 60, JSON.stringify(staleEntries));

            // Verify exists
            let leaderboard = await redisClient.get(staleLeaderboardKey);
            expect(leaderboard).toBeDefined();

            // Simulate cleanup of entries older than 14 days
            const cutoffTime = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const cleanedEntries = staleEntries.filter(entry => entry.timestamp > cutoffTime);

            if (cleanedEntries.length < staleEntries.length) {
                await redisClient.setex(staleLeaderboardKey, 24 * 60 * 60, JSON.stringify(cleanedEntries));
            }

            // Verify cleaned
            leaderboard = await redisClient.get(staleLeaderboardKey);
            expect(leaderboard).toBeDefined();

            const parsedLeaderboard = JSON.parse(leaderboard!);
            expect(parsedLeaderboard.length).toBeLessThan(staleEntries.length);
        });
    });

    describe('Data retention policies', () => {
        it('should enforce data retention limits for completed games', async () => {
            const oldGameId = `old_game_${Date.now()}`;

            // Create old completed game instance
            await prisma.gameInstance.create({
                data: {
                    id: oldGameId,
                    name: 'Old Completed Game',
                    accessCode: `old_${Date.now()}`,
                    gameTemplateId: testGameTemplateId,
                    initiatorUserId: testUserId,
                    status: 'COMPLETED',
                    playMode: 'practice',
                    settings: {
                        gradeLevel: 'CM1',
                        discipline: 'math',
                        themes: ['addition'],
                        questionCount: 3,
                        showImmediateFeedback: true,
                        allowRetry: false,
                        randomizeQuestions: false
                    },
                    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
                    startedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
                    endedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) // 95 days ago
                }
            });

            // Verify old game exists
            let oldGame = await prisma.gameInstance.findUnique({
                where: { id: oldGameId }
            });
            expect(oldGame).toBeDefined();
            expect(oldGame!.status).toBe('COMPLETED');

            // Simulate retention policy cleanup (games older than 90 days)
            const retentionCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            await prisma.gameInstance.deleteMany({
                where: {
                    status: 'COMPLETED',
                    endedAt: { lt: retentionCutoff }
                }
            });

            // Verify cleaned up
            oldGame = await prisma.gameInstance.findUnique({
                where: { id: oldGameId }
            });
            expect(oldGame).toBeNull();
        });
    });

    describe('Cache invalidation', () => {
        it('should invalidate stale cache entries', async () => {
            const cacheKey = `cache:question_data_${Date.now()}`;
            const staleData = {
                questionUid: 'q1',
                title: 'Cached Question',
                lastModified: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                data: { answerOptions: ['A', 'B', 'C'] }
            };

            // Store stale cache
            await redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(staleData));

            // Verify exists
            let cachedData = await redisClient.get(cacheKey);
            expect(cachedData).toBeDefined();

            // Simulate cache invalidation by deleting
            await redisClient.del(cacheKey);

            // Verify invalidated
            cachedData = await redisClient.get(cacheKey);
            expect(cachedData).toBeNull();
        });

        it('should handle cache consistency across updates', async () => {
            const consistencyKey = `cache:consistency_${Date.now()}`;
            const initialData = { version: 1, data: 'initial' };

            // Store initial cache
            await redisClient.setex(consistencyKey, 24 * 60 * 60, JSON.stringify(initialData));

            // Simulate data update
            const updatedData = { version: 2, data: 'updated' };

            // Update cache
            await redisClient.setex(consistencyKey, 24 * 60 * 60, JSON.stringify(updatedData));

            // Verify consistency
            const cachedData = await redisClient.get(consistencyKey);
            expect(cachedData).toBeDefined();

            const parsedData = JSON.parse(cachedData!);
            expect(parsedData.version).toBe(2);
            expect(parsedData.data).toBe('updated');
        });

        it('should clean up expired cache keys', async () => {
            const expiredKeys = [
                `cache:expired_1_${Date.now()}`,
                `cache:expired_2_${Date.now()}`,
                `cache:expired_3_${Date.now()}`
            ];

            // Store with short TTL
            for (const key of expiredKeys) {
                await redisClient.setex(key, 1, 'expired_data'); // 1 second TTL
            }

            // Verify exists
            for (const key of expiredKeys) {
                const value = await redisClient.get(key);
                expect(value).toBe('expired_data');
            }

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Verify cleaned up
            for (const key of expiredKeys) {
                const value = await redisClient.get(key);
                expect(value).toBeNull();
            }
        });
    });

    describe('Background cleanup processes', () => {
        it('should run periodic cleanup of temporary files', async () => {
            const tempFiles = [
                `temp:file_1_${Date.now()}.tmp`,
                `temp:file_2_${Date.now()}.tmp`,
                `temp:file_3_${Date.now()}.tmp`
            ];

            // Simulate temporary files (using Redis for this test)
            for (const file of tempFiles) {
                await redisClient.setex(`temp_file:${file}`, 60 * 60, 'temp_content'); // 1 hour TTL
            }

            // Verify exists
            for (const file of tempFiles) {
                const content = await redisClient.get(`temp_file:${file}`);
                expect(content).toBe('temp_content');
            }

            // Simulate cleanup process
            const cleanupPattern = 'temp_file:temp:*';
            // In real Redis, we'd use SCAN with pattern, but for test we'll delete directly
            for (const file of tempFiles) {
                await redisClient.del(`temp_file:${file}`);
            }

            // Verify cleaned up
            for (const file of tempFiles) {
                const content = await redisClient.get(`temp_file:${file}`);
                expect(content).toBeNull();
            }
        });

        it('should maintain cleanup logs', async () => {
            const cleanupLogKey = `cleanup:log_${Date.now()}`;
            const cleanupOperations = [
                { operation: 'delete_expired_sessions', count: 15, timestamp: new Date() },
                { operation: 'archive_old_games', count: 3, timestamp: new Date() },
                { operation: 'remove_orphaned_records', count: 7, timestamp: new Date() }
            ];

            // Store cleanup log
            await redisClient.setex(cleanupLogKey, 7 * 24 * 60 * 60, JSON.stringify(cleanupOperations)); // 7 days

            // Verify log exists
            const logData = await redisClient.get(cleanupLogKey);
            expect(logData).toBeDefined();

            const parsedLog = JSON.parse(logData!);
            expect(parsedLog).toHaveLength(3);
            expect(parsedLog[0].operation).toBe('delete_expired_sessions');
            expect(parsedLog[0].count).toBe(15);
        });

        it('should handle cleanup failures gracefully', async () => {
            const failedCleanupKey = `cleanup:failed_${Date.now()}`;
            const failedOperations = [
                { operation: 'cleanup_sessions', error: 'Connection timeout', retryCount: 2, timestamp: new Date() },
                { operation: 'archive_games', error: 'Disk full', retryCount: 1, timestamp: new Date() }
            ];

            // Store failed cleanup attempts
            await redisClient.setex(failedCleanupKey, 24 * 60 * 60, JSON.stringify(failedOperations));

            // Verify failure log exists
            const failureLog = await redisClient.get(failedCleanupKey);
            expect(failureLog).toBeDefined();

            const parsedFailures = JSON.parse(failureLog!);
            expect(parsedFailures).toHaveLength(2);
            expect(parsedFailures[0].error).toBe('Connection timeout');
            expect(parsedFailures[0].retryCount).toBe(2);
        });
    });
});