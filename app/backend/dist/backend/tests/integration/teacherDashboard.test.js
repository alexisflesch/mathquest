"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const prisma_1 = require("../../src/db/prisma");
const testSetup_1 = require("../testSetup");
const gameStateService_1 = __importDefault(require("../../src/core/gameStateService"));
const testQuestions_1 = require("../support/testQuestions");
const logger_1 = __importDefault(require("../../src/utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('Teacher Dashboard & Game Control', () => {
    jest.setTimeout(10000); // Increased timeout for async/socket tests
    let httpServer;
    let ioServer;
    let teacherSocket;
    let playerSocket;
    let gameInstance;
    let gameId;
    let accessCode;
    let gameTemplate;
    let seededQuestionUids;
    let testServerSetup;
    let baseUrl;
    let teacherToken;
    // Setup mock user data
    const teacherId = 'teacher-1';
    const playerId = 'player-1';
    const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
    beforeAll(async () => {
        // Create isolated test server
        testServerSetup = await (0, testSetup_1.startTestServer)();
        httpServer = testServerSetup.server;
        ioServer = testServerSetup.io;
        baseUrl = `http://localhost:${testServerSetup.port}`;
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
                creatorId: teacherId, // was creatoruserId
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
        // Generate JWT token for teacher
        teacherToken = jsonwebtoken_1.default.sign({
            userId: teacherId,
            username: 'testteacher',
            role: 'TEACHER'
        }, JWT_SECRET, { expiresIn: '1h' });
    });
    afterAll(async () => {
        // Close connections
        if (teacherSocket)
            teacherSocket.disconnect();
        if (playerSocket)
            playerSocket.disconnect();
        // Clean up test data
        if (gameId) {
            await prisma_1.prisma.gameInstance.delete({ where: { id: gameId } });
        }
        // Delete all gameInstances for this teacher (to satisfy FK constraint)
        await prisma_1.prisma.gameInstance.deleteMany({ where: { initiatorUserId: teacherId } });
        const gameTemplates = await prisma_1.prisma.gameTemplate.findMany({ where: { creatorId: teacherId } });
        for (const qt of gameTemplates) {
            await prisma_1.prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: qt.id } });
            await prisma_1.prisma.gameTemplate.delete({ where: { id: qt.id } });
        }
        // Delete teacherProfile and user
        await prisma_1.prisma.teacherProfile.deleteMany({ where: { id: teacherId } });
        await prisma_1.prisma.user.deleteMany({ where: { id: teacherId } });
        // Clean up server using test setup cleanup
        if (testServerSetup && testServerSetup.cleanup) {
            await testServerSetup.cleanup();
        }
        // Close database connections
        await prisma_1.prisma.$disconnect();
    });
    beforeEach((done) => {
        teacherSocket = (0, socket_io_client_1.io)(baseUrl, {
            query: {
                token: teacherToken,
                userId: teacherId,
                userType: 'teacher',
                role: 'TEACHER'
            },
            path: '/api/socket.io',
            transports: ['websocket'],
            forceNew: true
        });
        teacherSocket.on('connect', () => {
            teacherSocket.emit('join_dashboard', { gameId });
        });
        teacherSocket.once('game_control_state', () => {
            done();
        });
    });
    afterEach(() => {
        if (teacherSocket)
            teacherSocket.disconnect();
    });
    it('Should allow a teacher to join the dashboard', (done) => {
        // Already joined in beforeEach, just check state
        teacherSocket.once('game_control_state', (data) => {
            expect(data).toBeDefined();
            expect(data.gameId).toBe(gameId);
            expect(data.accessCode).toBe(accessCode);
            expect(data.status).toBe('pending');
            done();
        });
        // Re-emit join_dashboard to trigger event for this test
        teacherSocket.emit('join_dashboard', { gameId });
    });
    it('Should allow a teacher to set a question', (done) => {
        const questionUid = seededQuestionUids[0];
        teacherSocket.once('dashboard_question_changed', (data) => {
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
        // NOTE: The backend only listens for 'quiz_timer_action', not 'timer_action'.
        // See src/sockets/handlers/teacherControl/index.ts for event registration.
        // This is required for the test to work!
        const logger = (0, logger_1.default)('Test');
        let timeoutId = setTimeout(() => {
            logger.info('[TEST] dashboard_timer_updated event NOT received within timeout');
            done(new Error('dashboard_timer_updated event not received'));
        }, 4500);
        logger.info('[TEST] About to emit quiz_timer_action event');
        teacherSocket.once('dashboard_timer_updated', (data) => {
            logger.info('[TEST] Received dashboard_timer_updated event', data);
            clearTimeout(timeoutId);
            expect(data.timer).toBeDefined();
            expect(data.timer.isPaused).toBe(false);
            done();
        });
        teacherSocket.emit('quiz_timer_action', {
            gameId,
            action: 'start',
            duration: 30
        });
        logger.info('[TEST] quiz_timer_action event emitted');
    }, 5000);
    it('Should allow a teacher to lock/unlock answers', (done) => {
        teacherSocket.once('dashboard_answers_lock_changed', (data) => {
            expect(data.answersLocked).toBe(true);
            done();
        });
        teacherSocket.emit('lock_answers', {
            gameId,
            lock: true
        });
    });
    it('Should allow a teacher to end the game', (done) => {
        teacherSocket.once('dashboard_game_status_changed', (data) => {
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
