"use strict";
/**
 * server.ts - Main Entry Point for MathQuest Application
 *
 * This file serves as the main server entry point that combines:
 * 1. Next.js for serving the React frontend
 * 2. Socket.IO for real-time communication
 *
 * It initializes the HTTP server, configures Socket.IO, and registers
 * the various socket event handlers for lobbies, tournaments, and quizzes.
 *
 * The server maintains in-memory state for active tournaments and quizzes,
 * which is managed by their respective handlers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const _db_1 = __importDefault(require("@db"));
const _logger_1 = __importDefault(require("@logger"));
// Import handlers and states using path aliases
const lobbyHandler_1 = require("@sockets/lobbyHandler");
const tournamentHandler_1 = require("@sockets/tournamentHandler");
const quizHandler_1 = require("@sockets/quizHandler");
const logger = (0, _logger_1.default)('Server');
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = Number(process.env.PORT) || 3000;
// Initialize Next.js app
// Explicitly type options for NextServer constructor
const nextApp = (0, next_1.default)({ dev, hostname, port }); // Type inferred
const requestHandler = nextApp.getRequestHandler();
nextApp
    .prepare()
    .then(() => {
    const httpServer = (0, node_http_1.createServer)(requestHandler);
    const io = new socket_io_1.Server(httpServer, {
        path: '/api/socket/io',
        cors: {
            origin: '*', // Configure as needed for production
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        logger.info(`New connection: socket.id=${socket.id}`);
        (0, lobbyHandler_1.registerLobbyHandlers)(io, socket);
        (0, tournamentHandler_1.registerTournamentHandlers)(io, socket); // Corrected: Removed prisma and quizState
        (0, quizHandler_1.registerQuizHandlers)(io, socket, _db_1.default);
        socket.on('disconnect', () => {
            logger.debug(`Socket disconnected: socket.id=${socket.id}`);
        });
        socket.on('disconnecting', () => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    try {
                        if (lobbyHandler_1.lobbyParticipants && lobbyHandler_1.lobbyParticipants[room]) {
                            lobbyHandler_1.lobbyParticipants[room] = lobbyHandler_1.lobbyParticipants[room].filter((p) => p.id !== socket.id);
                            io.to(room).emit('participant_left', { id: socket.id });
                            io.to(room).emit('participants_list', lobbyHandler_1.lobbyParticipants[room]);
                            logger.debug(`Removed ${socket.id} from lobby ${room}, new list length: ${lobbyHandler_1.lobbyParticipants[room].length}`);
                        }
                    }
                    catch (e) {
                        if (e instanceof Error) {
                            logger.error(`Error handling disconnecting from room ${room} for socket ${socket.id}: ${e.message}`);
                        }
                        else {
                            logger.error(`Error handling disconnecting from room ${room} for socket ${socket.id}: Unknown error`);
                        }
                    }
                }
            });
        });
    });
    httpServer.once('error', (err) => {
        logger.error('HTTP server error:', err);
        process.exit(1);
    });
    httpServer.listen(port, hostname, () => {
        logger.info(`Server ready on http://${hostname}:${port}`);
    });
})
    .catch((ex) => {
    if (ex instanceof Error) {
        logger.error('Failed to prepare Next.js app:', ex.stack);
    }
    else {
        logger.error('Failed to prepare Next.js app with unknown error:', ex);
    }
    process.exit(1);
});
