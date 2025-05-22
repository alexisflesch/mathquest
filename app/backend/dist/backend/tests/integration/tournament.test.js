"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const socket_io_client_1 = require("socket.io-client"); // Import ioc for creating client sockets
const prisma_1 = require("@/db/prisma");
const server_1 = require("@/server");
const testQuestions_1 = require("../support/testQuestions");
const redis_1 = require("@/config/redis");
const sockets_1 = require("@/sockets");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForEvent = (socket, eventName, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        if (!socket)
            return reject(new Error('Socket undefined'));
        const handler = (data) => {
            socket.off(eventName, handler);
            resolve(data);
        };
        socket.on(eventName, handler);
        setTimeout(() => {
            socket.off(eventName, handler);
            reject(new Error(`Timeout waiting for ${eventName}`));
        }, timeout);
    });
};
describe('Minimal Tournament Flow', () => {
    let app; // Use express.Express type
    let httpServer;
    let io;
    let address;
    let socket1, socket2;
    let player1, player2;
    let accessCode;
    beforeAll(async () => {
        // Seed all testQuestions into the database before running tournament tests
        await prisma_1.prisma.question.deleteMany();
        await prisma_1.prisma.question.createMany({ data: testQuestions_1.testQuestions });
        const serverSetup = (0, server_1.setupServer)();
        httpServer = serverSetup.httpServer;
        io = serverSetup.io;
        await new Promise((resolve) => httpServer.listen({ port: 0 }, resolve)); // Corrected listen and added void type
        const port = httpServer.address().port;
        address = `http://localhost:${port}`;
        // Create users
        player1 = await prisma_1.prisma.user.create({ data: { username: 'p1', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-p1' } } } });
        player2 = await prisma_1.prisma.user.create({ data: { username: 'p2', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-p2' } } } });
        // Ensure test question exists
        for (const tq of testQuestions_1.testQuestions.slice(0, 1)) {
            await prisma_1.prisma.question.upsert({
                where: { uid: tq.uid },
                update: { ...tq, answerOptions: tq.answerOptions, correctAnswers: tq.correctAnswers },
                create: { ...tq, answerOptions: tq.answerOptions, correctAnswers: tq.correctAnswers },
            });
        }
        // Auth tokens
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
        const signToken = (user) => jwt.sign({ userId: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1h' });
        player1.token = signToken(player1);
        player2.token = signToken(player2);
    });
    afterAll(async () => {
        console.log('Starting afterAll cleanup...');
        // Helper function for disconnecting client sockets
        const disconnectSocket = async (socket, name, timeoutMs) => {
            if (!socket) {
                console.log(`${name} is not defined.`);
                return;
            }
            console.log(`Processing ${name}...`);
            // Remove all listeners attached during tests to prevent memory leaks or interference
            socket.removeAllListeners();
            if (socket.connected) {
                console.log(`${name} is connected. Attempting graceful disconnect...`);
                try {
                    await new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            console.warn(`${name} disconnect event timed out after ${timeoutMs}ms.`);
                            reject(new Error(`${name} disconnect event timeout`));
                        }, timeoutMs);
                        socket.once('disconnect', (reason) => {
                            clearTimeout(timeoutId);
                            console.log(`${name} disconnected. Reason: ${reason || 'N/A'}`);
                            resolve();
                        });
                        socket.disconnect(); // Initiate disconnection
                    });
                }
                catch (e) {
                    console.warn(`Error during ${name} graceful disconnect: ${e.message}. Attempting forceful disconnect.`);
                    // If graceful disconnect fails or times out, ensure disconnect is called
                    socket.disconnect();
                }
            }
            else {
                console.log(`${name} was not connected. Calling disconnect() as a cleanup step.`);
                // Call disconnect even if not connected, as it might perform some client-side cleanup
                socket.disconnect();
            }
            console.log(`${name} processing complete.`);
        };
        // 1. Clean up client-side sockets
        await disconnectSocket(socket1, 'socket1', 5000); // Increased timeout
        await disconnectSocket(socket2, 'socket2', 5000); // Increased timeout
        await new Promise(resolve => setTimeout(resolve, 500)); // Short pause
        // 2. Close Socket.IO server
        if (io) {
            console.log('Closing Socket.IO server...');
            await new Promise((resolveIO) => {
                const timeoutId = setTimeout(() => {
                    console.warn('Socket.IO server close timed out after 7000ms. Forcing continuation.');
                    resolveIO();
                }, 7000); // Increased timeout
                io.close((err) => {
                    clearTimeout(timeoutId);
                    if (err) {
                        console.error('Socket.IO server close error:', err);
                    }
                    else {
                        console.log('Socket.IO server closed successfully.');
                    }
                    resolveIO();
                });
            });
        }
        // 3. Close HTTP server
        console.log('Attempting to close HTTP server...');
        if (httpServer && typeof httpServer.close === 'function') {
            if (httpServer.listening) {
                console.log('HTTP server is listening, proceeding to close.');
                await new Promise((resolveHTTP) => {
                    const timeoutId = setTimeout(() => {
                        console.warn('HTTP server close attempt timed out after 5000ms. Forcing continuation.');
                        resolveHTTP();
                    }, 5000); // Keep existing timeout
                    httpServer.close((err) => {
                        clearTimeout(timeoutId);
                        if (err) {
                            console.error('HTTP server close error:', err);
                        }
                        console.log('HTTP server closed callback executed.');
                        resolveHTTP();
                    });
                });
            }
            else {
                console.log('HTTP server was not listening. Assuming already closed or handled by Socket.IO close.');
            }
        }
        else {
            console.log('HTTP server instance not found or .close is not a function.');
        }
        console.log('Waiting longer for server resources to release before closing Redis...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Crucial pause
        // 4. Close Socket.IO-specific Redis clients (subClient)
        console.log('Closing SocketIO Redis clients (subClient)...');
        try {
            await (0, sockets_1.closeSocketIORedisClients)();
            console.log('SocketIO Redis clients closed.');
        }
        catch (e) { // Added type for e
            console.warn('Error closing SocketIO Redis clients:', e.message || e);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        // 5. Close the main Redis client
        console.log('Closing main Redis client...');
        if (redis_1.redisClient && redis_1.redisClient.status !== 'end') {
            try {
                await redis_1.redisClient.quit();
                console.log('Main Redis client quit successfully.');
            }
            catch (e) { // Added type for e
                console.warn('Error quitting main Redis client:', e.message || e);
            }
        }
        else if (redis_1.redisClient) {
            console.log('Main Redis client was not in a quittable state or already closed:', redis_1.redisClient.status);
        }
        else {
            console.log('Main Redis client was not defined.');
        }
        // 6. Clean up DB
        console.log('Cleaning up database...');
        try {
            await prisma_1.prisma.gameParticipant.deleteMany();
            await prisma_1.prisma.gameInstance.deleteMany();
            await prisma_1.prisma.gameTemplate.deleteMany();
            await prisma_1.prisma.user.deleteMany({ where: { username: { in: ['p1', 'p2'] } } });
            console.log('Database cleanup successful.');
        }
        catch (e) { // Added type for e
            console.error('Error during database cleanup:', e.message || e);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('afterAll cleanup complete.');
    }, 60000); // Keep increased timeout for afterAll hook
    it('P1 creates, P2 joins, both receive Q1', async () => {
        // Create template and game
        const gameTemplate = await prisma_1.prisma.gameTemplate.create({
            data: {
                name: 'Minimal Tournament',
                creatorId: player1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: { create: [{ questionUid: testQuestions_1.testQuestions[0].uid, sequence: 1 }] }
            }
        });
        const createRes = await (0, supertest_1.default)(address)
            .post('/api/v1/games')
            .send({ name: 'Test Tournament', playMode: 'tournament', gameTemplateId: gameTemplate.id, discipline: 'math', nbOfQuestions: 1 })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const accessCode1 = createRes.body.gameInstance.accessCode;
        // No need to manually initialize game state; backend now does this
        await wait(100); // Give backend time to persist state
        // Both join lobby (HTTP)
        await (0, supertest_1.default)(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player1.id }).set('Authorization', `Bearer ${player1.token}`).expect(200);
        await (0, supertest_1.default)(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player2.id }).set('Authorization', `Bearer ${player2.token}`).expect(200);
        // Connect sockets
        // Connect player 1
        socket1 = (0, socket_io_client_1.io)(address, { auth: { token: player1.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        // Connect player 2
        socket2 = (0, socket_io_client_1.io)(address, { auth: { token: player2.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await Promise.all([
            new Promise((res) => socket1.on('connect', () => res())),
            new Promise((res) => socket2.on('connect', () => res())),
        ]);
        // Join tournament via socket
        socket1.emit('join_tournament', { accessCode: accessCode1, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode: accessCode1, userId: player2.id, username: player2.username });
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined'),
        ]);
        // Start tournament
        await (0, supertest_1.default)(address)
            .put(`/api/v1/games/${createRes.body.gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        socket1.emit('start_tournament', { accessCode: accessCode1 });
        // Both should receive Q1
        const [q1p1, q1p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q1p1.question.uid).toBe(testQuestions_1.testQuestions[0].uid);
        expect(q1p2.question.uid).toBe(testQuestions_1.testQuestions[0].uid);
        // Player 1 answers correctly, Player 2 answers incorrectly
        // correctAnswers is a boolean array, answerOptions is a string array
        const correctIndex = q1p1.question.correctAnswers.findIndex((v) => v);
        const correctAnswer = q1p1.question.answerOptions[correctIndex];
        // Pick a wrong answer (first option that is not correct)
        const wrongIndex = q1p1.question.correctAnswers.findIndex((v, idx) => !v && idx !== correctIndex);
        const wrongAnswer = q1p2.question.answerOptions[wrongIndex];
        expect(wrongAnswer).toBeDefined();
        socket1.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player1.id,
            questionId: q1p1.question.uid,
            answer: correctAnswer,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player2.id,
            questionId: q1p2.question.uid,
            answer: wrongAnswer,
            timeSpent: 2
        });
        // Wait for correct_answers event from backend for both
        const [ca1, ca2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);
        // Print the raw leaderboard for debugging
        const leaderboardRes = await (0, supertest_1.default)(address)
            .get(`/api/v1/games/${accessCode1}/leaderboard`)
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        // Print the raw leaderboard for debugging
        // eslint-disable-next-line no-console
        console.log('Leaderboard response:', JSON.stringify(leaderboardRes.body, null, 2));
        const leaderboard = leaderboardRes.body.leaderboard || leaderboardRes.body;
        const p1Entry = leaderboard.find((entry) => entry.userId === player1.id);
        const p2Entry = leaderboard.find((entry) => entry.userId === player2.id);
        expect(p1Entry).toBeDefined();
        expect(p2Entry).toBeDefined();
        expect(p1Entry.score).toBeGreaterThan(p2Entry.score);
    });
    it('P1 creates, P2 joins, backend sets the rhythm', async () => {
        // Create template and game
        const gameTemplate = await prisma_1.prisma.gameTemplate.create({
            data: {
                name: 'Minimal Tournament',
                creatorId: player1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: { create: [{ questionUid: testQuestions_1.testQuestions[0].uid, sequence: 1 }] }
            }
        });
        const createRes = await (0, supertest_1.default)(address)
            .post('/api/v1/games')
            .send({ name: 'Test Tournament', playMode: 'tournament', gameTemplateId: gameTemplate.id, discipline: 'math', nbOfQuestions: 1 })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const accessCode2 = createRes.body.gameInstance.accessCode;
        // No need to manually initialize game state; backend now does this
        await wait(100); // Give backend time to persist state
        // Both join lobby (HTTP)
        await (0, supertest_1.default)(address).post(`/api/v1/games/${accessCode2}/join`).send({ userId: player1.id }).set('Authorization', `Bearer ${player1.token}`).expect(200);
        await (0, supertest_1.default)(address).post(`/api/v1/games/${accessCode2}/join`).send({ userId: player2.id }).set('Authorization', `Bearer ${player2.token}`).expect(200);
        // Connect sockets
        // Connect player 1
        socket1 = (0, socket_io_client_1.io)(address, { auth: { token: player1.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        // Connect player 2
        socket2 = (0, socket_io_client_1.io)(address, { auth: { token: player2.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await Promise.all([
            new Promise((res) => socket1.on('connect', () => res())),
            new Promise((res) => socket2.on('connect', () => res())),
        ]);
        // Join tournament via socket
        socket1.emit('join_tournament', { accessCode: accessCode2, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode: accessCode2, userId: player2.id, username: player2.username });
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined'),
        ]);
        // Start tournament
        await (0, supertest_1.default)(address)
            .put(`/api/v1/games/${createRes.body.gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        socket1.emit('start_tournament', { accessCode: accessCode2 });
        // Wait for tournament_starting and countdown_complete
        await Promise.all([
            waitForEvent(socket1, 'tournament_starting', 5000),
            waitForEvent(socket2, 'tournament_starting', 5000),
        ]);
        await Promise.all([
            waitForEvent(socket1, 'countdown_complete', 7000),
            waitForEvent(socket2, 'countdown_complete', 7000),
        ]);
        // Both should receive Q1 after countdown_complete
        const [q1p1, q1p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q1p1.question.uid).toBe(testQuestions_1.testQuestions[0].uid);
        expect(q1p2.question.uid).toBe(testQuestions_1.testQuestions[0].uid);
        // Player 1 answers correctly, Player 2 answers incorrectly
        // correctAnswers is a boolean array, answerOptions is a string array
        const correctIndex = q1p1.question.correctAnswers.findIndex((v) => v);
        const correctAnswer = q1p1.question.answerOptions[correctIndex];
        // Pick a wrong answer (first option that is not correct)
        const wrongIndex = q1p1.question.correctAnswers.findIndex((v, idx) => !v && idx !== correctIndex);
        const wrongAnswer = q1p2.question.answerOptions[wrongIndex];
        expect(wrongAnswer).toBeDefined();
        socket1.emit('tournament_answer', {
            accessCode: accessCode2,
            userId: player1.id,
            questionId: q1p1.question.uid,
            answer: correctAnswer,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode2,
            userId: player2.id,
            questionId: q1p2.question.uid,
            answer: wrongAnswer,
            timeSpent: 2
        });
        // Wait for correct_answers event from backend for both
        const [ca1, ca2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);
        // Print the raw leaderboard for debugging
        const leaderboardRes = await (0, supertest_1.default)(address)
            .get(`/api/v1/games/${accessCode2}/leaderboard`)
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        // Print the raw leaderboard for debugging
        // eslint-disable-next-line no-console
        console.log('Leaderboard response:', JSON.stringify(leaderboardRes.body, null, 2));
        const leaderboard = leaderboardRes.body.leaderboard || leaderboardRes.body;
        const p1Entry = leaderboard.find((entry) => entry.userId === player1.id);
        const p2Entry = leaderboard.find((entry) => entry.userId === player2.id);
        expect(p1Entry).toBeDefined();
        expect(p2Entry).toBeDefined();
        expect(p1Entry.score).toBeGreaterThan(p2Entry.score);
    });
});
