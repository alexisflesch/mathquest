"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const sockets_1 = require("../../src/sockets");
const prisma_1 = require("../../src/db/prisma");
const redis_1 = require("../../src/config/redis");
const gameStateService_1 = __importDefault(require("../../src/core/gameStateService"));
describe('Teacher Dashboard & Game Control', () => {
    let httpServer;
    let ioServer;
    let teacherSocket;
    let playerSocket;
    let gameInstance;
    let gameId;
    let accessCode;
    // Setup mock user data
    const teacherId = 'teacher-1';
    const playerId = 'player-1';
    beforeAll(async () => {
        // Create HTTP server and Socket.IO instance
        httpServer = (0, http_1.createServer)();
        ioServer = new socket_io_1.Server(httpServer);
        (0, sockets_1.configureSocketServer)(ioServer);
        (0, sockets_1.registerHandlers)(ioServer);
        // Start HTTP server
        await new Promise((resolve) => {
            httpServer.listen(3001, () => {
                resolve();
            });
        });
        // Create a test game
        gameInstance = await prisma_1.prisma.gameInstance.create({
            data: {
                name: 'Test Game',
                accessCode: 'TEST123',
                : teacherId,
                status: 'pending',
                playMode: 'quiz', // Using valid enum value from schema
                gameTemplateId: 'quiz-1', // This would need to exist in your test DB
                leaderboard: [],
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            }
        });
        gameId = gameInstance.id;
        accessCode = gameInstance.accessCode;
        // Initialize game state
        await gameStateService_1.default.initializeGameState(gameId);
    });
    afterAll(async () => {
        // Close connections
        if (teacherSocket)
            teacherSocket.disconnect();
        if (playerSocket)
            playerSocket.disconnect();
        // Close server
        ioServer.close();
        httpServer.close();
        // Clean up test data
        await prisma_1.prisma.gameInstance.delete({ where: { id: gameId } });
        // Clear Redis keys
        const keys = await redis_1.redisClient.keys(`mathquest:game:*${accessCode}*`);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
        // Close database connections
        await prisma_1.prisma.$disconnect();
        await redis_1.redisClient.quit();
    });
    it('Should allow a teacher to join the dashboard', (done) => {
        // Create socket with auth data
        teacherSocket = (0, socket_io_client_1.io)('http://localhost:3001', {
            auth: { token: 'mock-token' },
            query: { teacherId }
        });
        // Mock socket middleware usually populates this
        teacherSocket.auth = { teacherId };
        teacherSocket.on('connect', () => {
            // Join dashboard
            teacherSocket.emit('join_dashboard', { gameId });
        });
        // Wait for game control state response
        teacherSocket.on('game_control_state', (data) => {
            expect(data).toBeDefined();
            expect(data.gameId).toBe(gameId);
            expect(data.accessCode).toBe(accessCode);
            expect(data.status).toBe('pending');
            done();
        });
    });
    it('Should allow a teacher to set a question', (done) => {
        // Using a synchronous approach with the done callback
        // First get the game state
        gameStateService_1.default.getFullGameState(accessCode).then(fullState => {
            if (!fullState || !fullState.gameState || !fullState.gameState.questionIds || fullState.gameState.questionIds.length === 0) {
                done.fail('No questions found in the game state');
                return;
            }
            const questionUid = fullState.gameState.questionIds[0];
            // Set up event listener
            teacherSocket.on('dashboard_question_changed', (data) => {
                expect(data.questionUid).toBe(questionUid);
                expect(data.timer).toBeDefined();
                done();
            });
            // Emit set_question event
            teacherSocket.emit('set_question', {
                gameId,
                questionUid
            });
        });
    });
    it('Should allow a teacher to control the timer', (done) => {
        // Set up event listener
        teacherSocket.on('dashboard_timer_updated', (data) => {
            expect(data.timer).toBeDefined();
            expect(data.timer.isPaused).toBe(false);
            done();
        });
        // Start the timer
        teacherSocket.emit('timer_action', {
            gameId,
            action: 'start',
            duration: 30 // 30 seconds
        });
    });
    it('Should allow a teacher to lock/unlock answers', (done) => {
        // Set up event listener
        teacherSocket.on('dashboard_answers_lock_changed', (data) => {
            expect(data.answersLocked).toBe(true);
            done();
        });
        // Lock answers
        teacherSocket.emit('lock_answers', {
            gameId,
            lock: true
        });
    });
    it('Should allow a teacher to end the game', (done) => {
        // Set up event listener
        teacherSocket.on('dashboard_game_status_changed', (data) => {
            expect(data.status).toBe('completed');
            done();
        });
        // End the game
        teacherSocket.emit('end_game', { gameId });
    });
});
