require('../../../tests/setupTestEnv');
import { Server as SocketIOServer } from 'socket.io';
import Client from 'socket.io-client';
import { createServer } from 'http';
import { emitParticipantCount, getParticipantCount } from '@/sockets/utils/participantCountUtils';
import { joinRoomPayloadSchema, testConnectionPayloadSchema } from '@shared/types/socketEvents.zod';
import { ZodError, z } from 'zod';

// Derive types from Zod schemas
type JoinRoomPayload = z.infer<typeof joinRoomPayloadSchema>;

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
                // Validate connection event
                const connectionValidation = testConnectionPayloadSchema.safeParse({});
                if (!connectionValidation.success) {
                    console.warn('Test connection validation failed:', connectionValidation.error);
                }
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

        // Set up server-side join handler with Zod validation
        io.on('connection', (socket) => {
            // Validate connection (no payload to validate, but we can log)
            const connectionValidation = testConnectionPayloadSchema.safeParse({});
            if (!connectionValidation.success) {
                console.warn('Test connection validation failed:', connectionValidation.error);
            }

            socket.on('join-room', (payload: JoinRoomPayload) => {
                // Validate room name payload
                const validation = joinRoomPayloadSchema.safeParse(payload);
                if (!validation.success) {
                    console.warn('join-room validation failed:', validation.error);
                    return;
                }

                const { roomName } = payload;
                socket.join(roomName);
            });
        });

        // Mock a client listening to the dashboard room (using gameId from mock)
        const dashboardClient = require('socket.io-client')(`http://localhost:${(httpServer.address() as any).port}`);

        dashboardClient.on('connect', () => {
            dashboardClient.emit('join-room', { roomName: `dashboard_mock-game-id` });

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
