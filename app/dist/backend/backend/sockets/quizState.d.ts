/**
 * quizState.ts - Quiz State Management
 *
 * This module provides a centralized in-memory state store for all active quizzes.
 * It maintains information about:
 * - Active questions
 * - Timer states
 * - Teacher socket associations
 * - Participation statistics
 *
 * The state is structured as a map where:
 * - Keys are quiz IDs
 * - Values are quiz state objects containing current status information
 *
 * This state is used by both the quiz handlers and tournament handlers
 * to coordinate the teacher dashboard and student views.
 *
 * UPDATED: Now includes per-question timer tracking to store individual
 * timer states for each question in a quiz.
 */
import { QuestionTimer, QuizStateContainer } from './types/quizTypes';
declare const quizState: QuizStateContainer;
/**
 * Creates a default question timer state object
 * @param initialTime - Initial time for the timer in seconds
 * @returns Question timer state object
 */
declare function createDefaultQuestionTimer(initialTime?: number): QuestionTimer;
/**
 * Gets the timer state for a specific question, creating it if it doesn't exist
 * @param quizId - The quiz ID
 * @param questionId - The question ID
 * @returns Question timer state object
 */
declare function getQuestionTimer(quizId: string, questionId: string): QuestionTimer | null;
export { quizState, createDefaultQuestionTimer, getQuestionTimer };
