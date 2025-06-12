"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const testSetup_1 = require("../testSetup");
// Global test variables
let io;
let clientSockets = []; // Initialize as empty array
let port;
let serverCleanup;
// Helper to wait for an event
const waitForEvent = (socket, event) => {
    return new Promise((resolve) => {
        socket.once(event, (data) => {
            resolve(data);
        });
    });
};
describe('Socket Event Test', () => {
    jest.setTimeout(10000); // 10 seconds timeout
    beforeAll(async () => {
        // Start test server and get Socket.IO instance
        const setup = await (0, testSetup_1.startTestServer)();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;
        // Setup direct event handler for echo testing
        io.on('connection', (socket) => {
            console.log('Test server received connection');
            // Direct echo handler - this should always work
            socket.on('echo', (data) => {
                console.log('Server received echo event with data:', data);
                socket.emit('echo_response', data);
            });
            // Handler for game_answer event for direct testing
            socket.on('game_answer', (data) => {
                console.log('Server received game_answer event with data:', data);
                socket.emit('answer_received', {
                    questionUid: data.questionUid,
                    timeSpent: data.timeSpent
                });
            });
        });
    });
    afterAll(async () => {
        // Clean up server
        await serverCleanup();
    });
    beforeEach(() => {
        // Initialize empty array of client sockets for each test
        clientSockets = [];
    });
    afterEach(() => {
        // Disconnect all client sockets after each test
        for (const socket of clientSockets) {
            if (socket.connected) {
                socket.disconnect();
            }
        }
        clientSockets = [];
    });
    // Helper to create a socket.io client
    const createSocketClient = (query = {}) => {
        const socket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
            path: '/api/socket.io',
            query,
            autoConnect: false,
            transports: ['websocket']
        });
        // Add debugging
        socket.on('connect', () => {
            console.log('Client socket connected');
        });
        socket.on('disconnect', (reason) => {
            console.log('Client socket disconnected, reason:', reason);
        });
        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
        socket.on('connect_error', (err) => {
            console.error('Socket connect_error:', err);
        });
        return socket;
    };
    test('Basic echo event works', async () => {
        // Create client socket
        const socket = createSocketClient({
            token: 'test-token',
            role: 'player'
        });
        clientSockets.push(socket);
        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');
        console.log('Socket connected successfully');
        // Setup echo response listener
        const echoPromise = new Promise((resolve) => {
            socket.once('echo_response', (data) => {
                console.log('Received echo_response:', data);
                resolve(data);
            });
        });
        // Send echo event
        const testMessage = 'Hello from client';
        console.log('Sending echo event with message:', testMessage);
        socket.emit('echo', testMessage);
        // Wait for response
        const response = await echoPromise;
        console.log('Echo test completed with response:', response);
        // Verify
        expect(response).toBe(testMessage);
    });
    test('Direct game_answer event works', async () => {
        // Create client socket
        const socket = createSocketClient({
            token: 'test-token',
            role: 'player'
        });
        clientSockets.push(socket);
        // Connect the socket
        socket.connect();
        await waitForEvent(socket, 'connect');
        console.log('Socket connected successfully');
        // Setup answer_received listener
        const answerPromise = new Promise((resolve) => {
            socket.once('answer_received', (data) => {
                console.log('Received answer_received event:', data);
                resolve(data);
            });
        });
        // Send game_answer event
        const testPayload = {
            accessCode: 'TEST123',
            userId: 'test-user',
            questionUid: 'q123',
            answer: 'A',
            timeSpent: 1000
        };
        console.log('Sending game_answer event with payload:', testPayload);
        socket.emit('game_answer', testPayload);
        // Wait for response
        const response = await answerPromise;
        console.log('Game answer test completed with response:', response);
        // Verify
        expect(response).toEqual({
            questionUid: 'q123',
            timeSpent: 1000
        });
    });
});
