// Test to verify exactly what leaderboard data is emitted for deferred tournaments
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { redisClient } from '../../src/config/redis';
import { prisma } from '../../src/db/prisma';
import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';

describe('Deferred Tournament Leaderboard Emission Test', () => {
    let timerService: CanonicalTimerService;

    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
    });

    it('should check what leaderboard data is emitted for deferred tournaments', async () => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 5);
        const uniqueId = `${timestamp}-${randomId}`;

        const testData = {
            accessCode: `DEFERRED-TEST-${uniqueId}`,
            gameId: `game-${uniqueId}`,
            questionUid: `question-${uniqueId}`,
            userId: `user-${uniqueId}`,
            username: 'TestPlayer'
        };

        // Create minimal test setup
        const testUser = await prisma.user.create({
            data: {
                id: `test-teacher-${testData.accessCode}`,
                username: 'TestTeacher',
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
                name: 'Deferred Emission Test',
                description: 'Testing deferred leaderboard emission',
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

        const gameInstance = await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Deferred Test Game',
                playMode: 'tournament',
                status: 'completed', // Deferred tournaments have completed status
                gameTemplateId: testGameTemplate.id,
                differedAvailableFrom: new Date(),
                differedAvailableTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
                initiatorUserId: testUser.id
            }
        });

        // Create participant
        await prisma.user.upsert({
            where: { id: testData.userId },
            update: {},
            create: {
                id: testData.userId,
                username: testData.username,
                email: `${testData.userId}@example.com`,
                role: 'STUDENT'
            }
        });

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

        // Set up participants metadata in Redis
        const participantsKey = `mathquest:game:participants:${testData.accessCode}`;
        const participantMetadata = {
            username: testData.username,
            avatarEmoji: '🎮',
            nbAttempts: 1,
            isConnected: true,
            socketId: `socket-${uniqueId}`,
            score: 0 // Initially 0
        };

        await redisClient.hset(participantsKey, testData.userId, JSON.stringify(participantMetadata));

        console.log('\n🧪 DEFERRED TOURNAMENT LEADERBOARD EMISSION TEST');
        console.log('================================================');

        // 1. Create deferred session
        const attemptNum = 1;
        const sessionKey = `deferred_session:${testData.accessCode}:${testData.userId}:${attemptNum}`;
        await redisClient.hset(sessionKey, {
            score: '0',
            userId: testData.userId,
            username: testData.username,
            attemptNumber: attemptNum.toString(),
            startTime: Date.now().toString(),
            isComplete: 'false'
        });

        console.log(`📝 Created session: ${sessionKey}`);
        let sessionData = await redisClient.hgetall(sessionKey);
        console.log('📊 Session data before scoring:', sessionData);

        // 2. Start timer for deferred attempt
        await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, testData.userId, attemptNum);
        await new Promise(resolve => setTimeout(resolve, 50));

        // 3. Submit answer with scoring
        const result = await ScoringService.submitAnswerWithScoring(
            testData.gameId,
            testData.userId,
            {
                questionUid: testData.questionUid,
                answer: 42,
                timeSpent: 1000,
                accessCode: testData.accessCode,
                userId: testData.userId
            },
            true, // deferred mode
            attemptNum
        );

        console.log(`📊 Scoring result: ${JSON.stringify({
            scoreAdded: result.scoreAdded,
            totalScore: result.totalScore,
            scoreUpdated: result.scoreUpdated
        }, null, 2)}`);

        // 4. Check session data after scoring
        sessionData = await redisClient.hgetall(sessionKey);
        console.log('📊 Session data after scoring:', sessionData);

        // 5. Check participants metadata
        const participantsData = await redisClient.hgetall(participantsKey);
        console.log('👥 Participants metadata:', participantsData);

        // 6. Check global leaderboard (should be empty for deferred)
        const leaderboardKey = `mathquest:game:leaderboard:${testData.accessCode}`;
        const leaderboardRaw = await redisClient.zrevrange(leaderboardKey, 0, -1, 'WITHSCORES');
        console.log('🏆 Global leaderboard (should be empty):', leaderboardRaw);

        // 7. Simulate what the deferred flow would emit
        console.log('\n🔍 SIMULATING DEFERRED FLOW LEADERBOARD EMISSION:');
        console.log('================================================');

        // Get participant from database
        const participant = await prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId: testData.gameId,
                userId: testData.userId
            },
            include: {
                user: true
            }
        });

        if (participant) {
            // Exactly what deferredTournamentFlow.ts does
            const currentScore = sessionData.score ? parseFloat(sessionData.score) : 0;
            const singleUserLeaderboard = [{
                userId: participant.userId,
                username: participant.user?.username || 'Unknown',
                score: currentScore,
                avatarEmoji: participant.user?.avatarEmoji || '🐼',
                rank: 1
            }];

            console.log('🎯 Single-user leaderboard that would be emitted:', JSON.stringify(singleUserLeaderboard, null, 2));
            console.log(`🎯 Score from session: ${currentScore}`);
            console.log(`🎯 Session score raw: "${sessionData.score}"`);
            console.log(`🎯 Session score parsed: ${sessionData.score ? parseFloat(sessionData.score) : 'null/undefined'}`);
        }

        // Verify that the issue is really in session score storage
        expect(result.scoreUpdated).toBe(true);
        expect(result.scoreAdded).toBeGreaterThan(0);

        // The issue: session score should be updated but might not be
        const finalSessionScore = sessionData.score ? parseFloat(sessionData.score) : 0;
        console.log(`\n❗ DIAGNOSTIC: Final session score is ${finalSessionScore}, should be ${result.totalScore}`);

        if (finalSessionScore === 0) {
            console.log('🚨 BUG CONFIRMED: Session score is 0, but scoring service returned non-zero score');
            console.log('🔧 The issue is in the deferred session score update logic');
        } else {
            console.log('✅ Session score is correctly updated');
        }

        // Cleanup
        await prisma.numericQuestion.delete({ where: { questionUid: testData.questionUid } }).catch(() => { });
        await prisma.question.delete({ where: { uid: testData.questionUid } }).catch(() => { });
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } }).catch(() => { });
        await prisma.gameInstance.delete({ where: { id: testData.gameId } }).catch(() => { });
        await prisma.gameTemplate.delete({ where: { id: testGameTemplate.id } }).catch(() => { });
        await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
        await prisma.user.delete({ where: { id: testData.userId } }).catch(() => { });
    });
});
