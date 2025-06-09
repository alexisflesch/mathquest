"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const participantCountUtils_1 = require("../../src/sockets/utils/participantCountUtils");
// Mock prisma for this test
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn().mockResolvedValue({
                id: 'mock-game-id'
            })
        }
    }
}));
describe('Participant Count Utils', () => {
    let httpServer;
    let io;
    let port;
    beforeAll((done) => {
        httpServer = (0, http_1.createServer)();
        io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        httpServer.listen(() => {
            port = httpServer.address().port;
            done();
        });
    });
    afterAll((done) => {
        io.close();
        httpServer.close(done);
    });
    test('getParticipantCount returns 0 for empty rooms', async () => {
        const accessCode = 'TEST123';
        const count = await (0, participantCountUtils_1.getParticipantCount)(io, accessCode);
        expect(count).toBe(0);
    });
    test('getParticipantCount counts participants in lobby and game rooms', (done) => {
        const accessCode = 'TEST456';
        let joinHandlerSetup = false;
        // Set up server-side join handler
        const setupJoinHandler = (socket) => {
            socket.on('join-room', (roomName) => {
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room: ${roomName}`);
            });
        };
        // Ensure join handler is set up for all connections
        if (!joinHandlerSetup) {
            io.removeAllListeners('connection');
            io.on('connection', setupJoinHandler);
            joinHandlerSetup = true;
        }
        // Create test clients
        const client1 = (0, socket_io_client_1.default)(`http://localhost:${port}`);
        const client2 = (0, socket_io_client_1.default)(`http://localhost:${port}`);
        const client3 = (0, socket_io_client_1.default)(`http://localhost:${port}`);
        let connectedClients = [];
        const onConnect = (client) => {
            connectedClients.push(client);
            if (connectedClients.length === 3) {
                // All clients connected, now test participant counting
                setTimeout(() => testParticipantCounting(), 100);
            }
        };
        client1.on('connect', () => onConnect(client1));
        client2.on('connect', () => onConnect(client2));
        client3.on('connect', () => onConnect(client3));
        const testParticipantCounting = async () => {
            try {
                // Join rooms with confirmation
                const promises = [
                    new Promise((resolve) => {
                        client1.emit('join-room', `lobby_${accessCode}`);
                        setTimeout(resolve, 50);
                    }),
                    new Promise((resolve) => {
                        client2.emit('join-room', `lobby_${accessCode}`);
                        setTimeout(resolve, 50);
                    }),
                    new Promise((resolve) => {
                        client3.emit('join-room', `game_${accessCode}`);
                        setTimeout(resolve, 50);
                    })
                ];
                await Promise.all(promises);
                // Wait a bit more for joins to process
                setTimeout(async () => {
                    const count = await (0, participantCountUtils_1.getParticipantCount)(io, accessCode);
                    console.log(`Participant count: ${count}`);
                    console.log(`Lobby room size: ${io.sockets.adapter.rooms.get(`lobby_${accessCode}`)?.size || 0}`);
                    console.log(`Game room size: ${io.sockets.adapter.rooms.get(`game_${accessCode}`)?.size || 0}`);
                    expect(count).toBe(3); // 2 in lobby + 1 in game
                    // Clean up
                    client1.disconnect();
                    client2.disconnect();
                    client3.disconnect();
                    done();
                }, 100);
            }
            catch (error) {
                client1.disconnect();
                client2.disconnect();
                client3.disconnect();
                done(error);
            }
        };
    }, 15000); // Increased timeout to 15 seconds
});
