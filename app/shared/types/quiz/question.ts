/**
 * Shared Question Types
 * 
 * These types represent the core question structure used across both frontend and backend.
 */

/**
 * Answer type for questions
 */
export interface Answer {
    texte: string;
    correct: boolean; // Changed from correct?: boolean to make it mandatory
}

/**
 * Question structure with common fields across frontend and backend
 */
export interface Question {
    uid: string;
    texte?: string;      // Backend primarily uses this
    question?: string;   // Frontend primarily uses this
    type?: string;
    temps?: number;      // Time in seconds
    reponses?: Answer[]; // Backend primarily uses this
    answers?: Answer[];  // Alternative field name sometimes used
    correct?: boolean | number[];
    theme?: string;
    difficulte?: number;
    niveau?: string | string[];
    discipline?: string;
    explication?: string;
    image_url?: string;
    hidden?: boolean;
    title?: string;      // Frontend sometimes uses titre instead
    titre?: string;      // Optional title
    tags?: string[];
    auteur?: string;
}
