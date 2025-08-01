import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { timerActionHandler } from '../../src/sockets/handlers/teacherControl/timerAction';
import { registerTeacherControlHandlers } from '../../src/sockets/handlers/teacherControl';
import { registerGameHandlers } from '../../src/sockets/handlers/game';
import { jest } from '@jest/globals';
import { z } from 'zod';

// --- Copied canonical event constants and Zod schemas for test isolation ---
const TEACHER_EVENTS = {
    DASHBOARD_TIMER_UPDATED: 'dashboard_timer_updated',
    // ... add other needed teacher events if required ...
};
const GAME_EVENTS = {
    GAME_TIMER_UPDATED: 'game_timer_updated',
    // ... add other needed game events if required ...
};

// Canonical Zod schemas for timer event payloads (modernized, only canonical fields)
const dashboardTimerUpdatedPayloadSchema = z.object({
    accessCode: z.string(),
    timer: z.object({
        status: z.enum(['stop', 'run', 'pause']),
        timerEndDateMs: z.number(),
        questionUid: z.string(),
    }),
    questionUid: z.string(),
    questionIndex: z.number(),
    totalQuestions: z.number(),
    answersLocked: z.boolean()
});
const gameTimerUpdatePayloadSchema = z.object({
    timer: z.object({
        status: z.enum(['stop', 'run', 'pause']),
        timerEndDateMs: z.number(),
        questionUid: z.string(),
    }),
    questionUid: z.string(),
    questionIndex: z.number(),
    totalQuestions: z.number(),
    answersLocked: z.boolean()
});
// --- End copied types ---

// Mock Prisma, Redis, Logger as in the unit test
jest.mock('../../src/core/services/gameStateService', () => {
    // Canonical timer mock generator
    function makeCanonicalTimer({
        accessCode,
        questionUid,
        playMode,
        isDeferred,
        durationMs,
        userId,
        attemptCount
    }: any) {
        return {
            status: 'run',
            timerEndDateMs: Date.now() + (durationMs ?? 30000),
            questionUid: questionUid ?? 'q-1',
        };
    }
    const getCanonicalTimer = jest.fn((accessCode, questionUid, playMode, isDeferred, durationMs, userId, attemptCount) => {
        // Return a canonical timer object with the provided args
        return Promise.resolve(
            makeCanonicalTimer({ accessCode, questionUid, playMode, isDeferred, durationMs, userId, attemptCount })
        );
    });
    return {
        __esModule: true,
        default: {
            getFullGameState: jest.fn(),
            updateGameState: jest.fn()
        },
        getCanonicalTimer
    };
});
jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            // @ts-ignore
            update: jest.fn().mockResolvedValue({})
        },
        question: {
            findUnique: jest.fn()
        },
        gameParticipant: {
            // Always return a valid participant for the teacher
            // @ts-ignore
            findFirst: jest.fn().mockResolvedValue({
                id: 'participant-1',
                userId: 'teacher-1',
                gameInstanceId: 'game-1',
                participationType: 'LIVE',
                username: 'Teacher',
                avatarEmoji: '🦋',
                score: 0,
                joinedAt: new Date().toISOString(),
                online: true
            }),
            // @ts-ignore
            create: jest.fn().mockResolvedValue({
                id: 'participant-1',
                userId: 'teacher-1',
                gameInstanceId: 'game-1',
                participationType: 'LIVE',
                username: 'Teacher',
                avatarEmoji: '🧑‍🏫',
                score: 0,
                joinedAt: new Date().toISOString(),
                online: true
            }),
            // @ts-ignore
            count: jest.fn().mockResolvedValue(1),
            // @ts-ignore
            findMany: jest.fn().mockResolvedValue([
                {
                    id: 'participant-1',
                    userId: 'teacher-1',
                    gameInstanceId: 'game-1',
                    participationType: 'LIVE',
                    username: 'Teacher',
                    avatarEmoji: '🦋',
                    score: 0,
                    joinedAt: new Date().toISOString(),
                    online: true,
                    user: { username: 'Teacher', avatarEmoji: '🦋' }
                }
            ]) // <-- Patch to return valid participant
        }
    }
}));
jest.mock('@/config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        set: jest.fn(),
        // @ts-ignore
        hset: jest.fn().mockResolvedValue(1),
        // @ts-ignore
        hget: jest.fn().mockResolvedValue(null), // Added mock for hget
        // @ts-ignore
        zadd: jest.fn().mockResolvedValue(1), // Added mock for zadd
        // @ts-ignore
        hgetall: jest.fn().mockResolvedValue({}), // <-- Add this mock
        // @ts-ignore
        llen: jest.fn().mockResolvedValue(0), // <-- Add this mock for joinOrderBonus
        // @ts-ignore
        lrange: jest.fn().mockResolvedValue([]), // <-- Add this mock for joinOrderBonus
        // @ts-ignore
        rpush: jest.fn().mockResolvedValue(1), // <-- Add this mock for joinOrderBonus
        // @ts-ignore
        expire: jest.fn().mockResolvedValue(1), // <-- Add this mock for joinOrderBonus
    }
} as any));
jest.mock('@/core/services/gameParticipant/joinService', () => ({
    // Always return a valid participant for the teacher
    // @ts-ignore
    joinGame: jest.fn().mockResolvedValue({
        success: true,
        participant: {
            id: 'participant-1',
            userId: 'teacher-1',
            gameInstanceId: 'game-1',
            participationType: 'LIVE',
            username: 'Teacher',
            avatarEmoji: '🧑‍🏫',
            score: 0,
            joinedAt: new Date().toISOString(),
            online: true
        }
    })
}));

