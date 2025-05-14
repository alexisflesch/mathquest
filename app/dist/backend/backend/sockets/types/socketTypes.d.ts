/**
 * TypeScript definitions for Socket.IO events
 * Now using shared types from shared/types
 */
import { Server, Socket } from 'socket.io';
import { SetQuestionPayload as SharedSetQuestionPayload, TimerActionPayload as SharedTimerActionPayload, SetTimerPayload as SharedSetTimerPayload, LockUnlockPayload as SharedLockUnlockPayload, EndQuizPayload as SharedEndQuizPayload, CloseQuestionPayload as SharedCloseQuestionPayload, JoinQuizPayload as SharedJoinQuizPayload, GetQuizStatePayload as SharedGetQuizStatePayload, PauseResumePayload as SharedPauseResumePayload, JoinTournamentPayload as SharedJoinTournamentPayload, TournamentAnswerPayload as SharedTournamentAnswerPayload, StartTournamentPayload as SharedStartTournamentPayload, PauseTournamentPayload as SharedPauseTournamentPayload, ResumeTournamentPayload as SharedResumeTournamentPayload } from '@shared/types/socket/payloads';
import type { PrismaClient } from '@prisma/client';
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
/**
 * Socket event handler function types
 * These are still defined here as they're backend-specific implementations
 */
export type QuizEventHandler = (io: Server, socket: Socket, prisma: PrismaClient, // Changed from any
payload: Record<string, unknown>) => void | Promise<void>;
export type TournamentEventHandler = (io: Server, socket: Socket, prisma: PrismaClient, // Changed from any
payload: Record<string, unknown>) => void | Promise<void>;
