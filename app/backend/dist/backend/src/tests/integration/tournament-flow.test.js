"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const prisma_1 = require("@/db/prisma");
const server_1 = require("@/server");
const testQuestions_1 = require("../../../tests/support/testQuestions");
const jwt_1 = __importDefault(require("../helpers/jwt"));
// Utility to wait for a given ms
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
describe('Tournament Flow Integration', () => {
    let httpServer;
    let address;
    let player1, player2, player3;
    let question1, question2;
    let accessCode;
    beforeAll(async () => {
        // Start backend server (with Socket.IO) for integration test
        httpServer = (0, server_1.setupServer)();
        await new Promise((resolve) => httpServer.listen(0, resolve));
        const port = httpServer.address().port;
        address = `http://localhost:${port}`;
        // Seed DB: create 3 players
        player1 = await prisma_1.prisma.user.create({ data: { username: 'player-1', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-1' } } } });
        player2 = await prisma_1.prisma.user.create({ data: { username: 'player-2', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-2' } } } });
        player3 = await prisma_1.prisma.user.create({ data: { username: 'player-3', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-3' } } } });
        // Fetch seeded questions by uid
        question1 = await prisma_1.prisma.question.findUnique({ where: { uid: testQuestions_1.testQuestions[0].uid } });
        question2 = await prisma_1.prisma.question.findUnique({ where: { uid: testQuestions_1.testQuestions[1].uid } });
        // Patch feedbackWaitTime and timeLimit for test
        await prisma_1.prisma.question.update({ where: { uid: question1.uid }, data: { feedbackWaitTime: 2, timeLimit: 5 } });
        await prisma_1.prisma.question.update({ where: { uid: question2.uid }, data: { feedbackWaitTime: 1, timeLimit: 5 } });
        // Re-fetch to get updated values
        question1 = await prisma_1.prisma.question.findUnique({ where: { uid: testQuestions_1.testQuestions[0].uid } });
        question2 = await prisma_1.prisma.question.findUnique({ where: { uid: testQuestions_1.testQuestions[1].uid } });
        // Generate JWT for player1 (student)
        player1.token = (0, jwt_1.default)(player1.id, player1.username);
        player2.token = (0, jwt_1.default)(player2.id, player2.username);
        player3.token = (0, jwt_1.default)(player3.id, player3.username);
    });
    afterAll(async () => {
        await prisma_1.prisma.gameParticipant.deleteMany();
        await prisma_1.prisma.gameInstance.deleteMany();
        await prisma_1.prisma.question.deleteMany();
        await prisma_1.prisma.user.deleteMany({ where: { role: 'STUDENT' } });
        httpServer.close();
    });
    it('runs the full tournament flow with feedback timing and late joiner', async () => {
        jest.setTimeout(60000); // 60 seconds
        // Declare all event flags and leaderboard at the top
        let q1Received1 = false, q1Received2 = false, feedbackQ1 = false;
        let q2Received1 = false, q2Received2 = false, q2Received3 = false;
        let feedbackQ2 = false;
        let endReceived = false;
        let leaderboard;
        // 1. player-1 creates a tournament
        const createRes = await (0, supertest_1.default)(address)
            .post('/api/v1/games')
            .send({
            name: 'Test Tournament',
            playMode: 'tournament',
            gameTemplateId: null,
            gradeLevel: '5',
            discipline: 'math',
            themes: ['algebra', 'geometry'],
            nbOfQuestions: 2,
        })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const gameInstance = createRes.body.gameInstance;
        accessCode = gameInstance.accessCode;
        console.log('Tournament created');
        // 2. player-2 joins the lobby
        const joinRes2 = await (0, supertest_1.default)(address)
            .post(`/api/v1/games/${accessCode}/join`)
            .send({ userId: player2.id })
            .set('Authorization', `Bearer ${player2.token}`);
        expect(joinRes2.status).toBe(200);
        console.log('Player 2 joined');
        // 3. player-1 joins and starts the tournament
        const joinRes1 = await (0, supertest_1.default)(address)
            .post(`/api/v1/games/${accessCode}/join`)
            .send({ userId: player1.id })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(joinRes1.status).toBe(200);
        console.log('Player 1 joined');
        // Connect sockets for all players
        const socket1 = (0, socket_io_client_1.default)(address, { query: { userId: player1.id } });
        const socket2 = (0, socket_io_client_1.default)(address, { query: { userId: player2.id } });
        let socket3;
        // Register event handlers before joining
        socket1.on('game_question', (data) => {
            console.log('[socket1] game_question', data);
            if (data.index === 0)
                q1Received1 = true;
            if (data.index === 1)
                q2Received1 = true;
        });
        socket2.on('game_question', (data) => {
            console.log('[socket2] game_question', data);
            if (data.index === 0)
                q1Received2 = true;
            if (data.index === 1)
                q2Received2 = true;
        });
        socket1.on('feedback', (data) => {
            console.log('[socket1] feedback', data);
            if (data.questionId === question1.uid)
                feedbackQ1 = true;
            if (data.questionId === question2.uid)
                feedbackQ2 = true;
        });
        socket2.on('feedback', (data) => {
            console.log('[socket2] feedback', data);
            if (data.questionId === question1.uid)
                feedbackQ1 = true;
            if (data.questionId === question2.uid)
                feedbackQ2 = true;
        });
        socket1.on('game_end', () => {
            console.log('[socket1] game_end');
            endReceived = true;
        });
        socket2.on('game_end', () => {
            console.log('[socket2] game_end');
            endReceived = true;
        });
        // Wait for sockets to connect
        await wait(500);
        console.log('Sockets connected');
        // Ensure sockets join the correct room
        socket1.emit('join_tournament', { accessCode, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode, userId: player2.id, username: player2.username });
        await wait(300); // Give time for join
        // 4. player-1 starts the tournament (status update for lobby polling)
        await (0, supertest_1.default)(address)
            .put(`/api/v1/games/${gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`);
        console.log('Tournament status set to active');
        // Emit start_tournament event to trigger real-time orchestration
        socket1.emit('start_tournament', { accessCode, questions: [question1, question2] });
        console.log('Emitted start_tournament event');
        // Wait for Q1 to be received
        await wait(2000); // increased from 400ms
        console.log('Waited for Q1');
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
        const joinRes3 = await (0, supertest_1.default)(address)
            .post(`/api/v1/games/${accessCode}/join`)
            .send({ userId: player3.id })
            .set('Authorization', `Bearer ${player3.token}`);
        expect(joinRes3.status).toBe(200);
        socket3 = (0, socket_io_client_1.default)(address, { query: { userId: player3.id } });
        socket3.on('game_question', (data) => {
            console.log('[socket3] game_question', data);
            if (data.index === 1)
                q2Received3 = true;
        });
        socket3.on('feedback', (data) => {
            console.log('[socket3] feedback', data);
            if (data.questionId === question2.uid)
                feedbackQ2 = true;
        });
        socket3.on('game_end', () => {
            console.log('[socket3] game_end');
            endReceived = true;
        });
        await wait(300); // was 500
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
        const lbRes = await (0, supertest_1.default)(address).get(`/api/v1/games/${accessCode}/leaderboard`);
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
