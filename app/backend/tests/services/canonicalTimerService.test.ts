import { Server } from 'socket.io';
import { createServer } from 'http';
import { emitQuestionHandler } from '../../src/sockets/handlers/game/emitQuestionHandler';
import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/services/canonicalTimerService';
import { redisClient } from '../../src/config/redis';
import { prisma } from '../../src/db/prisma';

// Helper to wait for ms
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Live Tournament Timer & Penalty Integration', () => {
    let io: Server;
    let httpServer: ReturnType<typeof createServer>;
    let socket: any;
    let canonicalTimerService: CanonicalTimerService;

    beforeAll((done) => {
        httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => done());
        canonicalTimerService = new CanonicalTimerService(redisClient);
    });

    afterAll((done) => {
        io.close();
        httpServer.close(() => done());
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock socket
        socket = {
            id: 'test-socket',
            emit: jest.fn(),
            data: { userId: 'user1', username: 'TestUser' },
        };
    });

    it('should call startTimer on CanonicalTimerService when emitting a question', async () => {
        // Arrange
        const accessCode = 'TESTCODE';
        const userId = 'user1';
        const questionUid = 'q1';
        // Spy on instance method
        const startTimerSpy = jest.spyOn(CanonicalTimerService.prototype, 'startTimer').mockResolvedValue(null);
        // Act: Call emitQuestionHandler as in real code
        const handler = emitQuestionHandler(io, socket);
        await handler({ accessCode, userId, questionUid });
        // Assert
        expect(startTimerSpy).toHaveBeenCalled();
        // Optionally, check args
        const callArgs = startTimerSpy.mock.calls[0];
        expect(callArgs[0]).toBe(accessCode);
        expect(callArgs[1]).toBe(questionUid);
        // Clean up
        startTimerSpy.mockRestore();
    });

    it('should return a valid ScoreResult from submitAnswerWithScoring', async () => {
        // Arrange
        const gameInstanceId = 'game-123';
        const userId = 'user1';
        const answerData = { questionUid: 'q1', answer: '4', timeSpent: 1000 };
        // Mock DB/Redis as needed for this test
        jest.spyOn(prisma.gameParticipant, 'findFirst').mockResolvedValue({
            id: 'p1',
            gameInstanceId,
            userId,
            score: 0,
            joinedAt: new Date(),
            participationType: 'LIVE',
            attemptCount: 1
        });
        jest.spyOn(prisma.gameInstance, 'findUnique').mockResolvedValue({
            id: gameInstanceId,
            accessCode: 'TESTCODE',
            playMode: 'quiz',
            status: 'active',
            startedAt: new Date(),
            name: 'Test Game',
            createdAt: new Date(),
            leaderboard: {},
            currentQuestionIndex: 0,
            settings: {},
            gameTemplateId: 'template-1',
            initiatorUserId: 'teacher-1',
            isDiffered: false,
            endedAt: null,
            differedAvailableFrom: null,
            differedAvailableTo: null
        });
        jest.spyOn(prisma.question, 'findUnique').mockResolvedValue({
            uid: 'q1',
            createdAt: new Date(),
            updatedAt: new Date(),
            title: 'Addition',
            text: 'What is 2+2?',
            questionType: 'MULTIPLE_CHOICE_SINGLE_ANSWER',
            difficulty: 1,
            timeLimit: 20,
            discipline: 'math',
            themes: ['arithmetic'],
            answerOptions: ['3', '4', '5', '22'],
            correctAnswers: [false, true, false, false],
            author: 'Test Teacher',
            gradeLevel: null,
            feedbackWaitTime: null,
            explanation: null,
            tags: [],
            isHidden: false
        });
        jest.spyOn(redisClient, 'hget').mockResolvedValue(null);
        jest.spyOn(redisClient, 'hset').mockResolvedValue(1);
        jest.spyOn(prisma.gameParticipant, 'update').mockResolvedValue({
            id: 'p1',
            gameInstanceId,
            userId,
            score: 100,
            joinedAt: new Date(),
            participationType: 'LIVE',
            attemptCount: 1
        });
        jest.spyOn(redisClient, 'zadd').mockResolvedValue('1');
        // Act
        const result = await ScoringService.submitAnswerWithScoring(gameInstanceId, userId, answerData);
        // Assert
        expect(result).toHaveProperty('scoreUpdated');
        expect(result).toHaveProperty('scoreAdded');
        expect(result).toHaveProperty('totalScore');
        expect(result).toHaveProperty('answerChanged');
        expect(result).toHaveProperty('message');
    });
});
