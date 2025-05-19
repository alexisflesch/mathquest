"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const socket_io_client_1 = __importDefault(require("socket.io-client")); // Changed import
const http_1 = require("http");
// Use require for these imports to avoid module resolution issues in Jest
const { prisma } = require('../../src/db/prisma');
let port;
let httpServer;
let io;
let client1;
let client2;
const TEST_ACCESS_CODE = 'TEST123';
describe('Basic Lobby Handler Test', () => {
    beforeAll(async () => {
        // Create HTTP server
        httpServer = (0, http_1.createServer)();
        // Create Socket.IO server
        io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            transports: ['websocket']
        });
        // Authentication middleware (simplified for test)
        io.use((socket, next) => {
            socket.data.user = {
                playerId: socket.handshake.auth.playerId || 'test-player',
                role: 'player'
            };
            next();
        });
        // Connect handler
        io.on('connection', (socket) => {
            console.log('Socket connected:', socket.id);
            // Join lobby handler
            socket.on('join_lobby', (payload) => {
                const { accessCode, playerId, username } = payload;
                console.log(`Player ${username} joining lobby ${accessCode}`);
                // Join the lobby room
                socket.join(`lobby_${accessCode}`);
                // Emit to the room
                io.to(`lobby_${accessCode}`).emit('participants_list', {
                    participants: [{ id: socket.id, username, playerId }],
                    gameId: 'test-game-id',
                    gameName: 'Test Game'
                });
            });
            // Leave lobby handler
            socket.on('leave_lobby', (payload) => {
                const { accessCode } = payload;
                console.log(`Player leaving lobby ${accessCode}`);
                socket.leave(`lobby_${accessCode}`);
                io.to(`lobby_${accessCode}`).emit('participant_left', { id: socket.id });
            });
        });
        // Start server on random port
        port = Math.floor(Math.random() * 10000) + 30000;
        await new Promise((resolve) => {
            httpServer.listen(port, () => {
                console.log(`Server listening on port ${port}`);
                resolve();
            });
        });
        // Create test game instance
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        // Find or create a teacher to use as creator
        const teacher = await prisma.teacher.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                username: 'testteacher',
                passwordHash: 'hash-not-important-for-test',
                email: 'test@example.com'
            }
        });
        // Create a quiz template for the game instance
        const testTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Quiz Template',
                creatorTeacherId: teacher.id,
                themes: ['math']
            }
        });
        // Create the game instance with the teacher ID
        await prisma.gameInstance.create({
            data: {
                accessCode: TEST_ACCESS_CODE,
                name: 'Test Game',
                status: 'pending',
                playMode: 'quiz',
                settings: {},
                gameTemplateId: testTemplate.id,
                : teacher.id
            }
        });
    });
    afterAll(async () => {
        // Close connections
        io.close();
        httpServer.close();
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
    beforeEach(() => {
        // Create client sockets
        client1 = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
            transports: ['websocket'],
            autoConnect: false
        });
        client2 = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
            transports: ['websocket'],
            autoConnect: false
        });
    });
    afterEach(() => {
        // Disconnect clients
        if (client1 && client1.connected)
            client1.disconnect();
        if (client2 && client2.connected)
            client2.disconnect();
    });
    test('Player can join and leave lobby', (done) => {
        client1.on('connect', () => {
            console.log('Client connected');
            client1.emit('join_lobby', {
                accessCode: TEST_ACCESS_CODE,
                playerId: 'test-player-1',
                username: 'Test Player 1'
            });
        });
        client1.on('participants_list', (data) => {
            console.log('Received participants list:', data);
            expect(data.participants).toBeDefined();
            expect(data.participants.length).toBeGreaterThan(0);
            expect(data.gameName).toBe('Test Game');
            // Test complete
            done();
        });
        // Connect
        client1.connect();
    });
});
