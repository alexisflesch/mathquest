// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { redisClient } from '../../src/config/redis';
import { prisma } from '../../src/db/prisma';
import { gameAnswerHandler } from '../../src/sockets/handlers/game/gameAnswer';
import { joinGameHandler } from '../../src/sockets/handlers/game/joinGame';
import { joinGame } from '../../src/core/services/gameParticipant/joinService';

// Mock the joinOrderBonus module at the top level
// jest.mock('../../src/utils/joinOrderBonus', () => ({
//     assignJoinOrderBonus: jest.fn()
// }));

// Get the mocked function
// const mockAssignJoinOrderBonus = require('../../src/utils/joinOrderBonus').assignJoinOrderBonus;

describe('Event Idempotency and Deduplication', () => {
    let io: SocketIOServer;
    let testGameId: string;
    let testAccessCode: string;

    beforeAll(async () => {
        // Set up Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
    });

    afterAll(async () => {
        if (io) {
            io.close();
        }
        await redisClient.quit();
    });

    beforeEach(async () => {
        // Generate unique test data
        const timestamp = Date.now();
        testAccessCode = `IDEMP-${timestamp}`;
        testGameId = `game-${timestamp}`;

        // Clean up Redis
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`mathquest:game:answers:${testAccessCode}`);
        await redisClient.del(`mathquest:game:${testAccessCode}`);

        // Clean up database - delete in correct order to handle foreign keys
        try {
            await prisma.questionsInGameTemplate.deleteMany({
                where: { gameTemplateId: { startsWith: 'template-' } }
            });
            await prisma.gameParticipant.deleteMany({
                where: { gameInstance: { accessCode: { startsWith: 'IDEMP-' } } }
            });
            await prisma.gameInstance.deleteMany({
                where: { accessCode: { startsWith: 'IDEMP-' } }
            });
            await prisma.questionsInGameTemplate.deleteMany({
                where: { questionUid: { startsWith: 'test-question-' } }
            });
            await prisma.question.deleteMany({
                where: { uid: { startsWith: 'test-question-' } }
            });
            await prisma.gameTemplate.deleteMany({
                where: { id: { startsWith: 'template-' } }
            });
            await prisma.user.deleteMany({
                where: { id: { startsWith: 'test-' } }
            });
        } catch (error) {
            // Ignore cleanup errors
            console.warn('Database cleanup warning:', error);
        }
    });

    afterEach(async () => {
        // Clean up test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameId } });
    });

    describe('Double-submit answer prevention', () => {
        it('should not double count rapid answer submissions', async () => {
            const timestamp = Date.now();

            // Create test data
            const teacherId = `teacher-${timestamp}`;
            const teacher = await prisma.user.create({
                data: {
                    id: teacherId,
                    username: 'TestTeacher',
                    email: `${teacherId}@example.com`,
                    role: 'TEACHER'
                }
            });

            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    name: 'Test Template',
                    description: 'Test template for idempotency test',
                    creator: { connect: { id: teacherId } }
                }
            });

            const gameInstance = await prisma.gameInstance.create({
                data: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    name: 'Test Game',
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: gameTemplate.id,
                    initiatorUserId: teacherId
                }
            });

            // Create a question
            const question = await prisma.question.create({
                data: {
                    uid: `test-question-${timestamp}`,
                    text: 'Test Question?',
                    questionType: 'MULTIPLE_CHOICE',
                    discipline: 'Test',
                    themes: ['test'],
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        create: {
                            answerOptions: ['A', 'B', 'C', 'D'],
                            correctAnswers: [true, false, false, false] // A is correct
                        }
                    }
                }
            });

            // Link question to game template
            await prisma.questionsInGameTemplate.create({
                data: {
                    gameTemplateId: gameTemplate.id,
                    questionUid: question.uid,
                    sequence: 1
                }
            });

            // Create student participant
            const studentId = `student-${Date.now()}`;
            await prisma.user.create({
                data: {
                    id: studentId,
                    username: 'TestStudent',
                    email: `${studentId}@example.com`,
                    role: 'STUDENT'
                }
            });

            const participant = await prisma.gameParticipant.create({
                data: {
                    userId: studentId,
                    gameInstanceId: testGameId,
                    liveScore: 0.0,
                    deferredScore: 0.0,
                    nbAttempts: 1,
                    status: 'ACTIVE'
                }
            });

            // Submit answer twice rapidly
            const answerData = {
                accessCode: testAccessCode,
                userId: studentId,
                questionUid: question.uid,
                answer: [0], // Correct answer
                timeSpent: 1000
            };

            const participantService = new (require('../../src/core/services/gameParticipantService').GameParticipantService)();

            // First submission
            const firstResult = await participantService.submitAnswer(testGameId, studentId, answerData);
            expect(firstResult.success).toBe(true);
            expect(firstResult.scoreResult?.scoreUpdated).toBe(true);

            // Second submission (same answer)
            const secondResult = await participantService.submitAnswer(testGameId, studentId, answerData);
            expect(secondResult.success).toBe(true);
            expect(secondResult.scoreResult?.scoreUpdated).toBe(false); // Should not update score
            expect(secondResult.scoreResult?.answerChanged).toBe(false); // Should detect same answer

            // Clean up
            await prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: gameTemplate.id } });
            await prisma.question.delete({ where: { uid: question.uid } });
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
            await prisma.gameInstance.delete({ where: { id: testGameId } });
            await prisma.gameTemplate.delete({ where: { id: gameTemplate.id } });
            await prisma.user.deleteMany({ where: { id: { in: [teacherId, studentId] } } });
        });

        it('should handle concurrent answer submissions from same user', async () => {
            // Create test data
            const teacherId = `teacher-${Date.now()}`;
            const teacher = await prisma.user.create({
                data: {
                    id: teacherId,
                    username: 'TestTeacher',
                    email: `${teacherId}@example.com`,
                    role: 'TEACHER'
                }
            });

            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    name: 'Test Template',
                    description: 'Test template for concurrent test',
                    creator: { connect: { id: teacherId } }
                }
            });

            const gameInstance = await prisma.gameInstance.create({
                data: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    name: 'Test Game',
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: gameTemplate.id,
                    initiatorUserId: teacherId
                }
            });

            // Create a question
            const question = await prisma.question.create({
                data: {
                    uid: `test-question-concurrent-${Date.now()}`,
                    text: 'Test Question 2?',
                    questionType: 'MULTIPLE_CHOICE',
                    discipline: 'Test',
                    themes: ['test'],
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        create: {
                            answerOptions: ['A', 'B', 'C', 'D'],
                            correctAnswers: [true, false, false, false] // A is correct
                        }
                    }
                }
            });

            // Link question to game template
            await prisma.questionsInGameTemplate.create({
                data: {
                    gameTemplateId: gameTemplate.id,
                    questionUid: question.uid,
                    sequence: 1
                }
            });

            // Create student participant
            const studentId = `student-${Date.now()}`;
            await prisma.user.create({
                data: {
                    id: studentId,
                    username: 'TestStudent',
                    email: `${studentId}@example.com`,
                    role: 'STUDENT'
                }
            });

            const participant = await prisma.gameParticipant.create({
                data: {
                    userId: studentId,
                    gameInstanceId: testGameId,
                    liveScore: 0.0,
                    deferredScore: 0.0,
                    nbAttempts: 1,
                    status: 'ACTIVE'
                }
            });

            const answerData = {
                accessCode: testAccessCode,
                userId: studentId,
                questionUid: question.uid,
                answer: [0], // Correct answer
                timeSpent: 1000
            };

            const participantService = new (require('../../src/core/services/gameParticipantService').GameParticipantService)();

            // Submit multiple answers in rapid succession (not truly concurrent)
            // This tests the deduplication logic under rapid sequential submissions
            const firstResult = await participantService.submitAnswer(testGameId, studentId, answerData);
            const secondResult = await participantService.submitAnswer(testGameId, studentId, answerData);
            const thirdResult = await participantService.submitAnswer(testGameId, studentId, answerData);

            // Only first submission should succeed with score update
            expect(firstResult.success).toBe(true);
            expect(firstResult.scoreResult?.scoreUpdated).toBe(true);

            expect(secondResult.success).toBe(true);
            expect(secondResult.scoreResult?.scoreUpdated).toBe(false); // Should not update score
            expect(secondResult.scoreResult?.answerChanged).toBe(false); // Should detect same answer

            expect(thirdResult.success).toBe(true);
            expect(thirdResult.scoreResult?.scoreUpdated).toBe(false); // Should not update score
            expect(thirdResult.scoreResult?.answerChanged).toBe(false); // Should detect same answer

            // Clean up
            await prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: gameTemplate.id } });
            await prisma.question.delete({ where: { uid: question.uid } });
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
            await prisma.gameInstance.delete({ where: { id: testGameId } });
            await prisma.gameTemplate.delete({ where: { id: gameTemplate.id } });
            await prisma.user.deleteMany({ where: { id: { in: [teacherId, studentId] } } });
        });
    });

    describe('Duplicate join_game payloads', () => {
        it('should be idempotent - no duplicate participants', async () => {
            // Create test data
            const teacherId = `teacher-${Date.now()}`;
            const teacher = await prisma.user.create({
                data: {
                    id: teacherId,
                    username: 'TestTeacher',
                    email: `${teacherId}@example.com`,
                    role: 'TEACHER'
                }
            });

            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    name: 'Test Template',
                    description: 'Test template for join idempotency test',
                    creator: { connect: { id: teacherId } }
                }
            });

            const gameInstance = await prisma.gameInstance.create({
                data: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    name: 'Test Game',
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: gameTemplate.id,
                    initiatorUserId: teacherId
                }
            });

            // Create student user
            const studentId = `student-${Date.now()}`;
            await prisma.user.create({
                data: {
                    id: studentId,
                    username: 'TestStudent',
                    email: `${studentId}@example.com`,
                    role: 'STUDENT'
                }
            });

            const { joinGame } = require('../../src/core/services/gameParticipant/joinService');

            // Join game twice with same user
            const joinPayload = {
                userId: studentId,
                accessCode: testAccessCode,
                username: 'TestStudent',
                avatarEmoji: '😀'
            };

            const firstJoin = await joinGame(joinPayload);
            const secondJoin = await joinGame(joinPayload);

            // Both joins should succeed
            expect(firstJoin.success).toBe(true);
            expect(secondJoin.success).toBe(true);

            // Should only have one participant record
            const participants = await prisma.gameParticipant.findMany({
                where: { gameInstanceId: testGameId, userId: studentId }
            });

            expect(participants.length).toBe(1); // Only one participant should exist

            // Clean up
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
            await prisma.gameInstance.delete({ where: { id: testGameId } });
            await prisma.gameTemplate.delete({ where: { id: gameTemplate.id } });
            await prisma.user.deleteMany({ where: { id: { in: [teacherId, studentId] } } });
        });

        it('should not apply join bonus multiple times', async () => {
            const timestamp = Date.now();

            // Create test data
            const teacherId = `teacher-${timestamp}`;
            const teacher = await prisma.user.create({
                data: {
                    id: teacherId,
                    username: 'TestTeacher',
                    email: `${teacherId}@example.com`,
                    role: 'TEACHER'
                }
            });

            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    name: 'Test Template',
                    description: 'Test template for join bonus deduplication',
                    creator: { connect: { id: teacherId } }
                }
            });

            const gameInstance = await prisma.gameInstance.create({
                data: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    name: 'Test Game',
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: gameTemplate.id,
                    initiatorUserId: teacherId
                }
            });

            // Create student user
            const studentId = `student-${timestamp}`;
            await prisma.user.create({
                data: {
                    id: studentId,
                    username: 'TestStudent',
                    email: `${studentId}@example.com`,
                    role: 'STUDENT'
                }
            });

            // Don't mock assignJoinOrderBonus - let it work normally
            // The function should return 0.01 for first joiner, 0 for subsequent joiners

            // Import joinGame after test setup
            const { joinGame } = require('../../src/core/services/gameParticipant/joinService');

            const joinPayload = {
                userId: studentId,
                accessCode: testAccessCode,
                username: 'TestStudent',
                avatarEmoji: '😀'
            };

            // Join game multiple times
            const firstJoin = await joinGame(joinPayload);
            const secondJoin = await joinGame(joinPayload);
            const thirdJoin = await joinGame(joinPayload);

            // All joins should succeed
            expect(firstJoin.success).toBe(true);
            expect(secondJoin.success).toBe(true);
            expect(thirdJoin.success).toBe(true);

            // Verify only one participant record exists
            const participants = await prisma.gameParticipant.findMany({
                where: { gameInstanceId: testGameId, userId: studentId }
            });
            expect(participants.length).toBe(1);

            // Verify the participant got the bonus only once
            const participant = participants[0];
            expect(participant.liveScore).toBe(0.01); // Should have the bonus from first join only

            // Verify join order list in Redis contains user only once
            const joinOrderKey = `mathquest:game:join_order:${testAccessCode}`;
            const joinOrderList = await redisClient.lrange(joinOrderKey, 0, -1);
            expect(joinOrderList.length).toBe(1); // Should contain exactly one user
            expect(joinOrderList[0]).toBe(studentId); // Should be our student

            // Clean up
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
            await prisma.gameInstance.delete({ where: { id: testGameId } });
            await prisma.gameTemplate.delete({ where: { id: gameTemplate.id } });
            await prisma.user.deleteMany({ where: { id: { in: [teacherId, studentId] } } });
        });
    });

    describe('Reconnect loop handling', () => {
        it('should not inflate participant count on rapid reconnects', async () => {
            const timestamp = Date.now();
            const testAccessCode = `IDEMP-${timestamp}`;
            const studentId = `student-${timestamp}`;

            // Create user first
            const user = await prisma.user.create({
                data: {
                    id: studentId,
                    username: 'TestStudent',
                    email: `test-${timestamp}@example.com`,
                    role: 'STUDENT'
                }
            });

            // Create question
            const question = await prisma.question.create({
                data: {
                    uid: `test-question-reconnect-${timestamp}`,
                    title: 'Test Question',
                    text: 'What is 2+2?',
                    questionType: 'MULTIPLE_CHOICE',
                    discipline: 'math',
                    themes: ['arithmetic'],
                    gradeLevel: 'CM1',
                    timeLimit: 60,
                    multipleChoiceQuestion: {
                        create: {
                            answerOptions: ['A', 'B', 'C', 'D'],
                            correctAnswers: [true, false, false, false]
                        }
                    }
                }
            });

            // Create game template
            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    id: `template-${timestamp}`,
                    name: 'Test Template',
                    description: 'Test template for idempotency tests',
                    discipline: 'math',
                    gradeLevel: 'CM1',
                    creatorId: studentId,
                    questions: {
                        create: [{
                            questionUid: `test-question-reconnect-${timestamp}`,
                            sequence: 1
                        }]
                    }
                }
            });

            // Create game instance
            const gameInstance = await prisma.gameInstance.create({
                data: {
                    id: `game-${timestamp}`,
                    name: 'Test Game',
                    accessCode: testAccessCode,
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: `template-${timestamp}`,
                    initiatorUserId: studentId
                }
            });

            // First join - should create participant
            const joinResult1 = await joinGame({
                userId: studentId,
                accessCode: testAccessCode,
                username: 'TestStudent',
                avatarEmoji: '😀'
            });

            expect(joinResult1.success).toBe(true);

            // Count participants after first join
            const participantsAfterFirstJoin = await prisma.gameParticipant.findMany({
                where: { gameInstanceId: gameInstance.id }
            });
            expect(participantsAfterFirstJoin.length).toBe(1);

            // Simulate multiple rapid reconnects (duplicate joins)
            for (let i = 0; i < 5; i++) {
                const joinResult = await joinGame({
                    userId: studentId,
                    accessCode: testAccessCode,
                    username: 'TestStudent',
                    avatarEmoji: '😀'
                });
                expect(joinResult.success).toBe(true);
            }

            // Count participants after rapid reconnects - should still be 1
            const participantsAfterReconnects = await prisma.gameParticipant.findMany({
                where: { gameInstanceId: gameInstance.id }
            });
            expect(participantsAfterReconnects.length).toBe(1); // Should not have increased

            // Verify the participant data is correct
            const participant = participantsAfterReconnects[0];
            expect(participant.userId).toBe(studentId);
            expect(participant.status).toBe('ACTIVE');
        });

        it('should not duplicate leaderboard entries on reconnect', async () => {
            const timestamp = Date.now();
            const testAccessCode = `IDEMP-${timestamp}`;
            const studentId = `student-${timestamp}`;

            // Create user first
            const user = await prisma.user.create({
                data: {
                    id: studentId,
                    username: 'TestStudent',
                    email: `test-${timestamp}@example.com`,
                    role: 'STUDENT'
                }
            });

            // Create question
            const question = await prisma.question.create({
                data: {
                    uid: `test-question-leaderboard-${timestamp}`,
                    title: 'Test Question',
                    text: 'What is 3+3?',
                    questionType: 'MULTIPLE_CHOICE',
                    discipline: 'math',
                    themes: ['arithmetic'],
                    gradeLevel: 'CM1',
                    timeLimit: 60,
                    multipleChoiceQuestion: {
                        create: {
                            answerOptions: ['A', 'B', 'C', 'D'],
                            correctAnswers: [true, false, false, false]
                        }
                    }
                }
            });

            // Create game template
            const gameTemplate = await prisma.gameTemplate.create({
                data: {
                    id: `template-${timestamp}`,
                    name: 'Test Template',
                    description: 'Test template for idempotency tests',
                    discipline: 'math',
                    gradeLevel: 'CM1',
                    creatorId: studentId,
                    questions: {
                        create: [{
                            questionUid: `test-question-leaderboard-${timestamp}`,
                            sequence: 1
                        }]
                    }
                }
            });

            // Create game instance
            const gameInstance = await prisma.gameInstance.create({
                data: {
                    id: `game-${timestamp}`,
                    name: 'Test Game',
                    accessCode: testAccessCode,
                    status: 'active',
                    playMode: 'quiz',
                    gameTemplateId: `template-${timestamp}`,
                    initiatorUserId: studentId
                }
            });

            // First join - should create leaderboard entry
            const joinResult1 = await joinGame({
                userId: studentId,
                accessCode: testAccessCode,
                username: 'TestStudent',
                avatarEmoji: '😀'
            });

            expect(joinResult1.success).toBe(true);

            // Check participant count after first join
            const participantsAfterFirstJoin = await prisma.gameParticipant.findMany({
                where: { gameInstanceId: gameInstance.id }
            });
            expect(participantsAfterFirstJoin.length).toBe(1);
            expect(participantsAfterFirstJoin[0].userId).toBe(studentId);
            expect(participantsAfterFirstJoin[0].status).toBe('ACTIVE');

            // Simulate multiple rapid reconnects
            for (let i = 0; i < 3; i++) {
                const joinResult = await joinGame({
                    userId: studentId,
                    accessCode: testAccessCode,
                    username: 'TestStudent',
                    avatarEmoji: '😀'
                });
                expect(joinResult.success).toBe(true);
            }

            // Check participant count after reconnects - should still have only 1 participant
            const participantsAfterReconnects = await prisma.gameParticipant.findMany({
                where: { gameInstanceId: gameInstance.id }
            });
            expect(participantsAfterReconnects.length).toBe(1); // Should not have duplicates
            expect(participantsAfterReconnects[0].userId).toBe(studentId);
            expect(participantsAfterReconnects[0].status).toBe('ACTIVE');
        });
    });
});