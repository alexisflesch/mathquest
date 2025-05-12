"use strict";
/**
 * unlockHandler.ts - Handler for unlocking a quiz
 *
 * This unlocks a quiz to allow answers from students.
 * Only the teacher who owns the quiz can unlock it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_js_1 = require("../quizState.js"); // MODIFIED
// Import from the legacy file for consistency during transition
const { patchQuizStateForBroadcast } = require('../quizUtils.legacy.js');
// Import logger
const createLogger = require('../../logger');
const logger = createLogger('UnlockQuizHandler');
/**
 * Handle quiz_unlock event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId
 */
function handleUnlock(io, socket, prisma, { quizId, teacherId }) {
    // Authorization check
    if (!quizState_js_1.quizState[quizId] || quizState_js_1.quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }
    logger.info(`Unlocking quiz ${quizId}`);
    // Update state
    quizState_js_1.quizState[quizId].locked = false;
    // Broadcast updated state
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState_js_1.quizState[quizId]));
    // Emit success message
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz unlocked successfully.'
    });
}
exports.default = handleUnlock;
