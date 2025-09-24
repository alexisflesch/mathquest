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
export * from './dashboardPayloads';
export type { GameIdentificationPayload, JoinDashboardPayload, LockAnswersPayload, EndGamePayload, DashboardQuestionChangedPayload, DashboardTimerUpdatedPayload, DashboardAnswersLockChangedPayload, DashboardGameStatusChangedPayload, DashboardAnswerStatsUpdatePayload, DashboardJoinedPayload, ConnectedCountPayload, QuestionForDashboard, GameControlStatePayload, ShowCorrectAnswersPayload, ToggleProjectionStatsPayload } from './dashboardPayloads';
export type { ProjectionShowStatsPayload } from './projectionShowStats';
