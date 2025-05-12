/**
 * endHandler.ts - Handler for ending a quiz
 *
 * This handler manages quiz end operations, including ending any linked tournament.
 * Only the teacher who owns the quiz can end it.
 */
import { quizState } from '@sockets/quizState';
import { patchQuizStateForBroadcast } from '@sockets/quizUtils';
import { tournamentState } from '@sockets/tournamentUtils/tournamentState';
// Import logger
import createLogger from '@logger';
const logger = createLogger('EndQuizHandler');
// Only log minimal state info to avoid circular structures
logger.debug(`[handleEnd] tournamentState imported: ${!!tournamentState}`);
logger.debug(`[handleEnd] tournamentState is empty object: ${Object.keys(tournamentState).length === 0}`);
// Avoid stringifying large objects like tournamentState directly
/**
 * Handle quiz_end event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId, teacherId, tournamentCode
 */
function handleEnd(io, socket, prisma, { quizId, teacherId, tournamentCode, forceEnd }) {
    var _a;
    // Authorization check
    const expectedTeacherId = (_a = quizState[quizId]) === null || _a === void 0 ? void 0 : _a.profTeacherId;
    logger.info(`[DEBUG] quiz_end teacherId received: ${teacherId}, expected: ${expectedTeacherId}`);
    if (!quizState[quizId] || !expectedTeacherId || teacherId !== expectedTeacherId) {
        logger.warn(`Unauthorized attempt to end quiz ${quizId} from socket ${socket.id}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }
    logger.info(`Ending quiz ${quizId}`);
    // Update state
    quizState[quizId].ended = true;
    // Emit success message
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz ended successfully.'
    });
    // Broadcast updated state
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    // Trigger tournament end if linked
    // 1. Use tournamentCode from payload if present, else fallback
    let code = tournamentCode;
    if (!code && quizState[quizId].tournament_code) {
        code = quizState[quizId].tournament_code;
    }
    if (!code) {
        try {
            logger.debug(`[handleEnd] Successfully imported tournamentState: ${JSON.stringify(tournamentState)}`);
        }
        catch (error) {
            logger.error(`[handleEnd] Failed to import tournamentState: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            if (!tournamentState) {
                logger.error('[handleEnd] tournamentState is undefined. Ensure it is properly initialized.');
            }
            logger.debug(`[handleEnd] tournamentState: ${JSON.stringify(tournamentState)}`);
            code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        }
        catch (e) {
            // Fallback in case of error
            logger.error(`[handleEnd] Error finding linked tournament: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    logger.debug(`[handleEnd] Checking tournamentState for tournamentCode=${code}, tournamentState exists: ${!!tournamentState}`);
    if (code && tournamentState && tournamentState[code]) {
        logger.info(`Forcing end of tournament ${code} linked to quiz ${quizId}`);
        // Using require for now until these utilities are converted
        const { forceTournamentEnd } = require('../tournamentUtils/tournamentTriggers');
        forceTournamentEnd(io, code);
    }
    else {
        logger.warn(`No active tournament found for quiz ${quizId} to end. Code: ${code}`);
    }
}
// Using both export syntaxes for compatibility
export default handleEnd;
module.exports = handleEnd;
