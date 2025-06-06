import { Socket } from 'socket.io';
import type {
    TimerActionPayload as CoreTimerActionPayload,
    GameTimerState,
    TimerStatus
} from '@shared/types/core/timer';

// Define dashboard event payload types
export interface JoinDashboardPayload {
    gameId?: string;      // Database ID of the game instance
    accessCode?: string;  // Access code of the game (for backward compatibility)
}

export interface SetQuestionPayload {
    gameId: string;      // Database ID of the game instance
    questionUid?: string; // UID of the question to show (using UIDs not indices)
    questionIndex?: number; // Index of the question (legacy support)
}

// Use consolidated timer action payload
export type TimerActionPayload = CoreTimerActionPayload & {
    gameId: string;      // Database ID of the game instance (required for teacher control)
};

export interface LockAnswersPayload {
    gameId: string;      // Database ID of the game instance
    lock: boolean;       // Whether to lock or unlock answers
}

export interface EndGamePayload {
    gameId: string;      // Database ID of the game instance
}

export interface StartTimerPayload {
    gameId?: string;     // Database ID of the game instance
    accessCode?: string; // Access code (legacy support)
    duration: number;    // Duration in milliseconds
}

export interface PauseTimerPayload {
    gameId?: string;     // Database ID of the game instance
    accessCode?: string; // Access code (legacy support)
}

// Define response interfaces for dashboard events
export interface QuestionForDashboard {
    uid: string;
    title: string;
    text: string;
    questionType: string;
    timeLimit: number;
    difficulty: number;
    discipline: string;
    themes: string[];
    answerOptions: string[];
    correctAnswers: boolean[];
}

// Use core timer state instead of local definition
export type TimerState = GameTimerState;

// Response types for server-to-client events
export interface GameControlStatePayload {
    gameId: string;
    accessCode: string;
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionUid: string | null;
    questions: QuestionForDashboard[];
    timer: TimerState;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number>;
}

export interface DashboardQuestionChangedPayload {
    questionUid: string;
    oldQuestionUid: string | null;
    timer: TimerState;
}

export interface DashboardTimerUpdatedPayload {
    timer: TimerState;
}

export interface DashboardAnswersLockChangedPayload {
    answersLocked: boolean;
}

export interface DashboardParticipantUpdatePayload {
    participantCount: number;
}

export interface DashboardAnswerStatsUpdatePayload {
    questionUid: string;
    stats: Record<string, number>; // Map of option id to count
}

export interface DashboardGameStatusChangedPayload {
    status: 'pending' | 'active' | 'paused' | 'completed';
}
