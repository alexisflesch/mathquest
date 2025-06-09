"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_client_1 = require("socket.io-client");
const sockets_1 = require("../../src/sockets");
const logger_1 = __importDefault(require("../../src/utils/logger"));
const logger = (0, logger_1.default)('DebugSocketTest');
describe('Debug Socket Connection', () => {
    let httpServer;
    let io;
    let clientSocket;
    const port = 3555;
    beforeAll(async () => {
        // Create HTTP server
        httpServer = (0, http_1.createServer)();
        // Initialize Socket.IO
        io = (0, sockets_1.initializeSocketIO)(httpServer);
        // Start server
        await new Promise((resolve) => {
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
        clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, {
            auth: {
                userId: 'test-teacher-123',
                userType: 'teacher'
            },
            path: '/api/socket.io',
            transports: ['websocket']
        });
        // Wait for connection
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 5000);
            clientSocket.on('connect', () => {
                clearTimeout(timeout);
                console.log('Socket connected successfully:', clientSocket.id);
                resolve();
            });
            clientSocket.on('connect_error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
        // Test if we can emit join_dashboard
        console.log('Emitting join_dashboard...');
        // Listen for any response
        clientSocket.onAny((event, ...args) => {
            console.log('Received event:', event, args);
        });
        clientSocket.emit('join_dashboard', { gameId: 'test-game-123' });
        // Give it a moment to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Test completed');
    });
});
