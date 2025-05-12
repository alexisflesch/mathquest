/**
 * tournamentTriggers.ts - Trigger functions for tournament events
 *
 * This module contains functions that trigger various tournament events,
 * such as sending questions, starting/stopping timers, and handling answers.
 */
import { Server } from 'socket.io';
/**
 * Sends a tournament question to participants
 *
 * Sends the question data and sets initial state, but DOES NOT start the timer itself.
 * Timer is started via triggerTournamentTimerSet.
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param index - Question index in the tournament questions array
 * @param linkedQuizId - Optional linked quiz ID if this is a quiz-linked tournament
 * @param initialTime - Optional initial time for the question timer
 * @param targetQuestionUid - Optional specific question UID to send
 */
declare function triggerTournamentQuestion(io: Server, code: string, index: number, linkedQuizId?: string | null, initialTime?: number | null, targetQuestionUid?: string | null): void;
/**
 * Sets the tournament timer
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param timeLeft - Time left in seconds
 * @param forceQuestionState - Optional force state ('running', 'paused', 'stopped')
 */
declare function triggerTournamentTimerSet(io: Server, code: string, timeLeft: number, forceQuestionState?: string | null): void;
/**
 * Processes an answer submission in a tournament
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param participantId - Participant ID
 * @param answer - The submitted answer
 * @param questionUid - Question UID
 */
declare function triggerTournamentAnswer(io: Server, code: string, participantId: string, answer: string | number, questionUid: string): void;
export { triggerTournamentQuestion, triggerTournamentTimerSet, triggerTournamentAnswer };
declare const _default: {
    triggerTournamentQuestion: typeof triggerTournamentQuestion;
    triggerTournamentTimerSet: typeof triggerTournamentTimerSet;
    triggerTournamentAnswer: typeof triggerTournamentAnswer;
};
export default _default;
