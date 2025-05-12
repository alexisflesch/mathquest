const createLogger = require('../../logger');
const logger = createLogger('EndQuizHandler');
const { quizState } = require('../quizState');
const { tournamentState } = require('../tournamentUtils/tournamentState.legacy.js');
logger.debug(`[handleEnd] tournamentState: ${JSON.stringify(tournamentState)}`);

// Note: prisma is not needed here
function handleEnd(io, socket, prisma, { quizId, teacherId, tournamentCode }) {
    const expectedTeacherId = quizState[quizId]?.profTeacherId;
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
    quizState[quizId].ended = true;

    // Emit success message after ending the quiz
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz ended successfully.'
    });

    // Patch: Recalculate timer for dashboard broadcast
    const { patchQuizStateForBroadcast } = require('../quizUtils.legacy.js');
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));

    // --- PATCH: Trigger tournament end if linked ---
    // 1. Use tournamentCode from payload if present, else fallback
    let code = tournamentCode;
    if (!code && quizState[quizId].tournament_code) code = quizState[quizId].tournament_code;
    if (!code) {
        try {
            logger.debug(`[handleEnd] Successfully imported tournamentState: ${JSON.stringify(tournamentState)}`);
        } catch (error) {
            logger.error(`[handleEnd] Failed to import tournamentState: ${error.message}`);
        }
        try {
            if (!tournamentState) {
                logger.error('[handleEnd] tournamentState is undefined. Ensure it is properly initialized.');
            }
            logger.debug(`[handleEnd] tournamentState: ${JSON.stringify(tournamentState)}`);
            code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        } catch (e) { /* fallback */ }
    }
    logger.debug(`[handleEnd] Checking tournamentState for tournamentCode=${tournamentCode}`);
    if (code && tournamentState[code]) {
        logger.info(`Forcing end of tournament ${code} linked to quiz ${quizId}`);
        const { forceTournamentEnd } = require('../tournamentUtils/tournamentTriggers');
        forceTournamentEnd(io, code);
    } else {
        logger.warn(`No active tournament found for quiz ${quizId} to end.`);
    }
}

// Remove redundant import and potentially problematic debug of tournamentState
// Just export the handler
module.exports = handleEnd;
