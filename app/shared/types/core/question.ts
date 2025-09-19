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
 * Numeric question data
 * Type-specific data for numeric questions
 */
export interface NumericQuestionData {
    correctAnswer: number;
    tolerance?: number;
    unit?: string;
}

/**
 * Multiple choice question data
 * Type-specific data for multiple choice questions
 */
export interface MultipleChoiceQuestionData {
    answerOptions: string[];
    correctAnswers: boolean[];
}

/**
 * Polymorphic question interface
 * Question with type-specific data included
 */
export interface Question extends BaseQuestion {
    // Polymorphic data - only one will be populated
    multipleChoiceQuestion?: MultipleChoiceQuestionData;
    numericQuestion?: NumericQuestionData;

    // Legacy fields for backward compatibility
    answerOptions?: string[];
    correctAnswers?: boolean[];
}

/**
 * Question for client display
 * Question data optimized for frontend rendering
 */

/**
 * Question creation payload for multiple choice questions
 */
export interface MultipleChoiceQuestionCreationPayload extends BaseQuestion {
    questionType: 'multiple_choice' | 'single_choice' | 'multiple_choice_single_answer';
    answerOptions: string[];
    correctAnswers: boolean[];
}

/**
 * Question creation payload for numeric questions
 */
export interface NumericQuestionCreationPayload extends BaseQuestion {
    questionType: 'numeric';
    numericData: NumericQuestionData;
}

/**
 * Union type for question creation
 */
export type QuestionCreationPayload = MultipleChoiceQuestionCreationPayload | NumericQuestionCreationPayload;

/**
 * Question update payload
 * Data for updating an existing question
 */
export interface QuestionUpdatePayload extends Partial<Omit<BaseQuestion, 'uid'>> {
    uid: string;
    // Type-specific updates
    answerOptions?: string[];
    correctAnswers?: boolean[];
    numericData?: NumericQuestionData;
}
