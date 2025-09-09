/**
 * Practice Session Socket Events
 *
 * Defines socket event types and payloads for practice mode functionality.
 * These events are completely separate from game events to ensure clean
 * architecture and prevent mixing of concerns.
 */
import { PracticeSession, PracticeQuestionData, PracticeSettings } from './session';
/**
 * Practice-specific socket event names
 * Using PRACTICE_ prefix to distinguish from game events
 */
export declare const PRACTICE_EVENTS: {
    readonly START_PRACTICE_SESSION: "START_PRACTICE_SESSION";
    readonly SUBMIT_PRACTICE_ANSWER: "SUBMIT_PRACTICE_ANSWER";
    readonly REQUEST_PRACTICE_FEEDBACK: "REQUEST_PRACTICE_FEEDBACK";
    readonly GET_NEXT_PRACTICE_QUESTION: "GET_NEXT_PRACTICE_QUESTION";
    readonly RETRY_PRACTICE_QUESTION: "RETRY_PRACTICE_QUESTION";
    readonly END_PRACTICE_SESSION: "END_PRACTICE_SESSION";
    readonly GET_PRACTICE_SESSION_STATE: "GET_PRACTICE_SESSION_STATE";
    readonly PRACTICE_SESSION_CREATED: "PRACTICE_SESSION_CREATED";
    readonly PRACTICE_QUESTION_READY: "PRACTICE_QUESTION_READY";
    readonly PRACTICE_ANSWER_SUBMITTED: "PRACTICE_ANSWER_SUBMITTED";
    readonly PRACTICE_ANSWER_FEEDBACK: "PRACTICE_ANSWER_FEEDBACK";
    readonly PRACTICE_SESSION_COMPLETED: "PRACTICE_SESSION_COMPLETED";
    readonly PRACTICE_SESSION_ERROR: "PRACTICE_SESSION_ERROR";
    readonly PRACTICE_SESSION_STATE: "PRACTICE_SESSION_STATE";
};
/**
 * Client to Server Event Payloads
 */
/** Payload for starting a new practice session */
export interface StartPracticeSessionPayload {
    /** User identifier */
    userId: string;
    /** Practice session settings */
    settings: PracticeSettings;
    /** Optional session preferences */
    preferences?: {
        /** Preferred session duration in minutes */
        maxDurationMinutes?: number;
        /** Whether to shuffle questions */
        shuffleQuestions?: boolean;
    };
}
/** Payload for submitting an answer in practice mode */
export interface SubmitPracticeAnswerPayload {
    /** Session identifier */
    sessionId: string;
    /** Question being answered */
    questionUid: string;
    /** Selected answer indices */
    selectedAnswers: number[];
    /** Time spent on this question in milliseconds */
    timeSpentMs: number;
}
/** Payload for requesting the next question */
export interface GetNextPracticeQuestionPayload {
    /** Session identifier */
    sessionId: string;
    /** Whether to skip the current question */
    skipCurrent?: boolean;
}
/** Payload for retrying a question */
export interface RetryPracticeQuestionPayload {
    /** Session identifier */
    sessionId: string;
    /** Question to retry */
    questionUid: string;
}
/** Payload for ending a practice session */
export interface EndPracticeSessionPayload {
    /** Session identifier */
    sessionId: string;
    /** Reason for ending */
    reason: 'completed' | 'user_quit' | 'timeout';
}
/** Payload for getting current session state */
export interface GetPracticeSessionStatePayload {
    /** Session identifier */
    sessionId: string;
}
/** Payload for requesting feedback on submitted answer */
export interface RequestPracticeFeedbackPayload {
    /** Session identifier */
    sessionId: string;
    /** Question that was answered */
    questionUid: string;
}
/**
 * Server to Client Event Payloads
 */
