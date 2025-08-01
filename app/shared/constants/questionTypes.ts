/**
 * Shared Question Type Constants
 * 
 * Centralized constants for question types used throughout the MathQuest application.
 * This eliminates hard-coded strings and ensures consistency across frontend, backend, and shared modules.
 * 
 * Phase 3 of Frontend Modernization - June 13, 2025
 */

/**
 * Canonical question type identifiers
 * These are the actual values used throughout the system and stored in the database
 */
export const QUESTION_TYPES = {
    /** Single choice question - canonical type */
    SINGLE_CHOICE: 'single_choice',

    /** Multiple choice question - canonical type */
    MULTIPLE_CHOICE: 'multiple_choice',

    /** Multiple choice with single answer - canonical type */
    MULTIPLE_CHOICE_SINGLE_ANSWER: 'multiple_choice_single_answer',

    /** Numeric question - new polymorphic type */
    NUMERIC: 'numeric',

    /** Multiple choice - alternative English form */
    MULTIPLE_CHOICE_EN: 'multiple_choice'
} as const;

/**
 * Type guard to check if a string is a valid question type
 */
export function isValidQuestionType(type: string): type is typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES] {
    return Object.values(QUESTION_TYPES).includes(type as any);
}

/**
 * Type-safe question type values
 */
export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

/**
 * Common timeout constants used throughout the application
 * Extracted from various hardcoded values found during audit
 */
export const TIMEOUT_CONSTANTS = {
    /** Default question timer (30 seconds) */
    DEFAULT_QUESTION_TIMER: 30000,

    /** Feedback display duration (3 seconds) */
    FEEDBACK_DISPLAY_DURATION: 3000,

    /** Socket reconnection delay (100ms) */
    SOCKET_RECONNECT_DELAY: 100,

    /** Game redirect timeout (3 seconds) */
    GAME_REDIRECT_TIMEOUT: 3000,

    /** Snackbar auto-hide duration (5 seconds) */
    SNACKBAR_DURATION: 5000
} as const;

/**
 * Type for timeout values
 */
export type TimeoutConstant = typeof TIMEOUT_CONSTANTS[keyof typeof TIMEOUT_CONSTANTS];
