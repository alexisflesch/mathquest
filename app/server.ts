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

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '@db';
import createLogger from '@logger';

// Import handlers and states using path aliases
import { registerLobbyHandlers, lobbyParticipants } from '@sockets/lobbyHandler';
import { registerTournamentHandlers, tournamentState } from '@sockets/tournamentHandler';
import { registerQuizHandlers, quizState } from '@sockets/quizHandler';
import { NextServerOptions } from 'next/dist/server/next'; // Kept for options casting


const logger = createLogger('Server');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port: number = Number(process.env.PORT) || 3000;

// Initialize Next.js app
// Explicitly type options for NextServer constructor
const nextApp = next({ dev, hostname, port } as NextServerOptions); // Type inferred
const requestHandler = nextApp.getRequestHandler();

nextApp
    .prepare()
    .then(() => {
        const httpServer = createServer(requestHandler);

        const io = new SocketIOServer(httpServer, {
            path: '/api/socket/io',
            cors: {
                origin: '*', // Configure as needed for production
                methods: ['GET', 'POST'],
            },
        });

        io.on('connection', (socket: Socket) => {
            logger.info(`New connection: socket.id=${socket.id}`);

            registerLobbyHandlers(io, socket);
            registerTournamentHandlers(io, socket); // Corrected: Removed prisma and quizState
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
            logger.info(`Server ready on http://${hostname}:${port}`);
        });
    })
    .catch((ex: unknown) => {
        if (ex instanceof Error) {
            logger.error('Failed to prepare Next.js app:', ex.stack);
        } else {
            logger.error('Failed to prepare Next.js app with unknown error:', ex);
        }
        process.exit(1);
    });
