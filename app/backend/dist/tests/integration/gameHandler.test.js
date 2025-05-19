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
        // Create test players for our tests
        // These players are needed to satisfy foreign key constraints
        await prisma_1.prisma.player.upsert({
            where: { id: 'player-123' },
            update: {},
            create: {
                id: 'player-123',
                username: 'Test Player',
                cookieId: 'cookie-player-123'
            }
        });
        await prisma_1.prisma.player.upsert({
            where: { id: 'player-1' },
            update: {},
            create: {
                id: 'player-1',
                username: 'Player 1',
                cookieId: 'cookie-player-1'
            }
        });
        await prisma_1.prisma.player.upsert({
            where: { id: 'player-2' },
            update: {},
            create: {
                id: 'player-2',
                username: 'Player 2',
                cookieId: 'cookie-player-2'
            }
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
        const testTemplate = await prisma_1.prisma.gameTemplate.create({
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
        await prisma_1.prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: testTemplate.id,
                questionUid: question1.uid,
                sequence: 0
            }
        });
        await prisma_1.prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: testTemplate.id,
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
                playMode: 'quiz',
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                },
                gameTemplateId: testTemplate.id,
                : testTeacher.id
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
        // Clean up the quiz template we created (must be after gameInstance)
        await prisma_1.prisma.gameTemplate.deleteMany({
            where: { name: 'Test Quiz Template' }
        });
        // Clean up questions
        await prisma_1.prisma.question.deleteMany({
            where: { text: { in: ['What is 2+2?', 'What is 3×3?'] } }
        });
        // Clean up test players
        await prisma_1.prisma.player.deleteMany({
            where: { id: { in: ['player-123', 'player-1', 'player-2'] } }
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
            return;
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
            return;
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
    // Use a shorter timeout for this test now that we have fixed the implementation
    test('Multiple players can join a game and see each other', async () => {
        // Set a reasonable timeout for this test
        jest.setTimeout(10000);
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
        // Initialize game state before players join
        const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        if (!gameInstance) {
            fail('Game instance not found');
            return;
        }
        await gameStateService_1.default.initializeGameState(gameInstance.id);
        // Set up promises to wait for join events
        const joinPromise1 = waitForEvent(socket1, 'game_joined');
        const joinPromise2 = waitForEvent(socket2, 'game_joined');
        // Player 1 joins
        socket1.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-1',
            username: 'Player 1',
            avatarUrl: 'avatar1.jpg'
        });
        // Wait for first player to join
        await joinPromise1;
        // Player 2 joins
        socket2.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-2',
            username: 'Player 2',
            avatarUrl: 'avatar2.jpg'
        });
        // Wait for second player to join
        await joinPromise2;
        // Wait a bit to make sure all events are processed
        await wait(100); // Much shorter wait since our implementation is fixed
        // Verify participants in Redis
        const participantsCount = await redis_1.redisClient.hlen(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        expect(participantsCount).toBe(2);
        // Listen for game_participants event
        const participantsPromise = waitForEvent(socket1, 'game_participants');
        // Force a refresh of the participants list
        socket1.emit('request_participants', { accessCode: TEST_ACCESS_CODE });
        // Wait for participants list with timeout
        const participantsData = await Promise.race([
            participantsPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for participants')), 3000))
        ]);
        // Now we should get both participants since we properly implemented 'request_participants'
        expect(participantsData).toBeDefined();
        expect(participantsData.participants.length).toBe(2);
        // Check for specific participant data
        const player1 = participantsData.participants.find((p) => p.playerId === 'player-1');
        const player2 = participantsData.participants.find((p) => p.playerId === 'player-2');
        expect(player1).toBeDefined();
        expect(player2).toBeDefined();
        expect(player1?.username).toBe('Player 1');
        expect(player2?.username).toBe('Player 2');
    });
    test('Simplified test: Multiple players can join a game', async () => {
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
        // Initialize game state
        const gameInstance = await prisma_1.prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        if (!gameInstance) {
            fail('Game instance not found');
            return;
        }
        await gameStateService_1.default.initializeGameState(gameInstance.id);
        // Player 1 joins
        socket1.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-1',
            username: 'Player 1',
            avatarUrl: 'avatar1.jpg'
        });
        // Player 2 joins
        socket2.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            playerId: 'player-2',
            username: 'Player 2',
            avatarUrl: 'avatar2.jpg'
        });
        // Wait for both players to join the game
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined')
        ]);
        // Wait briefly to allow Redis operations to complete
        await wait(500);
        // Directly verify the Redis state
        const participantsCount = await redis_1.redisClient.hlen(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        expect(participantsCount).toBe(2);
    });
});