/** Response when practice session is created */
export interface PracticeSessionCreatedPayload {
    /** Success indicator */
    success: boolean;
    /** Created session data */
    session?: PracticeSession;
    /** Error message if failed */
    error?: string;
    /** Additional context */
    message?: string;
}
/** Response when practice question is ready */
export interface PracticeQuestionReadyPayload {
    /** Session identifier */
    sessionId: string;
    /** Question data */
    question: PracticeQuestionData;
    /** Current progress */
    progress: {
        /** Current question number (1-based) */
        currentQuestionNumber: number;
        /** Total questions in session */
        totalQuestions: number;
        /** Questions remaining */
        questionsRemaining: number;
    };
    /** Whether this is a retry of a previous question */
    isRetry: boolean;
}
/** Response with feedback after answer submission */
export interface PracticeAnswerFeedbackPayload {
    /** Session identifier */
    sessionId: string;
    /** Question that was answered */
    questionUid: string;
    /** Whether the answer was correct */
    isCorrect: boolean;
    /** Correct answer flags for each answer option (for multiple choice) */
    correctAnswers: boolean[];
    /** Numeric question correct answer data (for numeric questions) */
    numericCorrectAnswer?: {
        correctAnswer: number;
        tolerance?: number;
    };
    /** Optional explanation */
    explanation?: string;
    /** Whether retry is allowed for this question */
    canRetry: boolean;
    /** Current session statistics */
    statistics: {
        /** Questions answered so far */
        questionsAnswered: number;
        /** Correct answers count */
        correctCount: number;
        /** Current accuracy percentage */
        accuracyPercentage: number;
    };
}
/** Response when practice session is completed */
export interface PracticeSessionCompletedPayload {
    /** Session identifier */
    sessionId: string;
    /** Final session data */
    session: PracticeSession;
    /** Performance summary */
    summary: {
        /** Total questions attempted */
        totalQuestions: number;
        /** Correct answers */
        correctAnswers: number;
        /** Final accuracy percentage */
        finalAccuracy: number;
        /** Total time spent in session */
        totalTimeSpent: number;
        /** Average time per question */
        averageTimePerQuestion: number;
    };
    /** Achievement/completion message */
    completionMessage: string;
}
/** Response for practice session errors */
export interface PracticeSessionErrorPayload {
    /** Session identifier (if available) */
    sessionId?: string;
    /** Error type */
    errorType: 'session_not_found' | 'session_expired' | 'invalid_answer' | 'question_not_found' | 'server_error';
    /** Error message */
    message: string;
    /** Additional error details */
    details?: any;
}
/** Response with current session state */
export interface PracticeSessionStatePayload {
    /** Session identifier */
    sessionId: string;
    /** Current session data */
    session: PracticeSession;
    /** Success indicator */
    success: boolean;
    /** Error message if failed */
    error?: string;
}
/** Response when answer is submitted (without feedback) */
export interface PracticeAnswerSubmittedPayload {
    /** Session identifier */
    sessionId: string;
    /** Question that was answered */
    questionUid: string;
    /** Selected answer indices */
    selectedAnswers: number[];
    /** Confirmation message */
    message: string;
}
/**
 * Practice Socket Event Map
 * Maps event names to their payload types for type safety
 */
export interface PracticeClientToServerEvents {
    [PRACTICE_EVENTS.START_PRACTICE_SESSION]: (payload: StartPracticeSessionPayload) => void;
    [PRACTICE_EVENTS.SUBMIT_PRACTICE_ANSWER]: (payload: SubmitPracticeAnswerPayload) => void;
    [PRACTICE_EVENTS.REQUEST_PRACTICE_FEEDBACK]: (payload: RequestPracticeFeedbackPayload) => void;
    [PRACTICE_EVENTS.GET_NEXT_PRACTICE_QUESTION]: (payload: GetNextPracticeQuestionPayload) => void;
    [PRACTICE_EVENTS.RETRY_PRACTICE_QUESTION]: (payload: RetryPracticeQuestionPayload) => void;
    [PRACTICE_EVENTS.END_PRACTICE_SESSION]: (payload: EndPracticeSessionPayload) => void;
    [PRACTICE_EVENTS.GET_PRACTICE_SESSION_STATE]: (payload: GetPracticeSessionStatePayload) => void;
}
export interface PracticeServerToClientEvents {
    [PRACTICE_EVENTS.PRACTICE_SESSION_CREATED]: (payload: PracticeSessionCreatedPayload) => void;
    [PRACTICE_EVENTS.PRACTICE_QUESTION_READY]: (payload: PracticeQuestionReadyPayload) => void;
    [PRACTICE_EVENTS.PRACTICE_ANSWER_SUBMITTED]: (payload: PracticeAnswerSubmittedPayload) => void;
    [PRACTICE_EVENTS.PRACTICE_ANSWER_FEEDBACK]: (payload: PracticeAnswerFeedbackPayload) => void;
    [PRACTICE_EVENTS.PRACTICE_SESSION_COMPLETED]: (payload: PracticeSessionCompletedPayload) => void;
    [PRACTICE_EVENTS.PRACTICE_SESSION_ERROR]: (payload: PracticeSessionErrorPayload) => void;
    [PRACTICE_EVENTS.PRACTICE_SESSION_STATE]: (payload: PracticeSessionStatePayload) => void;
}
