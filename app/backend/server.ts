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

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '@db';
import createLogger from '@logger';

// Import handlers and states using path aliases
import { registerLobbyHandlers, lobbyParticipants } from '@sockets/lobbyHandler';
import { registerTournamentHandlers, tournamentState } from '@sockets/tournamentHandler';
import { registerQuizHandlers, quizState } from '@sockets/quizHandler';

const logger = createLogger('Server');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port: number = Number(process.env.PORT) || 3007; // Default to port 3007 to avoid conflict with frontend

// Create a basic HTTP server for Socket.IO
const httpServer = createServer((req, res) => {
    // Simple health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
    }

    // API endpoint to get active tournaments/quizzes count
    if (req.url === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            activeTournaments: Object.keys(tournamentState).length,
            activeQuizzes: Object.keys(quizState).length,
        }));
        return;
    }

    // Default response for other requests
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    cors: {
        origin: '*', // Configure as needed for production
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'X-Client-Source']
    },
    // Configure socket.io for better reliability
    connectTimeout: 30000, // 30 seconds
    pingTimeout: 25000,    // 25 seconds
    pingInterval: 10000,   // 10 seconds
    transports: ['websocket', 'polling']
});

io.on('connection', (socket: Socket) => {
    logger.info(`New connection: socket.id=${socket.id}`);

    // Simple ping-pong handler for connection testing
    socket.on('ping', (data) => {
        logger.debug(`Received ping from ${socket.id}:`, data);
        socket.emit('pong', {
            timestamp: Date.now(),
            receivedTimestamp: data?.timestamp,
            message: 'Server received your ping'
        });
    });

    registerLobbyHandlers(io, socket);
    registerTournamentHandlers(io, socket);
    registerQuizHandlers(io, socket, prisma);

    socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: socket.id=${socket.id}`);
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            if (room !== socket.id) {
                try {
                    if (lobbyParticipants && lobbyParticipants[room]) {
                        lobbyParticipants[room] = lobbyParticipants[room].filter(
                            (p) => p.id !== socket.id
                        );
                        io.to(room).emit('participant_left', { id: socket.id });
                        io.to(room).emit('participants_list', lobbyParticipants[room]);
                        logger.debug(
                            `Removed ${socket.id} from lobby ${room}, new list length: ${lobbyParticipants[room].length}`
                        );
                    }
                } catch (e: unknown) {
                    if (e instanceof Error) {
                        logger.error(
                            `Error handling disconnecting from room ${room} for socket ${socket.id}: ${e.message}`
                        );
                    } else {
                        logger.error(
                            `Error handling disconnecting from room ${room} for socket ${socket.id}: Unknown error`
                        );
                    }
                }
            }
        });
    });
});

httpServer.once('error', (err: Error) => {
    logger.error('HTTP server error:', err);
    process.exit(1);
});

httpServer.listen(port, hostname, () => {
    logger.info(`Backend server ready on http://${hostname}:${port}`);
});
