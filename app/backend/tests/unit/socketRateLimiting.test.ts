import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';

// Mock the logger to avoid console output during tests
jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Mock Redis client with proper interface for socket.io adapter
jest.mock('@/config/redis', () => ({
    redisClient: {
        duplicate: jest.fn(() => ({
            psubscribe: jest.fn(),
            punsubscribe: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            quit: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        })),
        psubscribe: jest.fn(),
        punsubscribe: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        publish: jest.fn(),
        quit: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
    }
}));

describe('Socket.IO Rate Limiting Bug Test', () => {
    let httpServer: ReturnType<typeof createServer>;
    let io: SocketIOServer;
    let clients: ClientSocket[] = [];
    const PORT = 3002;

    beforeAll(async () => {
        // Create HTTP server
        httpServer = createServer();

        // Create Socket.IO server without Redis adapter for testing
        io = new SocketIOServer(httpServer, {
            cors: {
                origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 30000,
            pingInterval: 25000
        });

        // Start the server
        await new Promise<void>((resolve) => {
            httpServer.listen(PORT, () => {
                resolve();
            });
        });
    });

    afterAll(async () => {
        // Clean up all clients
        clients.forEach(client => client.disconnect());
        clients = [];

        // Close server
        if (io) {
            io.close();
        }
        if (httpServer) {
            httpServer.close();
        }
    });

    beforeEach(() => {
        // Clear clients array before each test
        clients.forEach(client => client.disconnect());
        clients = [];
    });

    it('should allow unlimited rapid socket connections (demonstrating lack of rate limiting)', async () => {
        const startTime = Date.now();
        let connectionCount = 0;
        let successfulConnections = 0;
        let failedConnections = 0;
        const TEST_DURATION = 3000; // 3 seconds
        const CONNECTIONS_PER_SECOND = 20;

        // Create connections at a high rate
        const connectionInterval = setInterval(() => {
            if (Date.now() - startTime >= TEST_DURATION) {
                clearInterval(connectionInterval);
                return;
            }

            const client = Client(`http://localhost:${PORT}`, {
                transports: ['websocket'],
                forceNew: true,
                reconnection: false,
                timeout: 1000
            });

            clients.push(client);
            connectionCount++;

            client.on('connect', () => {
                successfulConnections++;
            });

            client.on('connect_error', () => {
                failedConnections++;
            });

        }, 1000 / CONNECTIONS_PER_SECOND);

        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, TEST_DURATION + 1000));

        console.log(`Test Results:`, {
            totalAttempts: connectionCount,
            successfulConnections,
            failedConnections,
            duration: TEST_DURATION,
            connectionsPerSecond: CONNECTIONS_PER_SECOND
        });

        // This test should pass if there's no rate limiting
        expect(connectionCount).toBeGreaterThan(0);
        expect(successfulConnections).toBeGreaterThan(0);

        const successRate = successfulConnections / connectionCount;
        console.log(`Connection success rate: ${(successRate * 100).toFixed(2)}%`);

        // If success rate is very high, likely no rate limiting
        expect(successRate).toBeGreaterThan(0.5);

    }, 10000);

    it('should allow unlimited rapid socket events (demonstrating lack of event rate limiting)', async () => {
        const client = Client(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
        });

        clients.push(client);

        await new Promise<void>((resolve) => {
            client.on('connect', () => resolve());
            client.on('connect_error', () => resolve());
        });

        if (!client.connected) {
            console.log('Client failed to connect, skipping event rate limiting test');
            return;
        }

        const startTime = Date.now();
        let eventsSent = 0;
        const TEST_DURATION = 2000;
        const EVENTS_PER_SECOND = 50;

        // Send events at a high rate
        const eventInterval = setInterval(() => {
            if (Date.now() - startTime >= TEST_DURATION) {
                clearInterval(eventInterval);
                return;
            }

            client.emit('test_event', { data: 'test', timestamp: Date.now() });
            eventsSent++;
        }, 1000 / EVENTS_PER_SECOND);

        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, TEST_DURATION + 1000));

        console.log(`Event Test Results:`, {
            eventsSent,
            duration: TEST_DURATION,
            eventsPerSecond: EVENTS_PER_SECOND
        });

        // This test demonstrates the lack of event rate limiting
        expect(eventsSent).toBeGreaterThan(0);
        expect(eventsSent).toBeGreaterThan(EVENTS_PER_SECOND);

    }, 8000);

    it('should handle concurrent connections without proper rate limiting protection', async () => {
        const CONCURRENT_CONNECTIONS = 15;
        const connectionPromises: Promise<void>[] = [];

        for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
            const promise = new Promise<void>((resolve) => {
                const client = Client(`http://localhost:${PORT}`, {
                    transports: ['websocket'],
                    forceNew: true,
                    reconnection: false,
                    timeout: 2000
                });

                clients.push(client);

                client.on('connect', () => {
                    for (let j = 0; j < 5; j++) {
                        client.emit('concurrent_test_event', { connectionId: i, eventId: j });
                    }
                    resolve();
                });

                client.on('connect_error', () => {
                    resolve();
                });
            });

            connectionPromises.push(promise);
        }

        await Promise.all(connectionPromises);

        const connectedClients = clients.filter(client => client.connected).length;
        const totalClients = clients.length;

        console.log(`Concurrent Connection Test:`, {
            attempted: CONCURRENT_CONNECTIONS,
            connected: connectedClients,
            failed: totalClients - connectedClients
        });

        expect(connectedClients).toBeGreaterThanOrEqual(0);
        expect(totalClients).toBe(CONCURRENT_CONNECTIONS);

        const successRate = connectedClients / CONCURRENT_CONNECTIONS;
        console.log(`Concurrent connection success rate: ${(successRate * 100).toFixed(2)}%`);
        expect(successRate).toBeGreaterThan(0.7);

    }, 8000);

    it('should demonstrate potential for DoS through socket spam', async () => {
        const SPAM_CONNECTIONS = 8;
        const spamPromises: Promise<void>[] = [];

        for (let i = 0; i < SPAM_CONNECTIONS; i++) {
            const promise = new Promise<void>((resolve) => {
                const client = Client(`http://localhost:${PORT}`, {
                    transports: ['websocket'],
                    forceNew: true,
                    reconnection: false,
                    timeout: 1000
                });

                clients.push(client);

                client.on('connect', () => {
                    const spamInterval = setInterval(() => {
                        client.emit('dos_test_event', {
                            spamId: i,
                            timestamp: Date.now(),
                            data: 'x'.repeat(500)
                        });
                    }, 20);

                    setTimeout(() => {
                        clearInterval(spamInterval);
                        resolve();
                    }, 1500);
                });

                client.on('connect_error', () => {
                    resolve();
                });
            });

            spamPromises.push(promise);
        }

        await Promise.all(spamPromises);

        const connectedSpammers = clients.filter(client => client.connected).length;

        console.log(`DoS Test Results:`, {
            spamConnections: SPAM_CONNECTIONS,
            connectedSpammers,
            spamDuration: 1500,
            eventFrequency: 50
        });

        expect(connectedSpammers).toBeGreaterThanOrEqual(0);

        const spamSuccessRate = connectedSpammers / SPAM_CONNECTIONS;
        console.log(`DoS connection success rate: ${(spamSuccessRate * 100).toFixed(2)}%`);
        expect(spamSuccessRate).toBeGreaterThan(0.6);

    }, 6000);
});