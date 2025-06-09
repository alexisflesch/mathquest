import { Socket, io as clientIo } from 'socket.io-client';
import { Server } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { configureSocketServer, registerHandlers, closeSocketIORedisClients } from '../../src/sockets';
import { prisma } from '../../src/db/prisma';
import { startTestServer } from '../testSetup';
import gameStateService from '../../src/core/gameStateService';
import { testQuestions } from '../support/testQuestions';
import createLogger from '../../src/utils/logger';
import jwt from 'jsonwebtoken';

describe('Teacher Dashboard & Game Control', () => {
    jest.setTimeout(10000); // Increased timeout for async/socket tests

    let httpServer: HttpServer;
    let ioServer: Server;
    let teacherSocket: Socket;
    let playerSocket: Socket | undefined;
    let gameInstance: any;
    let gameId: string;
    let accessCode: string;
    let gameTemplate: any;
    let seededQuestionUids: string[];
    let testServerSetup: any;
    let baseUrl: string;
    let teacherToken: string;

    // Setup mock user data
    const teacherId = 'teacher-1';
    const playerId = 'player-1';
    const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';

    beforeAll(async () => {
        // Create isolated test server
        testServerSetup = await startTestServer();
        httpServer = testServerSetup.server;
        ioServer = testServerSetup.io;
        baseUrl = `http://localhost:${testServerSetup.port}`;

        // Ensure the teacher exists
        await prisma.user.upsert({
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
        gameTemplate = await prisma.gameTemplate.create({
            data: {
                id: 'quiz-1',
                name: 'Test Quiz',
                creatorId: teacherId, // was creatoruserId
                themes: [],
            }
        });

        // Link all seeded questions to the quiz template
        await prisma.questionsInGameTemplate.createMany({
            data: testQuestions.map((q, idx) => ({
                gameTemplateId: gameTemplate.id,
                questionUid: q.uid,
                sequence: idx + 1
            }))
        });

        // Create a test game
        gameInstance = await prisma.gameInstance.create({
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
        await gameStateService.initializeGameState(gameId);

        // Get all seeded question UIDs
        seededQuestionUids = testQuestions.map(q => q.uid);

        // Generate JWT token for teacher
        teacherToken = jwt.sign(
            {
                userId: teacherId,
                username: 'testteacher',
                role: 'TEACHER'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Close connections
        if (teacherSocket) teacherSocket.disconnect();
        if (playerSocket) playerSocket.disconnect();

        // Clean up test data
        if (gameId) {
            await prisma.gameInstance.delete({ where: { id: gameId } });
        }
        // Delete all gameInstances for this teacher (to satisfy FK constraint)
        await prisma.gameInstance.deleteMany({ where: { initiatorUserId: teacherId } });
        const gameTemplates = await prisma.gameTemplate.findMany({ where: { creatorId: teacherId } });
        for (const qt of gameTemplates) {
            await prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: qt.id } });
            await prisma.gameTemplate.delete({ where: { id: qt.id } });
        }
        // Delete teacherProfile and user
        await prisma.teacherProfile.deleteMany({ where: { id: teacherId } });
        await prisma.user.deleteMany({ where: { id: teacherId } });

        // Clean up server using test setup cleanup
        if (testServerSetup && testServerSetup.cleanup) {
            await testServerSetup.cleanup();
        }

        // Close database connections
        await prisma.$disconnect();
    });

    beforeEach((done) => {
        teacherSocket = clientIo(baseUrl, {
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
        if (teacherSocket) teacherSocket.disconnect();
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
        const logger = createLogger('Test');
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
        const fullState = await gameStateService.getFullGameState(accessCode);
        expect(fullState).not.toBeNull();
        if (!fullState || !fullState.gameState) {
            throw new Error('Game state is null or undefined');
        }
        expect(fullState.gameState.questionIds).toEqual(
            expect.arrayContaining(seededQuestionUids)
        );
    });
});
