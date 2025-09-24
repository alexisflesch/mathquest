"use strict";
/**
 * Shared Question Type Constants
 *
 * Centralized constants for question types used throughout the MathQuest application.
 * This eliminates hard-coded strings and ensures consistency across frontend, backend, and shared modules.
 *
 * Phase 3 of Frontend Modernization - June 13, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUESTION_TYPES = void 0;
/**
 * Canonical question type identifiers
 * These are the actual values used throughout the system and stored in the database
 */
exports.QUESTION_TYPES = {
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
};
