/**
 * Dashboard Socket Event Payloads
 *
 * Consolidated dashboard-specific payload types to eliminate duplicates
 * between backend and frontend implementations.
 */
import type { GameTimerState } from '../core/timer';
import type { Question } from '../core/question';
/**
 * Base interface for payloads that identify a game instance
 * Provides either gameId (preferred) or accessCode (legacy) for game identification
 */
export interface GameIdentificationPayload {
    /** Database ID of the game instance (preferred) */
    gameId?: string;
    /** Access code of the game (legacy support) */
    accessCode?: string;
}
/**
 * Payload for joining teacher dashboard
 */
export interface JoinDashboardPayload extends GameIdentificationPayload {
}
/**
 * Payload for starting a timer (semantically distinct from pausing)
 */
export interface StartTimerPayload extends GameIdentificationPayload {
    /** Duration in seconds to set for the timer */
    duration: number;
}
/**
 * Payload for pausing a timer (semantically distinct from joining dashboard)
 */
export interface PauseTimerPayload extends GameIdentificationPayload {
}
/**
 * Consolidated SetQuestionPayload with consistent naming
 */
export interface SetQuestionPayload {
    accessCode: string;
    questionUid: string;
    questionIndex?: number;
}
/**
 * Payload for locking/unlocking answers
 */
export interface LockAnswersPayload {
    gameId: string;
    lock: boolean;
}
/**
 * Payload for ending a game
 */
export interface EndGamePayload {
    accessCode: string;
}
/**
 * Dashboard question changed notification
 */
export interface DashboardQuestionChangedPayload {
    questionUid: string;
    oldQuestionUid: string | null;
    timer?: GameTimerState;
}
/**
 * Dashboard timer update notification
 */
export interface DashboardTimerUpdatedPayload {
    timer: GameTimerState;
    questionUid: string;
    questionIndex: number;
    totalQuestions: number;
    answersLocked: boolean;
    /** Backend timestamp at emission (ms since epoch, UTC) for sync */
    serverTime: number;
}
/**
 * Dashboard answers lock status changed
 */
export interface DashboardAnswersLockChangedPayload {
    answersLocked: boolean;
}
/**
 * Dashboard game status changed
 */
export interface DashboardGameStatusChangedPayload {
    status: 'pending' | 'active' | 'paused' | 'completed';
    ended?: boolean;
}
/**
 * Dashboard participant count update
 */
export interface DashboardParticipantUpdatePayload {
    participantCount: number;
}
/**
 * Dashboard answer statistics update
 */
export interface DashboardAnswerStatsUpdatePayload {
    questionUid: string;
    stats: Record<string, number> | {
        type: 'multipleChoice';
        stats: Record<string, number>;
        totalUsers: number;
    } | {
        type: 'numeric';
        values: number[];
        totalAnswers: number;
    };
}
/**
 * Dashboard joined confirmation
 */
export interface DashboardJoinedPayload {
    gameId: string;
    success: boolean;
    /**
     * Map of questionUid to boolean indicating if correct answers have been shown (terminated)
     */
    terminatedQuestions: Record<string, boolean>;
}
/**
 * Connected count payload (for quiz_connected_count event)
 */
export interface ConnectedCountPayload {
    count: number;
}
/**
 * NEW: Teacher-triggered correct answers display
 * For the trophy button functionality
 */
export interface ShowCorrectAnswersPayload {
    gameId?: string;
    accessCode?: string;
    teacherId?: string;
    show: boolean;
    /**
     * Map of questionUid to boolean indicating if correct answers have been shown (terminated)
     */
    terminatedQuestions: Record<string, boolean>;
}
/**
 * NEW: Teacher-triggered projection stats toggle
 * For the bar graph button functionality
 */
export interface ToggleProjectionStatsPayload {
    gameId?: string;
    accessCode?: string;
    show: boolean;
    teacherId?: string;
}
/**
 * Question data optimized for dashboard display (with teacher-only fields)
 */
export interface QuestionForDashboard extends Question {
}
/**
 * Comprehensive game control state for dashboard
 */
export interface GameControlStatePayload {
    gameId: string;
    accessCode: string;
    templateName: string;
    gameInstanceName: string;
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionUid: string | null;
    questions: QuestionForDashboard[];
    timer: GameTimerState;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number>;
}
