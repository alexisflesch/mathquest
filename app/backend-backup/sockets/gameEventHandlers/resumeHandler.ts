/**
 * resumeHandler.ts - Game Resume Handler
 * 
 * This module handles the game_resume event, resuming a paused game question.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState } from '../types/tournamentTypes'; // Will be renamed to GameState in separate PR
import { GameResumePayload } from '../types/socketTypes';
import { tournamentState } from '../tournamentUtils/tournamentState'; // Will be renamed to gameState in separate PR
import { sendQuestionWithState } from '../tournamentUtils/tournamentHelpers';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('ResumeGameHandler');

/**
 * Handle game_resume event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The resume payload from the client
 */
function handleGameResume(
    io: Server,
    socket: Socket,
    { accessCode, teacherId }: GameResumePayload
): void {
    const state: TournamentState | undefined = tournamentState[accessCode];

    if (state && state.paused) {
        state.paused = false;

        // Find the current question using currentQuestionUid
        const question = state.questions.find(q => q.uid === state.currentQuestionUid);
        if (!question) {
            logger.error(`[ResumeHandler] Question UID ${state.currentQuestionUid} not found in game state.`);
            return;
        }

        // Update all references to question properties
        const timeAllowed = question.time || 20;
        state.questionStart = Date.now() - (timeAllowed - (state.pausedRemainingTime || 0)) * 1000; // Adjust start time
        const remaining = state.pausedRemainingTime || 0;
        state.pausedRemainingTime = undefined;

        logger.info(`Resuming game ${accessCode} by teacher ${teacherId}. Remaining time: ${remaining.toFixed(1)}s`);
        io.to(`live_${accessCode}`).emit("game_question_state_update", {
            questionState: "active",
            remainingTime: remaining
        });

        // Set up a timer to end the question after the remaining time
        if (remaining > 0) {
            const { triggerTimerExpiration } = require('../tournamentUtils/tournamentTriggers');
            const timerMs = Math.ceil(remaining * 1000);

            state.timer = setTimeout(() => {
                if (state.paused) {
                    logger.info(`Timer expired but game ${accessCode} is paused, not processing.`);
                    return;
                }

                if (state.stopped) {
                    logger.info(`Timer expired but game ${accessCode} is stopped, not processing.`);
                    return;
                }

                logger.info(`Timer expired for game ${accessCode}, question ${question.uid}`);
                triggerTimerExpiration(io, accessCode);
            }, timerMs);
        } else {
            logger.warn(`Game ${accessCode} resumed with no remaining time, ending question immediately.`);
            const { triggerTimerExpiration } = require('../tournamentUtils/tournamentTriggers');
            triggerTimerExpiration(io, accessCode);
        }
    } else {
        logger.warn(`Received game_resume for ${accessCode}, but state not found or not paused.`);
    }
}

export default handleGameResume;
