/**
 * TypeScript definitions for Socket.IO events
 * Now using shared types from shared/types
 */
import { Server, Socket } from 'socket.io';
import { Question } from '@shared/types/quiz/question';
import { ExtendedQuizState } from '@shared/types/quiz/state';
import { TournamentState } from '@shared/types/tournament/state';
import {
    SetQuestionPayload as SharedSetQuestionPayload,
    TimerActionPayload as SharedTimerActionPayload,
    SetTimerPayload as SharedSetTimerPayload,
    LockUnlockPayload as SharedLockUnlockPayload,
    EndQuizPayload as SharedEndQuizPayload,
    CloseQuestionPayload as SharedCloseQuestionPayload,
    JoinQuizPayload as SharedJoinQuizPayload,
    GetQuizStatePayload as SharedGetQuizStatePayload,
    PauseResumePayload as SharedPauseResumePayload,
    JoinTournamentPayload as SharedJoinTournamentPayload,
    TournamentAnswerPayload as SharedTournamentAnswerPayload,
    StartTournamentPayload as SharedStartTournamentPayload,
    PauseTournamentPayload as SharedPauseTournamentPayload,
    ResumeTournamentPayload as SharedResumeTournamentPayload
} from '@shared/types/socket/payloads';
import type { PrismaClient } from '@prisma/client'; // Added import

// Re-export all the shared payload types
export type SetQuestionPayload = SharedSetQuestionPayload;
export type TimerActionPayload = SharedTimerActionPayload;
export type SetTimerPayload = SharedSetTimerPayload;
export type LockUnlockPayload = SharedLockUnlockPayload;
export type EndQuizPayload = SharedEndQuizPayload;
export type CloseQuestionPayload = SharedCloseQuestionPayload;
export type JoinQuizPayload = SharedJoinQuizPayload;
export type GetQuizStatePayload = SharedGetQuizStatePayload;
export type PauseResumePayload = SharedPauseResumePayload;

/**
 * Tournament events payloads - Re-exported from shared types
 */
export type JoinTournamentPayload = SharedJoinTournamentPayload;
export type TournamentAnswerPayload = SharedTournamentAnswerPayload;
export type StartTournamentPayload = SharedStartTournamentPayload;
export type PauseTournamentPayload = SharedPauseTournamentPayload;
export type ResumeTournamentPayload = SharedResumeTournamentPayload;

// New payload for joining a quiz template dashboard
export interface JoinQuizTemplateDashboardPayload {
    quizTemplateId: string;
    teacherId: string; // To verify ownership/authorization
}

// New payload for setting a question in the quiz template dashboard
export interface QuizTemplateDashboardSetQuestionPayload {
    quizTemplateId: string;
    questionUid: string;
    questionIdx?: number;
    teacherId: string; // To verify ownership/authorization
    startTime?: number; // Optional: explicit time to set
    preserveTimer?: boolean; // Optional: whether to keep existing timer settings
}

// Game events payloads (replacing tournament payloads)
export interface StartGamePayload {
    accessCode: string;      // The access code of the game instance to start
    teacherId: string;       // The ID of the teacher initiating the game
}

export interface JoinGamePayload {
    accessCode: string;      // The access code of the game instance to join
    playerId: string;        // The player's ID
    playerName: string;      // The player's display name
    avatarEmoji?: string;      // Optional URL to the player's avatar
    isDeferredMode?: boolean; // Whether this is a deferred play session
}

export interface GameAnswerPayload {
    accessCode: string;      // The access code of the game instance
    playerId: string;        // The ID of the player submitting the answer
    questionUid: string;     // The unique ID of the question being answered
    answer: number | number[] | string; // The player's answer
    clientTimestamp: number; // Client-side timestamp when answer was submitted
}

export interface GamePausePayload {
    accessCode: string;      // The access code of the game instance to pause
    teacherId: string;       // The ID of the teacher pausing the game
}

export interface GameResumePayload {
    accessCode: string;      // The access code of the game instance to resume
    teacherId: string;       // The ID of the teacher resuming the game
}

/**
 * Socket event handler function types
 * These are still defined here as they're backend-specific implementations
 */
export type QuizEventHandler = (
    io: Server,
    socket: Socket,
    prisma: PrismaClient, // Changed from any
    payload: Record<string, unknown> // Changed from any
) => void | Promise<void>;

export type TournamentEventHandler = (
    io: Server,
    socket: Socket,
    prisma: PrismaClient, // Changed from any
    payload: Record<string, unknown> // Changed from any
) => void | Promise<void>;
