/**
 * Practice Session API Types
 *
 * Defines API request/response types for practice mode endpoints.
 * These complement the socket events for stateless HTTP operations.
 */
import { PracticeSession, PracticeSettings, PracticeSessionStatus } from './session';
/**
 * API Request Types
 */
/** Request to create a new practice session */
export interface CreatePracticeSessionApiRequest {
    /** User ID who will participate */
    userId: string;
    /** Practice session configuration */
    settings: PracticeSettings;
}
/** Request to get practice sessions for a user */
export interface GetPracticeSessionsApiRequest {
    /** User ID to get sessions for */
    userId: string;
    /** Optional status filter */
    status?: PracticeSessionStatus;
    /** Maximum number of sessions to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}
/** Request to update practice session settings */
export interface UpdatePracticeSessionApiRequest {
    /** Session ID to update */
    sessionId: string;
    /** Updated settings */
    settings: Partial<PracticeSettings>;
}
/**
 * API Response Types
 */
/** Response for practice session creation */
export interface CreatePracticeSessionApiResponse {
    /** Success indicator */
    success: boolean;
    /** Created session data */
    session?: PracticeSession;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/** Response for getting a single practice session */
export interface GetPracticeSessionApiResponse {
    /** Success indicator */
    success: boolean;
    /** Session data */
    session?: PracticeSession;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/** Response for getting multiple practice sessions */
export interface GetPracticeSessionsApiResponse {
    /** Success indicator */
    success: boolean;
    /** Array of sessions */
    sessions?: PracticeSession[];
    /** Pagination information */
    pagination?: {
        /** Total number of sessions */
        total: number;
        /** Current page */
        page: number;
        /** Page size */
        pageSize: number;
        /** Total pages */
        totalPages: number;
    };
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/** Response for practice session updates */
export interface UpdatePracticeSessionApiResponse {
    /** Success indicator */
    success: boolean;
    /** Updated session data */
    session?: PracticeSession;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/** Response for practice session deletion */
export interface DeletePracticeSessionApiResponse {
    /** Success indicator */
    success: boolean;
    /** Confirmation message */
    message?: string;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/**
 * Practice Analytics Types
 */
/** Request for practice analytics */
export interface GetPracticeAnalyticsApiRequest {
    /** User ID to get analytics for */
    userId: string;
    /** Date range start */
    startDate?: Date;
    /** Date range end */
    endDate?: Date;
    /** Filter by grade level */
    gradeLevel?: string;
    /** Filter by discipline */
    discipline?: string;
}
/** Practice performance analytics */
export interface PracticeAnalytics {
    /** User ID */
    userId: string;
    /** Total sessions completed */
    totalSessions: number;
    /** Total questions answered */
    totalQuestions: number;
    /** Overall accuracy percentage */
    overallAccuracy: number;
    /** Average session duration in minutes */
    averageSessionDuration: number;
    /** Performance by grade level */
    performanceByGradeLevel: {
        gradeLevel: string;
        accuracy: number;
        questionsAnswered: number;
    }[];
    /** Performance by discipline */
    performanceByDiscipline: {
        discipline: string;
        accuracy: number;
        questionsAnswered: number;
    }[];
    /** Performance trends over time */
    performanceTrends: {
        date: string;
        accuracy: number;
        questionsAnswered: number;
    }[];
    /** Most challenging topics */
    challengingTopics: {
        theme: string;
        accuracy: number;
        questionsAnswered: number;
    }[];
}
/** Response for practice analytics */
export interface GetPracticeAnalyticsApiResponse {
    /** Success indicator */
    success: boolean;
    /** Analytics data */
    analytics?: PracticeAnalytics;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/**
 * Practice Question Pool Types
 */
/** Request to get available questions for practice */
export interface GetPracticeQuestionsApiRequest {
    /** Grade level filter */
    gradeLevel: string;
    /** Discipline filter */
    discipline: string;
    /** Theme filters */
    themes?: string[];
    /** Maximum number of questions */
    limit?: number;
    /** Exclude specific question UIDs */
    excludeQuestions?: string[];
}
/** Response for practice questions */
export interface GetPracticeQuestionsApiResponse {
    /** Success indicator */
    success: boolean;
    /** Available question UIDs */
    questionUids?: string[];
    /** Total questions available */
    totalAvailable?: number;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}
/**
 * Error Response Types
 */
/** Standard error response for practice API endpoints */
export interface PracticeApiErrorResponse {
    /** Success indicator (always false for errors) */
    success: false;
    /** Error message */
    error: string;
    /** Error code for programmatic handling */
    errorCode?: string;
    /** Additional error details */
    details?: any;
    /** HTTP status code */
    statusCode: number;
}
