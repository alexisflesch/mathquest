import { Socket } from 'socket.io';
import type {
    GameTimerState,
    TimerStatus
} from '@shared/types/core/timer';

// Import all dashboard payloads except GameControlStatePayload
import type {
    JoinDashboardPayload,
    SetQuestionPayload,
    LockAnswersPayload,
    EndGamePayload,
    DashboardQuestionChangedPayload,
    DashboardTimerUpdatedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    DashboardAnswerStatsUpdatePayload,
    QuestionForDashboard
} from '@shared/types/socket/dashboardPayloads';
// Import only the canonical GameControlStatePayload from zod.dashboard
import type { GameControlStatePayload } from '@shared/types/socketEvents.zod.dashboard';

// Re-export for local use
export type {
    JoinDashboardPayload,
    SetQuestionPayload,
    LockAnswersPayload,
    EndGamePayload,
    DashboardQuestionChangedPayload,
    DashboardTimerUpdatedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    DashboardAnswerStatsUpdatePayload,
    QuestionForDashboard,
    // Only export canonical GameControlStatePayload from zod.dashboard
    GameControlStatePayload
};

// Use core timer state instead of local definition
export type TimerState = GameTimerState;
