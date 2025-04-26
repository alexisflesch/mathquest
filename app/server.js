/**
 * server.js - Main Entry Point for MathQuest Application
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

const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const prisma = require('./db');
const createLogger = require('./logger');
const logger = createLogger('Server');

// Import handlers
const { registerLobbyHandlers } = require('./sockets/lobbyHandler');
const { registerTournamentHandlers, tournamentState } = require('./sockets/tournamentHandler'); // Import tournament handler and state
const { registerQuizHandlers, quizState } = require('./sockets/quizHandler'); // Import quiz handler AND quizState

// Server configuration
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3007;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer, {
        path: "/api/socket/io",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        logger.info(`New connection: socket.id=${socket.id}`);
        registerLobbyHandlers(io, socket);
        // *** Pass quizState to tournament handlers ***
        registerTournamentHandlers(io, socket, prisma, quizState);
        registerQuizHandlers(io, socket, prisma); // quizState is managed internally here

        // Generic disconnect log - specific cleanup is now in handlers
        socket.on("disconnect", () => {
            logger.debug(`Socket disconnected: socket.id=${socket.id}`);
        });

        socket.on("disconnecting", () => {
            // Remove user from all lobby rooms on disconnect
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    try {
                        const { lobbyParticipants } = require('./sockets/lobbyHandler');
                        if (lobbyParticipants && lobbyParticipants[room]) {
                            lobbyParticipants[room] = lobbyParticipants[room].filter((p) => p.id !== socket.id);
                            io.to(room).emit("participant_left", { id: socket.id });
                            io.to(room).emit("participants_list", lobbyParticipants[room]);
                        }
                    } catch (e) {
                        logger.error(`Error handling disconnecting from room ${room}:`, e.message);
                    }
                }
            });
        });
    });

    httpServer.once("error", (err) => {
        logger.error("HTTP server error:", err);
        process.exit(1);
    });

    httpServer.listen(port, () => {
        logger.info(`Server ready on http://${hostname}:${port}`);
    });
});
