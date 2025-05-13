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
    uid: string;
    texte: string;
    type: string;
    reponses?: Answer[];
    temps?: number;
    explication?: string;
}
