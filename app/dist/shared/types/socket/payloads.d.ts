/**
 * Shared Socket Event Payload Types
 *
 * These types represent the payload structures for socket.io events.
 */
import type { Server, Socket } from 'socket.io';
import type { TimerActionPayload } from '../core/timer';
/**
 * Tournament events payloads
 */
export interface JoinTournamentPayload {
    code: string;
    username?: string;
    avatar?: string;
    isDeferred?: boolean;
    userId?: string;
    classId?: string;
    cookieId?: string;
}
export interface TournamentAnswerPayload {
    code: string;
    questionUid: string;
    answerIdx: number | number[];
    clientTimestamp: number;
    isDeferred?: boolean;
}
export interface StartTournamentPayload {
    code: string;
    teacherId: string;
}
export interface PauseTournamentPayload {
    code: string;
}
export interface ResumeTournamentPayload {
    code: string;
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
export interface LockUnlockPayload {
    /** Game access code (legacy, optional for new backend) */
    accessCode?: string;
    /** Game ID for new backend (optional, for migration) */
    gameId?: string;
    lock: boolean;
    teacherId?: string;
}
export interface EndQuizPayload {
    accessCode: string;
    teacherId?: string;
}
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
/**
 * Room management payloads
 */
export interface RoomJoinedPayload {
    room: string;
    timestamp: string;
}
export interface RoomLeftPayload {
    room: string;
    timestamp: string;
}
/**
 * Socket event handler function types
 */
export type SocketEventHandler = (io: Server, socket: Socket, payload: Record<string, unknown>) => void | Promise<void>;
export * from './dashboardPayloads';
export type { GameIdentificationPayload, JoinDashboardPayload, PauseTimerPayload, SetQuestionPayload as DashboardSetQuestionPayload, LockAnswersPayload, EndGamePayload, DashboardQuestionChangedPayload, DashboardTimerUpdatedPayload, DashboardAnswersLockChangedPayload, DashboardGameStatusChangedPayload, DashboardParticipantUpdatePayload, DashboardAnswerStatsUpdatePayload, DashboardJoinedPayload, ConnectedCountPayload, QuestionForDashboard, GameControlStatePayload, ShowCorrectAnswersPayload, ToggleProjectionStatsPayload } from './dashboardPayloads';
export type { ProjectionShowStatsPayload } from './projectionShowStats';
