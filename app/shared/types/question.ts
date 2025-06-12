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
    questionType: string; // Canonical field, matches DB and API
    answers: Answer[]; // CHANGED: Array of possible answers, now mandatory
    timeLimitSeconds?: number; // Time limit for the question in seconds (explicit unit)
    explanation?: string; // Renamed from explication - Explanation for the correct answer
    tags?: string[]; // ADDED: Tags for categorizing the question
    // Remove legacy 'type' field, use only 'questionType' for questions
}
