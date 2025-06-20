import { Socket } from 'socket.io';
import type {
    TimerActionPayload as CoreTimerActionPayload,
    GameTimerState,
    TimerStatus
} from '@shared/types/core/timer';

// Import consolidated dashboard payload types
import type {
    JoinDashboardPayload,
    PauseTimerPayload,
    StartTimerPayload,
    SetQuestionPayload,
    LockAnswersPayload,
    EndGamePayload,
    DashboardQuestionChangedPayload,
    DashboardTimerUpdatedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    DashboardParticipantUpdatePayload,
    DashboardAnswerStatsUpdatePayload,
    QuestionForDashboard,
    GameControlStatePayload
} from '@shared/types/socket/dashboardPayloads';

// Re-export for local use
export type {
    JoinDashboardPayload,
    PauseTimerPayload,
    StartTimerPayload,
    SetQuestionPayload,
    LockAnswersPayload,
    EndGamePayload,
    DashboardQuestionChangedPayload,
    DashboardTimerUpdatedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    DashboardParticipantUpdatePayload,
    DashboardAnswerStatsUpdatePayload,
    QuestionForDashboard,
    GameControlStatePayload
};

// Use consolidated timer action payload
export type TimerActionPayload = CoreTimerActionPayload & {
    gameId: string;      // Database ID of the game instance (required for teacher control)
};

// Use core timer state instead of local definition
export type TimerState = GameTimerState;
