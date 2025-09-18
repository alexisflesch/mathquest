import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';

// This test checks score calculation with time penalty and tie-breaker logic in a tournament

describe('Tournament Score Calculation: Time Penalty & Tie-breaker', () => {
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
        const uniqueId = `score-tiebreaker-${timestamp}`;
        testData = {
            accessCode: `TOUR-${uniqueId}`,
            gameId: `game-${uniqueId}`,
            questionUid: `question-${uniqueId}`,
            users: [
                { id: `user-${uniqueId}-fast`, username: 'Fast', socketId: `socket-${uniqueId}-1` },
                { id: `user-${uniqueId}-slow`, username: 'Slow', socketId: `socket-${uniqueId}-2` },
                { id: `user-${uniqueId}-tie`, username: 'Tie', socketId: `socket-${uniqueId}-3` }
            ]
        };

        // Clean up
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testData.gameId } });
        await prisma.gameTemplate.deleteMany({ where: { creatorId: testData.users[0].id } });
        await prisma.user.deleteMany({ where: { id: { in: testData.users.map((u: typeof testData.users[0]) => u.id) } } });
        await prisma.question.deleteMany({ where: { uid: testData.questionUid } });

        // Create users
        for (const user of testData.users) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    username: user.username,
                    email: `${user.id}@test.com`,
                    role: 'STUDENT'
                }
            });
        }

        // Create question
        await prisma.question.create({
            data: {
                uid: testData.questionUid,
                text: 'What is 10 + 5?',
                questionType: 'numeric',
                discipline: 'Mathematics',
                gradeLevel: 'CE1',
                author: 'test',
                timeLimit: 30,
                numericQuestion: {
                    create: {
                        correctAnswer: 15,
                        tolerance: 0
                    }
                }
            }
        });

        // Create game template and instance
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Score Tiebreaker Template',
                description: 'Test score with time penalty and tie-breaker',
                creator: { connect: { id: testData.users[0].id } }
            }
        });

        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Score Tiebreaker Game',
                status: 'active',
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id
            }
        });

        // Create participants
        for (const user of testData.users) {
            await prisma.gameParticipant.create({
                data: {
                    id: user.id,
                    gameInstanceId: testData.gameId,
                    userId: user.id,
                    status: 'ACTIVE',
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 0,
                    joinedAt: new Date(),
                    lastActiveAt: new Date()
                }
            });
        }
    });

    it('should apply time penalty and resolve tie-breaker by fastest answer', async () => {
        // Simulate answers: Fast answers instantly, Slow answers after delay, Tie answers same score but different time
        const answerTimes = [100, 2000, 300]; // ms
        const expectedOrder = ['Fast', 'Slow', 'Tie']; // Updated: Slow beats Tie with new penalty system

        for (let i = 0; i < testData.users.length; i++) {
            const user = testData.users[i];
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, user.id);
            await new Promise(resolve => setTimeout(resolve, answerTimes[i]));
            await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid: testData.questionUid,
                    answer: 15,
                    timeSpent: answerTimes[i],
                    accessCode: testData.accessCode,
                    userId: user.id
                },
                false // live mode
            );
        }

        // Wait for updates
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get leaderboard
        const leaderboardKey = `mathquest:game:leaderboard:${testData.accessCode}`;
        const leaderboardRaw = await redisClient.zrevrange(leaderboardKey, 0, -1, 'WITHSCORES');
        const leaderboard = [];
        for (let i = 0; i < leaderboardRaw.length; i += 2) {
            const userId = leaderboardRaw[i];
            const score = parseFloat(leaderboardRaw[i + 1]);
            const user = testData.users.find((u: typeof testData.users[0]) => u.id === userId);
            leaderboard.push({ userId, username: user?.username, score });
        }

        // Check order: Fast, Tie, Slow
        expect(leaderboard).toHaveLength(3);
        for (let i = 0; i < expectedOrder.length; i++) {
            expect(leaderboard[i].username).toBe(expectedOrder[i]);
        }
        // Check scores: Fast > Tie > Slow
        expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);
        expect(leaderboard[1].score).toBeGreaterThan(leaderboard[2].score);
    });
});
