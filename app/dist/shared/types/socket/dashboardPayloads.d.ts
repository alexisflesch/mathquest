/**
 * Dashboard Socket Event Payloads
 *
 * Consolidated dashboard-specific payload types to eliminate duplicates
 * between backend and frontend implementations.
 */
import type { GameTimerState } from '../core/timer';
import type { Question } from '../core/question';
/**
 * Payload for joining teacher dashboard
 */
export interface JoinDashboardPayload {
    gameId?: string;
    accessCode?: string;
}
/**
 * Consolidated SetQuestionPayload with consistent naming
 */
export interface SetQuestionPayload {
    gameId: string;
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
    gameId: string;
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
    questionUid?: string;
    gameId?: string;
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
    stats: Record<string, number>;
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
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionUid: string | null;
    questions: QuestionForDashboard[];
    timer: GameTimerState;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number>;
}
