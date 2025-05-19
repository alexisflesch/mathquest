/**
 * Type Guards and Validation Utilities
 *
 * This file contains type guards and validation utilities to ensure
 * runtime type safety when working with shared types.
 */
// When importing from outside the shared/types package (e.g., in frontend or backend):
// import { BaseQuestion, Answer, Question } from '@shared/types';
/**
 * Type guard for Answer objects
 */
export function isAnswer(value) {
    return (!!value &&
        typeof value === 'object' &&
        'text' in value &&
        typeof value.text === 'string' &&
        'correct' in value &&
        typeof value.correct === 'boolean');
}
/**
 * Type guard for BaseQuestion objects
 */
export function isBaseQuestion(value) {
    return (!!value &&
        typeof value === 'object' &&
        'uid' in value &&
        typeof value.uid === 'string' &&
        'text' in value &&
        typeof value.text === 'string' &&
        'type' in value &&
        typeof value.type === 'string');
}
/**
 * Type guard for Question objects
 */
export function isQuestion(value) {
    return isBaseQuestion(value);
}
/**
 * Validates an array of answers
 */
export function validateAnswers(answers) {
    return answers.filter(isAnswer);
}
/**
 * Safely get the text from a question object (handles different property names)
 */
export function getQuestionText(question) {
    if ('question' in question && typeof question.question === 'string') {
        return question.question;
    }
    return question.text;
}
/**
 * Safely get the answers from a question object (handles different property names)
 */
export function getQuestionAnswers(question) {
    if ('responses' in question && Array.isArray(question.answers)) {
        return question.answers;
    }
    if ('answers' in question && Array.isArray(question.answers)) { // Keep 'answers' for QuestionLike compatibility
        return question.answers;
    }
    return [];
}
