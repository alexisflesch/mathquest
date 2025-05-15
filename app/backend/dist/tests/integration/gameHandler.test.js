"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const testSetup_1 = require("../testSetup");
const prisma_1 = require("../../src/db/prisma");
const redis_1 = require("../../src/config/redis");
const gameStateService_1 = __importDefault(require("../../src/core/gameStateService"));
// Global test variables
let io;
let clientSockets = []; // Initialize as empty array
let port;
let serverCleanup;
// Test access code for fake game instance
const TEST_ACCESS_CODE = 'TST789';
// Helper to create a socket.io client
const createSocketClient = (query = {}) => {
    return (0, socket_io_client_1.default)(`http://localhost:${port}`, {
        path: '/api/socket.io',
        query,
        autoConnect: false,
        transports: ['websocket']
    });
};
// Helper to wait for an event
const waitForEvent = (socket, event) => {
    return new Promise((resolve) => {
        socket.once(event, (data) => {
            resolve(data);
        });
    });
};
// Helper to wait a bit
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
describe('Game Handler', () => {
    beforeAll(async () => {
        // Start test server and get Socket.IO instance
        const setup = await (0, testSetup_1.startTestServer)();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;
        // Create a test game instance
        await prisma_1.prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        // Create a quiz template first (required for the game instance)
        const testTeacher = await prisma_1.prisma.teacher.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                username: 'testteacher',
                passwordHash: 'hash-not-important-for-test',
                email: 'test@example.com'
            }
        });
        // Create a quiz template with some questions
        const testTemplate = await prisma_1.prisma.quizTemplate.create({
            data: {
                name: 'Test Quiz Template',
                creatorTeacherId: testTeacher.id,
                themes: ['math']
            }
        });
        // Create some test questions
        const question1 = await prisma_1.prisma.question.create({
            data: {
                title: 'Addition',
                text: 'What is 2+2?',
                questionType: 'multiple_choice_single_answer',
                difficulty: 1, // Easy
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                responses: JSON.stringify([
                    { id: 'a', content: '3', isCorrect: false },
                    { id: 'b', content: '4', isCorrect: true },
                    { id: 'c', content: '5', isCorrect: false },
                    { id: 'd', content: '22', isCorrect: false }
                ]),
                author: testTeacher.username
            }
        });
        const question2 = await prisma_1.prisma.question.create({
            data: {
                title: 'Multiplication',
                text: 'What is 3×3?',
                questionType: 'multiple_choice_single_answer',
                difficulty: 1, // Easy
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                responses: JSON.stringify([
                    { id: 'a', content: '6', isCorrect: false },
                    { id: 'b', content: '9', isCorrect: true },
                    { id: 'c', content: '12', isCorrect: false },
                    { id: 'd', content: '33', isCorrect: false }
                ]),
                author: testTeacher.username
            }
        });
        // Link questions to quiz template
        await prisma_1.prisma.questionsInQuizTemplate.create({
            data: {
                quizTemplateId: testTemplate.id,
                questionUid: question1.uid,
                sequence: 0
            }
        });
        await prisma_1.prisma.questionsInQuizTemplate.create({
            data: {
                quizTemplateId: testTemplate.id,
                questionUid: question2.uid,
                sequence: 1
            }
        });
        // Create the game instance
        await prisma_1.prisma.gameInstance.create({
            data: {
                accessCode: TEST_ACCESS_CODE,
                name: 'Test Game',
                status: 'active',
                playMode: 'class',
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                },
                quizTemplateId: testTemplate.id,
                initiatorTeacherId: testTeacher.id
            }
        });
        // Initialize game state in Redis
        const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        if (gameInstance) {
            await gameStateService_1.default.initializeGameState(gameInstance.id);
        }
        // Clear any existing data in Redis
        const keys = await redis_1.redisClient.keys(`mathquest:game:*${TEST_ACCESS_CODE}*`);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
    });
    beforeEach(async () => {
        // Initialize empty array of client sockets for each test
        clientSockets = [];
    });
    afterEach(async () => {
        // Disconnect all client sockets after each test
        for (const socket of clientSockets) {
            if (socket.connected) {
                socket.disconnect();
            }
        }
        clientSockets = [];
        // Clear Redis game data
        const keys = await redis_1.redisClient.keys(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
    });
    afterAll(async () => {
        // Clean up server and databases
        await serverCleanup();
        // Clean up test game instance and related data
        await prisma_1.prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        // Clean up the quiz template we created
        await prisma_1.prisma.quizTemplate.deleteMany({
            where: { name: 'Test Quiz Template' }
        });
        // Clean up questions
        await prisma_1.prisma.question.deleteMany({
            where: { text: { in: ['What is 2+2?', 'What is 3×3?'] } }
        });
        // Clean up Redis
        const keys = await redis_1.redisClient.keys(`mathquest:game:*${TEST_ACCESS_CODE}*`);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
    });
    test('Player can join a game', async () => {
        // Create client socket
        const socket = createSocketClient({
            token: 'player-token-123',
            role: 'player'
        });
        clientSockets.push(socket);
        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');
        // Make sure the game state is initialized before joining
        const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        if (!gameInstance) {
            fail('Game instance not found');
            return;
        }
        await gameStateService_1.default.initializeGameState(gameInstance.id);
        // Join the game
        const joinPromise = waitForEvent(socket, 'game_joined');
        socket.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-123',
            username: 'Test Player',
            avatarUrl: 'avatar.jpg'
        });
        // Wait for game joined response with a timeout
        const joinResponse = await Promise.race([
            joinPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for game_joined event')), 5000))
        ]);
        expect(joinResponse).toBeDefined();
        expect(joinResponse.accessCode).toBe(TEST_ACCESS_CODE);
    });
    test('Player can submit an answer to a question', async () => {
        // Initialize game state with first question
        const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        if (!gameInstance) {
            fail('Game instance not found');
        }
        await gameStateService_1.default.initializeGameState(gameInstance.id);
        await gameStateService_1.default.setCurrentQuestion(TEST_ACCESS_CODE, 0);
        // Create client socket
        const socket = createSocketClient({
            token: 'player-token-123',
            role: 'player'
        });
        clientSockets.push(socket);
        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');
        // Join the game
        socket.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-123',
            username: 'Test Player',
            avatarUrl: 'avatar.jpg'
        });
        await waitForEvent(socket, 'game_joined');
        await waitForEvent(socket, 'game_question');
        // Get the question id
        const gameStateRaw = await redis_1.redisClient.get(`mathquest:game:${TEST_ACCESS_CODE}`);
        if (!gameStateRaw) {
            fail('Game state not found in Redis');
        }
        const gameState = JSON.parse(gameStateRaw);
        const questionId = gameState.questionIds[0];
        // Submit an answer
        const answerPromise = waitForEvent(socket, 'answer_received');
        socket.emit('game_answer', {
            accessCode: TEST_ACCESS_CODE,
            questionId,
            answer: 'b', // Correct answer
            timeSpent: 3000 // 3 seconds
        });
        // Wait for answer received confirmation
        const answerResponse = await answerPromise;
        expect(answerResponse).toBeDefined();
        expect(answerResponse.questionId).toBe(questionId);
        expect(answerResponse.timeSpent).toBe(3000);
        // Verify that answer was stored in Redis
        const answersKey = `mathquest:game:answers:${TEST_ACCESS_CODE}:${questionId}`;
        const answersCount = await redis_1.redisClient.hlen(answersKey);
        expect(answersCount).toBe(1);
    });
    test('Multiple players can join a game and see each other', async () => {
        // Create 2 client sockets
        const socket1 = createSocketClient({ token: 'player1-token', role: 'player' });
        const socket2 = createSocketClient({ token: 'player2-token', role: 'player' });
        clientSockets.push(socket1, socket2);
        // Connect all sockets
        socket1.connect();
        socket2.connect();
        await Promise.all([
            waitForEvent(socket1, 'connect'),
            waitForEvent(socket2, 'connect')
        ]);
        // Player 1 joins
        socket1.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-1',
            username: 'Player 1',
            avatarUrl: 'avatar1.jpg'
        });
        // Wait for first player to join
        await waitForEvent(socket1, 'game_joined');
        // Setup event promise for player_joined_game before player 2 joins
        const player2JoinedPromise = waitForEvent(socket1, 'player_joined_game');
        // Player 2 joins
        socket2.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-2',
            username: 'Player 2',
            avatarUrl: 'avatar2.jpg'
        });
        // Wait for second player to join
        await waitForEvent(socket2, 'game_joined');
        // First player should receive notification of second player joining
        const player2JoinedEvent = await player2JoinedPromise;
        expect(player2JoinedEvent).toBeDefined();
        expect(player2JoinedEvent.username).toBe('Player 2');
        // Both should receive game_participants event with both players
        const participantsPromise1 = waitForEvent(socket1, 'game_participants');
        const participantsPromise2 = waitForEvent(socket2, 'game_participants');
        // Wait for both to receive participants list
        const [participants1, participants2] = await Promise.all([
            participantsPromise1,
            participantsPromise2
        ]);
        expect(participants1.participants.length).toBe(2);
        expect(participants2.participants.length).toBe(2);
        // Verify participants in Redis
        const participantsCount = await redis_1.redisClient.hlen(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        expect(participantsCount).toBe(2);
    });
});
