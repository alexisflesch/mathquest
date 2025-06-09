import { Server as SocketIOServer } from 'socket.io';
import Client from 'socket.io-client';
import { createServer } from 'http';
import { emitParticipantCount, getParticipantCount } from '@/sockets/utils/participantCountUtils';

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
    let io: SocketIOServer;
    let serverSocket: any;
    let clientSocket: any;
    let httpServer: any;

    beforeAll((done) => {
        httpServer = createServer();
        io = new SocketIOServer(httpServer);
        httpServer.listen(() => {
            const port = (httpServer.address() as any).port;
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
        const count = await getParticipantCount(io, 'TEST123');
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
        const dashboardClient = require('socket.io-client')(`http://localhost:${(httpServer.address() as any).port}`);

        dashboardClient.on('connect', () => {
            dashboardClient.emit('join-room', `dashboard_mock-game-id`);

            dashboardClient.on('quiz_connected_count', (data: { count: number }) => {
                expect(data).toHaveProperty('count');
                expect(typeof data.count).toBe('number');
                dashboardClient.close();
                done();
            });

            // Trigger the participant count emission after a short delay
            setTimeout(() => {
                emitParticipantCount(io, accessCode);
            }, 10);
        });
    }, 10000); // Set test timeout to 10 seconds
});
