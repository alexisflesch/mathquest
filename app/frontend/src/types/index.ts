/**
 * Frontend type definitions - now using shared types where possible
 */
import {
    Logger as BaseLogger,
    Question as SharedQuestion // Import shared Question
} from '@shared/types';

// Re-export shared types directly
export type { Question, ExtendedQuizState as QuizState } from '@shared/types';

/**
 * Re-export the shared Logger interface
 */
export type Logger = BaseLogger;
