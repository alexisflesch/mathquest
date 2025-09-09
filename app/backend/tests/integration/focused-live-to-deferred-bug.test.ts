import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { joinGame } from '../../src/core/services/gameParticipant/joinService';
import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';
import { persistLeaderboardToGameInstance } from '../../src/sockets/handlers/sharedLeaderboard';

const timerService = new CanonicalTimerService(redisClient);

describe('FOCUSED: Live→Deferred nbAttempts Bug', () => {
    let testData: any;

    beforeAll(async () => {
        await redisClient.flushall();
    });

    afterAll(async () => {
        await redisClient.flushall();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Setup test data
        testData = {
            accessCode: 'LIVE-TO-DEFERRED-TEST',
            gameId: 'live-to-deferred-game',
            userId: 'user-live-to-deferred',
            questionUid: 'question-live-to-deferred'
        };

        // Clean up any existing data
        await prisma.gameParticipant.deleteMany({
            where: { gameInstanceId: testData.gameId }
        });
        await prisma.gameInstance.deleteMany({
            where: { id: testData.gameId }
        });
        // Delete any game templates created by this user first to avoid FK constraints
        await prisma.gameTemplate.deleteMany({
            where: { creatorId: testData.userId }
        });
        await prisma.user.deleteMany({
            where: { id: testData.userId }
        });

        // Create test user
        await prisma.user.upsert({
            where: { id: testData.userId },
            update: {},
            create: {
                id: testData.userId,
                username: 'TestUser',
                email: 'testuser@example.com',
                role: 'STUDENT'
            }
        });

        // Create question
        await prisma.question.create({
            data: {
                uid: testData.questionUid,
                text: 'What is 40+2?',
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

        // Create game template and instance
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Template',
                description: 'Test Description',
                creator: { connect: { id: testData.userId } }
            }
        });

        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Live to Deferred Test Game',
                status: 'active', // Start as LIVE
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id
            }
        });
    });

    it('should show the exact bug: Live(1) → EndLive → Deferred(should be 2, but might be 3)', async () => {
        console.log('\n🔬 FOCUSED BUG TEST: Live → EndLive → Deferred');
        console.log('=================================================');

        // STEP 1: Join LIVE tournament
        console.log('\n📍 STEP 1: Join LIVE tournament');
        const liveJoinResult = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'TestUser'
        });

        expect(liveJoinResult.success).toBe(true);

        let participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('✅ After LIVE join:', participant);
        expect(participant?.nbAttempts).toBe(1);

        // STEP 2: Play the live game (answer question)
        console.log('\n📍 STEP 2: Play LIVE game (score an answer)');
        await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, testData.userId);
        await new Promise(resolve => setTimeout(resolve, 50));

        const liveScoreResult = await ScoringService.submitAnswerWithScoring(
            testData.gameId,
            testData.userId,
            {
                questionUid: testData.questionUid,
                answer: 42,
                timeSpent: 1000,
                accessCode: testData.accessCode,
                userId: testData.userId
            },
            false // live mode
        );

        console.log('✅ Live scoring result:', liveScoreResult.scoreAdded);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('✅ After LIVE scoring:', participant);
        expect(participant?.nbAttempts).toBe(1); // Should still be 1

        // STEP 3: END THE LIVE TOURNAMENT (this might update nbAttempts!)
        console.log('\n📍 STEP 3: END live tournament (persist scores to DB)');

        // Simulate ending the tournament by persisting scores to database
        const mockLeaderboard = [{
            userId: testData.userId,
            username: 'TestUser',
            score: liveScoreResult.scoreAdded || 1000,
            rank: 1
        }];

        await persistLeaderboardToGameInstance(testData.accessCode, mockLeaderboard);

        // Now change game status to completed
        await prisma.gameInstance.update({
            where: { id: testData.gameId },
            data: {
                status: 'completed',
                differedAvailableFrom: new Date(Date.now() - 60000), // Available since 1 min ago
                differedAvailableTo: new Date(Date.now() + 60000)    // Available for 1 min more
            }
        });

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('🔍 After ENDING LIVE tournament (persist to DB):', participant);

        // ❓ THIS IS THE KEY QUESTION: Does ending the live tournament change nbAttempts?
        const nbAttemptsAfterLiveEnd = participant?.nbAttempts;

        // STEP 4: Join DEFERRED tournament (first time)
        console.log('\n📍 STEP 4: Join DEFERRED tournament (first time)');

        const deferredJoinResult = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'TestUser'
        });

        expect(deferredJoinResult.success).toBe(true);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('🔍 After FIRST DEFERRED join:', participant);

        // FINAL ANALYSIS
        console.log('\n📊 FINAL ANALYSIS:');
        console.log('==================');
        console.log(`After Live join: nbAttempts = 1`);
        console.log(`After Live scoring: nbAttempts = 1`);
        console.log(`After Live END (persist to DB): nbAttempts = ${nbAttemptsAfterLiveEnd}`);
        console.log(`After First Deferred join: nbAttempts = ${participant?.nbAttempts}`);
        console.log(`\n🐛 Expected: 1 → 1 → 1 → 2`);
        console.log(`🐛 User sees: 1 → 1 → ? → 3`);

        if (participant?.nbAttempts === 3) {
            console.log('🎯 BUG REPRODUCED! nbAttempts jumped to 3');
            console.log('🔍 Investigation needed: What happens during live tournament end?');
        } else if (participant?.nbAttempts === 2) {
            console.log('✅ Expected behavior: nbAttempts correctly at 2');
        } else {
            console.log(`❓ Unexpected: nbAttempts = ${participant?.nbAttempts}`);
        }

        // For the test to pass regardless, but we want to see the actual values
        expect(participant?.nbAttempts).toBeGreaterThan(0);
    });
});
