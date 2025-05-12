/**
 * disconnectingHandler.ts - Handler for socket disconnection from quiz
 * 
 * This handler manages cleanup when a socket disconnects from a quiz.
 * It removes the socket from connected sockets, updates counts, and
 * handles teacher disconnections.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { quizState } from '../quizState';
import { emitQuizConnectedCount } from '../quizUtils';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('DisconnectQuizHandler');

/**
 * Handle disconnecting event for quiz sockets
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection that is disconnecting
 * @param prisma - Prisma client for database operations
 */
async function handleDisconnecting(
    io: Server,
    socket: Socket,
    prisma: PrismaClient
): Promise<void> {
    logger.info(`disconnecting: socket.id=${socket.id}`);

    // Check all quizzes for this socket
    for (const quizId in quizState) {
        // Remove the socket from the connected set
        if (quizState[quizId].connectedSockets && quizState[quizId].connectedSockets.has(socket.id)) {
            quizState[quizId].connectedSockets.delete(socket.id);
            logger.info(`[QUIZ_CONNECTED] Suppression socket ${socket.id} de quiz ${quizId}. Sockets restants:`, Array.from(quizState[quizId].connectedSockets));

            // Emit updated connected count
            let code: string | null = null;
            if (quizState[quizId] && quizState[quizId].tournament_code) {
                code = quizState[quizId].tournament_code;
            } else {
                try {
                    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
                    if (quiz && quiz.tournament_code) code = quiz.tournament_code;
                } catch (e) {
                    logger.error('Erreur récupération code tournoi', e);
                }
            }

            if (code) await emitQuizConnectedCount(io, prisma, code);
        }

        // Handle teacher disconnection
        if (quizState[quizId].profSocketId === socket.id) {
            quizState[quizId].profSocketId = null;
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

export default handleDisconnecting;
