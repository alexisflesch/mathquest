/**
 * Shared Socket Event Payload Types
 * 
 * These types represent the payload structures for socket.io events.
 */
// Using type imports to avoid runtime dependencies
import type { Server, Socket } from 'socket.io';

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
 */
export interface SetQuestionPayload {
    /** Game access code (legacy, optional for new backend) */
    accessCode?: string;
    /** Game ID for new backend (optional, for migration) */
    gameId?: string;
    questionUid: string;
    questionIndex: number;
    teacherId?: string;
}

export interface QuizTimerActionPayload {
    /** Game access code (legacy, optional for new backend) */
    accessCode?: string;
    /** Game ID for new backend (optional, for migration) */
    gameId?: string;
    action: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration';
    duration?: number;
    teacherId?: string;
}

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
 * Socket event handler function types
 */
export type SocketEventHandler = (
    io: Server,
    socket: Socket,
    payload: Record<string, unknown>
) => void | Promise<void>;
