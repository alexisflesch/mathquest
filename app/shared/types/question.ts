
/**
 * Answer type for questions
 */
export interface Answer {
    texte: string;
    correct: boolean;
}

/**
 * Base interface for questions shared between frontend and backend.
 */
export interface BaseQuestion {
    uid: string; // Unique identifier for the question
    texte: string; // Primary field for question text
    type: string; // Question type (e.g., choix_simple, choix_multiple)
    reponses?: Answer[]; // Array of possible answers
    temps?: number; // Time limit for the question in seconds
    explication?: string; // Explanation for the correct answer
}
