"use strict";
/**
 * disconnectingHandler.ts - Handler for socket disconnection from quiz
 *
 * This handler manages cleanup when a socket disconnects from a quiz.
 * It removes the socket from connected sockets, updates counts, and
 * handles teacher disconnections.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("../quizState");
const quizUtils_1 = require("../quizUtils");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('DisconnectQuizHandler');
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
    for (const quizId in quizState_1.quizState) {
        // Remove the socket from the connected set
        if (quizState_1.quizState[quizId].connectedSockets && quizState_1.quizState[quizId].connectedSockets.has(socket.id)) {
            quizState_1.quizState[quizId].connectedSockets.delete(socket.id);
            logger.info(`[QUIZ_CONNECTED] Suppression socket ${socket.id} de quiz ${quizId}. Sockets restants:`, Array.from(quizState_1.quizState[quizId].connectedSockets));
            // Emit updated connected count
            let code = null;
            if (quizState_1.quizState[quizId] && quizState_1.quizState[quizId].tournament_code) {
                code = quizState_1.quizState[quizId].tournament_code;
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
                await (0, quizUtils_1.emitQuizConnectedCount)(io, prisma, code);
        }
        // Handle teacher disconnection
        if (quizState_1.quizState[quizId].profSocketId === socket.id) {
            quizState_1.quizState[quizId].profSocketId = null;
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
        await (0, quizUtils_1.emitQuizConnectedCount)(io, prisma, cleanCode);
    }
}
exports.default = handleDisconnecting;
