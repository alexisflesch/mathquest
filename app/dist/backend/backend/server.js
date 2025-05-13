"use strict";
/**
 * server.ts - Main Entry Point for MathQuest Backend
 *
 * This file serves as the main server entry point for:
 * 1. HTTP API endpoints for basic information
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
const port = Number(process.env.PORT) || 3007; // Default to port 3007 to avoid conflict with frontend
// Create a basic HTTP server for Socket.IO
const httpServer = (0, node_http_1.createServer)((req, res) => {
    // Add CORS headers to all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3008',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version, X-Client-Source',
        'Access-Control-Allow-Credentials': 'false',
    };
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }
    // Simple health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
    }
    // API endpoint to get active tournaments/quizzes count
    if (req.url === '/api/stats') {
        res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({
            activeTournaments: Object.keys(tournamentHandler_1.tournamentState).length,
            activeQuizzes: Object.keys(quizHandler_1.quizState).length,
        }));
        return;
    }
    // Default response for other requests
    res.writeHead(404, Object.assign({ 'Content-Type': 'application/json' }, corsHeaders));
    res.end(JSON.stringify({ error: 'Not found' }));
});
// Initialize Socket.IO server
const io = new socket_io_1.Server(httpServer, {
    path: '/api/socket/io',
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3008', // Specific origin instead of wildcard
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'X-Client-Source']
    },
    // Configure socket.io for better reliability
    connectTimeout: 30000, // 30 seconds
    pingTimeout: 25000, // 25 seconds
    pingInterval: 10000, // 10 seconds
    transports: ['websocket', 'polling']
});
io.on('connection', (socket) => {
    logger.info(`New connection: socket.id=${socket.id}`);
    // Simple ping-pong handler for connection testing
    socket.on('ping', (data) => {
        logger.debug(`Received ping from ${socket.id}:`, data);
        socket.emit('pong', {
            timestamp: Date.now(),
            receivedTimestamp: data === null || data === void 0 ? void 0 : data.timestamp,
            message: 'Server received your ping'
        });
    });
    (0, lobbyHandler_1.registerLobbyHandlers)(io, socket);
    (0, tournamentHandler_1.registerTournamentHandlers)(io, socket);
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
    logger.info(`Backend server ready on http://${hostname}:${port}`);
});
