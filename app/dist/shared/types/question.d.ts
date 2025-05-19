/**
 * Answer type for questions
 */
export interface Answer {
    text: string;
    correct: boolean;
}
/**
 * Base interface for questions shared between frontend and backend.
 */
export interface BaseQuestion {
    uid: string;
    text: string;
    type: string;
    answers: Answer[];
    time?: number;
    explanation?: string;
    tags?: string[];
}
