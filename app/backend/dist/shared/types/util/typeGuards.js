"use strict";
/**
 * Type Guards and Validation Utilities
 *
 * This file contains type guards and validation utilities to ensure
 * runtime type safety when working with shared types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBaseQuestion = isBaseQuestion;
exports.isQuestion = isQuestion;
exports.getQuestionText = getQuestionText;
exports.getQuestionAnswers = getQuestionAnswers;
/**
 * Type guard for BaseQuestion objects
 */
function isBaseQuestion(value) {
    return (!!value &&
        typeof value === 'object' &&
        'uid' in value &&
        typeof value.uid === 'string' &&
        'text' in value &&
        typeof value.text === 'string' &&
        'defaultMode' in value &&
        typeof (value.questionType) === 'string');
}
/**
 * Type guard for Question objects
 */
function isQuestion(value) {
    return isBaseQuestion(value);
}
/**
 * Safely get the text from a question object (handles different property names)
 */
function getQuestionText(question) {
    if ('question' in question && typeof question.question === 'string') {
        return question.question;
    }
    return question.text;
}
/**
 * Safely get the answers from a question object (handles different property names)
 */
function getQuestionAnswers(question) {
    // Use answerOptions as the canonical source for answers
    if (Array.isArray(question.answerOptions)) {
        return question.answerOptions;
    }
    // Fallback for legacy/alternative field names
    if ('answers' in question && Array.isArray(question.answers)) {
        return question.answers;
    }
    return [];
}
