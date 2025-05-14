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
    theme?: string; // Theme of the question
    difficulte?: number; // Difficulty level
    niveau?: string | string[]; // Educational level(s)
    discipline?: string; // Subject or discipline

    // Additional fields needed by the backend
    question?: string;  // Alternative field for question text
    hidden?: boolean;   // Whether the question is hidden
    title?: string;     // Alternative title for the question
}
