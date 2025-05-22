"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const testSetup_1 = require("../testSetup");
// Use require for these imports to avoid module resolution issues in Jest
const { prisma } = require('../../src/db/prisma');
const { redisClient } = require('../../src/config/redis');
// Global test variables
let io;
let clientSockets = []; // Initialize as empty array
let port;
let serverCleanup;
// Test access code for fake game instance
const TEST_ACCESS_CODE = 'TEST123';
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
describe('Lobby Handler', () => {
    jest.setTimeout(3000);
    beforeAll(async () => {
        // Start test server and get Socket.IO instance
        const setup = await (0, testSetup_1.startTestServer)();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;
        // Create a test game instance
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        // Create a quiz template first (required for the game instance)
        const testTeacher = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                username: 'testteacher',
                passwordHash: 'hash-not-important-for-test',
                email: 'test@example.com',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });
        const testTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Quiz Template',
                creatorId: testTeacher.id, // was creatoruserId
                themes: ['math']
            }
        });
        // Now create the game instance
        await prisma.gameInstance.create({
            data: {
                accessCode: TEST_ACCESS_CODE,
                name: 'Test Game',
                status: 'pending',
                playMode: 'quiz',
                settings: {},
                gameTemplateId: testTemplate.id,
                initiatorUserId: testTeacher.id // was 
            }
        });
        // Clear any existing lobby data in Redis
        await redisClient.del(`mathquest:lobby:${TEST_ACCESS_CODE}`);
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
        // Clear Redis lobby data
        await redisClient.del(`mathquest:lobby:${TEST_ACCESS_CODE}`);
    });
    afterAll(async () => {
        // Clean up server and databases
        await serverCleanup();
        // Clean up test game instance and related data
        // 1. Delete GameParticipant for all test gameInstances
        const testGameInstances = await prisma.gameInstance.findMany({
            where: { gameTemplate: { name: 'Test Quiz Template' } }
        });
        for (const gi of testGameInstances) {
            await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: gi.id } });
        }
        // 2. Delete GameInstance for test quiz templates
        await prisma.gameInstance.deleteMany({
            where: { gameTemplate: { name: 'Test Quiz Template' } }
        });
        // 3. Delete questionsInGameTemplate for this quiz template (to avoid FK errors)
        const gameTemplates = await prisma.gameTemplate.findMany({
            where: { name: 'Test Quiz Template' }
        });
        for (const qt of gameTemplates) {
            await prisma.questionsInGameTemplate.deleteMany({
                where: { gameTemplateId: qt.id }
            });
        }
        // 4. Clean up the quiz template we created (must be after gameInstance)
        await prisma.gameTemplate.deleteMany({
            where: { name: 'Test Quiz Template' }
        });
        // We'll leave the test teacher in the database as it might be used by other tests
    });
    test('Player can join and leave a lobby', async () => {
        // Create client socket
        const socket = createSocketClient({
            token: 'player-token-123',
            role: 'player'
        });
        clientSockets.push(socket);
        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');
        // Join the lobby
        const joinPromise = waitForEvent(socket, 'participants_list');
        socket.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-123',
            username: 'Test Player',
            avatarUrl: 'avatar.jpg'
        });
        // Wait for participants list response
        const participantsResponse = await joinPromise;
        expect(participantsResponse).toBeDefined();
        expect(participantsResponse.participants).toBeDefined();
        expect(participantsResponse.participants.length).toBe(1);
        expect(participantsResponse.participants[0].username).toBe('Test Player');
        expect(participantsResponse.gameName).toBe('Test Game');
        // Leave the lobby
        // Wait for both room_left and participants_list events
        const roomLeftPromise = waitForEvent(socket, 'room_left');
        socket.emit('leave_lobby', { accessCode: TEST_ACCESS_CODE });
        // Wait for room_left event first, it should be emitted immediately
        await roomLeftPromise;
        // Get updated participants list manually to verify it's empty
        const getParticipantsPromise = waitForEvent(socket, 'participants_list');
        socket.emit('get_participants', { accessCode: TEST_ACCESS_CODE });
        // Wait for participants list with a timeout
        const updatedParticipantsResponse = await getParticipantsPromise;
        expect(updatedParticipantsResponse).toBeDefined();
        expect(updatedParticipantsResponse.participants).toBeDefined();
        expect(updatedParticipantsResponse.participants.length).toBe(0);
    });
    test('Multiple players can join a lobby and see each other', async () => {
        // Create 3 client sockets
        const socket1 = createSocketClient({ token: 'player1-token', role: 'player' });
        const socket2 = createSocketClient({ token: 'player2-token', role: 'player' });
        const socket3 = createSocketClient({ token: 'player3-token', role: 'player' });
        clientSockets.push(socket1, socket2, socket3);
        // Connect all sockets
        socket1.connect();
        socket2.connect();
        socket3.connect();
        await Promise.all([
            waitForEvent(socket1, 'connect'),
            waitForEvent(socket2, 'connect'),
            waitForEvent(socket3, 'connect')
        ]);
        // Player 1 joins
        const joinPromise1 = waitForEvent(socket1, 'participants_list');
        socket1.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-1',
            username: 'Player 1',
            avatarUrl: 'avatar1.jpg'
        });
        // Wait for first player to join
        const response1 = await joinPromise1;
        expect(response1.participants.length).toBe(1);
        expect(response1.participants[0].username).toBe('Player 1');
        // Player 2 joins and both players should receive updated list
        const joinPromise2 = waitForEvent(socket2, 'participants_list');
        const updatePromise1 = waitForEvent(socket1, 'participants_list');
        socket2.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-2',
            username: 'Player 2',
            avatarUrl: 'avatar2.jpg'
        });
        // Both sockets should get updated participants list
        const [response2, update1] = await Promise.all([joinPromise2, updatePromise1]);
        expect(response2.participants.length).toBe(2);
        expect(update1.participants.length).toBe(2);
        // Player 1 should receive notification when Player 3 joins
        const participantJoinedPromise = waitForEvent(socket1, 'participant_joined');
        // Player 3 joins
        socket3.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-3',
            username: 'Player 3',
            avatarUrl: 'avatar3.jpg'
        });
        // Wait for participant_joined event on first socket
        const joinNotification = await participantJoinedPromise;
        expect(joinNotification).toBeDefined();
        expect(joinNotification.username).toBe('Player 3');
        // Player 2 should get notification when Player 1 leaves
        const participantLeftPromise = waitForEvent(socket2, 'participant_left');
        // Player 1 leaves
        socket1.emit('leave_lobby', { accessCode: TEST_ACCESS_CODE });
        // Wait for participant_left event
        const leftNotification = await participantLeftPromise;
        expect(leftNotification).toBeDefined();
        expect(leftNotification.id).toBe(socket1.id);
        // Get participants manually
        const getParticipantsPromise = waitForEvent(socket3, 'participants_list');
        socket3.emit('get_participants', { accessCode: TEST_ACCESS_CODE });
        // Should receive participants list with 2 remaining players
        const manualParticipantsList = await getParticipantsPromise;
        expect(manualParticipantsList.participants.length).toBe(2);
    });
    test('Players should be redirected when game becomes active', async () => {
        // Create client socket
        const socket = createSocketClient({ token: 'player-token', role: 'player' });
        clientSockets.push(socket);
        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');
        // Join the lobby
        socket.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-redirect-test',
            username: 'Redirect Test',
            avatarUrl: 'avatar.jpg'
        });
        // Wait for initial join response
        await waitForEvent(socket, 'participants_list');
        // Set up listener for redirect event
        const redirectPromise = waitForEvent(socket, 'redirect_to_game');
        // Update game status to active
        await prisma.gameInstance.update({
            where: { accessCode: TEST_ACCESS_CODE },
            data: { status: 'active' }
        });
        // Wait for redirect (status check interval is 2000ms)
        const redirectEvent = await redirectPromise;
        expect(redirectEvent).toBeDefined();
        expect(redirectEvent.accessCode).toBe(TEST_ACCESS_CODE);
        // Reset game status for other tests
        await prisma.gameInstance.update({
            where: { accessCode: TEST_ACCESS_CODE },
            data: { status: 'pending' }
        });
    });
    test('Disconnecting socket should be removed from lobby', async () => {
        // Create two client sockets
        const socket1 = createSocketClient({ token: 'disconnect-test-1', role: 'player' });
        const socket2 = createSocketClient({ token: 'disconnect-test-2', role: 'player' });
        clientSockets.push(socket1, socket2);
        // Connect both sockets
        socket1.connect();
        socket2.connect();
        await Promise.all([
            waitForEvent(socket1, 'connect'),
            waitForEvent(socket2, 'connect')
        ]);
        // Store socket1's ID for later comparison
        const socket1Id = socket1.id;
        // Both join the lobby
        socket1.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-d1',
            username: 'Disconnect Test 1',
            avatarUrl: 'avatar.jpg'
        });
        socket2.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'player-d2',
            username: 'Disconnect Test 2',
            avatarUrl: 'avatar.jpg'
        });
        // Wait for both to receive participants list
        await Promise.all([
            waitForEvent(socket1, 'participants_list'),
            waitForEvent(socket2, 'participants_list')
        ]);
        // Set up listener for participant_left event
        const leftPromise = waitForEvent(socket2, 'participant_left');
        // Disconnect first socket
        socket1.disconnect();
        // Second socket should get notification of first socket leaving
        const leftNotification = await leftPromise;
        expect(leftNotification).toBeDefined();
        expect(leftNotification.id).toBe(socket1Id);
        // Wait a bit for Redis to update
        await wait(300); // Increased wait time to ensure Redis updates
        // Check Redis directly to confirm participant was removed
        const participantsHash = await redisClient.hgetall(`mathquest:lobby:${TEST_ACCESS_CODE}`);
        const participants = Object.values(participantsHash).map(p => JSON.parse(p));
        expect(participants.length).toBe(1);
        expect(participants[0].username).toBe('Disconnect Test 2');
    });
    // Add more tests as needed...
});
