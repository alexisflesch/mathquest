/**
 * Core Answer Types
 *
 * Consolidated answer-related type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical answer types
 * that should be used throughout the application.
 */
/**
 * Base answer interface
 * Core properties for any answer submission
 */
export interface BaseAnswer {
    /** Question identifier */
    questionUid: string;
    /** Answer value (flexible to support different question types) */
    value: any;
    /** Time spent on question in milliseconds */
    timeSpent: number;
    /** Timestamp when answer was submitted */
    timestamp: number;
}
/**
 * Game answer interface
 * Extended answer for game sessions with scoring
 */
export interface GameAnswer extends BaseAnswer {
    /** User who submitted the answer */
    userId: string;
    /** Game session identifier */
    accessCode?: string;
    /** Whether the answer is correct */
    isCorrect?: boolean;
    /** Score awarded for this answer */
    score?: number;
    /** Client-side timestamp */
    clientTimestamp?: number;
}
/**
 * Tournament answer interface
 * Comprehensive answer data for tournament context
 */
export interface TournamentAnswer {
    /** Question UID */
    questionUid?: string;
    /** Selected answer index or indices */
    answerIdx?: number | number[];
    /** Answer value */
    value?: any;
    /** Server timestamp */
    timestamp?: number;
    /** Client timestamp */
    clientTimestamp?: number;
    /** Score awarded */
    score?: number;
    /** Time penalty applied */
    timePenalty?: number;
    /** Base score before penalties */
    baseScore?: number;
    /** Time spent in milliseconds */
    timeMs?: number;
    /** Whether answer is correct */
    isCorrect?: boolean;
}
/**
 * Answer submission payload interface
 * Used for socket events when submitting answers
 */
export interface AnswerSubmissionPayload {
    /** Game access code */
    accessCode: string;
    /** User ID submitting answer */
    userId: string;
    /** Question UID being answered */
    questionUid: string;
    /** Answer value */
    answer: any;
    /** Time spent on question */
    timeSpent: number;
}
/**
 * Answer response payload interface
 * Server response after processing an answer
 */
export interface AnswerResponsePayload {
    /** Question that was answered */
    questionUid: string;
    /** Time spent on question */
    timeSpent: number;
    /** Whether answer was correct */
    correct?: boolean;
    /** Correct answer options (for multi-choice) */
    correctAnswers?: boolean[];
    /** Explanation text */
    explanation?: string;
    /** Score awarded */
    score?: number;
}
/**
 * Answer result interface
 * Comprehensive answer result with all computed data
 */
export interface AnswerResult {
    /** Original answer submission */
    answer: GameAnswer;
    /** Whether answer is correct */
    isCorrect: boolean;
    /** Score awarded */
    score: number;
    /** Time penalty applied */
    timePenalty?: number;
    /** Feedback message */
    feedback?: string;
    /** Explanation text */
    explanation?: string;
}
/**
 * Answer statistics interface
 * Aggregated statistics for answer analysis
 */
export interface AnswerStats {
    /** Total answers submitted */
    totalAnswers: number;
    /** Number of correct answers */
    correctAnswers: number;
    /** Average time spent per answer */
    averageTime: number;
    /** Answer accuracy percentage */
    accuracy: number;
    /** Distribution of answer choices */
    answerDistribution?: Record<string, number>;
}
/**
 * Question answer summary interface
 * Summary of all answers for a specific question
 */
export interface QuestionAnswerSummary {
    /** Question identifier */
    questionUid: string;
    /** All answers for this question */
    answers: GameAnswer[];
    /** Answer statistics */
    stats: AnswerStats;
    /** Correct answer indices */
    correctAnswers: boolean[];
}
/**
 * @deprecated Use AnswerSubmissionPayload instead
 */
export interface GameAnswerPayload {
    accessCode: string;
    userId: string;
    questionUid: string;
    answer: any;
    timeSpent: number;
}
