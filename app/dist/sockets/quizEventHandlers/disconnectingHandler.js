"use strict";
/**
 * disconnectingHandler.ts - Handler for socket disconnection from quiz
 *
 * This handler manages cleanup when a socket disconnects from a quiz.
 * It removes the socket from connected sockets, updates counts, and
 * handles teacher disconnections.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_js_1 = require("../quizState.js"); // MODIFIED
// Import from the legacy file for consistency during transition
const { emitQuizConnectedCount } = require('../quizUtils.legacy.js');
// Import logger using require until logger module is converted to TypeScript
const createLogger = require('../../logger');
const logger = createLogger('DisconnectQuizHandler');
/**
 * Handle disconnecting event for quiz sockets
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection that is disconnecting
 * @param prisma - Prisma client for database operations
 */
async function handleDisconnecting(io, socket, prisma) {
    logger.info(`disconnecting: socket.id=${socket.id}`);
    // Check all quizzes for this socket
    for (const quizId in quizState_js_1.quizState) {
        // Remove the socket from the connected set
        if (quizState_js_1.quizState[quizId].connectedSockets && quizState_js_1.quizState[quizId].connectedSockets.has(socket.id)) {
            quizState_js_1.quizState[quizId].connectedSockets.delete(socket.id);
            logger.info(`[QUIZ_CONNECTED] Suppression socket ${socket.id} de quiz ${quizId}. Sockets restants:`, Array.from(quizState_js_1.quizState[quizId].connectedSockets));
            // Emit updated connected count
            let code = null;
            if (quizState_js_1.quizState[quizId] && quizState_js_1.quizState[quizId].tournament_code) {
                code = quizState_js_1.quizState[quizId].tournament_code;
            }
            else {
                try {
                    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
                    if (quiz && quiz.tournament_code)
                        code = quiz.tournament_code;
                }
                catch (e) {
                    logger.error('Erreur récupération code tournoi', e);
                }
            }
            if (code)
                await emitQuizConnectedCount(io, prisma, code);
        }
        // Handle teacher disconnection
        if (quizState_js_1.quizState[quizId].profSocketId === socket.id) {
            quizState_js_1.quizState[quizId].profSocketId = null;
            logger.info(`Professor disconnected from quiz ${quizId}`);
            // Optionally emit an update to other clients in the quiz room
            // io.to(`dashboard_${quizId}`).emit("quiz_state", quizState[quizId]);
        }
    }
    // Call emitQuizConnectedCount after a student disconnects
    const rooms = Array.from(socket.rooms);
    const tournamentRoom = rooms.find((room) => room.startsWith('lobby_') || room.startsWith('tournament_'));
    if (tournamentRoom) {
        const cleanCode = tournamentRoom.replace(/^(lobby_|tournament_)/, '');
        await emitQuizConnectedCount(io, prisma, cleanCode);
    }
}
exports.default = handleDisconnecting;
