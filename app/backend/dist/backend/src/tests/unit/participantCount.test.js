"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const participantCountUtils_1 = require("@/sockets/utils/participantCountUtils");
// Mock prisma
jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn().mockResolvedValue({
                id: 'mock-game-id'
            })
        }
    }
}));
describe('Participant Count Functionality', () => {
    let io;
    let serverSocket;
    let clientSocket;
    let httpServer;
    beforeAll((done) => {
        httpServer = (0, http_1.createServer)();
        io = new socket_io_1.Server(httpServer);
        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket = require('socket.io-client')(`http://localhost:${port}`);
            io.on('connection', (socket) => {
                serverSocket = socket;
            });
            clientSocket.on('connect', done);
        });
    });
    afterAll(() => {
        io.close();
        clientSocket.close();
        httpServer.close();
    });
    test('getParticipantCount should return 0 for empty rooms', async () => {
        const count = await (0, participantCountUtils_1.getParticipantCount)(io, 'TEST123');
        expect(count).toBe(0);
    });
    test('emitParticipantCount should emit to dashboard room', (done) => {
        const accessCode = 'TEST123';
        // Set up server-side join handler
        io.on('connection', (socket) => {
            socket.on('join-room', (roomName) => {
                socket.join(roomName);
            });
        });
        // Mock a client listening to the dashboard room (using gameId from mock)
        const dashboardClient = require('socket.io-client')(`http://localhost:${httpServer.address().port}`);
        dashboardClient.on('connect', () => {
            dashboardClient.emit('join-room', `dashboard_mock-game-id`);
            dashboardClient.on('quiz_connected_count', (data) => {
                expect(data).toHaveProperty('count');
                expect(typeof data.count).toBe('number');
                dashboardClient.close();
                done();
            });
            // Trigger the participant count emission after a short delay
            setTimeout(() => {
                (0, participantCountUtils_1.emitParticipantCount)(io, accessCode);
            }, 10);
        });
    }, 10000); // Set test timeout to 10 seconds
});
