/**
 * Frontend type definitions - now using shared types where possible
 */
import {
    BaseQuizState,
    Logger as BaseLogger,
    Question as SharedQuestion // Import shared Question
} from '@shared/types';
// BaseQuestion is not directly used here anymore for defining a local Question.
// If it's needed for other local types, it can be re-added.
// import { BaseQuestion } from '@shared/types/question';

// Re-export shared types
export type { Question } from '@shared/types'; // Re-export the shared Question type

// Frontend-specific QuizState extensions
export interface QuizState extends BaseQuizState {
    // Ensure frontend expected properties are defined
    currentQuestionIdx: number | null;
    stats: Record<string, unknown>;
    // Frontend uses a slightly different chrono structure - REMOVED to use shared Chrono from BaseQuizState
    // chrono: { timeLeft: number | null; running: boolean };
}

/**
 * Re-export the shared Logger interface
 */
export type Logger = BaseLogger;
