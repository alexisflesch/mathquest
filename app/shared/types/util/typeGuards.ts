/**
 * Type Guards and Validation Utilities
 * 
 * This file contains type guards and validation utilities to ensure
 * runtime type safety when working with shared types.
 */

// For internal imports within the shared/types package, use relative paths:
import { BaseQuestion, Answer, Question } from '../index';
// When importing from outside the shared/types package (e.g., in frontend or backend):
// import { BaseQuestion, Answer, Question } from '@shared/types';

/**
 * Type guard for Answer objects
 */
export function isAnswer(value: unknown): value is Answer {
    return (
        !!value &&
        typeof value === 'object' &&
        'texte' in value &&
        typeof (value as Answer).texte === 'string' &&
        'correct' in value &&
        typeof (value as Answer).correct === 'boolean'
    );
}

/**
 * Type guard for BaseQuestion objects
 */
export function isBaseQuestion(value: unknown): value is BaseQuestion {
    return (
        !!value &&
        typeof value === 'object' &&
        'uid' in value &&
        typeof (value as BaseQuestion).uid === 'string' &&
        'texte' in value &&
        typeof (value as BaseQuestion).texte === 'string' &&
        'type' in value &&
        typeof (value as BaseQuestion).type === 'string'
    );
}

/**
 * Type guard for Question objects
 */
export function isQuestion(value: unknown): value is Question {
    return isBaseQuestion(value);
}

/**
 * Validates an array of answers
 */
export function validateAnswers(answers: unknown[]): Answer[] {
    return answers.filter(isAnswer);
}

/**
 * Safely get the text from a question object (handles different property names)
 */
export function getQuestionText(question: BaseQuestion | Question): string {
    if ('question' in question && typeof question.question === 'string') {
        return question.question;
    }
    return question.texte;
}

/**
 * Safely get the answers from a question object (handles different property names)
 */
export function getQuestionAnswers(question: Question): Answer[] {
    if ('reponses' in question && Array.isArray(question.reponses)) {
        return question.reponses;
    }
    if ('answers' in question && Array.isArray(question.answers)) {
        return question.answers;
    }
    return [];
}
