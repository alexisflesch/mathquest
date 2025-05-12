/**
 * lobbyHandler.ts - Lobby Management Socket Handler
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
import createLogger from '@logger';
const logger = createLogger('LobbyHandler');
// Import database connection
import prisma from '../db';
// Import utilities
import { emitQuizConnectedCount } from './quizUtils';
// In-memory store for lobby participants
const lobbyParticipants = {};
/**
 * Register all lobby-related socket event handlers
 * @param io - Socket.IO server instance
 * @param socket - Socket connection
 */
function registerLobbyHandlers(io, socket) {
    socket.on("join_lobby", async ({ code, pseudo, avatar, cookie_id }) => {
        logger.info(`join_lobby received: code=${code}, pseudo=${pseudo}, cookie_id=${cookie_id || 'none'}, socket.id=${socket.id}`);
        logger.debug(`Avatar for ${pseudo}: ${avatar}`);
        try {
            // Fetch tournament status first
            logger.debug(`Fetching tournament status for code ${code}...`);
            const tournoi = await prisma.tournoi.findUnique({
                where: { code },
                select: { statut: true }
            });
            if (!tournoi) {
                logger.warn(`Tournament with code ${code} not found during join_lobby.`);
                socket.emit('lobby_error', { message: 'Tournoi non trouvé.' });
                return;
            }
            logger.info(`Tournament ${code} status found: ${tournoi.statut}`);
            // Check if tournament has already started or finished
            if (tournoi.statut === 'en cours' || tournoi.statut === 'terminé') {
                logger.info(`Tournament ${code} already ${tournoi.statut}. Emitting 'tournament_already_started' to client ${socket.id}.`);
                socket.emit('tournament_already_started', { code, status: tournoi.statut });
                // Always join the lobby room first for consistent event handling
                socket.join(`lobby_${code}`);
                // If tournament is currently in progress, immediately send redirect
                if (tournoi.statut === 'en cours') {
                    logger.info(`Tournament ${code} is in progress, emitting redirect_to_tournament to socket ${socket.id}`);
                    socket.emit('redirect_to_tournament', { code });
                    // Add a brief delay and then resend the redirect in case the client missed it
                    setTimeout(() => {
                        if (socket.connected) {
                            logger.info(`Sending follow-up redirect_to_tournament for ${code} to socket ${socket.id}`);
                            socket.emit('redirect_to_tournament', { code });
                        }
                    }, 2000);
                }
                return;
            }
            // --- Tournament is 'en préparation', proceed with joining the lobby ---
            logger.info(`Tournament ${code} is 'en préparation'. Proceeding to join lobby for socket ${socket.id}.`);
            // Check if this tournament is linked to a quiz
            let isQuizLinked = false;
            let quizId = null;
            try {
                const quiz = await prisma.quiz.findUnique({ where: { tournament_code: code }, select: { id: true } });
                if (quiz && quiz.id) {
                    isQuizLinked = true;
                    quizId = quiz.id;
                    logger.info(`Tournament ${code} is linked to quiz ${quizId}`);
                    // For quiz-linked tournaments, check if the quiz is active
                    // This is a critical check for late joiners
                    if (tournoi.statut === 'en préparation') {
                        // Double-check the tournament status in the database
                        const freshTournoi = await prisma.tournoi.findUnique({
                            where: { code },
                            select: { statut: true }
                        });
                        if (freshTournoi && freshTournoi.statut === 'en cours') {
                            logger.info(`Quiz-linked tournament ${code} is actually active but marked as 'en préparation'. Forcing redirect.`);
                            socket.emit('redirect_to_tournament', { code });
                            // Also update the tournament status in database
                            await prisma.tournoi.update({
                                where: { code },
                                data: { statut: 'en cours' }
                            });
                            // Return early to prevent joining lobby unnecessarily
                            return;
                        }
                    }
                }
            }
            catch (e) {
                logger.error('Error checking if tournament is quiz-linked:', e);
            }
            // Join ONLY the lobby room - to avoid receiving live tournament events prematurely
            socket.join(`lobby_${code}`);
            logger.info(`[DEBUG] After join, socket ${socket.id} rooms:`, Array.from(socket.rooms));
            logger.debug(`Socket ${socket.id} joined ONLY the lobby_${code} room`);
            if (!lobbyParticipants[code])
                lobbyParticipants[code] = [];
            lobbyParticipants[code] = [
                ...lobbyParticipants[code].filter((p) => p.id !== socket.id),
                { id: socket.id, pseudo, avatar, cookie_id },
            ];
            logger.debug(`lobbyParticipants[${code}]:`, lobbyParticipants[code]);
            io.to(`lobby_${code}`).emit("participant_joined", { pseudo, avatar, id: socket.id });
            io.to(`lobby_${code}`).emit("participants_list", { participants: lobbyParticipants[code], isQuizLinked });
            // Emit quiz connected count after a student joins the lobby
            await emitQuizConnectedCount(io, prisma, code);
            // Periodically check tournament status for this lobby
            const checkInterval = setInterval(async () => {
                try {
                    // Stop checking if socket disconnected
                    if (!socket.connected) {
                        clearInterval(checkInterval);
                        return;
                    }
                    // Verify the client is still in the lobby room
                    const clientRooms = Array.from(socket.rooms);
                    logger.debug(`[STATUS CHECK] Socket ${socket.id} rooms:`, clientRooms);
                    // Verify that client is in correct room - if not, rejoin them
                    if (!clientRooms.includes(`lobby_${code}`)) {
                        logger.warn(`[STATUS CHECK] Socket ${socket.id} not in lobby_${code} room, rejoining...`);
                        socket.join(`lobby_${code}`);
                    }
                    const updatedTournoi = await prisma.tournoi.findUnique({
                        where: { code },
                        select: { statut: true }
                    });
                    if (updatedTournoi && updatedTournoi.statut === 'en cours') {
                        logger.info(`Tournament ${code} status is now en cours, emitting redirect_to_tournament (periodic check)`);
                        // Use multiple techniques to ensure the client receives the redirect
                        // 1. Direct socket event
                        socket.emit('redirect_to_tournament', { code });
                        // 2. Broadcast to the entire lobby room
                        io.to(`lobby_${code}`).emit('redirect_to_tournament', { code });
                        // 3. Global notification
                        io.emit("tournament_notification", {
                            type: "redirect",
                            code: code,
                            message: "Tournament has started",
                            isQuizMode: true,
                            immediate: true
                        });
                        // 4. Multiple delayed attempts with increasing delays
                        const redirectDelays = [500, 1000, 2000, 5000];
                        redirectDelays.forEach(delay => {
                            setTimeout(() => {
                                if (socket.connected) {
                                    logger.info(`[STATUS CHECK] Sending delayed (${delay}ms) redirect for ${code} to socket ${socket.id}`);
                                    socket.emit('redirect_to_tournament', { code });
                                }
                            }, delay);
                        });
                        clearInterval(checkInterval);
                    }
                    else if (updatedTournoi && updatedTournoi.statut === 'terminé') {
                        logger.info(`Tournament ${code} status is now terminé, emitting tournament_end`);
                        socket.emit('tournament_already_started', { code, status: 'terminé' });
                        clearInterval(checkInterval);
                    }
                }
                catch (statusCheckError) {
                    logger.error(`Error checking tournament status after join: ${statusCheckError}`);
                }
            }, 1000); // Check every second for faster response
            // Clear interval when socket disconnects
            socket.on('disconnect', () => {
                clearInterval(checkInterval);
            });
        }
        catch (error) {
            logger.error(`Error processing join_lobby for code ${code}:`, error);
            // Optionally emit an error back to the client
            socket.emit('lobby_error', { message: 'Erreur interne lors de la connexion au lobby.' });
        }
    });
    socket.on("leave_lobby", async ({ code }) => {
        logger.info(`leave_lobby: code=${code}, socket.id=${socket.id}`);
        // Leave only the lobby room
        socket.leave(`lobby_${code}`);
        logger.debug(`Socket ${socket.id} left room: lobby_${code}`);
        if (lobbyParticipants[code]) {
            lobbyParticipants[code] = lobbyParticipants[code].filter((p) => p.id !== socket.id);
            logger.debug(`lobbyParticipants[${code}] after leave:`, lobbyParticipants[code]);
            io.to(`lobby_${code}`).emit("participant_left", { id: socket.id });
            // Always emit participants_list as an object with isQuizLinked
            let isQuizLinked = false;
            try {
                const quiz = await prisma.quiz.findUnique({ where: { tournament_code: code }, select: { id: true } });
                if (quiz && quiz.id)
                    isQuizLinked = true;
            }
            catch (e) {
                logger.error('Error checking if tournament is quiz-linked (leave_lobby):', e);
            }
            io.to(`lobby_${code}`).emit("participants_list", { participants: lobbyParticipants[code], isQuizLinked });
        }
    });
    socket.on("get_participants", async ({ code }) => {
        logger.debug(`get_participants: code=${code}, socket.id=${socket.id}`);
        logger.debug(`lobbyParticipants[${code}] on get_participants:`, lobbyParticipants[code]);
        // Check if this tournament is linked to a quiz
        let isQuizLinked = false;
        try {
            const quiz = await prisma.quiz.findUnique({ where: { tournament_code: code }, select: { id: true } });
            if (quiz && quiz.id)
                isQuizLinked = true;
        }
        catch (e) {
            logger.error('Error checking if tournament is quiz-linked (get_participants):', e);
        }
        // Make sure the socket has joined the correct lobby room
        if (!socket.rooms.has(`lobby_${code}`)) {
            socket.join(`lobby_${code}`);
            logger.debug(`Socket ${socket.id} joined lobby_${code} room during get_participants`);
        }
        socket.emit("participants_list", { participants: lobbyParticipants[code] || [], isQuizLinked });
    });
    // Handle disconnect within the lobby context as well
    socket.on("disconnecting", async () => {
        for (const room of socket.rooms) {
            // Check if this is a lobby room (starts with "lobby_")
            if (room.startsWith('lobby_')) {
                const code = room.replace('lobby_', '');
                if (lobbyParticipants[code]) {
                    lobbyParticipants[code] = lobbyParticipants[code].filter((p) => p.id !== socket.id);
                    logger.info(`Socket ${socket.id} disconnecting from lobby ${code}`);
                    io.to(`lobby_${code}`).emit("participant_left", { id: socket.id });
                    // Always emit participants_list as an object with isQuizLinked
                    let isQuizLinked = false;
                    try {
                        const quiz = await prisma.quiz.findUnique({ where: { tournament_code: code }, select: { id: true } });
                        if (quiz && quiz.id)
                            isQuizLinked = true;
                    }
                    catch (e) {
                        logger.error('Error checking if tournament is quiz-linked (disconnecting):', e);
                    }
                    io.to(`lobby_${code}`).emit("participants_list", { participants: lobbyParticipants[code], isQuizLinked });
                }
            }
            // Legacy support for old room format (just the code)
            else if (room !== socket.id && lobbyParticipants[room]) {
                lobbyParticipants[room] = lobbyParticipants[room].filter((p) => p.id !== socket.id);
                logger.info(`Socket ${socket.id} disconnecting from legacy lobby ${room}`);
                io.to(`lobby_${room}`).emit("participant_left", { id: socket.id });
                // Always emit participants_list as an object with isQuizLinked
                let isQuizLinked = false;
                try {
                    const quiz = await prisma.quiz.findUnique({ where: { tournament_code: room }, select: { id: true } });
                    if (quiz && quiz.id)
                        isQuizLinked = true;
                }
                catch (e) {
                    logger.error('Error checking if tournament is quiz-linked (disconnecting):', e);
                }
                io.to(`lobby_${room}`).emit("participants_list", { participants: lobbyParticipants[room], isQuizLinked });
            }
        }
    });
}
// Export for CommonJS compatibility
const lobbyHandlerExports = {
    registerLobbyHandlers,
    lobbyParticipants
};
module.exports = lobbyHandlerExports;
// This allows both TypeScript import and CommonJS require
export { registerLobbyHandlers, lobbyParticipants,
// ... other exports
 };
// For CommonJS compatibility (bridge files)
// Types are not typically exported for CommonJS consumers in this manner
// JavaScript consumers will rely on the TypeScript declaration files (.d.ts)
// or if they are using JSDoc, they can define the types there.
module.exports = {
    registerLobbyHandlers,
    lobbyParticipants,
    // ... other exports (do not add LobbyParticipant here)
};
