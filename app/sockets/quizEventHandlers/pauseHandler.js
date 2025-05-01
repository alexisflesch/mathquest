const createLogger = require('../../logger');
const logger = createLogger('PauseQuizHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentPause } = require('../tournamentHandler');

// Note: prisma is not needed here
function handlePause(io, socket, prisma, { quizId }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized attempt to pause quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Pausing quiz ${quizId}`);

    // PATCH: Calcul du temps restant réel au moment de la pause
    const now = Date.now();
    const chrono = quizState[quizId].chrono;
    let remaining = 0;

    if (chrono && chrono.running && typeof chrono.timeLeft === 'number' && quizState[quizId].timerTimestamp) {
        const elapsed = Math.floor((now - quizState[quizId].timerTimestamp) / 1000);
        remaining = Math.max(chrono.timeLeft - elapsed, 0);
        quizState[quizId].chrono.timeLeft = remaining;
        quizState[quizId].timerTimeLeft = remaining;
        logger.info(`[PAUSE] Timer paused at ${remaining}s (elapsed: ${elapsed}s)`);
    } else if (typeof chrono?.timeLeft === 'number') {
        // If we don't have a timestamp (rare), use the current timeLeft
        remaining = chrono.timeLeft;
        logger.info(`[PAUSE] Timer paused at ${remaining}s (no elapsed calculation)`);
    }

    quizState[quizId].chrono.running = false;
    quizState[quizId].timerStatus = 'pause';
    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    const code = Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        // Pass the remaining time to ensure tournament state is correctly updated
        triggerTournamentPause(io, code, remaining);
    }
}

module.exports = handlePause;
