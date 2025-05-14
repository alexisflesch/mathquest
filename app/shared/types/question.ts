/**
 * Answer type for questions
 */
export interface Answer {
    text: string; // Renamed from texte
    correct: boolean;
}

/**
 * Base interface for questions shared between frontend and backend.
 */
export interface BaseQuestion {
    uid: string; // Unique identifier for the question
    text: string; // Renamed from texte - Primary field for question text
    type: string; // Question type (e.g., choix_simple, choix_multiple)
    answers: Answer[]; // CHANGED: Array of possible answers, now mandatory
    time?: number; // Renamed from temps - Time limit for the question in seconds
    explanation?: string; // Renamed from explication - Explanation for the correct answer
    tags?: string[]; // ADDED: Tags for categorizing the question
}
