/**
 * Type Guards and Validation Utilities
 * 
 * This file contains type guards and validation utilities to ensure
 * runtime type safety when working with shared types.
 */

// For internal imports within the shared/types package, use relative paths:
import { BaseQuestion, Question } from '../core/question';

/**
 * Type guard for BaseQuestion objects
 */
export function isBaseQuestion(value: unknown): value is BaseQuestion {
    return (
        !!value &&
        typeof value === 'object' &&
        'uid' in value &&
        typeof (value as BaseQuestion).uid === 'string' &&
        'text' in value &&
        typeof (value as BaseQuestion).text === 'string' &&
        'type' in value &&
        typeof ((value as unknown as BaseQuestion).questionType) === 'string'
    );
}

/**
 * Type guard for Question objects
 */
export function isQuestion(value: unknown): value is Question {
    return isBaseQuestion(value);
}

/**
 * Safely get the text from a question object (handles different property names)
 */
export function getQuestionText(question: BaseQuestion | Question): string {
    if ('question' in question && typeof question.question === 'string') {
        return question.question;
    }
    return (question as BaseQuestion).text;
}

/**
 * Safely get the answers from a question object (handles different property names)
 */
export function getQuestionAnswers(question: Question): string[] {
    // Use answerOptions as the canonical source for answers
    if (Array.isArray(question.answerOptions)) {
        return question.answerOptions;
    }
    // Fallback for legacy/alternative field names
    if ('answers' in question && Array.isArray((question as any).answers)) {
        return (question as any).answers;
    }
    return [];
}
