/**
 * Type Guards and Validation Utilities
 *
 * This file contains type guards and validation utilities to ensure
 * runtime type safety when working with shared types.
 */
import { BaseQuestion, Question } from '../core/question';
/**
 * Type guard for BaseQuestion objects
 */
export declare function isBaseQuestion(value: unknown): value is BaseQuestion;
/**
 * Type guard for Question objects
 */
export declare function isQuestion(value: unknown): value is Question;
/**
 * Safely get the text from a question object (handles different property names)
 */
export declare function getQuestionText(question: BaseQuestion | Question): string;
/**
 * Safely get the answers from a question object (handles different property names)
 */
export declare function getQuestionAnswers(question: Question): string[];
