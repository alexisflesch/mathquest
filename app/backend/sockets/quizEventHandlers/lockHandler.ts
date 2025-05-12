/**
 * lockHandler.ts - Handler for locking a quiz
 * 
 * This locks a quiz to prevent further answers from students.
 * Only the teacher who owns the quiz can lock it.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { LockUnlockPayload } from '../types/socketTypes';
import { quizState } from '../quizState.js'; // Changed to .js to use the bridge
import { patchQuizStateForBroadcast } from '../quizUtils'; // Import from quizUtils (TS)

// Import logger
import createLogger from '../../logger'; // Use import for .ts file
const logger = createLogger('LockQuizHandler');

/**
 * Handle quiz_lock event
 * 
 * @param io - Socket.IO server instance 
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId
 */
function handleLock(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizId, teacherId }: LockUnlockPayload
): void {
    // Authorization check
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to lock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }

    logger.info(`Locking quiz ${quizId}`);

    // Update state
    quizState[quizId].locked = true;

    // Broadcast updated state
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));

    // Emit success message
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz locked successfully.'
    });
}

export default handleLock;
