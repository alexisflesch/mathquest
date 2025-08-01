import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import Client from 'socket.io-client';
import { getParticipantCount } from '../../src/sockets/utils/participantCountUtils';

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
    let httpServer: Server;
    let io: SocketIOServer;
    let port: number;

    beforeAll((done) => {
        httpServer = createServer();
        io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            done();
        });
    });

    afterAll((done) => {
        io.close();
        httpServer.close(done);
    });

    test('getParticipantCount returns 0 for empty rooms', async () => {
        const accessCode = 'TEST123';
        const count = await getParticipantCount(io, accessCode);
        expect(count).toBe(0);
    });

    test('getParticipantCount counts participants in lobby and game rooms', (done) => {
        const accessCode = 'TEST456';

        let joinHandlerSetup = false;

        // Set up server-side join handler
        const setupJoinHandler = (socket: any) => {
            socket.on('join-room', (roomName: string) => {
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
        const client1 = Client(`http://localhost:${port}`);
        const client2 = Client(`http://localhost:${port}`);
        const client3 = Client(`http://localhost:${port}`);

        let connectedClients: any[] = [];

        const onConnect = (client: any) => {
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
                    new Promise<void>((resolve) => {
                        client1.emit('join-room', `lobby_${accessCode}`);
                        setTimeout(resolve, 50);
                    }),
                    new Promise<void>((resolve) => {
                        client2.emit('join-room', `lobby_${accessCode}`);
                        setTimeout(resolve, 50);
                    }),
                    new Promise<void>((resolve) => {
                        client3.emit('join-room', `game_${accessCode}`);
                        setTimeout(resolve, 50);
                    })
                ];

                await Promise.all(promises);

                // Wait a bit more for joins to process
                setTimeout(async () => {
                    const count = await getParticipantCount(io, accessCode);
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
            } catch (error) {
                client1.disconnect();
                client2.disconnect();
                client3.disconnect();
                done(error);
            }
        };
    }, 15000); // Increased timeout to 15 seconds
});
