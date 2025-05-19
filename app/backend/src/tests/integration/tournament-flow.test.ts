import request from 'supertest';
import { AddressInfo } from 'net';
import Client from 'socket.io-client';
import { prisma } from '@/db/prisma';
import { setupServer } from '@/server';
import { testQuestions } from '../../../tests/support/testQuestions';
import generateStudentToken from '../helpers/jwt';

// Utility to wait for a given ms
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Tournament Flow Integration', () => {
    let httpServer: any;
    let address: string;

    let player1: any, player2: any, player3: any;
    let teacher1: any;
    let question1: any, question2: any;
    let accessCode: string;

    beforeAll(async () => {
        // Start backend server (with Socket.IO) for integration test
        httpServer = setupServer();
        await new Promise((resolve) => httpServer.listen(0, resolve));
        const port = (httpServer.address() as AddressInfo).port;
        address = `http://localhost:${port}`;

        // Seed DB: create 1 teacher and 3 players
        teacher1 = await prisma.user.create({ data: { username: 'teacher-1', role: 'TEACHER', teacherProfile: { create: {} } } });
        player1 = await prisma.user.create({ data: { username: 'player-1', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-1' } } } });
        player2 = await prisma.user.create({ data: { username: 'player-2', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-2' } } } });
        player3 = await prisma.user.create({ data: { username: 'player-3', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-3' } } } });
        // Fetch seeded questions by uid
        question1 = await prisma.question.findUnique({ where: { uid: testQuestions[0].uid } });
        question2 = await prisma.question.findUnique({ where: { uid: testQuestions[1].uid } });
        // Patch feedbackWaitTime and timeLimit for test
        await prisma.question.update({ where: { uid: question1.uid }, data: { feedbackWaitTime: 2, timeLimit: 5 } });
        await prisma.question.update({ where: { uid: question2.uid }, data: { feedbackWaitTime: 1, timeLimit: 5 } });
        // Re-fetch to get updated values
        question1 = await prisma.question.findUnique({ where: { uid: testQuestions[0].uid } });
        question2 = await prisma.question.findUnique({ where: { uid: testQuestions[1].uid } });

        // Generate JWT for all users
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
        player1.token = jwt.sign({ userId: player1.id, username: player1.username, role: 'STUDENT' }, secret, { expiresIn: '1h' });
        player2.token = jwt.sign({ userId: player2.id, username: player2.username, role: 'STUDENT' }, secret, { expiresIn: '1h' });
        player3.token = jwt.sign({ userId: player3.id, username: player3.username, role: 'STUDENT' }, secret, { expiresIn: '1h' });
        teacher1.token = jwt.sign({ userId: teacher1.id, username: teacher1.username, role: 'TEACHER' }, secret, { expiresIn: '1h' });
    });

    afterAll(async () => {
        await prisma.gameParticipant.deleteMany();
        await prisma.gameInstance.deleteMany();
        await prisma.question.deleteMany();
        await prisma.gameTemplate.deleteMany(); // <-- Delete game templates before users
        await prisma.studentProfile.deleteMany();
        await prisma.teacherProfile.deleteMany();
        await prisma.user.deleteMany({ where: { role: 'STUDENT' } });
        await prisma.user.deleteMany({ where: { role: 'TEACHER' } });
        httpServer.close();
    });

    it('runs the full tournament flow with feedback timing and late joiner', async () => {
        jest.setTimeout(60000); // 60 seconds
        // Declare all event flags and leaderboard at the top
        let q1Received1 = false, q1Received2 = false, feedbackQ1 = false;
        let q2Received1 = false, q2Received2 = false, q2Received3 = false;
        let feedbackQ2 = false;
        let endReceived = false;
        let leaderboard: any;

        // 1. player-1 (student) creates a tournament
        // Create a game template for the tournament
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Template',
                creatorId: teacher1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: {
                    create: [
                        { questionUid: question1.uid, sequence: 1 },
                        { questionUid: question2.uid, sequence: 2 }
                    ]
                }
            }
        });
        const createRes = await request(address)
            .post('/api/v1/games')
            .send({
                name: 'Test Tournament',
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id,
                discipline: 'math',
                nbOfQuestions: 2,
            })
            .set('Authorization', `Bearer ${player1.token}`); // Use player1's token (student)
        if (createRes.status !== 201) {
            console.error('Tournament creation failed:', createRes.body);
        }
        expect(createRes.status).toBe(201);
        const gameInstance = createRes.body.gameInstance;
        accessCode = gameInstance.accessCode;
        console.log('Tournament created');

        // 2. player-2 joins the lobby
        const joinRes2 = await request(address)
            .post(`/api/v1/games/${accessCode}/join`)
            .send({ userId: player2.id })
            .set('Authorization', `Bearer ${player2.token}`);
        expect(joinRes2.status).toBe(200);
        console.log('Player 2 joined');

        // 3. player-1 joins and starts the tournament
        const joinRes1 = await request(address)
            .post(`/api/v1/games/${accessCode}/join`)
            .send({ userId: player1.id })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(joinRes1.status).toBe(200);
        console.log('Player 1 joined');

        // Connect sockets for all players, passing JWT token in 'auth'
        const socket1 = Client(address, { auth: { token: player1.token } });
        const socket2 = Client(address, { auth: { token: player2.token } });
        let socket3;

        // Register event handlers before joining
        socket1.onAny((event, ...args) => {
            console.log(`[socket1] onAny event:`, event, args);
        });
        socket2.onAny((event, ...args) => {
            console.log(`[socket2] onAny event:`, event, args);
        });
        socket1.on('game_joined', (data) => {
            console.log('[socket1] game_joined', data);
        });
        socket2.on('game_joined', (data) => {
            console.log('[socket2] game_joined', data);
        });
        socket1.on('game_error', (data) => {
            console.log('[socket1] game_error', data);
        });
        socket2.on('game_error', (data) => {
            console.log('[socket2] game_error', data);
        });
        socket1.on('game_question', (data: any) => {
            console.log('[socket1] game_question', data);
            if (data.index === 0) q1Received1 = true;
            if (data.index === 1) q2Received1 = true;
        });
        socket2.on('game_question', (data: any) => {
            console.log('[socket2] game_question', data);
            if (data.index === 0) q1Received2 = true;
            if (data.index === 1) q2Received2 = true;
        });
        socket1.on('feedback', (data: any) => {
            console.log('[socket1] feedback', data);
            if (data.questionId === question1.uid) feedbackQ1 = true;
            if (data.questionId === question2.uid) feedbackQ2 = true;
        });
        socket2.on('feedback', (data: any) => {
            console.log('[socket2] feedback', data);
            if (data.questionId === question1.uid) feedbackQ1 = true;
            if (data.questionId === question2.uid) feedbackQ2 = true;
        });
        socket1.on('game_end', () => {
            console.log('[socket1] game_end');
            endReceived = true;
        });
        socket2.on('game_end', () => {
            console.log('[socket2] game_end');
            endReceived = true;
        });
        socket1.on('connect', () => {
            console.log('[socket1] connected');
        });
        socket1.on('connect_error', (err: any) => {
            console.log('[socket1] connect_error', err);
        });
        socket1.on('disconnect', (reason: any) => {
            console.log('[socket1] disconnected', reason);
        });
        socket2.on('connect', () => {
            console.log('[socket2] connected');
        });
        socket2.on('connect_error', (err: any) => {
            console.log('[socket2] connect_error', err);
        });
        socket2.on('disconnect', (reason: any) => {
            console.log('[socket2] disconnected', reason);
        });
        // For socket3 after creation:
        socket3.on('connect', () => {
            console.log('[socket3] connected');
        });
        socket3.on('connect_error', (err: any) => {
            console.log('[socket3] connect_error', err);
        });
        socket3.on('disconnect', (reason: any) => {
            console.log('[socket3] disconnected', reason);
        });

        // Wait for sockets to connect
        await Promise.all([
            new Promise<void>(resolve => socket1.on('connect', () => resolve())),
            new Promise<void>(resolve => socket2.on('connect', () => resolve())),
        ]);
        console.log('Sockets connected');

        // Ensure sockets join the correct room
        socket1.emit('join_tournament', { accessCode, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode, userId: player2.id, username: player2.username });
        console.log('Emitted join_tournament with accessCode:', accessCode);
        await wait(1000); // Wait for room join
        console.log('Sockets joined tournament room, proceeding to start tournament');

        // 4. player-1 starts the tournament (status update for lobby polling)
        await request(address)
            .put(`/api/v1/games/${gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`); // Use player1's token
        console.log('Tournament status set to active');

        // Emit start_tournament event to trigger real-time orchestration (from player1)
        socket1.emit('start_tournament', { accessCode });
        console.log('Emitted start_tournament event');

        // Wait for Q1 to be received
        await wait(2000); // increased from 400ms
        console.log('Waited for Q1');
        // Add extra debug before expect
        console.log('q1Received1:', q1Received1, 'q1Received2:', q1Received2);
        expect(q1Received1).toBe(true);
        expect(q1Received2).toBe(true);

        // 5. Both answer Q1 (player-1 correct, player-2 wrong)
        socket1.emit('tournament_answer', { accessCode, userId: player1.id, questionId: question1.uid, answer: 0, timeSpent: 2 });
        socket2.emit('tournament_answer', { accessCode, userId: player2.id, questionId: question1.uid, answer: 1, timeSpent: 2 });

        // Wait for feedback (should be after 2s)
        await wait(1200); // was 2500
        console.log('Waited for feedbackQ1');
        expect(feedbackQ1).toBe(true);

        // Wait for Q2
        await wait(400); // was 1000
        console.log('Waited for Q2');
        expect(q2Received1).toBe(true);
        expect(q2Received2).toBe(true);

        // 6. player-3 joins as late joiner
        const joinRes3 = await request(address)
            .post(`/api/v1/games/${accessCode}/join`)
            .send({ userId: player3.id })
            .set('Authorization', `Bearer ${player3.token}`);
        expect(joinRes3.status).toBe(200);
        socket3 = Client(address, { query: { userId: player3.id } });
        socket3.onAny((event, ...args) => {
            console.log(`[socket3] onAny event:`, event, args);
        });
        socket3.on('game_question', (data: any) => {
            console.log('[socket3] game_question', data);
            if (data.index === 1) q2Received3 = true;
        });
        socket3.on('feedback', (data: any) => {
            console.log('[socket3] feedback', data);
            if (data.questionId === question2.uid) feedbackQ2 = true;
        });
        socket3.on('game_end', () => {
            console.log('[socket3] game_end');
            endReceived = true;
        });
        socket3.on('connect', () => {
            console.log('[socket3] connected');
        });
        socket3.on('connect_error', (err: any) => {
            console.log('[socket3] connect_error', err);
        });
        socket3.on('disconnect', (reason: any) => {
            console.log('[socket3] disconnected', reason);
        });
        await wait(300); // was 500
        // For socket3, after creation and before emitting join_tournament:
        await new Promise<void>(resolve => socket3.on('connect', () => resolve()));
        socket3.emit('join_tournament', { accessCode, userId: player3.id, username: player3.username });
        await wait(300);
        console.log('Waited for late joiner socket3 connect');
        await wait(300); // was 500
        console.log('Waited for Q2 for late joiner');
        expect(q2Received3).toBe(true);

        // All answer Q2
        socket1.emit('tournament_answer', { accessCode, userId: player1.id, questionId: question2.uid, answer: 1, timeSpent: 2 });
        socket2.emit('tournament_answer', { accessCode, userId: player2.id, questionId: question2.uid, answer: 1, timeSpent: 2 });
        socket3.emit('tournament_answer', { accessCode, userId: player3.id, questionId: question2.uid, answer: 1, timeSpent: 2 });

        // Wait for feedback and end
        await wait(1200); // was 2000
        console.log('Waited for feedbackQ2');
        expect(feedbackQ2).toBe(true);
        await wait(800); // was 1000
        console.log('Waited for endReceived');
        expect(endReceived).toBe(true);

        // 7. Check leaderboard
        const lbRes = await request(address).get(`/api/v1/games/${accessCode}/leaderboard`);
        expect(lbRes.status).toBe(200);
        leaderboard = lbRes.body.leaderboard;
        expect(leaderboard.length).toBeGreaterThanOrEqual(2);
        expect(leaderboard[0].score).toBeGreaterThanOrEqual(leaderboard[1].score);

        // Clean up sockets
        socket1.close();
        socket2.close();
        socket3.close();
    });
});
