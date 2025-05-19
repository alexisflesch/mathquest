"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const sockets_1 = require("../../src/sockets");
const prisma_1 = require("../../src/db/prisma");
const redis_1 = require("../../src/config/redis");
const gameStateService_1 = __importDefault(require("../../src/core/gameStateService"));
const testQuestions_1 = require("../support/testQuestions");
describe('Teacher Dashboard & Game Control', () => {
    jest.setTimeout(3000); // Revert to 3s timeout for async/socket tests
    let httpServer;
    let ioServer;
    let teacherSocket;
    let playerSocket;
    let gameInstance;
    let gameId;
    let accessCode;
    let gameTemplate;
    let seededQuestionUids;
    // Setup mock user data
    const teacherId = 'teacher-1';
    const userId = 'player-1';
    beforeAll(async () => {
        // Create HTTP server and Socket.IO instance
        httpServer = (0, http_1.createServer)();
        ioServer = new socket_io_1.Server(httpServer);
        (0, sockets_1.configureSocketServer)(ioServer);
        (0, sockets_1.registerHandlers)(ioServer);
        // Start HTTP server
        await new Promise((resolve) => {
            httpServer.listen(3001, () => {
                resolve();
            });
        });
        // Ensure the teacher exists
        await prisma_1.prisma.user.upsert({
            where: { id: teacherId },
            update: {},
            create: {
                id: teacherId,
                username: 'testteacher',
                passwordHash: 'testhash',
                email: 'teacher1@example.com',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });
        // Create a test quiz template (needed for foreign key)
        gameTemplate = await prisma_1.prisma.gameTemplate.create({
            data: {
                id: 'quiz-1',
                name: 'Test Quiz',
                creatorId: teacherId, // was creatorTeacherId
                themes: [],
            }
        });
        // Link all seeded questions to the quiz template
        await prisma_1.prisma.questionsInGameTemplate.createMany({
            data: testQuestions_1.testQuestions.map((q, idx) => ({
                gameTemplateId: gameTemplate.id,
                questionUid: q.uid,
                sequence: idx + 1
            }))
        });
        // Create a test game
        gameInstance = await prisma_1.prisma.gameInstance.create({
            data: {
                name: 'Test Game',
                accessCode: 'TEST123',
                initiatorUserId: teacherId, // was 
                status: 'pending',
                playMode: 'quiz', // Using valid enum value from schema
                gameTemplateId: 'quiz-1', // This would need to exist in your test DB
                leaderboard: [],
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            }
        });
        gameId = gameInstance.id;
        accessCode = gameInstance.accessCode;
        // Initialize game state
        await gameStateService_1.default.initializeGameState(gameId);
        // Get all seeded question UIDs
        seededQuestionUids = testQuestions_1.testQuestions.map(q => q.uid);
    });
    afterAll(async () => {
        // Close connections
        if (teacherSocket)
            teacherSocket.disconnect();
        if (playerSocket)
            playerSocket.disconnect();
        // Close server
        ioServer.close();
        httpServer.close();
        // Clean up test data
        if (gameId) {
            await prisma_1.prisma.gameInstance.delete({ where: { id: gameId } });
        }
        // Delete all gameInstances for this teacher (to satisfy FK constraint)
        await prisma_1.prisma.gameInstance.deleteMany({ where: { initiatorUserId: teacherId } });
        // Delete all gameTemplates for this teacher (to satisfy FK constraint)
        const gameTemplates = await prisma_1.prisma.gameTemplate.findMany({ where: { creatorId: teacherId } });
        for (const qt of gameTemplates) {
            await prisma_1.prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: qt.id } });
            await prisma_1.prisma.gameTemplate.delete({ where: { id: qt.id } });
        }
        // Delete teacherProfile and user
        await prisma_1.prisma.teacherProfile.deleteMany({ where: { id: teacherId } });
        await prisma_1.prisma.user.deleteMany({ where: { id: teacherId } });
        // Clear Redis keys
        const keys = await redis_1.redisClient.keys(`mathquest:game:*${accessCode}*`);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
        // Close database connections
        await prisma_1.prisma.$disconnect();
        await redis_1.redisClient.quit();
    });
    it('Should allow a teacher to join the dashboard', (done) => {
        teacherSocket = (0, socket_io_client_1.io)('http://localhost:3001', {
            auth: { teacherId }
        });
        teacherSocket.on('connect', () => {
            teacherSocket.emit('join_dashboard', { gameId });
        });
        teacherSocket.on('game_control_state', (data) => {
            expect(data).toBeDefined();
            expect(data.gameId).toBe(gameId);
            expect(data.accessCode).toBe(accessCode);
            expect(data.status).toBe('pending');
            done();
        });
    });
    it('Should allow a teacher to set a question', (done) => {
        const questionUid = seededQuestionUids[0];
        teacherSocket.on('dashboard_question_changed', (data) => {
            expect(data.questionUid).toBe(questionUid);
            expect(data.timer).toBeDefined();
            done();
        });
        teacherSocket.emit('set_question', {
            gameId,
            questionUid
        });
    });
    it('Should allow a teacher to control the timer', (done) => {
        teacherSocket.on('dashboard_timer_updated', (data) => {
            expect(data.timer).toBeDefined();
            expect(data.timer.isPaused).toBe(false);
            done();
        });
        teacherSocket.emit('timer_action', {
            gameId,
            action: 'start',
            duration: 30
        });
    });
    it('Should allow a teacher to lock/unlock answers', (done) => {
        teacherSocket.on('dashboard_answers_lock_changed', (data) => {
            expect(data.answersLocked).toBe(true);
            done();
        });
        teacherSocket.emit('lock_answers', {
            gameId,
            lock: true
        });
    });
    it('Should allow a teacher to end the game', (done) => {
        teacherSocket.on('dashboard_game_status_changed', (data) => {
            expect(data.status).toBe('completed');
            done();
        });
        teacherSocket.emit('end_game', { gameId });
    });
    it('Game state should contain seeded questions', async () => {
        const fullState = await gameStateService_1.default.getFullGameState(accessCode);
        expect(fullState).not.toBeNull();
        if (!fullState || !fullState.gameState) {
            throw new Error('Game state is null or undefined');
        }
        expect(fullState.gameState.questionIds).toEqual(expect.arrayContaining(seededQuestionUids));
    });
});