const mockGameInstance = {
    id: 'game-1',
    accessCode: 'CODE1',
    playMode: 'quiz',
    status: 'active', // Set to 'active' for timer tests
    gameTemplate: { creatorId: 'teacher-1' },
    initiatorUserId: 'teacher-1'
};
const mockQuestions = [
    { uid: 'q-1', text: 'Q1', durationMs: 30000 },
    { uid: 'q-2', text: 'Q2', durationMs: 40000 }
];
const mockGameState = {
    currentQuestionIndex: 0,
    questionUids: ['q-1', 'q-2'],
    timer: {
        status: 'stop',
        timerEndDateMs: Date.now() + 30000,
        questionUid: 'q-1',
    },
    status: 'active', // Set to 'active' for timer tests
    answersLocked: false
};

// --- Ensure updateGameState mock is applied to the correct module instance ---
// This must be done after all imports and before tests run
import * as gameStateServiceModule from '../../src/core/services/gameStateService';

describe('timerActionHandler integration (real socket)', () => {
    let httpServer: any;
    let io: SocketIOServer;
    let clientSocket: ClientSocket;
    let port: number;

    beforeAll(async () => {
        httpServer = createServer();
        io = new SocketIOServer(httpServer, { path: '/api/socket.io' });
        port = Math.floor(Math.random() * 10000) + 30000;
        await new Promise<void>(resolve => httpServer.listen(port, resolve));

        // Register handler on a test namespace/event
        io.on('connection', (socket) => {
            // Attach userId to socket.data for auth
            socket.data.userId = 'teacher-1';
            registerTeacherControlHandlers(io, socket);
            registerGameHandlers(io, socket); // <-- Register game handlers for game events
        });
    });

    afterAll(async () => {
        if (clientSocket) clientSocket.disconnect();
        if (io) io.close();
        if (httpServer) httpServer.close();
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    let lastGameState: any;
    beforeEach(() => {
        // Reset all mocks
        const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
        lastGameState = deepClone(mockGameState);
        require('@/db/prisma').prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
        require('@/db/prisma').prisma.gameInstance.findFirst.mockImplementation(() => mockGameInstance);
        require('@/db/prisma').prisma.question.findUnique.mockImplementation(({ where: { uid } }: { where: { uid: string } }) => {
            const q = mockQuestions.find(q => q.uid === uid);
            return q;
        });
        require('../../src/core/services/gameStateService').default.getFullGameState.mockImplementation(() => {
            return Promise.resolve({ gameState: deepClone(lastGameState) });
        });
        // Remove any previous mock for updateGameState
        if ((gameStateServiceModule.default.updateGameState as any).mockRestore) {
            (gameStateServiceModule.default.updateGameState as any).mockRestore();
        }
        // Spy on the real updateGameState used by the handler
        jest.spyOn(gameStateServiceModule.default, 'updateGameState').mockImplementation((accessCode: string, maybeFnOrState: any) => {
            const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
            let result;
            if (typeof maybeFnOrState === 'function') {
                lastGameState = maybeFnOrState(deepClone(lastGameState));
                result = lastGameState;
            } else {
                // Defensive: if called with a state object, just assign it
                lastGameState = deepClone(maybeFnOrState);
                result = lastGameState;
            }
            return Promise.resolve(result);
        });
        require('@/config/redis').redisClient.get.mockImplementation((key: string) => {
            return Promise.resolve(JSON.stringify(lastGameState));
        });
    });

    it('should emit timer events to all rooms on play', (done) => {
        jest.setTimeout(3000); // Reduce timeout for async events
        clientSocket = ClientIO(`http://localhost:${port}`, {
            path: '/api/socket.io',
            transports: ['websocket']
        });
        const received: Record<string, any> = {};
        let gameJoined = false;
        // Attach listeners BEFORE connecting
        clientSocket.onAny((event, ...args) => {
            if (event === 'game_joined') gameJoined = true;
        });
        // Listen for dashboard_question_changed event (as seen in UI logs)
        clientSocket.on('dashboard_question_changed', (payload) => {
            received['dashboard_question_changed'] = payload;
        });
        clientSocket.on('error_dashboard', (payload) => {
            console.error('[test] error_dashboard payload:', payload);
            if (!received['error_dashboard']) received['error_dashboard'] = [];
            received['error_dashboard'].push(payload);
            // Log full error payload for debugging
            console.error('[test] FULL error_dashboard payload:', JSON.stringify(payload, null, 2));
        });
        clientSocket.on('game_error', (payload) => {
            console.error('[test] game_error payload:', payload);
            if (!received['game_error']) received['game_error'] = [];
            received['game_error'].push(payload);
            // Log full error payload for debugging
            console.error('[test] FULL game_error payload:', JSON.stringify(payload, null, 2));
        });
        clientSocket.on('connect', () => {
            // Join the dashboard room
            clientSocket.emit('join_dashboard', { accessCode: 'CODE1' });
            // Join the live/game room with canonical payload
            const joinGamePayload = {
                accessCode: 'CODE1',
                userId: 'teacher-1',
                username: 'Teacher',
                avatarEmoji: '🦋'
            };
            clientSocket.emit('join_game', joinGamePayload);
            setTimeout(() => {
                if (!gameJoined) {
                    console.error('[test] game_joined not confirmed.');
                }
                // Emit only canonical timer run action to trigger the backend
                const timerEndDateMs = Date.now() + 30000;
                clientSocket.emit('timer_action', { accessCode: 'CODE1', action: 'run', questionUid: 'q-1', timerEndDateMs });
                clientSocket.emit('quiz_timer_action', { accessCode: 'CODE1', action: 'run', questionUid: 'q-1', timerEndDateMs });
            }, 2000); // Wait 2s for joins to process
        });
        // Remove joinConfirmed from timeout and maybeDone logic
        const timeout = setTimeout(() => {
            console.error('[test] Timeout: Events received:', received);
            console.error('[test] dashboard_timer_updated:', received['dashboard_timer_updated']);
            console.error('[test] game_timer_updated:', received['game_timer_updated']);
            done(new Error('Did not receive expected timer events within timeout.'));
        }, 3000); // Reduce timeout
        let finished = false; // Guard to ensure done() is only called once
        function maybeDone() {
            if (finished) return;
            if (received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] && received[GAME_EVENTS.GAME_TIMER_UPDATED]) {
                finished = true;
                clearTimeout(timeout);
                expect(received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED]).toBeDefined();
                expect(received[GAME_EVENTS.GAME_TIMER_UPDATED]).toBeDefined();
                done();
            }
        }
        // Only store the first canonical event with questionUid: 'q-1' for each event type
        clientSocket.on(TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, (payload) => {
            if (!received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] && payload?.questionUid === 'q-1') {
                received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] = payload;
                console.log('[test] Received DASHBOARD_TIMER_UPDATED:', payload);
                maybeDone();
            }
        });
        clientSocket.on(GAME_EVENTS.GAME_TIMER_UPDATED, (payload) => {
            if (!received[GAME_EVENTS.GAME_TIMER_UPDATED] && payload?.questionUid === 'q-1') {
                received[GAME_EVENTS.GAME_TIMER_UPDATED] = payload;
                console.log('[test] Received GAME_TIMER_UPDATED:', payload);
                maybeDone();
            }
        });
        clientSocket.connect();
    });

    // Remove legacy and isolation tests, and add 3 canonical sub-tests for current question only
    it.each([
        ['run', 30000],
        ['pause', 15000],
        ['stop', 0]
    ])(
        'should emit timer events for current question with status %s',
        async (status, timeLeftMs) => {
            jest.setTimeout(3000);
            lastGameState.timer.status = status;
            lastGameState.timer.timerEndDateMs = Date.now() + timeLeftMs;
            lastGameState.timer.questionUid = 'q-1';
            lastGameState.currentQuestionIndex = 0; // current question
            clientSocket = ClientIO(`http://localhost:${port}`, {
                path: '/api/socket.io',
                transports: ['websocket']
            });
            const received: Record<string, any> = {};
            let gameJoined = false;
            await new Promise<void>((resolve, reject) => {
                clientSocket.onAny((event, ...args) => {
                    if (event === 'game_joined') gameJoined = true;
                });
                clientSocket.on('connect', () => {
                    clientSocket.emit('join_dashboard', { accessCode: 'CODE1' });
                    const joinGamePayload = {
                        accessCode: 'CODE1',
                        userId: 'teacher-1',
                        username: 'Teacher',
                        avatarEmoji: '🦋'
                    };
                    clientSocket.emit('join_game', joinGamePayload);
                    setTimeout(() => {
                        const emitNow = new Date().toISOString();
                        const timerEndDateMs = Date.now() + 35000;
                        const timerActionPayload = { accessCode: 'CODE1', action: status, questionUid: 'q-1', timerEndDateMs };
                        console.log(`[test][${emitNow}] emitting quiz_timer_action`, timerActionPayload);
                        clientSocket.emit('quiz_timer_action', timerActionPayload);
                    }, 2200);
                });
                const timeout = setTimeout(() => {
                    console.error('[test] Timeout: Events received:', received);
                    reject(new Error('Did not receive expected timer events within timeout.'));
                }, 3000);
                let finished = false;
                function maybeDone() {
                    if (finished) return;
                    if (received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] && received[GAME_EVENTS.GAME_TIMER_UPDATED]) {
                        finished = true;
                        clearTimeout(timeout);
                        expect(received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED]).toBeDefined();
                        expect(received[GAME_EVENTS.GAME_TIMER_UPDATED]).toBeDefined();
                        resolve();
                    }
                }
                clientSocket.on(TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, (payload) => {
                    if (!received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] && payload?.questionUid === 'q-1') {
                        received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] = payload;
                        maybeDone();
                    }
                });
                clientSocket.on(GAME_EVENTS.GAME_TIMER_UPDATED, (payload) => {
                    if (!received[GAME_EVENTS.GAME_TIMER_UPDATED] && payload?.questionUid === 'q-1') {
                        received[GAME_EVENTS.GAME_TIMER_UPDATED] = payload;
                        maybeDone();
                    }
                });
                clientSocket.connect();
            });
        }
    );

    // Canonical sub-tests for NEW QUESTION scenario (start, pause, stop)
    it.each([
        ['run', 40000, true],
        ['pause', 20000, true],
        ['stop', 0, false]
    ])(
        'should handle quiz_timer_action for new question (q-2) with status %s',
        async (status, timeLeftMs, shouldSwitch) => {
            jest.setTimeout(3000);
            // Set initial state: current question is q-1
            lastGameState.currentQuestionIndex = 0;
            lastGameState.timer.status = 'stop';
            lastGameState.timer.timerEndDateMs = Date.now() + 30000;
            lastGameState.timer.questionUid = 'q-1';
            clientSocket = ClientIO(`http://localhost:${port}`, {
                path: '/api/socket.io',
                transports: ['websocket']
            });
            const received: Record<string, any> = {};
            let gameJoined = false;
            let projectionEventReceived = false;
            await new Promise<void>((resolve, reject) => {
                clientSocket.onAny((event, ...args) => {
                    if (event === 'game_joined') gameJoined = true;
                });
                clientSocket.on('connect', () => {
                    clientSocket.emit('join_dashboard', { accessCode: 'CODE1' });
                    const joinGamePayload = {
                        accessCode: 'CODE1',
                        userId: 'teacher-1',
                        username: 'Teacher',
                        avatarEmoji: '🦋'
                    };
                    clientSocket.emit('join_game', joinGamePayload);
                    setTimeout(() => {
                        const emitNow = new Date().toISOString();
                        const timerEndDateMs = Date.now() + 40000;
                        const timerActionPayload = { accessCode: 'CODE1', action: status, questionUid: 'q-2', timerEndDateMs };
                        console.log(`[test][${emitNow}] emitting quiz_timer_action (new question)`, timerActionPayload);
                        clientSocket.emit('quiz_timer_action', timerActionPayload);
                    }, 2200);
                });
                // Listen for projection room timer events (dashboard_timer_updated)
                clientSocket.on('dashboard_timer_updated', (payload) => {
                    // In the real app, projection room receives dashboard_timer_updated as well
                    if (payload?.questionUid === 'q-2' && payload?.projection === true) {
                        projectionEventReceived = true;
                    }
                });
                const timeout = setTimeout(() => {
                    console.error('[test] Timeout: Events received:', received);
                    reject(new Error('Did not receive expected timer events within timeout.'));
                }, 3000);
                let finished = false;
                function maybeDone() {
                    if (finished) return;
                    // For start/pause: expect both dashboard and game events for q-2
                    // For stop: expect only dashboard event for q-2, no game event for q-2, no projection event
                    if (shouldSwitch) {
                        if (received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] && received[GAME_EVENTS.GAME_TIMER_UPDATED]) {
                            finished = true;
                            clearTimeout(timeout);
                            expect(received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED]?.questionUid).toBe('q-2');
                            expect(received[GAME_EVENTS.GAME_TIMER_UPDATED]?.questionUid).toBe('q-2');
                            resolve();
                        }
                    } else {
                        if (received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED]) {
                            finished = true;
                            clearTimeout(timeout);
                            expect(received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED]?.questionUid).toBe('q-2');
                            expect(received[GAME_EVENTS.GAME_TIMER_UPDATED]).toBeUndefined();
                            expect(projectionEventReceived).toBe(false); // Ensure no projection event
                            resolve();
                        }
                    }
                }
                clientSocket.on(TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED, (payload) => {
                    if (!received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] && payload?.questionUid === 'q-2') {
                        received[TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED] = payload;
                        maybeDone();
                    }
                });
                clientSocket.on(GAME_EVENTS.GAME_TIMER_UPDATED, (payload) => {
                    if (!received[GAME_EVENTS.GAME_TIMER_UPDATED] && payload?.questionUid === 'q-2') {
                        received[GAME_EVENTS.GAME_TIMER_UPDATED] = payload;
                        maybeDone();
                    }
                });
                clientSocket.connect();
            });
        }
    );
});
