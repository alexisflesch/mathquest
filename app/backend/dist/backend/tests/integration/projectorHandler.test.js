"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const index_1 = require("@/sockets/index");
const prisma_1 = require("@/db/prisma");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const questionTypes_1 = require("@shared/constants/questionTypes");
describe('Projector Mode Socket Handler', () => {
    jest.setTimeout(10000);
    let io;
    let httpServer;
    let clientSocket;
    let gameId;
    let gameAccessCode;
    beforeAll(async () => {
        // Create a real game instance for testing
        const testTeacher = await prisma_1.prisma.user.upsert({
            where: { email: 'projector-test@example.com' },
            update: {},
            create: {
                username: 'projectortestteacher',
                email: 'projector-test@example.com',
                passwordHash: 'hash-not-important-for-test',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });
        const testTemplate = await prisma_1.prisma.gameTemplate.create({
            data: {
                name: 'Projector Test Quiz Template',
                creatorId: testTeacher.id,
                themes: ['math']
            }
        });
        // Add at least one question to the template
        const testQuestion = await prisma_1.prisma.question.create({
            data: {
                title: 'Addition',
                text: 'What is 2+2?',
                questionType: questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1,
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['3', '4', '5', '22'],
                correctAnswers: [false, true, false, false],
                author: testTeacher.username
            }
        });
        await prisma_1.prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: testTemplate.id,
                questionUid: testQuestion.uid,
                sequence: 0
            }
        });
        const gameInstance = await prisma_1.prisma.gameInstance.create({
            data: {
                accessCode: 'PROJ123',
                name: 'Projector Test Game',
                status: 'active',
                playMode: 'quiz',
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                },
                gameTemplateId: testTemplate.id,
                initiatorUserId: testTeacher.id
            }
        });
        gameId = gameInstance.id;
        gameAccessCode = gameInstance.accessCode;
        // Initialize game state for both gameId and accessCode
        await gameStateService_1.default.initializeGameState(gameId);
        await gameStateService_1.default.initializeGameState(gameAccessCode);
        // Start HTTP server with Socket.IO
        return new Promise((resolve) => {
            httpServer = (0, http_1.createServer)();
            io = new socket_io_1.Server(httpServer);
            (0, index_1.setupSocketHandlers)(io);
            httpServer.listen(() => {
                const port = httpServer.address().port;
                clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`);
                clientSocket.on('connect', resolve);
            });
        });
    });
    afterAll(async () => {
        return new Promise(async (resolve) => {
            io.close();
            clientSocket.close();
            if (httpServer) {
                httpServer.close(async () => {
                    // Clean up test data
                    await prisma_1.prisma.gameInstance.deleteMany({
                        where: { accessCode: 'PROJ123' }
                    });
                    await prisma_1.prisma.gameTemplate.deleteMany({
                        where: { name: 'Projector Test Quiz Template' }
                    });
                    await prisma_1.prisma.teacherProfile.deleteMany({
                        where: { user: { email: 'projector-test@example.com' } }
                    });
                    await prisma_1.prisma.user.deleteMany({
                        where: { email: 'projector-test@example.com' }
                    });
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    });
    it('should join projector room and receive initial state', (done) => {
        clientSocket.emit('join_projector', gameId);
        clientSocket.on('projector_state', (state) => {
            expect(state).toBeDefined();
            expect(state.accessCode).toBe(gameAccessCode);
            done();
        });
        // Add timeout fallback
        setTimeout(() => {
            done(new Error('Test timed out waiting for projector_state'));
        }, 5000);
    });
    it('should leave projector room without error', (done) => {
        clientSocket.emit('leave_projector', gameId);
        // No error expected, just call done
        setTimeout(done, 100);
    });
    it('should handle disconnect gracefully', (done) => {
        clientSocket.disconnect();
        setTimeout(done, 100);
    });
    // Add more tests for real-time updates, error cases, etc.
});
