/**
 * Integration test for JOIN_GAME idempotency
 * 
 * Tests the full flow from socket emission to handler processing,
 * verifying that duplicate JOIN_GAME events are properly blocked.
 * 
 * @jest-environment node
 */

// @ts-nocheck - Jest globals are available at runtime but not in editor with main tsconfig

import { Server } from 'socket.io';
import { Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { clearAllIdempotencyKeys } from '../../utils/idempotencyGuard';
import { registerConnectionHandlers } from '../connectionHandlers';

describe('JOIN_GAME Idempotency Integration', () => {
    let io: Server;
    let serverSocket: any;
    let clientSocket: ClientSocket;
    let httpServer: any;
    let port: number;

    beforeAll(() => {
        // Disable socket.onAny logging for tests
        delete process.env.SOCKET_DEBUG_EVENTS;
    });

    beforeEach((done) => {
        // Clear idempotency cache
        clearAllIdempotencyKeys();

        // Create HTTP server
        httpServer = createServer();
        io = new Server(httpServer);

        // Register connection handlers
        registerConnectionHandlers(io);

        // Listen on random port
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;

            // Create client socket
            clientSocket = ioClient(`http://localhost:${port}`, {
                transports: ['websocket'],
                forceNew: true
            });

            // Wait for connection
            io.on('connection', (socket) => {
                serverSocket = socket;
            });

            clientSocket.on('connect', () => {
                done();
            });
        });
    });

    afterEach((done) => {
        // Cleanup
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        io.close();
        httpServer.close(() => {
            done();
        });
    });

    describe('Burst JOIN_GAME events', () => {
        it('should process only first JOIN_GAME and block duplicates within 5s window', (done) => {
            const accessCode = 'TEST_GAME_123';
            const userId = 'test-user-456';
            const username = 'TestUser';

            let gameJoinedCount = 0;
            let gameErrorCount = 0;

            // Listen for responses
            clientSocket.on('game_joined', () => {
                gameJoinedCount++;
            });

            clientSocket.on('game_error', (error: any) => {
                gameErrorCount++;
                console.log('Received game_error:', error);
            });

            // Send 5 rapid JOIN_GAME events
            const payload = {
                accessCode,
                userId,
                username,
                avatarEmoji: '🐼'
            };

            // Emit burst of events
            for (let i = 0; i < 5; i++) {
                clientSocket.emit('join_game', payload);
            }

            // Wait for processing
            setTimeout(() => {
                // Should have received at most 1 game_joined (first request)
                // Duplicates are silently ignored (no response)
                // If game doesn't exist, should get 1 game_error
                expect(gameJoinedCount + gameErrorCount).toBe(1);

                console.log(`Processed ${gameJoinedCount} game_joined, ${gameErrorCount} game_error out of 5 requests`);
                done();
            }, 1000);
        }, 10000);

        it('should allow second JOIN_GAME after window expires', (done) => {
            const accessCode = 'TEST_GAME_789';
            const userId = 'test-user-999';
            const username = 'TestUser2';

            let responseCount = 0;

            clientSocket.on('game_joined', () => {
                responseCount++;
            });

            clientSocket.on('game_error', () => {
                responseCount++;
            });

            const payload = {
                accessCode,
                userId,
                username,
                avatarEmoji: '🐨'
            };

            // First request
            clientSocket.emit('join_game', payload);

            // Wait 100ms and send duplicate - should be blocked
            setTimeout(() => {
                clientSocket.emit('join_game', payload);
            }, 100);

            // Wait for window to expire (5s) plus margin
            setTimeout(() => {
                // Clear count for second test
                responseCount = 0;

                // After window expires, should be allowed
                clientSocket.emit('join_game', payload);

                // Check response
                setTimeout(() => {
                    expect(responseCount).toBe(1);
                    done();
                }, 500);
            }, 5500);
        }, 10000);
    });

    describe('Multiple users joining same game', () => {
        it('should allow different users to join simultaneously', (done) => {
            const accessCode = 'TEST_GAME_ABC';

            let user1ResponseCount = 0;
            let user2ResponseCount = 0;

            clientSocket.on('game_joined', () => {
                user1ResponseCount++;
            });

            clientSocket.on('game_error', () => {
                user1ResponseCount++;
            });

            // Create second client
            const client2 = ioClient(`http://localhost:${port}`, {
                transports: ['websocket'],
                forceNew: true
            });

            client2.on('connect', () => {
                client2.on('game_joined', () => {
                    user2ResponseCount++;
                });

                client2.on('game_error', () => {
                    user2ResponseCount++;
                });

                // Both users join same game
                clientSocket.emit('join_game', {
                    accessCode,
                    userId: 'user1',
                    username: 'User1',
                    avatarEmoji: '🦁'
                });

                client2.emit('join_game', {
                    accessCode,
                    userId: 'user2',
                    username: 'User2',
                    avatarEmoji: '🐯'
                });

                // Check responses
                setTimeout(() => {
                    // Each user should get exactly 1 response
                    expect(user1ResponseCount).toBe(1);
                    expect(user2ResponseCount).toBe(1);

                    client2.disconnect();
                    done();
                }, 1000);
            });
        }, 10000);
    });

    describe('Practice mode JOIN_GAME', () => {
        it('should handle PRACTICE accessCode correctly', (done) => {
            let gameJoinedCount = 0;

            clientSocket.on('game_joined', (payload: any) => {
                gameJoinedCount++;
                expect(payload.accessCode).toBe('PRACTICE');
                expect(payload.gameMode).toBe('practice');
            });

            // Send practice mode join
            clientSocket.emit('join_game', {
                accessCode: 'PRACTICE',
                userId: 'practice-user-123',
                username: 'PracticeUser',
                avatarEmoji: '🎯'
            });

            // Wait for response
            setTimeout(() => {
                expect(gameJoinedCount).toBe(1);
                done();
            }, 500);
        }, 10000);

        it('should block duplicate PRACTICE joins within window', (done) => {
            let responseCount = 0;

            clientSocket.on('game_joined', () => {
                responseCount++;
            });

            const payload = {
                accessCode: 'PRACTICE',
                userId: 'practice-user-456',
                username: 'PracticeUser2',
                avatarEmoji: '🎲'
            };

            // Send 3 rapid practice joins
            clientSocket.emit('join_game', payload);
            clientSocket.emit('join_game', payload);
            clientSocket.emit('join_game', payload);

            // Wait for processing
            setTimeout(() => {
                // Should only process first one
                expect(responseCount).toBe(1);
                done();
            }, 500);
        }, 10000);
    });
});
