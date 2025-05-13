/**
 * quizHandler.ts - Quiz Handler Registration Module
 *
 * This file serves as a bridge between the main server and the quiz event handlers.
 * It imports the quiz state and tournament functions, then registers the quiz event
 * handlers by delegating to the quizEvents module.
 *
 * The architecture separates quiz state management and event registration to:
 * 1. Keep the code modular
 * 2. Avoid circular dependencies
 * 3. Allow for easier testing and maintenance
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Question, QuizState } from './types/quizTypes';
import { TournamentAnswer } from './types/tournamentTypes';
import { quizState } from './quizState';
interface ScoreCalculationResult {
    baseScore: number;
    timePenalty: number;
    totalScore: number;
}
/**
 * Compute scores for quiz mode, accounting for paused timers.
 * @param state - The quiz state object.
 * @param question - The current question object.
 * @param answer - The participant's answer.
 * @param questionStart - The timestamp when the question started.
 * @param totalQuestions - The total number of questions in the quiz.
 * @returns The computed score details.
 */
declare function computeQuizModeScore(state: QuizState, question: Question, answer: TournamentAnswer, questionStart: number, totalQuestions: number): ScoreCalculationResult;
/**
 * Register all quiz-related event handlers
 * @param io - Socket.IO server instance
 * @param socket - Socket connection
 * @param prisma - Prisma client for database operations
 */
declare function registerQuizHandlers(io: Server, socket: Socket, prisma: PrismaClient): void;
export { registerQuizHandlers, quizState, computeQuizModeScore };
