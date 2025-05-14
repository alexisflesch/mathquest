/**
 * Type Guards and Validation Utilities
 *
 * This file contains type guards and validation utilities to ensure
 * runtime type safety when working with shared types.
 */
import { BaseQuestion, Answer, Question } from '../index';
/**
 * Type guard for Answer objects
 */
export declare function isAnswer(value: unknown): value is Answer;
/**
 * Type guard for BaseQuestion objects
 */
export declare function isBaseQuestion(value: unknown): value is BaseQuestion;
/**
 * Type guard for Question objects
 */
export declare function isQuestion(value: unknown): value is Question;
/**
 * Validates an array of answers
 */
export declare function validateAnswers(answers: unknown[]): Answer[];
/**
 * Safely get the text from a question object (handles different property names)
 */
export declare function getQuestionText(question: BaseQuestion | Question): string;
/**
 * Safely get the answers from a question object (handles different property names)
 */
export declare function getQuestionAnswers(question: Question): Answer[];
