/**
 * Test for Practice Session Database Integration
 *
 * This test verifies that completed practice sessions create proper database records
 * that can be queried by the myTournaments API.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { PracticeSessionService } from '../../src/core/services/practiceSessionService';

describe('Practice Session Database Integration', () => {
    let practiceSessionService: PracticeSessionService;
    let testUserId: string;
    let testSessionId: string;

    beforeAll(async () => {
        practiceSessionService = new PracticeSessionService();
        testUserId = `test-user-${Date.now()}`;

        // Create a test user in the database
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `testuser-${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create the associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `cookie-${testUserId}`
            }
        });

        // Clean up any existing test data
        await redisClient.flushall();
        await prisma.gameParticipant.deleteMany({ where: { userId: testUserId } });
        await prisma.gameInstance.deleteMany({ where: { accessCode: { startsWith: 'practice_' } } });
    });

    afterAll(async () => {
        await redisClient.flushall();
        await prisma.$disconnect();
    });

    it('should create database records when practice session is completed', async () => {
        // Create a mock session directly in Redis to test the endSession functionality
        const mockSession = {
            sessionId: 'test-session-direct',
            userId: testUserId,
            settings: {
                discipline: 'Mathématiques',
                gradeLevel: 'CP',
                themes: ['Calcul'],
                questionCount: 5,
                timeLimit: 300,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: true
            },
            status: 'active' as const,
            questionPool: ['aflesch-cp-math-calcul-001', 'aflesch-cp-math-calcul-002'],
            currentQuestionIndex: 1,
            answers: [],
            statistics: {
                questionsAttempted: 2,
                correctAnswers: 1,
                incorrectAnswers: 1,
                accuracyPercentage: 50,
                averageTimePerQuestion: 30,
                totalTimeSpent: 60,
                retriedQuestions: []
            },
            createdAt: new Date(Date.now() - 120000), // 2 minutes ago
            startedAt: new Date(Date.now() - 120000),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            completedAt: new Date()
        };

        // Store the mock session in Redis
        const redisKey = `practice_session:${mockSession.sessionId}`;
        await redisClient.setex(redisKey, 24 * 60 * 60, JSON.stringify(mockSession));

        // Now end the session - this should create the database records
        await practiceSessionService.endSession(mockSession.sessionId);

        // Wait a moment for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that gameInstance record was created
        const gameInstance = await prisma.gameInstance.findFirst({
            where: {
                accessCode: { startsWith: 'PRACTICE-' },
                playMode: 'practice',
                initiatorUserId: testUserId
            },
            include: { participants: true }
        });

        expect(gameInstance).toBeTruthy();
        expect(gameInstance?.name).toContain('Session d\'entraînement');
        expect(gameInstance?.playMode).toBe('practice');
        expect(gameInstance?.status).toBe('completed');
        expect(gameInstance?.participants).toHaveLength(1);

        // Verify participant record
        const participant = gameInstance?.participants[0];
        expect(participant?.userId).toBe(testUserId);
        expect(participant?.status).toBe('COMPLETED');
        expect(participant?.liveScore).toBeGreaterThan(0);
    });

    it('should make practice sessions visible in myTournaments API', async () => {
        // Query for practice sessions like myTournaments API does
        const practiceSessions = await prisma.gameInstance.findMany({
            where: {
                playMode: 'practice',
                participants: {
                    some: {
                        userId: testUserId
                    }
                }
            },
            include: {
                participants: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        expect(practiceSessions.length).toBeGreaterThan(0);
        expect(practiceSessions[0].playMode).toBe('practice');
        expect(practiceSessions[0].participants[0].userId).toBe(testUserId);
    });
});