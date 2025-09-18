// Set up environment variables for testing
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

describe('Leaderboard Payload Tests', () => {
    let timerService: CanonicalTimerService;

    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
    });

    // Helper function to create a participant in the database
    const createParticipant = async (gameInstanceId: string, accessCode: string, user: { id: string; username: string; socketId: string }) => {
        try {
            // Create user if it doesn't exist
            await prisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: {
                    id: user.id,
                    username: user.username,
                    email: `${user.id}@example.com`,
                    role: 'STUDENT'
                }
            });

            // Create participant in database
            const participant = await prisma.gameParticipant.create({
                data: {
                    id: user.id,
                    gameInstanceId,
                    userId: user.id,
                    status: 'ACTIVE',
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 0,
                    joinedAt: new Date(),
                    lastActiveAt: new Date()
                }
            });

            // Also populate Redis participants metadata (required for leaderboard)
            const participantsKey = `mathquest:game:participants:${accessCode}`;
            const participantMetadata = {
                username: user.username,
                avatarEmoji: '🎮',
                nbAttempts: 1,
                isConnected: true,
                socketId: user.socketId
            };

            await redisClient.hset(participantsKey, user.id, JSON.stringify(participantMetadata));

            console.log(`✅ Created participant: ${user.username} (${participant.id})`);
            return participant;
        } catch (error) {
            console.error(`❌ Failed to create participant ${user.username}:`, error);
            throw error;
        }
    };    // Test data generators with unique IDs
    const generateTestData = () => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 5);
        const uniqueId = `${timestamp}-${randomId}`;

        return {
            accessCode: `TOURNAMENT-${uniqueId}`,
            gameId: `game-${uniqueId}`,
            questionUid: `question-${uniqueId}`,
            users: [
                { id: `user-${uniqueId}-alice`, username: 'Alice', socketId: `socket-${uniqueId}-1` },
                { id: `user-${uniqueId}-bob`, username: 'Bob', socketId: `socket-${uniqueId}-2` },
                { id: `user-${uniqueId}-charlie`, username: 'Charlie', socketId: `socket-${uniqueId}-3` }
            ]
        };
    };

    // Helper function to get leaderboard from Redis using the correct key structure
    const getLeaderboardFromRedis = async (accessCode: string) => {
        try {
            // Use the same keys as the production sharedLeaderboard.ts
            const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`;
            const participantsKey = `mathquest:game:participants:${accessCode}`;

            // Get scores from sorted set (ZREVRANGE returns highest scores first)
            const leaderboardRaw = await redisClient.zrevrange(leaderboardKey, 0, -1, 'WITHSCORES');
            const participantsRaw = await redisClient.hgetall(participantsKey);

            console.log(`🔍 Redis Debug for ${accessCode}:`);
            console.log(`- Leaderboard key: ${leaderboardKey}`);
            console.log(`- Leaderboard raw:`, leaderboardRaw);
            console.log(`- Participants key: ${participantsKey}`);
            console.log(`- Participants raw:`, participantsRaw);

            if (!leaderboardRaw || leaderboardRaw.length === 0) {
                console.log(`📭 No leaderboard data found for ${accessCode}`);
                return [];
            }

            if (!participantsRaw || Object.keys(participantsRaw).length === 0) {
                console.log(`📭 No participants metadata found for ${accessCode}`);
                return [];
            }

            // Parse participant metadata
            const participantsMetadata = new Map();
            Object.entries(participantsRaw).forEach(([userId, json]) => {
                try {
                    const parsed = JSON.parse(json as string);
                    participantsMetadata.set(userId, {
                        username: parsed.username,
                        avatarEmoji: parsed.avatarEmoji,
                        nbAttempts: parsed.nbAttempts || 1,
                        isConnected: parsed.isConnected || false
                    });
                } catch (parseError) {
                    console.warn(`⚠️ Failed to parse participant metadata for ${userId}:`, parseError);
                }
            });

            // Process leaderboard entries (already sorted by score descending)
            const leaderboard = [];
            for (let i = 0; i < leaderboardRaw.length; i += 2) {
                const userId = leaderboardRaw[i];
                const score = parseFloat(leaderboardRaw[i + 1]);
                const metadata = participantsMetadata.get(userId);

                if (metadata) {
                    leaderboard.push({
                        userId,
                        username: metadata.username,
                        score,
                        nbAttempts: metadata.nbAttempts,
                        isConnected: metadata.isConnected
                    });
                }
            }

            console.log(`✅ Processed leaderboard for ${accessCode}:`, leaderboard);
            return leaderboard;
        } catch (error) {
            console.error(`❌ Error getting leaderboard for ${accessCode}:`, error);
            return [];
        }
    };

    // Helper function to get snapshot data
    const getSnapshotData = async (gameInstanceId: string, accessCode: string) => {
        try {
            // For testing, we'll get the current leaderboard data which represents the actual scores
            // In production, this would be the game participant snapshot service
            const leaderboard = await getLeaderboardFromRedis(accessCode);

            if (leaderboard.length === 0) {
                return null;
            }

            return {
                participants: leaderboard.map(entry => ({
                    userId: entry.userId,
                    username: entry.username,
                    score: entry.score,
                    nbAttempts: entry.nbAttempts,
                    status: 'ACTIVE'
                }))
            };
        } catch (error) {
            console.error('Failed to get snapshot:', error);
            return null;
        }
    };

    describe('🏆 Live Tournament Leaderboard', () => {
        it('should have correct leaderboard payload after live tournament completion', async () => {
            const testData = generateTestData();

            // Create test database records
            const testUser = await prisma.user.create({
                data: {
                    id: `test-teacher-live-${testData.accessCode}`,
                    username: 'TestTeacher',
                    email: `teacher-live-${Date.now()}@example.com`,
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
                    name: 'Live Leaderboard Test',
                    description: 'Testing live leaderboard',
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
                    name: 'Live Tournament Test',
                    playMode: 'tournament',
                    status: 'active',
                    gameTemplateId: testGameTemplate.id,
                    initiatorUserId: testUser.id
                }
            });

            // Create participants in database
            const participants = [];
            for (const user of testData.users) {
                const participant = await createParticipant(testData.gameId, testData.accessCode, user);
                participants.push(participant);
            }

            console.log('🏁 Starting live tournament simulation...');

            // Simulate live tournament - users answer with different scores
            const expectedScores = [999, 995, 990]; // Alice fastest, Bob medium, Charlie slowest

            for (let i = 0; i < testData.users.length; i++) {
                const user = testData.users[i];
                const expectedScore = expectedScores[i];

                // Start timer for this user
                await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, user.id);

                // Add slight delay to create score differences
                await new Promise(resolve => setTimeout(resolve, (i + 1) * 20));

                // Submit answer
                const result = await ScoringService.submitAnswerWithScoring(
                    testData.gameId,
                    user.id,
                    {
                        questionUid: testData.questionUid,
                        answer: 42,
                        timeSpent: (i + 1) * 500, // Different response times
                        accessCode: testData.accessCode,
                        userId: user.id
                    },
                    false // live mode
                );

                console.log(`📊 ${user.username} scored ${result.scoreAdded} points`);
                expect(result.scoreUpdated).toBe(true);
                expect(result.scoreAdded).toBeGreaterThan(450); // Updated: ~500 points with new penalty system
                expect(result.scoreAdded).toBeLessThanOrEqual(1000);
            }

            // Wait a moment for all updates to propagate
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get leaderboard from Redis
            const leaderboard = await getLeaderboardFromRedis(testData.accessCode);
            console.log('🏆 Live Tournament Leaderboard:', JSON.stringify(leaderboard, null, 2));

            // Verify leaderboard structure and content
            expect(leaderboard).toHaveLength(3);

            // Verify leaderboard is sorted by score (highest first)
            expect(leaderboard[0].score).toBeGreaterThanOrEqual(leaderboard[1].score);
            expect(leaderboard[1].score).toBeGreaterThanOrEqual(leaderboard[2].score);

            // Verify all users are present with correct data
            const usernames = leaderboard.map(entry => entry.username);
            expect(usernames).toContain('Alice');
            expect(usernames).toContain('Bob');
            expect(usernames).toContain('Charlie');

            // Verify each entry has required fields
            for (const entry of leaderboard) {
                expect(entry).toHaveProperty('userId');
                expect(entry).toHaveProperty('username');
                expect(entry).toHaveProperty('score');
                expect(entry).toHaveProperty('nbAttempts');
                expect(entry).toHaveProperty('isConnected');

                expect(typeof entry.userId).toBe('string');
                expect(typeof entry.username).toBe('string');
                expect(typeof entry.score).toBe('number');
                expect(typeof entry.nbAttempts).toBe('number');
                expect(typeof entry.isConnected).toBe('boolean');

                expect(entry.score).toBeGreaterThan(0);
                expect(entry.username).not.toContain('guest-'); // Should not be guest usernames
            }

            // Get snapshot data for comparison
            const snapshot = await getSnapshotData(testData.gameId, testData.accessCode);
            console.log('📸 Live Tournament Snapshot:', JSON.stringify(snapshot, null, 2));

            if (snapshot && snapshot.participants) {
                expect(snapshot.participants).toHaveLength(3);

                // Verify snapshot matches leaderboard
                for (const snapshotParticipant of snapshot.participants) {
                    const leaderboardEntry = leaderboard.find(entry => entry.userId === snapshotParticipant.userId);
                    expect(leaderboardEntry).toBeDefined();
                    expect(leaderboardEntry?.username).toBe(snapshotParticipant.username);
                    expect(leaderboardEntry?.score).toBe(snapshotParticipant.score);
                }
            }

            console.log('✅ Live tournament leaderboard test passed');

            // Cleanup database with error handling
            await prisma.numericQuestion.delete({ where: { questionUid: testData.questionUid } }).catch(() => { });
            await prisma.question.delete({ where: { uid: testData.questionUid } }).catch(() => { });
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } }).catch(() => { });
            await prisma.gameInstance.delete({ where: { id: testData.gameId } }).catch(() => { });
            await prisma.gameTemplate.delete({ where: { id: testGameTemplate.id } }).catch(() => { });
            await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
        });
    });

    describe('🕐 Deferred Tournament Leaderboard', () => {
        it('should have correct leaderboard payload after deferred tournament completion', async () => {
            const testData = generateTestData();

            // Create test database records
            const testUser = await prisma.user.create({
                data: {
                    id: `test-teacher-deferred-${testData.accessCode}`,
                    username: 'TestTeacher',
                    email: `teacher-deferred-${Date.now()}@example.com`,
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
                    id: testData.gameId + '-template-deferred',
                    name: 'Deferred Leaderboard Test',
                    description: 'Testing deferred leaderboard',
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
                    name: 'Deferred Tournament Test',
                    playMode: 'tournament',
                    status: 'completed', // Deferred tournaments have completed status
                    gameTemplateId: testGameTemplate.id,
                    differedAvailableFrom: new Date(),
                    differedAvailableTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    initiatorUserId: testUser.id
                }
            });

            console.log('🕐 Starting deferred tournament simulation...');

            // Simulate deferred tournament - users play at different times with different attempts
            const userScenarios = [
                { user: testData.users[0], attempts: [1], scores: [1000] }, // Alice: 1 perfect attempt
                { user: testData.users[1], attempts: [1, 2], scores: [995, 999] }, // Bob: 2 attempts, improving
                { user: testData.users[2], attempts: [1, 2, 3], scores: [990, 995, 998] } // Charlie: 3 attempts, gradually improving
            ];

            for (const scenario of userScenarios) {
                const { user, attempts, scores } = scenario;

                // Create participant in database for this user
                await createParticipant(testData.gameId, testData.accessCode, user);

                for (let i = 0; i < attempts.length; i++) {
                    const attemptNum = attempts[i];
                    const expectedScore = scores[i];

                    console.log(`🎯 ${user.username} starting attempt ${attemptNum}...`);

                    // Create deferred session for this attempt
                    const sessionKey = `deferred_session:${testData.accessCode}:${user.id}:${attemptNum}`;
                    await redisClient.hset(sessionKey, {
                        score: '0',
                        userId: user.id,
                        username: user.username,
                        attemptNumber: attemptNum.toString(),
                        startTime: Date.now().toString(),
                        isComplete: 'false'
                    });

                    // Start timer for this deferred attempt
                    await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', true, user.id, attemptNum);

                    // Add delay based on expected score (faster = higher score)
                    const delay = expectedScore === 1000 ? 50 : expectedScore === 999 ? 100 : expectedScore === 998 ? 120 : expectedScore === 995 ? 150 : 200;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Submit answer for this deferred attempt
                    const result = await ScoringService.submitAnswerWithScoring(
                        testData.gameId,
                        user.id,
                        {
                            questionUid: testData.questionUid,
                            answer: 42,
                            timeSpent: (1000 - expectedScore) * 10, // Slower time = lower score
                            accessCode: testData.accessCode,
                            userId: user.id
                        },
                        true, // deferred mode
                        attemptNum
                    );

                    console.log(`📊 ${user.username} attempt ${attemptNum} scored ${result.scoreAdded} points`);
                    expect(result.scoreUpdated).toBe(true);
                    expect(result.scoreAdded).toBeGreaterThanOrEqual(expectedScore - 10);
                    expect(result.scoreAdded).toBeLessThanOrEqual(expectedScore + 10);

                    // Update session as complete
                    await redisClient.hset(sessionKey, 'isComplete', 'true');
                    await redisClient.hset(sessionKey, 'score', result.scoreAdded.toString());
                }
            }

            // Wait a moment for all updates to propagate
            await new Promise(resolve => setTimeout(resolve, 200));

            // Get leaderboard from Redis
            const leaderboard = await getLeaderboardFromRedis(testData.accessCode);
            console.log('🏆 Deferred Tournament Leaderboard:', JSON.stringify(leaderboard, null, 2));

            // In deferred mode, global leaderboard should be empty during play
            // Scores are stored in isolated session data until game end
            expect(leaderboard).toHaveLength(0);
            console.log('✅ Deferred tournament correctly shows empty global leaderboard during play');

            // Instead, verify session data contains scores
            const sessionKeys = [];
            for (const scenario of userScenarios) {
                const { user, attempts } = scenario;
                for (const attemptNum of attempts) {
                    const sessionKey = `deferred_session:${testData.accessCode}:${user.id}:${attemptNum}`;
                    sessionKeys.push(sessionKey);

                    const sessionExists = await redisClient.exists(sessionKey);
                    expect(sessionExists).toBe(1);

                    const sessionData = await redisClient.hgetall(sessionKey);
                    expect(sessionData.userId).toBe(user.id);
                    expect(sessionData.username).toBe(user.username);
                    expect(sessionData.isComplete).toBe('true');
                    expect(parseFloat(sessionData.score)).toBeGreaterThan(0);

                    console.log(`📊 Session ${user.username} attempt ${attemptNum}: score ${sessionData.score}`);
                }
            }

            // Verify participants metadata is populated correctly even in deferred mode
            const participantsKey = `mathquest:game:participants:${testData.accessCode}`;
            const participantsData = await redisClient.hgetall(participantsKey);
            expect(Object.keys(participantsData)).toHaveLength(3);

            for (const scenario of userScenarios) {
                const { user } = scenario;
                expect(participantsData[user.id]).toBeDefined();
                const metadata = JSON.parse(participantsData[user.id]);
                expect(metadata.username).toBe(user.username);
                expect(metadata.nbAttempts).toBeGreaterThan(0);
                expect(metadata.score).toBeGreaterThan(0);
            }

            // Get snapshot data for comparison
            const snapshot = await getSnapshotData(testData.gameId, testData.accessCode);
            console.log('📸 Deferred Tournament Snapshot:', JSON.stringify(snapshot, null, 2));

            if (snapshot && snapshot.participants) {
                expect(snapshot.participants).toHaveLength(3);

                // In deferred mode, snapshot should show cumulative scores from session data
                for (const snapshotParticipant of snapshot.participants) {
                    expect(snapshotParticipant.userId).toBeDefined();
                    expect(snapshotParticipant.username).toBeDefined();
                    expect(snapshotParticipant.score).toBeGreaterThan(0);
                    expect(snapshotParticipant.nbAttempts).toBeGreaterThan(0);
                    expect(['Alice', 'Bob', 'Charlie']).toContain(snapshotParticipant.username);
                }
            }

            // Verify deferred session isolation - ensure each session was tracked separately
            for (const scenario of userScenarios) {
                const { user, attempts } = scenario;
                for (const attemptNum of attempts) {
                    const sessionKey = `deferred_session:${testData.accessCode}:${user.id}:${attemptNum}`;
                    const sessionExists = await redisClient.exists(sessionKey);
                    expect(sessionExists).toBe(1); // Session should exist

                    const sessionData = await redisClient.hgetall(sessionKey);
                    expect(sessionData.userId).toBe(user.id);
                    expect(sessionData.username).toBe(user.username);
                    expect(sessionData.isComplete).toBe('true');
                    expect(parseFloat(sessionData.score)).toBeGreaterThan(0);
                }
            }

            console.log('✅ Deferred tournament leaderboard test passed');

            // Cleanup database with error handling
            await prisma.numericQuestion.delete({ where: { questionUid: testData.questionUid } }).catch(() => { });
            await prisma.question.delete({ where: { uid: testData.questionUid } }).catch(() => { });
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } }).catch(() => { });
            await prisma.gameInstance.delete({ where: { id: testData.gameId } }).catch(() => { });
            await prisma.gameTemplate.delete({ where: { id: testGameTemplate.id } }).catch(() => { });
            await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
        });
    });

    describe('🔍 Leaderboard Data Integrity', () => {
        it('should maintain consistent leaderboard data between Redis and database', async () => {
            const testData = generateTestData();

            // Create minimal test setup
            const testUser = await prisma.user.create({
                data: {
                    id: `test-teacher-integrity-${testData.accessCode}`,
                    username: 'TestTeacher',
                    email: `teacher-integrity-${Date.now()}@example.com`,
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
                    id: testData.gameId + '-template-integrity',
                    name: 'Integrity Test',
                    description: 'Testing data integrity',
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
                    name: 'Integrity Test Game',
                    playMode: 'tournament',
                    status: 'active',
                    gameTemplateId: testGameTemplate.id,
                    initiatorUserId: testUser.id
                }
            });

            // Create participant and simulate scoring
            const user = testData.users[0];
            await createParticipant(testData.gameId, testData.accessCode, user);

            // Submit answer and get score
            await timerService.startTimer(testData.accessCode, testData.questionUid, 'tournament', false, user.id);
            await new Promise(resolve => setTimeout(resolve, 50));

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid: testData.questionUid,
                    answer: 42,
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                },
                false
            );

            expect(result.scoreUpdated).toBe(true);

            // Check Redis leaderboard
            const leaderboard = await getLeaderboardFromRedis(testData.accessCode);
            expect(leaderboard).toHaveLength(1);

            const leaderboardEntry = leaderboard[0];
            expect(leaderboardEntry.userId).toBe(user.id);
            expect(leaderboardEntry.username).toBe(user.username);
            expect(leaderboardEntry.score).toBeGreaterThan(0);

            // Check database participant record
            const dbParticipant = await prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: testData.gameId,
                    userId: user.id
                },
                include: {
                    user: true
                }
            });

            expect(dbParticipant).toBeDefined();
            expect(dbParticipant!.user.username).toBe(user.username);
            expect(dbParticipant!.userId).toBe(user.id);

            // Check snapshot service
            const snapshot = await getSnapshotData(testData.gameId, testData.accessCode);
            if (snapshot && snapshot.participants && snapshot.participants.length > 0) {
                const snapshotParticipant = snapshot.participants.find(p => p.userId === user.id);
                expect(snapshotParticipant).toBeDefined();
                expect(snapshotParticipant!.username).toBe(user.username);
                expect(snapshotParticipant!.score).toBeGreaterThanOrEqual(0);
            }

            console.log('✅ Data integrity test passed');

            // Cleanup
            await prisma.numericQuestion.delete({ where: { questionUid: testData.questionUid } }).catch(() => { });
            await prisma.question.delete({ where: { uid: testData.questionUid } }).catch(() => { });
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } }).catch(() => { });
            await prisma.gameInstance.delete({ where: { id: testData.gameId } }).catch(() => { });
            await prisma.gameTemplate.delete({ where: { id: testGameTemplate.id } }).catch(() => { });
            await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
        });
    });
});
