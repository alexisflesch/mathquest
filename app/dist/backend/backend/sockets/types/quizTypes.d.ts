/**
 * TypeScript definitions for Quiz-related data structures
 * Now using shared types from shared/types
 */
import { Question as BaseQuestion, Answer as BaseAnswer, QuestionTimer as BaseQuestionTimer, Chrono as BaseChrono, ExtendedQuizState as BaseQuizState } from '@shared/types';
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
    [key: string]: QuizState;
    wrapWithLogger?: any;
}
