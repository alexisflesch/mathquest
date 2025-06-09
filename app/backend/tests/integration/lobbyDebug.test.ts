import { Server } from 'socket.io';
import ClientIO, { Socket as ClientSocket } from 'socket.io-client';
import { startTestServer } from '../testSetup';
import { generateStudentToken } from '../helpers/jwt';

// Use require for these imports to avoid module resolution issues in Jest
const { prisma } = require('../../src/db/prisma');
const { redisClient } = require('../../src/config/redis');

// Define the payload type for JWT generation, matching jwt.ts
interface StudentJwtPayload {
    userId: string;
    username: string;
    role: 'STUDENT'; // Assuming role is always STUDENT for this token type
}

// Placeholder types - replace with actual imports if available
interface Participant {
    id: string;
    userId: string;
    username: string;
    avatarEmoji: string;
    joinedAt: number;
}
interface ParticipantsListResponse {
    participants: Participant[];
    gameId?: string;
    gameName?: string;
}

interface RoomLeftResponse {
    room: string;
    timestamp: string;
    accessCode?: string; // Added based on log
}

// Global test variables
let io: Server;
let clientSockets: ClientSocket[] = [];
let port: number;
let serverCleanup: () => Promise<void>;

// Test access code for fake game instance
const TEST_ACCESS_CODE = 'TEST123';

// Helper to create a socket.io client
const createSocketClient = (query: Record<string, string> = {}) => {
    return ClientIO(`http://localhost:${port}`, {
        path: '/api/socket.io',
        query,
        autoConnect: false,
        transports: ['websocket']
    });
};

