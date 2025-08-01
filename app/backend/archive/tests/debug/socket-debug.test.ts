import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import { initializeSocketIO } from '../../src/sockets';
import createLogger from '../../src/utils/logger';

const logger = createLogger('DebugSocketTest');

describe('Debug Socket Connection', () => {
    let httpServer: any;
    let io: SocketIOServer;
    let clientSocket: any;
    const port = 3555;

    beforeAll(async () => {
        // Create HTTP server
        httpServer = createServer();

        // Initialize Socket.IO
        io = initializeSocketIO(httpServer);

        // Start server
        await new Promise<void>((resolve) => {
            httpServer.listen(port, () => {
                logger.info(`Test server listening on port ${port}`);
                resolve();
            });
        });
    });

    afterAll(async () => {
        if (clientSocket) {
            clientSocket.disconnect();
        }
        if (httpServer) {
            httpServer.close();
        }
    });

    it('should connect and register handlers', async () => {
        console.log('Creating client socket...');

        clientSocket = ClientIO(`http://localhost:${port}`, {
            auth: {
                userId: 'test-teacher-123',
                userType: 'teacher'
            },
            path: '/api/socket.io',
            transports: ['websocket']
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 5000);

            clientSocket.on('connect', () => {
                clearTimeout(timeout);
                console.log('Socket connected successfully:', clientSocket.id);
                resolve();
            });

            clientSocket.on('connect_error', (error: any) => {
                clearTimeout(timeout);
                reject(error);
            });
        });

        // Test if we can emit join_dashboard
        console.log('Emitting join_dashboard...');

        // Listen for any response
        clientSocket.onAny((event: string, ...args: any[]) => {
            console.log('Received event:', event, args);
        });

        clientSocket.emit('join_dashboard', { gameId: 'test-game-123' });

        // Give it a moment to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Test completed');
    });
});
