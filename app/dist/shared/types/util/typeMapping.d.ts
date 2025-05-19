/**
 * Type Mapping Utilities
 *
 * This file contains utilities for mapping between different structures
 * of similar types, helping to handle inconsistencies between frontend
 * and backend representations of the same entities.
 */
import { Question } from '../quiz/question';
import { BaseQuestion, Answer } from '../question';
export interface QuestionLike {
    id?: string;
    uid?: string;
    text?: string;
    type?: string;
    responses?: Array<AnswerLike>;
    time?: number;
    explanation?: string;
    theme?: string;
    discipline?: string;
    difficulty?: number;
    level?: string | string[];
    correct?: boolean | number[];
    hidden?: boolean;
    title?: string;
}
export interface AnswerLike {
    text?: string;
    correct?: boolean;
}
/**
 * Maps a question-like object to a standard Question object,
 * handling property name inconsistencies
 */
export declare function mapToStandardQuestion(input: QuestionLike): Question;
/**
 * Maps an answer-like object to a standard Answer object
 */
export declare function mapToStandardAnswer(input: AnswerLike): Answer;
/**
 * Creates a deep clone of a question object
 */
export declare function cloneQuestion<T extends BaseQuestion>(question: T): T;
