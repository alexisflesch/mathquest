"use strict";
/**
 * lockHandler.ts - Handler for locking a quiz
 *
 * This locks a quiz to prevent further answers from students.
 * Only the teacher who owns the quiz can lock it.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("../quizState"); // Remove .js extension to use proper TypeScript import
const quizUtils_1 = require("../quizUtils"); // Import from quizUtils (TS)
// Import logger
const logger_1 = __importDefault(require("../../logger")); // Use import for .ts file
const logger = (0, logger_1.default)('LockQuizHandler');
/**
 * Handle quiz_lock event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId
 */
function handleLock(io, socket, prisma, { quizId, teacherId }) {
    // Authorization check
    if (!quizState_1.quizState[quizId] || quizState_1.quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to lock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }
    logger.info(`Locking quiz ${quizId}`);
    // Update state
    quizState_1.quizState[quizId].locked = true;
    // Broadcast updated state
    io.to(`dashboard_${quizId}`).emit("quiz_state", (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
    // Emit success message
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz locked successfully.'
    });
}
exports.default = handleLock;