// Helper to wait for an event with detailed logging
const waitForEvent = (socket: ClientSocket, event: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Timeout waiting for event: ${event}`));
        }, 5000);

        socket.once(event, (data: any) => {
            console.log(`✅ Received event: ${event}`, JSON.stringify(data, null, 2));
            clearTimeout(timeoutId);
            resolve(data);
        });
    });
};

// Add global error handlers for debugging
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception thrown:', err);
});

describe('Lobby Handler Debug', () => {
    jest.setTimeout(15000);

    beforeAll(async () => {
        // Start test server and get Socket.IO instance
        const setup = await startTestServer();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;

        // Create a test game instance
        await prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });

        // Create a quiz template first (required for the game instance)
        const testTeacher = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                username: 'testteacher',
                passwordHash: 'hash-not-important-for-test',
                email: 'test@example.com',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });

        const testTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Quiz Template Debug',
                creatorId: testTeacher.id,
                themes: ['math']
            }
        });

        // Now create the game instance
        await prisma.gameInstance.create({
            data: {
                accessCode: TEST_ACCESS_CODE,
                name: 'Test Game Debug',
                status: 'pending',
                playMode: 'quiz',
                settings: {},
                gameTemplateId: testTemplate.id,
                initiatorUserId: testTeacher.id
            }
        });

        // Clear any existing lobby data in Redis
        await redisClient.del(`mathquest:lobby:${TEST_ACCESS_CODE}`);
    });

    beforeEach(async () => {
        clientSockets = [];
    });

    afterEach(async () => {
        for (const socket of clientSockets) {
            if (socket.connected) {
                socket.disconnect();
            }
        }
        clientSockets = [];
        await redisClient.del(`mathquest:lobby:${TEST_ACCESS_CODE}`);
    });

    afterAll(async () => {
        if (serverCleanup) {
            console.log('🧹 [afterAll] Calling serverCleanup...');
            await serverCleanup();
            console.log('✅ [afterAll] serverCleanup completed.');
        }

        // Safeguard: The io instance should be closed by serverCleanup.
        // If it's still listening, attempt to close it.
        if (io && io.httpServer && io.httpServer.listening) {
            console.warn('⚠️ [afterAll] httpServer was still listening. Attempting to close again.');
            await new Promise(res => io.httpServer.close(res));
            console.log('✅ [afterAll] httpServer closed (safeguard).');
        }

        // Close the Socket.IO Redis clients as well
        try {
            const { closeSocketIORedisClients } = await import('@/sockets');
            console.log('🧹 [afterAll] Closing Socket.IO Redis clients...');
            await closeSocketIORedisClients();
            console.log('✅ [afterAll] Socket.IO Redis clients closed.');
        } catch (e) {
            console.warn('⚠️ [afterAll] Error closing Socket.IO Redis clients:', e);
        }

        // Use the redisClient imported at the top of the file
        if (redisClient && redisClient.status !== 'end' && redisClient.status !== 'close') {
            console.log('🧹 [afterAll] Quitting Redis client...');
            await redisClient.quit();
            console.log('✅ [afterAll] Redis client quit.');
        }

        // Try disconnecting Prisma
        if (prisma && typeof prisma.$disconnect === 'function') {
            console.log('🧹 [afterAll] Disconnecting Prisma client...');
            await prisma.$disconnect();
            console.log('✅ [afterAll] Prisma client disconnected.');
        }

        console.log('🏁 [afterAll] Cleanup finished.');
        // Add a longer delay to ensure all handles are released before Jest exits
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('Debug: Player can join and leave a lobby', async () => {
        console.log('🔧 Starting debug test...');

        const accessCode = 'TEST123';
        // Correctly type and create the payload for generateStudentToken
        const studentPayload: StudentJwtPayload = { userId: 'player-123', username: 'Test Player', role: 'STUDENT' };
        const studentToken = generateStudentToken(studentPayload.userId, studentPayload.username, studentPayload.role); // avatarEmoji removed

        let participantsResponse: ParticipantsListResponse | null = null;
        let updatedParticipantsResponse: ParticipantsListResponse | null = null;
        let roomLeftResponse: RoomLeftResponse | null = null;

        // Create socket client for this test, passing auth details in query, ensuring role matches JWT role
        const socket = createSocketClient({ token: studentToken, role: 'STUDENT' }); // role changed to STUDENT
        clientSockets.push(socket); // Add to array for cleanup

        // Setup event listeners
        socket.on('participants_list', (data: ParticipantsListResponse) => {
            console.log('✅ Received event: participants_list', data);
            if (!participantsResponse) {
                participantsResponse = data;
            } else {
                updatedParticipantsResponse = data;
            }
        });

        socket.on('room_left', (data: RoomLeftResponse) => {
            console.log('✅ Received event: room_left', data);
            roomLeftResponse = data;
        });

        // Generic event logger
        socket.onAny((eventName, ...args) => {
            console.log(`📡 Received event: ${eventName}`, args);
        });

        try {
            console.log('🔌 Connecting socket...');
            socket.connect();

            await new Promise<void>((resolve, reject) => {
                let connectionTimeoutId: NodeJS.Timeout; // Declare timeoutId
                socket.on('connect', () => {
                    console.log('✅ Socket connected');
                    clearTimeout(connectionTimeoutId); // Clear timeout on successful connection
                    resolve();
                });
                socket.on('connect_error', (err) => {
                    console.error('❌ Socket connection error:', err);
                    clearTimeout(connectionTimeoutId); // Clear timeout on connection error
                    reject(err);
                });
                connectionTimeoutId = setTimeout(() => { // Assign to timeoutId
                    // It's important to also remove listeners to prevent memory leaks if timeout occurs
                    socket.off('connect');
                    socket.off('connect_error');
                    reject(new Error('Socket connection timeout'));
                }, 5000);
            });

            console.log('🏠 Joining lobby...');
            socket.emit('join_lobby', {
                accessCode,
                userId: studentPayload.userId, // Keep sending these for now as backend expects them
                username: studentPayload.username,
                avatarEmoji: '😊' // Explicitly send avatarEmoji
            });
            console.log('📤 Sent join_lobby event with full payload');

            await new Promise<void>((resolve, reject) => {
                const interval = setInterval(() => {
                    if (participantsResponse) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        console.log('✅ Got participants list:', participantsResponse);
                        resolve();
                    }
                }, 100);
                const timeout = setTimeout(() => {
                    clearInterval(interval);
                    socket.off('participants_list');
                    reject(new Error('Timeout waiting for initial participants_list'));
                }, 5000);
            });

            console.log('🔍 Checking participantsResponse is defined...');
            expect(participantsResponse).toBeDefined();
            console.log('✅ participantsResponse is defined');
            console.log('🔍 Checking participantsResponse.participants is defined...');
            expect(participantsResponse!.participants).toBeDefined(); // Added non-null assertion
            console.log('✅ participantsResponse.participants is defined');
            console.log('🔍 Checking participants length is 1...');
            console.log('Actual length:', participantsResponse!.participants?.length);
            expect(participantsResponse!.participants?.length).toBe(1);
            console.log('✅ participants length is correct');
            console.log('🔍 Checking first participant username...');
            console.log('Actual username:', participantsResponse!.participants?.[0]?.username);
            expect(participantsResponse!.participants?.[0]?.username).toBe('Test Player');
            console.log('✅ username is correct');

            console.log('🚪 Leaving lobby...');
            socket.emit('leave_lobby', { accessCode });
            console.log('📤 Sent leave_lobby event');

            await new Promise<void>((resolve, reject) => {
                const interval = setInterval(() => {
                    if (roomLeftResponse) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        console.log('✅ Got room_left event');
                        resolve();
                    }
                }, 100);
                const timeout = setTimeout(() => {
                    clearInterval(interval);
                    socket.off('room_left');
                    reject(new Error('Timeout waiting for room_left event'));
                }, 5000);
            });

            console.log('📋 Getting updated participants list...');
            socket.emit('get_participants', { accessCode });
            console.log('📤 Sent get_participants event');

            await new Promise<void>((resolve, reject) => {
                const interval = setInterval(() => {
                    if (updatedParticipantsResponse) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        console.log('✅ Got updated participants list:', updatedParticipantsResponse);
                        resolve();
                    }
                }, 100);
                const timeout = setTimeout(() => {
                    clearInterval(interval);
                    socket.off('participants_list');
                    reject(new Error('Timeout waiting for updated participants_list'));
                }, 5000);
            });

            console.log('🔍 Checking updatedParticipantsResponse is defined...');
            expect(updatedParticipantsResponse).toBeDefined();
            console.log('✅ updatedParticipantsResponse is defined');
            console.log('🔍 Checking updatedParticipantsResponse.participants is defined...');
            expect(updatedParticipantsResponse!.participants).toBeDefined(); // Added non-null assertion
            console.log('✅ updatedParticipantsResponse.participants is defined');
            console.log('🔍 Checking updated participants length is 0...');
            console.log('Actual updated length:', updatedParticipantsResponse!.participants?.length);
            expect(updatedParticipantsResponse!.participants?.length).toBe(0);
            console.log('✅ updated participants length is correct');

            console.log('🔧 Debug test completed successfully!');

            // Clean up: disconnect the socket with explicit wait
            console.log('🧹 Disconnecting socket...');
            socket.disconnect();

            // Wait a bit for disconnect to fully process and intervals to clear
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('✅ Socket disconnected and cleanup waited');
        } catch (error) {
            console.error('❌ Test failed with error:', error);
            if (error && (error as any).stack) {
                console.error('❌ Error stack:', (error as any).stack);
            }
            // Disconnect socket on error as well
            if (socket && socket.connected) {
                socket.disconnect();
                // Wait for disconnect cleanup
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            throw error;
        }
    });
});
