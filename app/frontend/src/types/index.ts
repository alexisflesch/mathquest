/**
 * Frontend type definitions - now using shared types where possible
 */
import {
    BaseQuizState,
    Answer, // Keep this import as it's used for Response alias
    Logger as BaseLogger
} from '@shared/types';
import { BaseQuestion } from '@shared/types/question';

// Re-export shared types
export type { Answer } from '@shared/types'; // Ensured "export type" is used

// Frontend-specific Response type (alias for Answer for backward compatibility)
export type Response = Answer;

// Frontend-specific Question extensions
export interface Question extends BaseQuestion {
    question: string; // Frontend-specific field for question text
    reponses: Response[]; // Overrides BaseQuestion's reponses to use Response type
    tags?: string[]; // Tags for categorization and filtering
    theme?: string; // Theme of the question
    niveau?: string; // Academic level 
    discipline?: string; // Subject discipline
    titre?: string; // Title of the question
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
