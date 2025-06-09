import request from 'supertest';
import { Server as HttpServer } from 'http'; // Corrected import
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net'; // For port handling
import jwt from 'jsonwebtoken'; // For token generation

import { startTestServer } from '../testSetup';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

// Utility to wait for a specific event - ensure this is robust
function waitForEvent(socket: ClientSocket, event: string, timeout = 5000) { // Increased default timeout slightly
    return new Promise((resolve, reject) => {
        if (!socket) return reject(new Error('Socket is undefined while waiting for ' + event));
        const timer = setTimeout(() => {
            socket.off(event); // Clean up listener on timeout
            reject(new Error(`Timeout waiting for '${event}'`));
        }, timeout);
        socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

describe('Teacher-driven Quiz Flow', () => {
    let httpServer: HttpServer;
    let io: SocketIOServer;
    let baseUrl: string;
    let teacherSocket: ClientSocket;
    let player1Socket: ClientSocket;

    let teacherUser: any;
    let player1User: any;
    let quizTemplate: any;
    let gameInstance: any; // This will be our "quiz"
    let teacherToken: string;
    let player1Token: string;
    let quizId: string; // Will be gameInstance.id
    let accessCode: string;
    let questionUid: string; // UID of the first question

    beforeAll(async () => {
        const serverSetup = await startTestServer();
        httpServer = serverSetup.server;
        io = serverSetup.io;
        baseUrl = `http://localhost:${serverSetup.port}`;

        // 1. Create Users (Teacher and Player)
        teacherUser = await prisma.user.create({
            data: {
                username: 'quizTeacher',
                email: 'quizteacher@example.com',
                role: 'TEACHER',
                // Add other required fields for teacher if any
            },
        });
        player1User = await prisma.user.create({
            data: {
                username: 'quizPlayer1',
                email: 'quizplayer1@example.com',
                role: 'STUDENT',
                studentProfile: { create: { cookieId: 'cookie-quiz-p1' } }
            },
        });

        // 2. Generate JWT Tokens
        const secret = process.env.JWT_SECRET || 'mathquest_default_secret'; // Use your actual secret
        teacherToken = jwt.sign({ userId: teacherUser.id, username: teacherUser.username, role: teacherUser.role }, secret, { expiresIn: '1h' });
        player1Token = jwt.sign({ userId: player1User.id, username: player1User.username, role: player1User.role }, secret, { expiresIn: '1h' });

        // 3. Create a QuizTemplate via API (assuming endpoint and structure)
        //    For simplicity, let's assume testQuestions[0] is the question to be added.
        //    You might need to create the question in DB first if not already present.
        const questionData = {
            uid: 'test-q-quiz-1',
            text: 'What is 2+2 for quiz?',
            answerOptions: ['3', '4', '5'],
            correctAnswers: [false, true, false],
            difficulty: 1, // Corrected: Int?
            discipline: 'math',
            gradeLevel: 'elementary',
            questionType: 'multiple_choice_single_answer', // Added: String
            themes: ['arithmetic'], // Added example for themes as it's a required array
            // ... other question fields
        };
        await prisma.question.upsert({
            where: { uid: questionData.uid },
            update: { ...questionData, answerOptions: questionData.answerOptions as any, correctAnswers: questionData.correctAnswers as any },
            create: { ...questionData, answerOptions: questionData.answerOptions as any, correctAnswers: questionData.correctAnswers as any },
        });
        questionUid = questionData.uid;

        console.log('Creating game template with payload:', {
            name: 'My First Quiz Template',
            discipline: 'math',
            gradeLevel: 'middle',
            themes: ['arithmetic'],
            questions: [{ questionUid: questionUid, sequence: 1 }]
        });
        const quizTemplateRes = await request(baseUrl)
            .post('/api/v1/game-templates')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
                name: 'My First Quiz Template',
                discipline: 'math',
                gradeLevel: 'middle',
                themes: ['arithmetic'],
                questions: [{ questionUid: questionUid, sequence: 1 }]
            });
        console.log('Game template response status:', quizTemplateRes.status);
        console.log('Game template response body:', quizTemplateRes.body);
        expect(quizTemplateRes.status).toBe(201);
        quizTemplate = quizTemplateRes.body.gameTemplate;
        expect(quizTemplate).toBeDefined(); // Add this check

        // 4. Create a GameInstance (Quiz) from the Template via API
        console.log('Creating game instance with payload:', {
            name: 'Live Quiz Session 1',
            playMode: 'quiz',
            gameTemplateId: quizTemplate.id
        });
        const gameInstanceRes = await request(baseUrl)
            .post('/api/v1/games')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
                name: 'Live Quiz Session 1',
                playMode: 'quiz',
                gameTemplateId: quizTemplate.id
            });
        console.log('Game instance response status:', gameInstanceRes.status);
        console.log('Game instance response body:', gameInstanceRes.body);
        expect(gameInstanceRes.status).toBe(201);
        gameInstance = gameInstanceRes.body.gameInstance;
        expect(gameInstance).toBeDefined(); // Add this check
        quizId = gameInstance.id;
        accessCode = gameInstance.accessCode;

        // Initialize game state in Redis (required for dashboard functionality)
        const gameStateService = require('../../src/core/gameStateService');
        await gameStateService.initializeGameState(gameInstance.id);

        // 5. Connect Teacher Socket
        teacherSocket = ClientIO(baseUrl, {
            query: {
                token: teacherToken,
                userId: teacherUser.id,
                userType: 'teacher',
                role: teacherUser.role
            },
            path: '/api/socket.io', // As per tournament2.test.ts
            transports: ['websocket'],
            forceNew: true
        });
        await new Promise<void>((resolve) => teacherSocket.on('connect', () => resolve()));

        // Add debug logging for all teacher socket events
        teacherSocket.onAny((event, ...args) => {
            console.log('[teacherSocket] Event:', event, JSON.stringify(args));
        });

        console.log('Emitting join_dashboard with:', { gameId: quizId, userId: teacherUser.id, username: teacherUser.username });
        teacherSocket.emit('join_dashboard', { gameId: quizId, userId: teacherUser.id, username: teacherUser.username }); // Using 'join_dashboard'

        // Expect 'game_control_state' or a specific join confirmation.
        await waitForEvent(teacherSocket, 'game_control_state');

        // 6. Connect Player Socket and Join Game
        // Player might first join via HTTP then connect socket, or join directly via socket.
        // Following tournament2.test.ts: connect socket, then emit join_game/join_tournament.
        // For quiz, let's assume player joins the "game" (which is the quiz session).
        player1Socket = ClientIO(baseUrl, {
            query: {
                token: player1Token,
                userId: player1User.id,
                userType: 'player',
                role: player1User.role
            },
            path: '/api/socket.io',
            transports: ['websocket'],
            forceNew: true
        });
        await new Promise<void>((resolve) => player1Socket.on('connect', () => resolve()));
        // Player joins the game instance (quiz) using accessCode
        // The event might be 'join_game' or 'join_lobby' depending on your setup
        // README mentions `game_${code}` for live tournament, `${code}` or `lobby_${code}` for lobby.
        // Let's use a generic 'join_game' and expect 'game_joined'.
        player1Socket.emit('join_game', { accessCode: accessCode, userId: player1User.id, username: player1User.username });
        await waitForEvent(player1Socket, 'game_joined');

        // Add debug logging for all events on player1Socket
        if (player1Socket) {
            player1Socket.onAny((event, ...args) => {
                console.log('[player1Socket] Event:', event, JSON.stringify(args));
            });
        }

        // Remove debug logging for all events on teacherSocket to avoid interfering with test event listeners
    }, 60000); // Increased timeout for the entire beforeAll

    afterAll(async () => {
        if (teacherSocket && teacherSocket.connected) teacherSocket.disconnect();
        if (player1Socket && player1Socket.connected) player1Socket.disconnect();

        // Close HTTP server
        if (httpServer && httpServer.listening) {
            await new Promise<void>(resolve => httpServer.close(() => resolve()));
        }

        // Clean up Redis connections
        if (redisClient) {
            await redisClient.quit();
        }

        // Clean up DB
        // Order matters due to foreign key constraints
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: gameInstance?.id } });
        if (gameInstance) await prisma.gameInstance.deleteMany({ where: { id: gameInstance.id } });
        if (quizTemplate) {
            await prisma.questionsInGameTemplate.deleteMany({ where: { gameTemplateId: quizTemplate.id } });
            await prisma.gameTemplate.deleteMany({ where: { id: quizTemplate.id } });
        }
        await prisma.question.deleteMany({ where: { uid: questionUid } });
        // Delete profiles before users
        await prisma.studentProfile.deleteMany({ where: { id: { in: [player1User?.id].filter(Boolean) } } });
        // await prisma.teacherProfile.deleteMany({ where: { id: { in: [teacherUser?.id].filter(Boolean) } } }); // If teacher profiles were created
        await prisma.user.deleteMany({ where: { id: { in: [teacherUser?.id, player1User?.id].filter(Boolean) } } });

        // Disconnect Prisma
        await prisma.$disconnect();
    }, 60000);

    beforeEach(() => {
        if (teacherSocket) teacherSocket.offAny();
        if (player1Socket) player1Socket.offAny();
    });

    it('should have initialized sockets, created entities, and teacher/player joined', () => {
        expect(teacherSocket).toBeDefined();
        expect(teacherSocket.connected).toBe(true);
        expect(player1Socket).toBeDefined();
        expect(player1Socket.connected).toBe(true);
        expect(quizTemplate).toBeDefined();
        expect(gameInstance).toBeDefined();
        expect(quizId).toBe(gameInstance.id);
        expect(accessCode).toBeDefined();
        // Further checks: e.g., teacher is in 'dashboard_quizId' room, player in 'live_accessCode' room
    });

    it('teacher should be able to set a question, and player receives it', async () => {
        // Attach the event listener before emitting set_question
        const gameQuestionPromise = waitForEvent(player1Socket, 'game_question');
        const dashboardQuestionChangedPromise = waitForEvent(teacherSocket, 'dashboard_question_changed');
        // Teacher sets the first question (using questionUid only)
        teacherSocket.emit('set_question', { gameId: quizId, questionUid });

        // Player receives 'game_question'
        const questionPayload: any = await gameQuestionPromise;
        expect(questionPayload).toBeDefined();
        expect(questionPayload.question).toBeDefined();
        expect(questionPayload.question.uid).toBe(questionUid); // Check if it's the correct question
        expect(questionPayload.timer).toBeDefined(); // Timer should be part of the question payload

        // Teacher receives 'dashboard_question_changed' (not quiz_state or game_state)
        const dashboardUpdate: any = await dashboardQuestionChangedPromise;
        expect(dashboardUpdate).toBeDefined();
        expect(dashboardUpdate.questionUid).toBe(questionUid);
    });

    it('should allow teacher to control timer using quiz_timer_action', async () => {
        // Ensure a question is active (from previous test or set one here)
        // The timer is paused by default after setting a question, so we must start/resume it first.

        // RESUME (start the timer)
        const resumePlayerPromise = waitForEvent(player1Socket, 'game_timer_updated');
        const resumeTeacherPromise = waitForEvent(teacherSocket, 'dashboard_timer_updated');
        teacherSocket.emit('quiz_timer_action', { gameId: quizId, action: 'resume' });
        let playerPayload: any = await resumePlayerPromise;
        expect(playerPayload.timer.isPaused).toBe(false); // Timer should be running
        let teacherState: any = await resumeTeacherPromise;
        expect(teacherState.timer.isPaused).toBe(false);

        // PAUSE
        const pausePlayerPromise = waitForEvent(player1Socket, 'game_timer_updated');
        const pauseTeacherPromise = waitForEvent(teacherSocket, 'dashboard_timer_updated');
        teacherSocket.emit('quiz_timer_action', { gameId: quizId, action: 'pause' });
        playerPayload = await pausePlayerPromise;
        expect(playerPayload.timer.isPaused).toBe(true); // Timer should be paused
        teacherState = await pauseTeacherPromise;
        expect(teacherState.timer.isPaused).toBe(true);

        // Save paused timeRemaining
        const pausedTime = teacherState.timer.timeRemaining;
        expect(typeof pausedTime).toBe('number');
        expect(pausedTime).toBeGreaterThan(0);

        // Wait 1s
        await new Promise(res => setTimeout(res, 1000));

        // RESUME and check timeRemaining is about the same (±100ms)
        const resume2PlayerPromise = waitForEvent(player1Socket, 'game_timer_updated');
        const resume2TeacherPromise = waitForEvent(teacherSocket, 'dashboard_timer_updated');
        teacherSocket.emit('quiz_timer_action', { gameId: quizId, action: 'resume' });
        playerPayload = await resume2PlayerPromise;
        teacherState = await resume2TeacherPromise;
        // Check both teacher and player get the resumed timer
        const resumedTimeTeacher = teacherState.timer.duration;
        const resumedTimePlayer = playerPayload.timer.duration;
        expect(Math.abs(resumedTimeTeacher - pausedTime)).toBeLessThanOrEqual(150); // Allow 150ms drift
        expect(Math.abs(resumedTimePlayer - pausedTime)).toBeLessThanOrEqual(150);
        expect(teacherState.timer.isPaused).toBe(false);
        expect(playerPayload.timer.isPaused).toBe(false);

        // STOP
        const stopPlayerPromise = waitForEvent(player1Socket, 'game_timer_updated');
        const stopTeacherPromise = waitForEvent(teacherSocket, 'dashboard_timer_updated');
        teacherSocket.emit('quiz_timer_action', { gameId: quizId, action: 'stop' });
        playerPayload = await stopPlayerPromise;
        teacherState = await stopTeacherPromise;
        expect(playerPayload.timer.isPaused).toBe(true); // Timer should be stopped/paused
        expect(teacherState.timer.isPaused).toBe(true);
        // Optionally: expect(playerPayload.timer.timeRemaining).toBe(0);
    });

    // ... (Rest of the tests to be adapted) ...

});
