// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { redisClient } from '@/config/redis';
import { prisma } from '@/db/prisma';
import { joinGame } from '@/core/services/gameParticipant/joinService';
import { ScoringService } from '@/core/services/scoringService';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';

/**
 * Test to reproduce the EXACT user-reported bug:
 * 1. Created a tournament
 * 2. Played it live  
 * 3. Played it deferred → shows 3 attempts (should show 1-2)
 * 4. Played it deferred again → shows 5 attempts (should show 2-3)
 * 
 * This test checks the ACTUAL DATABASE VALUES that the frontend sees.
 */
describe('User Reported Attempt Count Bug - Database Values', () => {
    let timerService: CanonicalTimerService;

    const testData = {
        userId: 'user-attempt-bug-test',
        accessCode: 'ATTEMPT-BUG-TEST',
        gameId: 'game-attempt-bug-test',
        teacherId: 'teacher-attempt-bug-test',
        questionUid: 'question-attempt-bug-test'
    };

    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
    });

    beforeEach(async () => {
        // Clean up Redis and database
        await redisClient.flushdb();

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

        // Create teacher
        await prisma.user.upsert({
            where: { id: testData.teacherId },
            update: {},
            create: {
                id: testData.teacherId,
                username: 'TestTeacher',
                email: 'teacher@example.com',
                role: 'TEACHER'
            }
        });

        // Create question
        await prisma.question.create({
            data: {
                uid: testData.questionUid,
                text: 'What is 2+2?',
                questionType: 'numeric',
                discipline: 'Mathematics',
                gradeLevel: 'CE1',
                author: 'test',
                timeLimit: 30,
                numericQuestion: {
                    create: {
                        correctAnswer: 4,
                        tolerance: 0
                    }
                }
            }
        });

        // Create game template
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Attempt Bug Test Template',
                description: 'Testing attempt count bug',
                creatorId: testData.teacherId
            }
        });

        // Link question to template
        await prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: gameTemplate.id,
                questionUid: testData.questionUid,
                sequence: 1
            }
        });

        // Create game instance (initially active for live play)
        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Attempt Bug Test Game',
                gameTemplateId: gameTemplate.id,
                playMode: 'tournament',
                status: 'active', // Start as active for live play
                initiatorUserId: testData.teacherId
            }
        });
    });

    afterEach(async () => {
        // Cleanup in dependency order
        await prisma.numericQuestion.deleteMany({ where: { questionUid: testData.questionUid } }).catch(() => { });
        await prisma.question.deleteMany({ where: { uid: testData.questionUid } }).catch(() => { });
        await prisma.gameParticipant.deleteMany({ where: { userId: testData.userId } }).catch(() => { });
        await prisma.questionsInGameTemplate.deleteMany({ where: { questionUid: testData.questionUid } }).catch(() => { });
        await prisma.gameInstance.deleteMany({ where: { id: testData.gameId } }).catch(() => { });
        await prisma.gameTemplate.deleteMany({ where: { name: 'Attempt Bug Test Template' } }).catch(() => { });
        await prisma.user.deleteMany({ where: { id: { in: [testData.userId, testData.teacherId] } } }).catch(() => { });
        await redisClient.flushdb();
    });

    it('should reproduce the exact bug: shows 3, then 5 attempts instead of 1, then 2', async () => {
        console.log('\n🐛 REPRODUCING USER-REPORTED BUG:');
        console.log('Expected: Live (1) → Deferred (1-2) → Deferred (2-3)');
        console.log('User sees: Live (1) → Deferred (3) → Deferred (5)');
        console.log('=====================================\n');

        // STEP 1: Play tournament LIVE
        console.log('📍 STEP 1: Playing tournament LIVE');

        const liveJoinResult = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'TestUser'
        });

        console.log('Live join result:', liveJoinResult.success);

        // Check DB after live join
        let participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('After LIVE join - DB values:', participant);
        expect(participant?.nbAttempts).toBe(1); // Should be 1 for live play

        // Simulate completing the live tournament (by scoring)
        await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, testData.userId);
        await new Promise(resolve => setTimeout(resolve, 50));

        const liveScoreResult = await ScoringService.submitAnswerWithScoring(
            testData.gameId,
            testData.userId,
            {
                questionUid: testData.questionUid,
                answer: 4,
                timeSpent: 1000,
                accessCode: testData.accessCode,
                userId: testData.userId
            },
            false // live mode
        );

        console.log('Live scoring result:', liveScoreResult.scoreAdded);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('After LIVE completion - DB values:', participant);
        expect(participant?.nbAttempts).toBe(1); // Should still be 1

        // STEP 2: Change tournament to COMPLETED (for deferred access)
        console.log('\n📍 STEP 2: Setting tournament to COMPLETED for deferred access');

        await prisma.gameInstance.update({
            where: { id: testData.gameId },
            data: {
                status: 'completed',
                differedAvailableFrom: new Date(Date.now() - 60000), // Available since 1 min ago
                differedAvailableTo: new Date(Date.now() + 60000)   // Available for 1 more min
            }
        });

        // STEP 3: Play tournament DEFERRED (first time)
        console.log('\n📍 STEP 3: Playing tournament DEFERRED (first time)');

        const firstDeferredJoinResult = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'TestUser'
        });

        console.log('First deferred join result:', firstDeferredJoinResult.success);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('After FIRST DEFERRED join - DB values:', participant);
        console.log('❌ BUG CHECK: User sees attempts =', participant?.nbAttempts, '(should be 1 or 2, but user reports 3)');

        // Complete the first deferred session with scoring
        await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, participant?.nbAttempts || 1);
        await new Promise(resolve => setTimeout(resolve, 50));

        const firstDeferredScoreResult = await ScoringService.submitAnswerWithScoring(
            testData.gameId,
            testData.userId,
            {
                questionUid: testData.questionUid,
                answer: 4,
                timeSpent: 2000,
                accessCode: testData.accessCode,
                userId: testData.userId
            },
            true, // deferred mode
            participant?.nbAttempts || 1
        );

        console.log('First deferred scoring result:', firstDeferredScoreResult.scoreAdded);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('After FIRST DEFERRED completion - DB values:', participant);

        // STEP 4: Play tournament DEFERRED (second time)
        console.log('\n📍 STEP 4: Playing tournament DEFERRED (second time)');

        const secondDeferredJoinResult = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'TestUser'
        });

        console.log('Second deferred join result:', secondDeferredJoinResult.success);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('After SECOND DEFERRED join - DB values:', participant);
        console.log('❌ BUG CHECK: User sees attempts =', participant?.nbAttempts, '(should be 2 or 3, but user reports 5)');

        // Complete the second deferred session
        await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, participant?.nbAttempts || 1);
        await new Promise(resolve => setTimeout(resolve, 50));

        const secondDeferredScoreResult = await ScoringService.submitAnswerWithScoring(
            testData.gameId,
            testData.userId,
            {
                questionUid: testData.questionUid,
                answer: 4,
                timeSpent: 1500,
                accessCode: testData.accessCode,
                userId: testData.userId
            },
            true, // deferred mode
            participant?.nbAttempts || 1
        );

        console.log('Second deferred scoring result:', secondDeferredScoreResult.scoreAdded);

        participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('After SECOND DEFERRED completion - DB values:', participant);

        // FINAL ANALYSIS
        console.log('\n🔍 FINAL ANALYSIS:');
        console.log('===================');
        console.log('Final nbAttempts in DB:', participant?.nbAttempts);
        console.log('Expected progression: 1 → 2 → 3');
        console.log('User reported seeing: 1 → 3 → 5');

        if (participant?.nbAttempts === 3) {
            console.log('✅ This test shows EXPECTED behavior (1 → 2 → 3)');
            console.log('🤔 The bug might be elsewhere or under different conditions');
        } else {
            console.log('❌ This test reproduced the bug!');
            console.log('🐛 nbAttempts =', participant?.nbAttempts, 'is not the expected 3');
        }

        // Test the frontend API that actually shows the attempt count
        console.log('\n📡 TESTING FRONTEND API (what user actually sees):');
        const response = await fetch(`http://localhost:3001/api/v1/games/${testData.accessCode}/leaderboard`);
        if (response.ok) {
            const leaderboardData = await response.json();
            console.log('Leaderboard API response:', JSON.stringify(leaderboardData, null, 2));

            const userEntry = leaderboardData.leaderboard?.find((entry: any) => entry.userId === testData.userId);
            if (userEntry) {
                console.log('User attempt count from API:', userEntry.attemptCount);
                console.log('Does this match what user reported?');
            }
        } else {
            console.log('Could not fetch leaderboard API (server might not be running)');
        }
    });
});
