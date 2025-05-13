/**
 * Frontend type definitions - now using shared types where possible
 */
import {
    BaseQuizState,
    Question as BaseQuestion,
    Answer, // Keep this import as it's used for Response alias
    Logger as BaseLogger
} from '@shared/types';

// Re-export shared types
export type { Answer } from '@shared/types'; // Ensured "export type" is used

// Frontend-specific Response type (alias for Answer for backward compatibility)
export type Response = Answer;

// Frontend-specific Question extensions
export interface Question extends BaseQuestion {
    // Ensure frontend expected properties are required
    question: string;
    reponses: Response[];
}

// Frontend-specific QuizState extensions
export interface QuizState extends BaseQuizState {
    // Ensure frontend expected properties are defined
    currentQuestionIdx: number | null;
    stats: Record<string, unknown>;
    // Frontend uses a slightly different chrono structure
    chrono: { timeLeft: number | null; running: boolean };
}

/**
 * Re-export the shared Logger interface
 */
export type Logger = BaseLogger;
