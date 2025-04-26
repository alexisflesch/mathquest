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
