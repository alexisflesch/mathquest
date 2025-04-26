/**
 * lobbyHandler.js - Lobby Management Socket Handler
 * 
 * This module handles the real-time functionality of tournament lobbies, where
 * participants gather before a tournament starts. Key responsibilities include:
 * 
 * - Tracking participants joining and leaving lobbies
 * - Broadcasting participant lists to all connected clients
 * - Managing socket room memberships for proper event routing
 * - Maintaining in-memory state of lobby participants
 * 
 * Each tournament has its own lobby, identified by the tournament code.
 * When a tournament starts, participants are automatically moved from
 * the lobby to the active tournament.
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const createLogger = require('../logger');
const logger = createLogger('LobbyHandler');

const lobbyParticipants = {};

function registerLobbyHandlers(io, socket) {
    socket.on("join_lobby", async ({ code, pseudo, avatar, cookie_id }) => { // Make handler async
        logger.info(`join_lobby received: code=${code}, pseudo=${pseudo}, cookie_id=${cookie_id}, socket.id=${socket.id}`); // Log reception
        logger.debug(`Avatar for ${pseudo}: ${avatar}`);

        try {
            // Fetch tournament status first
            logger.debug(`Fetching tournament status for code ${code}...`); // Log before DB call
            const tournoi = await db.tournoi.findUnique({
                where: { code },
                select: { statut: true } // Only select the status field
            });

            if (!tournoi) {
                logger.warn(`Tournament with code ${code} not found during join_lobby.`);
                // Optionally emit an error back to the client
                socket.emit('lobby_error', { message: 'Tournoi non trouvé.' });
                return;
            }

            logger.info(`Tournament ${code} status found: ${tournoi.statut}`); // Log the fetched status

            // Check if tournament has already started or finished
            if (tournoi.statut === 'en cours' || tournoi.statut === 'terminé') {
                logger.info(`Tournament ${code} already ${tournoi.statut}. Emitting 'tournament_already_started' to client ${socket.id}.`); // Log before emitting
                socket.emit('tournament_already_started', { code, status: tournoi.statut });
                // Do not proceed to join lobby rooms or add to participants list
                return;
            }

            // --- Tournament is 'en préparation', proceed with joining the lobby ---
            logger.info(`Tournament ${code} is 'en préparation'. Proceeding to join lobby for socket ${socket.id}.`); // Log normal join

            // Join both the plain code room (for lobby communications) and the tournament room
            socket.join(code);
            socket.join(`tournament_${code}`); // Also join the tournament room preemptively

            logger.debug(`Socket ${socket.id} joined rooms: ${code} and tournament_${code}`);

            if (!lobbyParticipants[code]) lobbyParticipants[code] = [];
            lobbyParticipants[code] = [
                ...lobbyParticipants[code].filter((p) => p.id !== socket.id),
                { id: socket.id, pseudo, avatar, cookie_id },
            ];
            logger.debug(`lobbyParticipants[${code}]:`, lobbyParticipants[code]);
            io.to(code).emit("participant_joined", { pseudo, avatar, id: socket.id });
            io.to(code).emit("participants_list", lobbyParticipants[code]);

        } catch (error) {
            logger.error(`Error processing join_lobby for code ${code}:`, error);
            // Optionally emit an error back to the client
            socket.emit('lobby_error', { message: 'Erreur interne lors de la connexion au lobby.' });
        }
    });

    socket.on("leave_lobby", ({ code }) => {
        logger.info(`leave_lobby: code=${code}, socket.id=${socket.id}`);

        // Leave both the lobby code room and the tournament room
        socket.leave(code);
        socket.leave(`tournament_${code}`);
        logger.debug(`Socket ${socket.id} left rooms: ${code} and tournament_${code}`);

        if (lobbyParticipants[code]) {
            lobbyParticipants[code] = lobbyParticipants[code].filter((p) => p.id !== socket.id);
            logger.debug(`lobbyParticipants[${code}] after leave:`, lobbyParticipants[code]);
            io.to(code).emit("participant_left", { id: socket.id });
            io.to(code).emit("participants_list", lobbyParticipants[code]);
        }
    });

    socket.on("get_participants", ({ code }) => {
        logger.debug(`get_participants: code=${code}, socket.id=${socket.id}`);
        logger.debug(`lobbyParticipants[${code}] on get_participants:`, lobbyParticipants[code]);
        socket.emit("participants_list", lobbyParticipants[code] || []);
    });

    // Handle disconnect within the lobby context as well
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
            // Check if the room is a lobby code (simple check, might need refinement)
            if (room !== socket.id && lobbyParticipants[room]) {
                lobbyParticipants[room] = lobbyParticipants[room].filter((p) => p.id !== socket.id);
                logger.info(`Socket ${socket.id} disconnecting from lobby ${room}`);
                io.to(room).emit("participant_left", { id: socket.id });
                io.to(room).emit("participants_list", lobbyParticipants[room]);
            }
        });
    });
}

// Export the state to be accessible elsewhere
module.exports = { registerLobbyHandlers, lobbyParticipants };
