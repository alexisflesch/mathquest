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
    correct: boolean;
}
/**
 * Question structure with common fields across frontend and backend
 */
export interface Question {
    uid: string;
    texte?: string;
    question?: string;
    type?: string;
    temps?: number;
    reponses?: Answer[];
    answers?: Answer[];
    correct?: boolean | number[];
    theme?: string;
    difficulte?: number;
    niveau?: string | string[];
    discipline?: string;
    explication?: string;
    image_url?: string;
    hidden?: boolean;
    title?: string;
    titre?: string;
    tags?: string[];
    auteur?: string;
}
