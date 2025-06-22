import { Server } from 'socket.io';
import ClientIO from 'socket.io-client';
import { startTestServer } from '../testSetup';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import gameStateService from '../../src/core/services/gameStateService';
import generateStudentToken from '../helpers/jwt';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';

// Global test variables
let io: Server;
let clientSockets: ReturnType<typeof ClientIO>[] = []; // Initialize as empty array
let port: number;
let serverCleanup: () => Promise<void>;

// Variables to store IDs from beforeAll
let gameInstanceIdDb: string;
let firstQuestionUidDb: string;
let userIdDb: string;

// Test access code for fake game instance
const TEST_ACCESS_CODE = 'TST789';

// Helper to wait for an event
const waitForEvent = (socket: ReturnType<typeof ClientIO>, event: string): Promise<any> => {
    return new Promise((resolve) => {
        socket.once(event, (data: any) => {
            resolve(data);
        });
    });
};

// Helper to wait a bit
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Game Handler', () => {
    jest.setTimeout(15000); // Increase timeout to 15 seconds for all tests in this describe block

    // Add global unhandledRejection handler for better error visibility
    beforeAll(() => {
        process.on('unhandledRejection', (reason, promise) => {
            // eslint-disable-next-line no-console
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    });

    beforeAll(async () => {
        // Start test server and get Socket.IO instance
        const setup = await startTestServer();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;

        // Create a test game instance
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });

        // Create test users for our tests
        await prisma.user.upsert({
            where: { id: 'player-123' },
            update: {},
            create: {
                id: 'player-123',
                username: 'Test Player',
                role: 'STUDENT',
                studentProfile: { create: { cookieId: 'cookie-player-123' } }
            }
        });
        await prisma.user.upsert({
            where: { id: 'player-1' },
            update: {},
            create: {
                id: 'player-1',
                username: 'Player 1',
                role: 'STUDENT',
                studentProfile: { create: { cookieId: 'cookie-player-1' } }
            }
        });
        await prisma.user.upsert({
            where: { id: 'player-2' },
            update: {},
            create: {
                id: 'player-2',
                username: 'Player 2',
                role: 'STUDENT',
                studentProfile: { create: { cookieId: 'cookie-player-2' } }
            }
        });
        // Create a teacher user
        const testTeacher = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                username: 'testteacher',
                email: 'test@example.com',
                passwordHash: 'hash-not-important-for-test',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });
        userIdDb = testTeacher.id;
        // Create a quiz template with some questions
        const testTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Quiz Template',
                creatorId: testTeacher.id,
                themes: ['math']
            }
        });

        // Create some test questions
        const question1 = await prisma.question.create({
            data: {
                title: 'Addition',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1, // Easy
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['3', '4', '5', '22'],
                correctAnswers: [false, true, false, false],
                author: testTeacher.username
            }
        });
        firstQuestionUidDb = question1.uid; // Store UID

        const question2 = await prisma.question.create({
            data: {
                title: 'Multiplication',
                text: 'What is 3×3?',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1, // Easy
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['6', '9', '12', '33'],
                correctAnswers: [false, true, false, false],
                author: testTeacher.username
            }
        });

        // Link questions to quiz template
        await prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: testTemplate.id,
                questionUid: question1.uid,
                sequence: 0
            }
        });

        await prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: testTemplate.id,
                questionUid: question2.uid,
                sequence: 1
            }
        });

        // Create the game instance
        const createdGameInstance = await prisma.gameInstance.create({
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
                initiatorUserId: userIdDb
            }
        });
        gameInstanceIdDb = createdGameInstance.id; // Store game instance ID

        // Initialize game state in Redis
        // const gameInstance = await prisma.gameInstance.findFirst({ // Not needed, already have ID
        // where: { accessCode: TEST_ACCESS_CODE }
        // });

        if (gameInstanceIdDb) {
            await gameStateService.initializeGameState(gameInstanceIdDb);
        }

        // Clear any existing data in Redis
        const keys = await redisClient.keys(`mathquest:game:*${TEST_ACCESS_CODE}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
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

        // Clear all Redis keys related to the test game
        const keys = await redisClient.keys(`mathquest:game:*${TEST_ACCESS_CODE}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    });

    afterAll(async () => {
        // Clean up server and databases
        await serverCleanup();

        // Clean up in proper order to respect foreign key constraints

        // 1. Clean up GameParticipant records first (references users)
        await prisma.gameParticipant.deleteMany({
            where: {
                userId: { in: ['player-123', 'player-1', 'player-2'] }
            }
        });

        // 3. Clean up test game instance (references gameTemplate and user)
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });

        // 4. Clean up questionsInGameTemplate (references gameTemplate and questions)
        await prisma.questionsInGameTemplate.deleteMany({
            where: {
                gameTemplate: { name: 'Test Quiz Template' }
            }
        });

        // 5. Clean up the quiz template (references user)
        await prisma.gameTemplate.deleteMany({
            where: { name: 'Test Quiz Template' }
        });

        // 6. Clean up questions
        await prisma.question.deleteMany({
            where: { text: { in: ['What is 2+2?', 'What is 3×3?'] } }
        });

        // 7. Clean up student profiles first (referenced by users)
        await prisma.studentProfile.deleteMany({
            where: {
                id: { in: ['player-123', 'player-1', 'player-2'] }
            }
        });

        // 8. Clean up test student users
        await prisma.user.deleteMany({
            where: {
                id: { in: ['player-123', 'player-1', 'player-2'] }
            }
        });

        // 9. Clean up teacher profile and teacher user
        await prisma.teacherProfile.deleteMany({
            where: {
                user: { email: 'test@example.com' }
            }
        });

        await prisma.user.deleteMany({
            where: { email: 'test@example.com' }
        });

        // 10. Clean up Redis
        const keys = await redisClient.keys(`mathquest:game:*${TEST_ACCESS_CODE}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    });

    // Helper to create a socket.io client with error logging
    const createSocketClient = (query: Record<string, string> = {}) => {
        // Ensure userId is included for player sockets
        if (query.role === 'player' && !query.userId) {
            query.userId = 'player-123';
        }
        // If a token is not provided, generate a valid JWT for the user
        if (!query.token && query.userId) {
            query.token = generateStudentToken(query.userId, query.username || 'Test Player', 'STUDENT');
        }
        const socket = ClientIO(`http://localhost:${port}`, {
            path: '/api/socket.io',
            query,
            autoConnect: false,
            transports: ['websocket']
        });
        // Add error event logging
        socket.on('error', (err: any) => {
            // eslint-disable-next-line no-console
            console.error('Socket error:', err);
        });
        socket.on('connect_error', (err: any) => {
            // eslint-disable-next-line no-console
            console.error('Socket connect_error:', err);
        });
        return socket;
    };

    test('Player can join a game', async () => {
        // Create client socket
        const socket = createSocketClient({
            userId: 'player-123',
            username: 'Test Player',
            role: 'player'
        });

        clientSockets.push(socket);

        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');

        // Make sure the game state is initialized before joining
        const gameInstance = await prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });

        if (!gameInstance) {
            fail('Game instance not found');
            return;
        }

        await gameStateService.initializeGameState(gameInstance.id);

        // Join the game
        const joinPromise = waitForEvent(socket, 'game_joined');
        socket.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-123',
            username: 'Test Player',
            avatarEmoji: 'https://example.com/avatar.jpg'
        });

        // Wait for game joined response with a timeout
        const joinResponse = await Promise.race([
            joinPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for game_joined event')), 5000))
        ]);

        expect(joinResponse).toBeDefined();
        expect(joinResponse.accessCode).toBe(TEST_ACCESS_CODE);
    });

    // test('Player can submit an answer to a question', async () => {
    //     // Increase test timeout
    //     jest.setTimeout(15000); // Test-specific timeout, ensure it's generous

    //     // Create player client socket
    //     let playerSocket = createSocketClient({
    //         token: 'player-token-123',
    //         role: 'player',
    //         userId: 'player-123' // Explicitly set userId for player
    //     });
    //     clientSockets.push(playerSocket);

    //     // Add detailed event logging for player socket
    //     const playerSocketIdForLogging = playerSocket.id || 'player-pre-connect';
    //     playerSocket.onAny((event, ...args) => {
    //         console.log(`Player Client ${playerSocket.id || playerSocketIdForLogging} received event: ${event}`, args);
    //     });
    //     playerSocket.on('disconnect', (reason) => {
    //         console.log(`Player Client ${playerSocket.id || playerSocketIdForLogging} disconnected: ${reason}`);
    //     });
    //     playerSocket.on('connect_error', (err) => {
    //         console.error(`Player Client ${playerSocket.id || playerSocketIdForLogging} connect_error: ${err.message || err}`);
    //     });
    //     playerSocket.on('error', (err) => {
    //         console.error(`Player Client ${playerSocket.id || playerSocketIdForLogging} general error: ${err.message || err}`);
    //     });

    //     // Connect the player socket
    //     console.log('Connecting player socket...');
    //     playerSocket.connect();
    //     await waitForEvent(playerSocket, 'connect');
    //     console.log('Player socket connected successfully.');

    //     // Player joins the game and waits for confirmation
    //     console.log('Player emitting join_game event...');
    //     const playerJoinPromise = waitForEvent(playerSocket, 'game_joined');
    //     playerSocket.emit('join_game', {
    //         accessCode: TEST_ACCESS_CODE,
    //         userId: 'player-123',
    //         username: 'Test Player',
    //         avatarEmoji: 'https://example.com/avatar.jpg'
    //     });

    //     const playerJoinResponse = await Promise.race([
    //         playerJoinPromise,
    //         new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for player game_joined event')), 5000))
    //     ]);
    //     console.log('Player received game_joined response:', playerJoinResponse);

    //     // In backend-driven mode, the backend emits game_question after player joins
    //     console.log('Player waiting for game_question event...');
    //     const questionDataPromise = waitForEvent(playerSocket, 'game_question');
    //     const questionData = await Promise.race([
    //         questionDataPromise,
    //         new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for game_question event')), 7000))
    //     ]) as any;
    //     console.log('Player received game_question event:', questionData);

    //     expect(questionData).toBeDefined();
    //     expect(questionData.uid).toBe(firstQuestionUidDb); // Should match the first question UID

    //     const questionUidFromEvent = questionData.uid;
    //     console.log('Question UID from game_question event:', questionUidFromEvent);

    //     // Check if player socket is still connected
    //     console.log('Player socket connected status before game_answer emit:', playerSocket.connected);
    //     if (!playerSocket.connected) {
    //         fail('Player socket disconnected before emitting game_answer. Check server logs and previous client logs for errors.');
    //         return;
    //     }

    //     // Register event handlers for debugging game_answer response
    //     playerSocket.once('answer_confirmed', (data) => console.log('Player received answer_confirmed:', data));
    //     playerSocket.once('game_error', (err) => console.error('Player received game_error (after game_answer):', err));

    //     console.log('Player emitting game_answer with questionUid:', questionUidFromEvent);
    //     const answerResponsePromise = Promise.race([
    //         waitForEvent(playerSocket, 'answer_confirmed'),
    //         waitForEvent(playerSocket, 'game_error')
    //     ]);

    //     playerSocket.emit('game_answer', {
    //         accessCode: TEST_ACCESS_CODE,
    //         userId: 'player-123',
    //         questionUid: questionUidFromEvent, // Use the UID from the game_question event
    //         answer: [1], 
    //         timeTakenMs: 1500
    //     });
    //     console.log('Player game_answer emitted. Waiting for response...');

    //     const answerResponse = await Promise.race([
    //         answerResponsePromise,
    //         new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for answer_confirmed or game_error from player')), 7000))
    //     ]) as any;
    //     console.log('Player received response after game_answer:', answerResponse);

    //     if (answerResponse && answerResponse.error) {
    //         fail(`Player received game_error: ${JSON.stringify(answerResponse)}`);
    //     }

    //     expect(answerResponse).toBeDefined();
    //     expect(answerResponse.questionUid).toBe(questionUidFromEvent);
    //     expect(answerResponse.isCorrect).toBe(true); 
    // });

    test('Multiple players can join a game and see each other', async () => {
        // Create 2 client sockets
        const socket1 = createSocketClient({
            userId: 'player-1',
            username: 'Player 1',
            role: 'player'
        });

        const socket2 = createSocketClient({
            userId: 'player-2',
            username: 'Player 2',
            role: 'player'
        });

        clientSockets.push(socket1, socket2);

        // Connect all sockets
        socket1.connect();
        socket2.connect();

        await Promise.all([
            waitForEvent(socket1, 'connect'),
            waitForEvent(socket2, 'connect')
        ]);

        // Initialize game state before players join
        const gameInstance = await prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });

        if (!gameInstance) {
            fail('Game instance not found');
            return;
        }

        await gameStateService.initializeGameState(gameInstance.id);

        // Set up promises to wait for join events
        const joinPromise1 = waitForEvent(socket1, 'game_joined');
        const joinPromise2 = waitForEvent(socket2, 'game_joined');

        // Player 1 joins
        socket1.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-1',
            username: 'Player 1',
            avatarEmoji: 'https://example.com/avatar1.jpg'
        });

        // Wait for first player to join
        await joinPromise1;

        // Player 2 joins
        socket2.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-2',
            username: 'Player 2',
            avatarEmoji: 'https://example.com/avatar2.jpg'
        });

        // Wait for second player to join
        await joinPromise2;

        // Wait a bit to make sure all events are processed
        await wait(100);

        // Debug: print all participant entries in Redis
        const participantEntries = await redisClient.hgetall(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        console.log('DEBUG: Redis participants:', participantEntries);

        // Verify participants in Redis
        const participantsCount = await redisClient.hlen(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
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
        const player1 = participantsData.participants.find((p: any) => p.userId === 'player-1');
        const player2 = participantsData.participants.find((p: any) => p.userId === 'player-2');

        expect(player1).toBeDefined();
        expect(player2).toBeDefined();
        expect(player1?.username).toBe('Player 1');
        expect(player2?.username).toBe('Player 2');
    });

    test('Simplified test: Multiple players can join a game', async () => {
        // Create 2 client sockets
        const socket1 = createSocketClient({
            userId: 'player-1',
            username: 'Player 1',
            role: 'player'
        });

        const socket2 = createSocketClient({
            userId: 'player-2',
            username: 'Player 2',
            role: 'player'
        });

        clientSockets.push(socket1, socket2);

        // Connect all sockets
        socket1.connect();
        socket2.connect();

        await Promise.all([
            waitForEvent(socket1, 'connect'),
            waitForEvent(socket2, 'connect')
        ]);

        // Initialize game state
        const gameInstance = await prisma.gameInstance.findFirst({
            where: { accessCode: TEST_ACCESS_CODE }
        });

        if (!gameInstance) {
            fail('Game instance not found');
            return;
        }

        await gameStateService.initializeGameState(gameInstance.id);

        // Player 1 joins
        socket1.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-1',
            username: 'Player 1',
            avatarEmoji: 'https://example.com/avatar1.jpg'
        });

        // Player 2 joins
        socket2.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-2',
            username: 'Player 2',
            avatarEmoji: 'https://example.com/avatar2.jpg'
        });

        // Wait for both players to join the game
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined')
        ]);

        // Wait briefly to allow Redis operations to complete
        await wait(500);

        // Debug: print all participant entries in Redis
        const participantEntries = await redisClient.hgetall(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        console.log('DEBUG: Redis participants:', participantEntries);

        // Directly verify the Redis state
        const participantsCount = await redisClient.hlen(`mathquest:game:participants:${TEST_ACCESS_CODE}`);
        expect(participantsCount).toBe(2);
    });
});
