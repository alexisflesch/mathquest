"use strict";
/**
 * unlockHandler.ts - Handler for unlocking a quiz
 *
 * This unlocks a quiz to allow answers from students.
 * Only the teacher who owns the quiz can unlock it.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("@sockets/quizState");
const quizUtils_1 = require("@sockets/quizUtils");
const _logger_1 = __importDefault(require("@logger"));
const logger = (0, _logger_1.default)('UnlockQuizHandler');
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
    if (!quizState_1.quizState[quizId] || quizState_1.quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to unlock quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }
    logger.info(`Unlocking quiz ${quizId}`);
    // Update state
    quizState_1.quizState[quizId].locked = false;
    // Broadcast updated state
    io.to(`dashboard_${quizId}`).emit("quiz_state", (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
    // Emit success message
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz unlocked successfully.'
    });
}
exports.default = handleUnlock;
