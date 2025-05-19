"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const index_1 = require("@/sockets/index");
// Mock or import your test helpers as needed
describe('Projector Mode Socket Handler', () => {
    jest.setTimeout(3000);
    let io;
    let httpServer;
    let clientSocket;
    const gameId = 'test-game-id';
    const projectorRoom = `projector_${gameId}`;
    beforeAll((done) => {
        httpServer = (0, http_1.createServer)();
        io = new socket_io_1.Server(httpServer);
        (0, index_1.setupSocketHandlers)(io);
        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`);
            clientSocket.on('connect', done);
        });
        // Optionally, set up Redis mock/connection here
    });
    afterAll((done) => {
        io.close();
        clientSocket.close();
        if (httpServer)
            httpServer.close(done);
        // Optionally, clean up Redis
    });
    it('should join projector room and receive initial state', (done) => {
        // Mock Redis state for the game
        const mockState = {
            question: 'What is 2+2?',
            answerOptions: ['2', '3', '4', '5'],
            correctAnswers: ['4'],
            timer: 30,
            gameCode: 'ABCD',
            leaderboard: [],
            stats: {},
        };
        jest.spyOn(require('@/core/gameStateService'), 'getFullGameState').mockResolvedValueOnce(mockState);
        clientSocket.emit('join_projector', gameId);
        clientSocket.on('projector_state', (state) => {
            expect(state).toEqual(mockState);
            done();
        });
    });
    it('should leave projector room without error', (done) => {
        clientSocket.emit('leave_projector', gameId);
        // No error expected, just call done
        setTimeout(done, 100);
    });
    it('should handle disconnect gracefully', (done) => {
        clientSocket.disconnect();
        setTimeout(done, 100);
    });
    // Add more tests for real-time updates, error cases, etc.
});
