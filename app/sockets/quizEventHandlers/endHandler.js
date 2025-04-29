const createLogger = require('../../logger');
const logger = createLogger('EndQuizHandler');
const quizState = require('../quizState');

// Note: prisma is not needed here
function handleEnd(io, socket, prisma, { quizId, teacherId }) {
    const expectedTeacherId = quizState[quizId]?.profTeacherId;
    logger.info(`[DEBUG] quiz_end teacherId received: ${teacherId}, expected: ${expectedTeacherId}`);
    if (!quizState[quizId] || !expectedTeacherId || teacherId !== expectedTeacherId) {
        logger.warn(`Unauthorized attempt to end quiz ${quizId} from socket ${socket.id}`);
        return;
    }
    logger.info(`Ending quiz ${quizId}`);
    quizState[quizId].ended = true;
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    // --- PATCH: Trigger tournament end if linked ---
    // 1. Find the tournament code linked to this quiz
    let code = null;
    // Try to find code in memory
    try {
        const { tournamentState } = require('../tournamentHandler');
        const { forceTournamentEnd } = require('../tournamentUtils/tournamentTriggers');
        code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        if (!code && quizState[quizId].tournament_code) code = quizState[quizId].tournament_code;
        if (code && tournamentState[code]) {
            logger.info(`Forcing end of tournament ${code} linked to quiz ${quizId}`);
            forceTournamentEnd(io, code);
        } else {
            logger.warn(`No active tournament found for quiz ${quizId} to end.`);
        }
    } catch (err) {
        logger.error('Error while trying to end linked tournament:', err);
    }
}

module.exports = handleEnd;
