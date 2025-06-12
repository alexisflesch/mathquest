/**
 * Frontend type definitions - now using shared types where possible
 */
import {
    ExtendedQuizState as SharedQuizState,
    Logger as BaseLogger,
    Question as SharedQuestion // Import shared Question
} from '@shared/types';

// Re-export shared types
export type { Question } from '@shared/types'; // Re-export the shared Question type

// Use shared ExtendedQuizState as frontend QuizState
export type QuizState = SharedQuizState & {
    // Add any frontend-specific properties if needed
    currentQuestionIdx?: number | null; // Alias for currentQuestionidx
    accessCode?: string; // Common property needed by frontend
};

/**
 * Re-export the shared Logger interface
 */
export type Logger = BaseLogger;
