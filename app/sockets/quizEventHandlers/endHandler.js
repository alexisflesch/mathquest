const createLogger = require('../../logger');
const logger = createLogger('EndQuizHandler');
const quizState = require('../quizState');

// Note: prisma is not needed here
function handleEnd(io, socket, prisma, { quizId, teacherId, tournamentCode }) {
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
    // 1. Use tournamentCode from payload if present, else fallback
    let code = tournamentCode;
    if (!code && quizState[quizId].tournament_code) code = quizState[quizId].tournament_code;
    if (!code) {
        try {
            const { tournamentState } = require('../tournamentHandler');
            code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        } catch (e) { /* fallback */ }
    }
    if (code && tournamentState[code]) {
        logger.info(`Forcing end of tournament ${code} linked to quiz ${quizId}`);
        const { forceTournamentEnd } = require('../tournamentUtils/tournamentTriggers');
        forceTournamentEnd(io, code);
    } else {
        logger.warn(`No active tournament found for quiz ${quizId} to end.`);
    }
}

module.exports = handleEnd;
