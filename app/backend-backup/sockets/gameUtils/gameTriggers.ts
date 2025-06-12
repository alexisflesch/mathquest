/**
 * gameTriggers.ts - Game Trigger Functions
 *
 * This module provides functions that can be called from outside the game
 * event handlers to trigger game-related actions, such as sending questions
 * or setting timers.
 * 
 * Previously known as tournamentTriggers.ts, now renamed to reflect the new
 * GameInstance model in the schema.
 */

import { Server } from 'socket.io';
import { gameState } from './gameState';
import { sendQuestionWithState } from './gameHelpers';

// Create logger for this module
import createLogger from '../../logger';
const logger = createLogger('GameTriggers');

/**
 * Trigger sending a question for a game
 * 
 * @param io - Socket.IO server instance
 * @param accessCode - Access code for the game
 * @param questionIndex - Index of the question to send
 */
export async function triggerGameQuestion(
    io: Server,
    accessCode: string,
    questionIndex: number
): Promise<void> {
    await sendQuestionWithState(io, accessCode, questionIndex);
}

/**
 * Set a timer for a game question
 * 
 * @param io - Socket.IO server instance
 * @param accessCode - Access code for the game
 * @param duration - Duration of the timer in seconds
 * @param isStarting - Whether this is the start of a new question
 */
export function triggerGameTimerSet(
    io: Server,
    accessCode: string,
    duration: number,
    isStarting: boolean = false
): void {
    const state = gameState[accessCode];
    if (!state) {
        logger.error(`Cannot set timer: Game state not found for accessCode ${accessCode}`);
        return;
    }

    // Clear any existing timer
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    // Only send the timer event for active games
    if (!state.paused) {
        logger.debug(`Setting timer for game ${accessCode} to ${duration} seconds`);

        // Emit timer start event
        io.to(`game_${accessCode}`).emit("game_timer", {
            timeLeft: duration,
            isStarting
        });

        // Set timer to handle question completion
        state.timer = setTimeout(() => {
            handleTimerExpiration(io, accessCode);
        }, duration * 1000);
    }
}

/**
 * Handle timer expiration for a game question
 * 
 * @param io - Socket.IO server instance
 * @param accessCode - Access code for the game
 */
export function handleTimerExpiration(
    io: Server,
    accessCode: string
): void {
    const state = gameState[accessCode];
    if (!state) {
        logger.error(`Cannot handle timer expiration: Game state not found for accessCode ${accessCode}`);
        return;
    }

    // Clear the timer reference
    state.timer = null;

    logger.info(`Timer expired for game ${accessCode}, question index ${state.currentIndex}`);

    // Emit time's up event
    io.to(`game_${accessCode}`).emit("game_question_end", {
        questionUid: state.currentQuestionUid,
        timeIsUp: true
    });

    // Move to the next question after a delay
    setTimeout(() => {
        if (state.currentIndex !== undefined && !state.paused && !state.stopped) {
            const nextQuestionIndex = state.currentIndex + 1;
            triggerGameQuestion(io, accessCode, nextQuestionIndex);

            // If this isn't the last question, set a timer for the next one
            if (nextQuestionIndex < state.questions.length) {
                const nextQuestion = state.questions[nextQuestionIndex];
                const nextTime = nextQuestion?.time || 20; // Default to 20 seconds
                triggerGameTimerSet(io, accessCode, nextTime, true);
            }
        }
    }, 3000); // Wait 3 seconds before moving to the next question
}

/**
 * Manually move to the next question in a game
 * (Useful for teacher-paced games)
 * 
 * @param io - Socket.IO server instance
 * @param accessCode - Access code for the game
 */
export function triggerGameNextQuestion(
    io: Server,
    accessCode: string
): void {
    const state = gameState[accessCode];
    if (!state) {
        logger.error(`Cannot move to next question: Game state not found for accessCode ${accessCode}`);
        return;
    }

    // Clear any existing timer
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    // Emit question end event
    io.to(`game_${accessCode}`).emit("game_question_end", {
        questionUid: state.currentQuestionUid,
        timeIsUp: false,
        manualAdvance: true
    });

    // Move to the next question after a delay
    setTimeout(() => {
        if (state.currentIndex !== undefined && !state.paused && !state.stopped) {
            const nextQuestionIndex = state.currentIndex + 1;
            triggerGameQuestion(io, accessCode, nextQuestionIndex);

            // If this isn't the last question, set a timer for the next one
            if (nextQuestionIndex < state.questions.length) {
                const nextQuestion = state.questions[nextQuestionIndex];
                const nextTime = nextQuestion?.time || 20; // Default to 20 seconds
                triggerGameTimerSet(io, accessCode, nextTime, true);
            }
        }
    }, 1000); // Wait 1 second before moving to the next question (shorter than timer expiration)
}

// Create exports object
const gameTriggers = {
    triggerGameQuestion,
    triggerGameTimerSet,
    triggerGameNextQuestion,
    handleTimerExpiration
};

// Export in TypeScript style first
export {
    triggerGameQuestion,
    triggerGameTimerSet,
    triggerGameNextQuestion,
    handleTimerExpiration
};

// Also provide CommonJS export for compatibility with bridge files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameTriggers;
}
