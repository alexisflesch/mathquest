/**
 * Core Question Types
 * 
 * Consolidated question-related type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical question types
 * that should be used throughout the application.
 */

/**
 * Base question interface
 * Core properties shared across all question implementations
 */
export interface BaseQuestion {
    /** Unique question identifier */
    uid: string;
    /** Question title */
    title?: string;
    /** Question text/prompt */
    text: string;
    /** Question type classification */
    questionType: string;
    /** Canonical timer duration in milliseconds (required) */
    durationMs: number;
    /** Feedback wait time in milliseconds */
    feedbackWaitTime?: number | null;
}

/**
 * Extended question interface
 * Question with comprehensive metadata and content
 */
export interface Question extends BaseQuestion {
    /** Answer options for multiple choice questions */
    answerOptions: string[];
    /** Boolean array indicating correct answers */
    correctAnswers: boolean[];
    /** Educational grade level */
    gradeLevel?: string;
    /** Subject/discipline */
    discipline?: string;
    /** Question themes */
    themes?: string[];
    /** Question tags */
    tags?: string[];
    /** Difficulty level (1-5) */
    difficulty?: number;
    /** Question explanation */
    explanation?: string;
    /** Question author */
    author?: string;
    /** Array of play modes this question is excluded from */
    excludedFrom?: string[];
    /** Creation timestamp */
    createdAt?: Date;
    /** Last update timestamp */
    updatedAt?: Date;
}

/**
 * Question for client display
 * Question data optimized for frontend rendering
 */
export interface ClientQuestion extends BaseQuestion {
    /** Answer options */
    answerOptions: string[];
    /** Correct answers (may be hidden for students) */
    correctAnswers: boolean[];
    /** Current question index in sequence */
    currentQuestionIndex?: number;
    /** Total questions in sequence */
    totalQuestions?: number;
    /** Display metadata */
    gradeLevel?: string;
    discipline?: string;
    themes?: string[];
    explanation?: string;
}

/**
 * Question creation payload
 * Data required to create a new question
 */
export interface QuestionCreationPayload {
    title?: string;
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    discipline: string;
    themes: string[];
    gradeLevel?: string;
    difficulty?: number;
    explanation?: string;
    tags?: string[];
    /** Canonical timer duration in milliseconds (required) */
    durationMs: number;
    author?: string;
    /** Array of play modes this question is excluded from */
    excludedFrom?: string[];
}

/**
 * Question update payload
 * Data for updating an existing question
 */
export interface QuestionUpdatePayload extends Partial<QuestionCreationPayload> {
    uid: string;
}
