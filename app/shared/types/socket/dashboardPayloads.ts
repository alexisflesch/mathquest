/**
 * Dashboard Socket Event Payloads
 * 
 * Consolidated dashboard-specific payload types to eliminate duplicates
 * between backend and frontend implementations.
 */

import type { GameTimerState } from '../core/timer';
import type { Question } from '../core/question';

// ===== Dashboard Client-to-Server Event Payloads =====

/**
 * Payload for joining teacher dashboard
 */
export interface JoinDashboardPayload {
    gameId?: string;      // Database ID of the game instance
    accessCode?: string;  // Access code of the game (for backward compatibility)
}

/**
 * Consolidated SetQuestionPayload with consistent naming
 */
export interface SetQuestionPayload {
    gameId: string;          // Database ID of the game instance
    questionUid: string;     // UID of the question to show (consistent naming)
    questionIndex?: number;  // Index of the question (legacy support)
}

/**
 * Payload for locking/unlocking answers
 */
export interface LockAnswersPayload {
    gameId: string;      // Database ID of the game instance
    lock: boolean;       // Whether to lock or unlock answers
}

/**
 * Payload for ending a game
 */
export interface EndGamePayload {
    gameId: string;      // Database ID of the game instance
}

// ===== Dashboard Server-to-Client Event Payloads =====

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
    questionUid?: string;  // Associated question
    gameId?: string;       // Game context
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
    ended?: boolean;  // Additional flag for clarity
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
    stats: Record<string, number>; // Map of option id to count
}

/**
 * Dashboard joined confirmation
 */
export interface DashboardJoinedPayload {
    gameId: string;
    success: boolean;
}

/**
 * Connected count payload (for quiz_connected_count event)
 */
export interface ConnectedCountPayload {
    count: number;
}

// ===== Dashboard State Payloads =====

/**
 * Question data optimized for dashboard display (with teacher-only fields)
 */
export interface QuestionForDashboard extends Question {
    // Inherits all fields from core Question type
    // Dashboard can see correctAnswers and all metadata
}

/**
 * Comprehensive game control state for dashboard
 */
export interface GameControlStatePayload {
    gameId: string;
    accessCode: string;
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionUid: string | null;
    questions: QuestionForDashboard[];
    timer: GameTimerState;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number>;
}
