/**
 * TypeScript definitions for Quiz-related data structures
 * Now using shared types from shared/types
 */

import {
    Question as BaseQuestion,
    Answer as BaseAnswer,
    QuestionTimer as BaseQuestionTimer,
    Chrono as BaseChrono,
    ExtendedQuizState as BaseQuizState
} from '@shared/types';

// Re-export shared types
export type QuestionTimer = BaseQuestionTimer;
export type Answer = BaseAnswer;
export type Question = BaseQuestion;
export type Chrono = BaseChrono;

/**
 * Re-export the extended QuizState from shared types
 */
export type QuizState = BaseQuizState;

/**
 * Global quiz state container
 * Note: We're using a hybrid approach to handle the wrapWithLogger function
 */
export interface QuizStateContainer {
    // Use symbol as key for the wrapWithLogger function to avoid collision with string indexer
    [key: string]: QuizState;
    // Need to use any here to work around TypeScript's constraint that
    // all properties must conform to the index signature
    wrapWithLogger?: any;
}
