import { BaseQuestion, Answer } from '../question';

/**
 * Shared Question Types
 * 
 * These types represent the core question structure used across both frontend and backend.
 */

// Re-export Answer to make it available to importers of this file
export type { Answer } from '../question';

/**
 * Question structure with common fields across frontend and backend
 */
export interface Question extends BaseQuestion {
    correct?: boolean | number[]; // Indicates the correct answer(s)
    themes?: string[]; // Themes of the question (plural)
    difficulty?: number; // Difficulty level
    gradeLevel?: string; // Educational level (singular string)
    discipline?: string; // Subject or discipline

    // Additional fields needed by the backend
    question?: string;  // Alternative field for question text
    hidden?: boolean;   // Whether the question is hidden
    title?: string;     // Alternative title for the question

    // New fields for answer options and correct answers
    answerOptions?: string[]; // List of possible answers
    correctAnswers?: boolean[]; // List of booleans indicating correct answers

    // Timing fields used in frontend
    timeLimit?: number | null; // Time limit in seconds (nullable from database)
    feedbackWaitTime?: number | null; // Feedback wait time in milliseconds (nullable from database)
    time?: number; // Legacy field for compatibility

    // Frontend compatibility: answers array with text and correct properties
    answers: Answer[]; // Required for frontend compatibility
}
