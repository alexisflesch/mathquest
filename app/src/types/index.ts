// Shared response type for quiz questions
export interface Response {
    texte: string;
    correct: boolean;
}

// Base question type (extend as needed in specific files)
export interface Question {
    uid: string;
    question: string;
    reponses: Response[];
    temps?: number;
    type?: string;
    explication?: string;
    difficulte?: number;
    niveau?: string;
    auteur?: string;
    titre?: string;      // Optional title
    hidden?: boolean;    // Optional hidden flag
    tags?: string[];
    discipline?: string;
    theme?: string;
}

// Shared quiz state type
export interface QuizState {
    currentQuestionIdx: number | null;
    questions: Question[];
    chrono: { timeLeft: number | null; running: boolean };
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
}

/**
 * Shared Logger interface for server-side logging
 * 
 * This interface is used to provide consistent typing for the logger
 * created by the createLogger function from @logger.
 * Use this interface when importing the logger in API routes.
 */
export interface Logger {
    debug: (message: string, context?: unknown) => void;
    info: (message: string, context?: unknown) => void;
    warn: (message: string, context?: unknown) => void;
    error: (message: string, context?: unknown) => void;
}
