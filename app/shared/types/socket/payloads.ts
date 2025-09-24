/**
 * Shared Socket Event Payload Types
 * 
 * These types represent the payload structures for socket.io events.
 */
// Using type imports to avoid runtime dependencies
import type { Server, Socket } from 'socket.io';
import type { TimerActionPayload } from '../core/timer';

/**
 * Tournament events payloads
 */
export interface StartTournamentPayload {
    code: string;
    teacherId: string;
}

/**
 * Quiz/Teacher Control Payloads
 * Note: SetQuestionPayload and other dashboard payloads are now in ./dashboardPayloads.ts
 */

export interface SetTimerPayload {
    gameId: string;
    time: number;
    questionUid?: string;
}

export interface UpdateTournamentCodePayload {
    gameId: string;
    newCode: string;
}

// Canonical alias: use only TimerActionPayload everywhere
export type QuizTimerActionPayload = TimerActionPayload;

/**
 * Game end result payload
 */
export interface GameEndedPayload {
    accessCode: string;
    endedAt?: string;
    score?: number;
    totalQuestions?: number;
    correct?: number;
    total?: number;
}

// Re-export dashboard payloads
export * from './dashboardPayloads';

// Re-export for backward compatibility
export type {
    GameIdentificationPayload,
    JoinDashboardPayload,
    LockAnswersPayload,
    EndGamePayload,
    DashboardQuestionChangedPayload,
    DashboardTimerUpdatedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    DashboardAnswerStatsUpdatePayload,
    DashboardJoinedPayload,
    ConnectedCountPayload,
    QuestionForDashboard,
    GameControlStatePayload,
    ShowCorrectAnswersPayload,
    ToggleProjectionStatsPayload
} from './dashboardPayloads';

// [MODERNIZATION] Canonical type import for projection_show_stats event
export type { ProjectionShowStatsPayload } from './projectionShowStats';
