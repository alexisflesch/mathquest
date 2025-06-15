/**
 * Practice Session Core Types
 * 
 * Defines the canonical types for practice mode functionality,
 * completely separate from game session types to ensure clean
 * architecture and single responsibility principle.
 */

/**
 * Practice session status enumeration
 * Represents the current state of a practice session
 */
export type PracticeSessionStatus = 'active' | 'completed' | 'abandoned';

/**
 * Practice session settings interface
 * Configuration for how the practice session behaves
 */
export interface PracticeSettings {
    /** Educational grade level for question selection */
    gradeLevel: string;
    /** Subject/discipline for question filtering */
    discipline: string;
    /** Question themes for content filtering */
    themes: string[];
    /** Number of questions in the session */
    questionCount: number;
    /** Whether to show immediate feedback after each answer */
    showImmediateFeedback: boolean;
    /** Whether to allow retrying incorrect answers */
    allowRetry: boolean;
    /** Whether to randomize question order */
    randomizeQuestions: boolean;
}

/**
 * Practice answer submission
 * Records user's answer to a practice question
 */
export interface PracticeAnswer {
    /** Unique identifier for the question */
    questionUid: string;
    /** Index of selected answer option(s) */
    selectedAnswers: number[];
    /** Whether the answer was correct */
    isCorrect: boolean;
    /** Timestamp when answer was submitted */
    submittedAt: Date;
    /** Time taken to answer in milliseconds */
    timeSpentMs: number;
    /** Number of attempts (for retry functionality) */
    attemptNumber: number;
}

/**
 * Practice question data
 * Question information sent to client during practice session
 */
export interface PracticeQuestionData {
    /** Unique question identifier */
    uid: string;
    /** Question title */
    title: string;
    /** Question text/prompt */
    text: string;
    /** Available answer options */
    answerOptions: string[];
    /** Question type classification */
    questionType: string;
    /** Time limit for this question in seconds (optional) */
    timeLimit?: number;
    /** Educational metadata */
    gradeLevel: string;
    discipline: string;
    themes: string[];
    /** Current question index in the session (0-based) */
    questionIndex?: number;
}

/**
 * Practice session statistics
 * Summary of performance during practice session
 */
export interface PracticeStatistics {
    /** Total questions attempted */
    questionsAttempted: number;
    /** Number of correct answers */
    correctAnswers: number;
    /** Number of incorrect answers */
    incorrectAnswers: number;
    /** Accuracy percentage (0-100) */
    accuracyPercentage: number;
    /** Average time per question in milliseconds */
    averageTimePerQuestion: number;
    /** Total time spent in session in milliseconds */
    totalTimeSpent: number;
    /** Questions that were retried */
    retriedQuestions: string[];
}

/**
 * Core practice session interface
 * Represents a complete practice learning session
 */
export interface PracticeSession {
    /** Unique session identifier */
    sessionId: string;
    /** User ID of the participant */
    userId: string;
    /** Session configuration */
    settings: PracticeSettings;
    /** Current status of the session */
    status: PracticeSessionStatus;
    /** Pool of question UIDs for this session */
    questionPool: string[];
    /** Index of current question in the pool */
    currentQuestionIndex: number;
    /** Current question data (if active) */
    currentQuestion?: PracticeQuestionData;
    /** All answers submitted during session */
    answers: PracticeAnswer[];
    /** Session performance statistics */
    statistics: PracticeStatistics;
    /** When the session was created */
    createdAt: Date;
    /** When the session was started (first question shown) */
    startedAt?: Date;
    /** When the session was completed */
    completedAt?: Date;
    /** Session expiration time */
    expiresAt: Date;
}

/**
 * Practice session creation request
 * Data required to create a new practice session
 */
export interface CreatePracticeSessionRequest {
    /** User ID who will participate in the session */
    userId: string;
    /** Session configuration settings */
    settings: PracticeSettings;
}

/**
 * Practice session creation response
 * Response when a practice session is successfully created
 */
export interface CreatePracticeSessionResponse {
    /** The created practice session */
    session: PracticeSession;
    /** Success indicator */
    success: boolean;
    /** Optional message */
    message?: string;
}

/**
 * Practice session state update
 * Used for updating session state during gameplay
 */
export interface PracticeSessionUpdate {
    /** Session identifier */
    sessionId: string;
    /** New status (optional) */
    status?: PracticeSessionStatus;
    /** Current question index (optional) */
    currentQuestionIndex?: number;
    /** Add new answer (optional) */
    newAnswer?: PracticeAnswer;
    /** Updated statistics (optional) */
    statistics?: Partial<PracticeStatistics>;
}
