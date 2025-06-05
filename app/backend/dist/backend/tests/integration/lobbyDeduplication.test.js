"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const testSetup_1 = require("../testSetup");
const jwt_1 = require("../helpers/jwt");
// Use require for these imports to avoid module resolution issues in Jest
const { prisma } = require('../../src/db/prisma');
const { redisClient } = require('../../src/config/redis');
// Global test variables
let io;
let clientSockets = [];
let port;
let serverCleanup;
// Test access code for fake game instance
const TEST_ACCESS_CODE = 'DEDUP123';
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
describe('Lobby Deduplication Tests', () => {
    jest.setTimeout(5000);
    beforeAll(async () => {
        // Start test server and get Socket.IO instance
        const setup = await (0, testSetup_1.startTestServer)();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;
        // Create a test game instance for deduplication testing
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        // Ensure the referenced user exists for foreign key constraints
        await prisma.user.upsert({
            where: { id: 'teacher-123' },
            update: {},
            create: {
                id: 'teacher-123',
                username: 'Teacher',
                role: 'TEACHER',
            },
        });
        await prisma.gameTemplate.create({
            data: {
                id: 'test-template',
                name: 'Test Template',
                gradeLevel: 'test',
                themes: [],
                discipline: 'test',
                description: 'Test template for deduplication',
                defaultMode: 'tournament',
                creatorId: 'teacher-123'
            }
        });
        await prisma.gameInstance.create({
            data: {
                id: 'dedup-test-game-id',
                accessCode: TEST_ACCESS_CODE,
                name: 'Deduplication Test Game',
                status: 'pending',
                gameTemplateId: 'test-template',
                initiatorUserId: 'teacher-123',
                settings: {},
                playMode: 'tournament' // Fixed: must match enum value in schema (lowercase)
            }
        });
    });
    afterAll(async () => {
        // Clean up any remaining sockets
        for (const socket of clientSockets) {
            if (socket.connected) {
                socket.disconnect();
            }
        }
        clientSockets = [];
        // Clean up test data
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        // Clean up Redis data
        await redisClient.del(`mathquest:lobby:${TEST_ACCESS_CODE}`);
        // Close server
        if (serverCleanup) {
            await serverCleanup();
        }
    });
    afterEach(async () => {
        // Disconnect all sockets after each test
        for (const socket of clientSockets) {
            if (socket.connected) {
                socket.disconnect();
            }
        }
        clientSockets = [];
        // Clean lobby data between tests
        await redisClient.del(`mathquest:lobby:${TEST_ACCESS_CODE}`);
        await wait(100); // Small delay to ensure cleanup
    });
    test('should deduplicate participants when same user joins with multiple connections', async () => {
        // Create multiple socket connections for the same user
        const socket1 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-1', 'Test User'),
            role: 'player'
        });
        const socket2 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-1', 'Test User'),
            role: 'player'
        });
        const socket3 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-1', 'Test User'),
            role: 'player'
        });
        clientSockets.push(socket1, socket2, socket3);
        // Connect all sockets
        await Promise.all([
            new Promise(resolve => socket1.connect() && socket1.on('connect', () => resolve())),
            new Promise(resolve => socket2.connect() && socket2.on('connect', () => resolve())),
            new Promise(resolve => socket3.connect() && socket3.on('connect', () => resolve()))
        ]);
        // Wait for connections to establish
        await wait(100);
        // Join lobby with all three connections for the same user
        socket1.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-1',
            username: 'Test User',
            avatarEmoji: '🚀'
        });
        await wait(50);
        socket2.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-1',
            username: 'Test User',
            avatarEmoji: '🚀'
        });
        await wait(50);
        socket3.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-1',
            username: 'Test User',
            avatarEmoji: '🚀'
        });
        // Wait for all join operations to complete
        await wait(200);
        // Request participants list from the last socket
        const participantsPromise = waitForEvent(socket3, 'participants_list');
        socket3.emit('get_participants', { accessCode: TEST_ACCESS_CODE });
        const participantsResponse = await participantsPromise;
        // Should only have ONE participant despite 3 socket connections
        expect(participantsResponse.participants).toBeDefined();
        expect(participantsResponse.participants).toHaveLength(1);
        expect(participantsResponse.participants[0].userId).toBe('user-1');
        expect(participantsResponse.participants[0].username).toBe('Test User');
        expect(participantsResponse.participants[0].avatarEmoji).toBe('🚀');
        // Verify that only the most recent socket connection is active
        const latestParticipant = participantsResponse.participants[0];
        expect(latestParticipant.id).toBe(socket3.id);
    });
    test('should handle multiple different users correctly while deduplicating same users', async () => {
        // Create connections for two different users
        const socket1User1 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-1', 'User One'),
            role: 'player'
        });
        const socket2User1 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-1', 'User One'),
            role: 'player'
        });
        const socket1User2 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-2', 'User Two'),
            role: 'player'
        });
        clientSockets.push(socket1User1, socket2User1, socket1User2);
        // Connect all sockets
        await Promise.all([
            new Promise(resolve => socket1User1.connect() && socket1User1.on('connect', () => resolve())),
            new Promise(resolve => socket2User1.connect() && socket2User1.on('connect', () => resolve())),
            new Promise(resolve => socket1User2.connect() && socket1User2.on('connect', () => resolve()))
        ]);
        await wait(100);
        // Join lobby with different users and duplicate connections
        socket1User1.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-1',
            username: 'User One',
            avatarEmoji: '🎮'
        });
        await wait(50);
        socket1User2.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-2',
            username: 'User Two',
            avatarEmoji: '🎯'
        });
        await wait(50);
        // Second connection for user-1 (should replace the first)
        socket2User1.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-1',
            username: 'User One',
            avatarEmoji: '🎮'
        });
        await wait(200);
        // Request participants list
        const participantsPromise = waitForEvent(socket2User1, 'participants_list');
        socket2User1.emit('get_participants', { accessCode: TEST_ACCESS_CODE });
        const participantsResponse = await participantsPromise;
        // Should have exactly 2 participants (user-1 and user-2)
        expect(participantsResponse.participants).toBeDefined();
        expect(participantsResponse.participants).toHaveLength(2);
        // Check both users are present
        const userIds = participantsResponse.participants.map((p) => p.userId).sort();
        expect(userIds).toEqual(['user-1', 'user-2']);
        // Verify user-1 has the latest socket connection
        const user1Participant = participantsResponse.participants.find((p) => p.userId === 'user-1');
        expect(user1Participant.id).toBe(socket2User1.id);
        expect(user1Participant.username).toBe('User One');
        expect(user1Participant.avatarEmoji).toBe('🎮');
        // Verify user-2 connection
        const user2Participant = participantsResponse.participants.find((p) => p.userId === 'user-2');
        expect(user2Participant.id).toBe(socket1User2.id);
        expect(user2Participant.username).toBe('User Two');
        expect(user2Participant.avatarEmoji).toBe('🎯');
    });
    test('should clean up participants properly when connections disconnect', async () => {
        // Create multiple connections for the same user
        const socket1 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-cleanup', 'Cleanup User'),
            role: 'player'
        });
        const socket2 = createSocketClient({
            token: (0, jwt_1.generateStudentToken)('user-cleanup', 'Cleanup User'),
            role: 'player'
        });
        clientSockets.push(socket1, socket2);
        // Connect both sockets
        await Promise.all([
            new Promise(resolve => socket1.connect() && socket1.on('connect', () => resolve())),
            new Promise(resolve => socket2.connect() && socket2.on('connect', () => resolve()))
        ]);
        await wait(100);
        // Join with both connections
        socket1.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-cleanup',
            username: 'Cleanup User',
            avatarEmoji: '🧹'
        });
        await wait(50);
        socket2.emit('join_lobby', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'user-cleanup',
            username: 'Cleanup User',
            avatarEmoji: '🧹'
        });
        await wait(200);
        // Verify only one participant exists
        let participantsPromise = waitForEvent(socket2, 'participants_list');
        socket2.emit('get_participants', { accessCode: TEST_ACCESS_CODE });
        let participantsResponse = await participantsPromise;
        expect(participantsResponse.participants).toHaveLength(1);
        expect(participantsResponse.participants[0].userId).toBe('user-cleanup');
        // Disconnect the active socket
        socket2.disconnect();
        await wait(200);
        // Verify participant was cleaned up from Redis
        const redisData = await redisClient.hgetall(`mathquest:lobby:${TEST_ACCESS_CODE}`);
        expect(Object.keys(redisData)).toHaveLength(0);
    });
});
