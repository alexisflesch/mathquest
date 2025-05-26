/**
 * pauseHandler.ts - Game Pause Handler
 * 
 * This module handles the game_pause event, pausing the current game question.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState } from '../types/tournamentTypes'; // Will be renamed to GameState in separate PR
import { GamePausePayload } from '../types/socketTypes';
import { tournamentState } from '../tournamentUtils/tournamentState'; // Will be renamed to gameState in separate PR

// Import logger
import createLogger from '../../logger';
const logger = createLogger('PauseGameHandler');

/**
 * Handle game_pause event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The pause payload from the client
 */
function handleGamePause(
    io: Server,
    socket: Socket,
    { accessCode, teacherId }: GamePausePayload
): void {
    const state: TournamentState | undefined = tournamentState[accessCode];

    if (state && !state.paused) {
        // Calculate remaining time based on elapsed time since question start
        const elapsed = state.questionStart ? (Date.now() - state.questionStart) / 1000 : 0;

        // Use currentQuestionDuration if available, otherwise fallback
        const currentQuestion = state.questions.find(q => q.uid === state.currentQuestionUid);
        const timeAllowed = state.currentQuestionDuration || (currentQuestion?.time || 20);
        state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);

        // Set paused flag to true
        state.paused = true;

        // Clear the existing timer to prevent it from continuing to run in the background
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        logger.info(`Paused game ${accessCode} by teacher ${teacherId}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
        io.to(`game_${accessCode}`).emit("game_question_state_update", {
            questionState: "paused",
            remainingTime: state.pausedRemainingTime
        });
    } else {
        logger.warn(`Received game_pause for ${accessCode}, but state not found or already paused.`);
    }
}

export default handleGamePause;
