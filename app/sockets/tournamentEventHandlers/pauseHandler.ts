/**
 * pauseHandler.ts - Tournament Pause Handler
 * 
 * This module handles the tournament_pause event, pausing the current tournament question.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState } from '../types/tournamentTypes';
import { PauseTournamentPayload } from '../types/socketTypes';
import { tournamentState } from '../tournamentUtils/tournamentState';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('PauseTournamentHandler');

/**
 * Handle tournament_pause event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The pause payload from the client
 */
function handleTournamentPause(
    io: Server,
    socket: Socket,
    { code }: PauseTournamentPayload
): void {
    const state: TournamentState | undefined = tournamentState[code]; // Only applicable to live tournaments

    if (state && !state.isDiffered && !state.paused) {
        // Calculate remaining time based on elapsed time since question start
        const elapsed = state.questionStart ? (Date.now() - state.questionStart) / 1000 : 0;

        // Use currentQuestionDuration if available, otherwise fallback
        const currentQuestion = state.questions.find(q => q.uid === state.currentQuestionUid);
        const timeAllowed = state.currentQuestionDuration || (currentQuestion?.temps || 20);
        state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);

        // Set paused flag to true
        state.paused = true;

        // Clear the existing timer to prevent it from continuing to run in the background
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        logger.info(`Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
        io.to(`live_${code}`).emit("tournament_question_state_update", {
            questionState: "paused",
            remainingTime: state.pausedRemainingTime
        });
    } else {
        logger.warn(`Received tournament_pause for ${code}, but state not found, is differed, or already paused.`);
    }
}

export default handleTournamentPause;
