import { BaseQuestion, Answer } from '../question';
/**
 * Shared Question Types
 *
 * These types represent the core question structure used across both frontend and backend.
 */
export type { Answer } from '../question';
/**
 * Question structure with common fields across frontend and backend
 */
export interface Question extends BaseQuestion {
    correct?: boolean | number[];
    themes?: string[];
    difficulty?: number;
    gradeLevel?: string;
    discipline?: string;
    question?: string;
    hidden?: boolean;
    title?: string;
    answerOptions?: string[];
    correctAnswers?: boolean[];
    answers: Answer[];
}
