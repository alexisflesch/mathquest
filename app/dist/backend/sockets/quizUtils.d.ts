/**
 * quizUtils.ts - Quiz Utility Functions
 *
 * This module provides a set of utility functions for managing quiz state
 * and connected users.
 */
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { QuizState, Chrono, Question } from './types/quizTypes';
/**
 * Emits the connected user count for a tournament associated with a quiz
 * @param io - Socket.IO server instance
 * @param prisma - Prisma client
 * @param code - Tournament code
 */
export declare function emitQuizConnectedCount(io: Server, prisma: PrismaClient, code: string): Promise<void>;
/**
 * Centralized function to emit quiz timer updates
 * @param io - Socket.IO server instance
 * @param quizId - Quiz ID
 * @param status - Timer status ('play', 'pause', 'stop')
 * @param questionId - Question ID
 * @param timeLeft - Time left in seconds
 */
export declare function emitQuizTimerUpdate(io: Server, quizId: string, status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number): void;
/**
 * Helper to patch quiz state with recalculated timer for broadcast
 * @param state - The quiz state to patch
 * @returns The patched quiz state
 */
export declare function patchQuizStateForBroadcast(state: QuizState): QuizState & {
    currentQuestion?: Question | null;
};
/**
 * Function to update chrono in quiz state
 * @param state - The quiz state to update
 * @param timeLeft - New time left value
 * @param status - Timer status
 * @returns Updated quiz state
 */
export declare function updateChrono(state: QuizState | null | undefined, timeLeft?: number, status?: 'play' | 'pause' | 'stop'): QuizState | null | undefined;
/**
 * Function to create an initialized chrono object
 * @param initialTime - Initial time in seconds
 * @returns Initialized chrono object
 */
export declare function initializeChrono(initialTime?: number): Chrono;
/**
 * Function to calculate remaining time based on chrono and timestamp
 * @param chrono - Chrono object
 * @param timestamp - Timestamp when timer started
 * @returns Remaining time in seconds
 */
export declare function calculateRemainingTime(chrono?: Chrono | null, timestamp?: number | null): number;
/**
 * Updates a question's timer state
 * @param quizId - The quiz ID
 * @param questionId - The question ID
 * @param status - The timer status ('play', 'pause', or 'stop')
 * @param timeLeft - The remaining time in seconds
 */
export declare function updateQuestionTimer(quizId: string, questionId: string, status: 'play' | 'pause' | 'stop', timeLeft?: number): void;
/**
 * Calculates the precise remaining time for a question
 * @param quizId - The quiz ID
 * @param questionId - The question ID
 * @returns The remaining time in seconds
 */
export declare function calculateQuestionRemainingTime(quizId: string, questionId: string): number;
/**
 * Synchronizes timer values between quiz and tournament
 * @param quizId - Quiz ID
 * @param tournamentCode - Tournament code
 * @param timeLeft - Time left in seconds
 */
export declare function synchronizeTimerValues(quizId: string, tournamentCode: string, timeLeft: number): void;
