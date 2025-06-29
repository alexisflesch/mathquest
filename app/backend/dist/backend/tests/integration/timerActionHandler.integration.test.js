"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socket_io_client_1 = require("socket.io-client");
const teacherControl_1 = require("../../src/sockets/handlers/teacherControl");
const game_1 = require("../../src/sockets/handlers/game");
const globals_1 = require("@jest/globals");
const zod_1 = require("zod");
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
const dashboardTimerUpdatedPayloadSchema = zod_1.z.object({
    accessCode: zod_1.z.string(),
    timer: zod_1.z.object({
        status: zod_1.z.enum(['stop', 'run', 'pause']),
        timerEndDateMs: zod_1.z.number(),
        questionUid: zod_1.z.string(),
    }),
    questionUid: zod_1.z.string(),
    questionIndex: zod_1.z.number(),
    totalQuestions: zod_1.z.number(),
    answersLocked: zod_1.z.boolean()
});
const gameTimerUpdatePayloadSchema = zod_1.z.object({
    timer: zod_1.z.object({
        status: zod_1.z.enum(['stop', 'run', 'pause']),
        timerEndDateMs: zod_1.z.number(),
        questionUid: zod_1.z.string(),
    }),
    questionUid: zod_1.z.string(),
    questionIndex: zod_1.z.number(),
    totalQuestions: zod_1.z.number(),
    answersLocked: zod_1.z.boolean()
});
// --- End copied types ---
// Mock Prisma, Redis, Logger as in the unit test
globals_1.jest.mock('../../src/core/services/gameStateService', () => {
    // Canonical timer mock generator
    function makeCanonicalTimer({ accessCode, questionUid, playMode, isDeferred, durationMs, userId, attemptCount }) {
        return {
            status: 'run',
            timerEndDateMs: Date.now() + (durationMs ?? 30000),
            questionUid: questionUid ?? 'q-1',
        };
    }
    const getCanonicalTimer = globals_1.jest.fn((accessCode, questionUid, playMode, isDeferred, durationMs, userId, attemptCount) => {
        // Return a canonical timer object with the provided args
        return Promise.resolve(makeCanonicalTimer({ accessCode, questionUid, playMode, isDeferred, durationMs, userId, attemptCount }));
    });
    return {
        __esModule: true,
        default: {
            getFullGameState: globals_1.jest.fn(),
            updateGameState: globals_1.jest.fn()
        },
        getCanonicalTimer
    };
});
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: globals_1.jest.fn(),
            findFirst: globals_1.jest.fn(),
            // @ts-ignore
            update: globals_1.jest.fn().mockResolvedValue({})
        },
        question: {
            findUnique: globals_1.jest.fn()
        },
        gameParticipant: {
            // Always return a valid participant for the teacher
            // @ts-ignore
            findFirst: globals_1.jest.fn().mockResolvedValue({
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
            create: globals_1.jest.fn().mockResolvedValue({
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
            count: globals_1.jest.fn().mockResolvedValue(1),
            // @ts-ignore
            findMany: globals_1.jest.fn().mockResolvedValue([
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
globals_1.jest.mock('@/config/redis', () => ({
    redisClient: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        // @ts-ignore
        hset: globals_1.jest.fn().mockResolvedValue(1),
        // @ts-ignore
        hget: globals_1.jest.fn().mockResolvedValue(null), // Added mock for hget
        // @ts-ignore
        zadd: globals_1.jest.fn().mockResolvedValue(1), // Added mock for zadd
        // @ts-ignore
        hgetall: globals_1.jest.fn().mockResolvedValue({}), // <-- Add this mock
        // @ts-ignore
        llen: globals_1.jest.fn().mockResolvedValue(0), // <-- Add this mock for joinOrderBonus
        // @ts-ignore
        lrange: globals_1.jest.fn().mockResolvedValue([]), // <-- Add this mock for joinOrderBonus
        // @ts-ignore
        rpush: globals_1.jest.fn().mockResolvedValue(1), // <-- Add this mock for joinOrderBonus
        // @ts-ignore
        expire: globals_1.jest.fn().mockResolvedValue(1), // <-- Add this mock for joinOrderBonus
    }
}));
globals_1.jest.mock('@/core/services/gameParticipant/joinService', () => ({
    // Always return a valid participant for the teacher
    // @ts-ignore
    joinGame: globals_1.jest.fn().mockResolvedValue({
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
    isDiffered: false,
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
const gameStateServiceModule = __importStar(require("../../src/core/services/gameStateService"));
describe('timerActionHandler integration (real socket)', () => {
    let httpServer;
    let io;
    let clientSocket;
    let port;
    beforeAll(async () => {
        httpServer = (0, http_1.createServer)();
        io = new socket_io_1.Server(httpServer, { path: '/api/socket.io' });
        port = Math.floor(Math.random() * 10000) + 30000;
        await new Promise(resolve => httpServer.listen(port, resolve));
        // Register handler on a test namespace/event
        io.on('connection', (socket) => {
            // Attach userId to socket.data for auth
            socket.data.userId = 'teacher-1';
            (0, teacherControl_1.registerTeacherControlHandlers)(io, socket);
            (0, game_1.registerGameHandlers)(io, socket); // <-- Register game handlers for game events
        });
    });
    afterAll(async () => {
        if (clientSocket)
            clientSocket.disconnect();
        if (io)
            io.close();
        if (httpServer)
            httpServer.close();
    });
    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });
    let lastGameState;
    beforeEach(() => {
        // Reset all mocks
        const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
        lastGameState = deepClone(mockGameState);
        require('@/db/prisma').prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
        require('@/db/prisma').prisma.gameInstance.findFirst.mockImplementation(() => mockGameInstance);
        require('@/db/prisma').prisma.question.findUnique.mockImplementation(({ where: { uid } }) => {
            const q = mockQuestions.find(q => q.uid === uid);
            return q;
        });
        require('../../src/core/services/gameStateService').default.getFullGameState.mockImplementation(() => {
            return Promise.resolve({ gameState: deepClone(lastGameState) });
        });
        // Remove any previous mock for updateGameState
        if (gameStateServiceModule.default.updateGameState.mockRestore) {
            gameStateServiceModule.default.updateGameState.mockRestore();
        }
        // Spy on the real updateGameState used by the handler
        globals_1.jest.spyOn(gameStateServiceModule.default, 'updateGameState').mockImplementation((accessCode, maybeFnOrState) => {
            const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
            let result;
            if (typeof maybeFnOrState === 'function') {
                lastGameState = maybeFnOrState(deepClone(lastGameState));
                result = lastGameState;
            }
            else {
                // Defensive: if called with a state object, just assign it
                lastGameState = deepClone(maybeFnOrState);
                result = lastGameState;
            }
            return Promise.resolve(result);
        });
        require('@/config/redis').redisClient.get.mockImplementation((key) => {
            return Promise.resolve(JSON.stringify(lastGameState));
        });
    });
    it('should emit timer events to all rooms on play', (done) => {
        globals_1.jest.setTimeout(3000); // Reduce timeout for async events
        clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, {
            path: '/api/socket.io',
            transports: ['websocket']
        });
        const received = {};
        let gameJoined = false;
        // Attach listeners BEFORE connecting
        clientSocket.onAny((event, ...args) => {
            if (event === 'game_joined')
                gameJoined = true;
        });
        // Listen for dashboard_question_changed event (as seen in UI logs)
        clientSocket.on('dashboard_question_changed', (payload) => {
            received['dashboard_question_changed'] = payload;
        });
        clientSocket.on('error_dashboard', (payload) => {
            console.error('[test] error_dashboard payload:', payload);
            if (!received['error_dashboard'])
                received['error_dashboard'] = [];
            received['error_dashboard'].push(payload);
            // Log full error payload for debugging
            console.error('[test] FULL error_dashboard payload:', JSON.stringify(payload, null, 2));
        });
        clientSocket.on('game_error', (payload) => {
            console.error('[test] game_error payload:', payload);
            if (!received['game_error'])
                received['game_error'] = [];
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
            if (finished)
                return;
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
    ])('should emit timer events for current question with status %s', async (status, timeLeftMs) => {
        globals_1.jest.setTimeout(3000);
        lastGameState.timer.status = status;
        lastGameState.timer.timerEndDateMs = Date.now() + timeLeftMs;
        lastGameState.timer.questionUid = 'q-1';
        lastGameState.currentQuestionIndex = 0; // current question
        clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, {
            path: '/api/socket.io',
            transports: ['websocket']
        });
        const received = {};
        let gameJoined = false;
        await new Promise((resolve, reject) => {
            clientSocket.onAny((event, ...args) => {
                if (event === 'game_joined')
                    gameJoined = true;
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
                if (finished)
                    return;
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
    });
    // Canonical sub-tests for NEW QUESTION scenario (start, pause, stop)
    it.each([
        ['run', 40000, true],
        ['pause', 20000, true],
        ['stop', 0, false]
    ])('should handle quiz_timer_action for new question (q-2) with status %s', async (status, timeLeftMs, shouldSwitch) => {
        globals_1.jest.setTimeout(3000);
        // Set initial state: current question is q-1
        lastGameState.currentQuestionIndex = 0;
        lastGameState.timer.status = 'stop';
        lastGameState.timer.timerEndDateMs = Date.now() + 30000;
        lastGameState.timer.questionUid = 'q-1';
        clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, {
            path: '/api/socket.io',
            transports: ['websocket']
        });
        const received = {};
        let gameJoined = false;
        let projectionEventReceived = false;
        await new Promise((resolve, reject) => {
            clientSocket.onAny((event, ...args) => {
                if (event === 'game_joined')
                    gameJoined = true;
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
                if (finished)
                    return;
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
                }
                else {
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
    });
});
