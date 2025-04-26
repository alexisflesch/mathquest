const createLogger = require('../../logger');
const logger = createLogger('PauseTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');

function handleTournamentPause(io, socket, { code }) {
    const state = tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && !state.paused) {
        // Calculate remaining time based on elapsed time since question start
        const elapsed = (Date.now() - state.questionStart) / 1000;
        // Use currentQuestionDuration if available, otherwise fallback
        const timeAllowed = state.currentQuestionDuration || state.questions[state.currentIndex]?.temps || 20;
        state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);

        // Set paused flag to true
        state.paused = true;

        // Clear the existing timer to prevent it from continuing to run in the background
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        logger.info(`Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
        io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "paused", remainingTime: state.pausedRemainingTime });
    } else {
        logger.warn(`Received tournament_pause for ${code}, but state not found, is differed, or already paused.`);
    }
}

module.exports = handleTournamentPause;
