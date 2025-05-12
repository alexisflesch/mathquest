import { Server } from 'socket.io';
/**
 * Sends the current question to the tournament room if the quiz is linked to a tournament.
 */
export declare function sendQuestionToTournament(io: Server, quizId: string, questionId: string): void;
/**
 * Triggers the timer action for a quiz question (play, pause, stop).
 */
export declare function triggerQuizTimerAction(io: Server, quizId: string, questionId: string, action: 'play' | 'pause' | 'stop', timeLeft?: number): void;
/**
 * Sets the timer value for a quiz question (edit duration).
 */
export declare function triggerQuizSetTimer(io: Server, quizId: string, questionId: string, timeLeft: number): void;
