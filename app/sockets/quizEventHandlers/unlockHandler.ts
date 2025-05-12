/**
 * unlockHandler.ts - Handler for unlocking a quiz
 * 
 * This unlocks a quiz to allow answers from students.
 * Only the teacher who owns the quiz can unlock it.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { LockUnlockPayload } from '../types/socketTypes';
import { quizState } from '../quizState';
import { patchQuizStateForBroadcast } from '../quizUtils';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('UnlockQuizHandler');

/**
 * Handle quiz_unlock event
 * 
 * @param io - Socket.IO server instance 
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId
 */
function handleUnlock(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizId, teacherId }: LockUnlockPayload
): void {
    // Authorization check
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }

    logger.info(`Unlocking quiz ${quizId}`);

    // Update state
    quizState[quizId].locked = false;

    // Broadcast updated state
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));

    // Emit success message
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz unlocked successfully.'
    });
}

export default handleUnlock;
