/**
 * Socket Type Guards and Runtime Validation
 * 
 * Provides type guards and runtime validation for socket event payloads
 * to ensure type safety when using shared types from socketEvents.ts
 * 
 * Phaexport function isGameSettingsChangedPayload(data: unknown): data is GameSettingsChangedPayload {d Modernization
 */

import type {
    QuestionData,
    ErrorPayload,
    GameJoinedPayload,
    JoinGamePayload,
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerActionPayload,
    GameStateUpdatePayload,
    TournamentQuestion,
    AnswerReceivedPayload,
    FeedbackPayload
} from '@shared/types/socketEvents';

import type {
    SetQuestionPayload,
    QuizTimerActionPayload as TeacherTimerActionPayload,
    DashboardQuestionChangedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    ConnectedCountPayload
} from '@shared/types/socket/payloads';

// Re-export payload types for use by other modules
export type {
    SetQuestionPayload,
    QuizTimerActionPayload as TeacherTimerActionPayload,
    DashboardQuestionChangedPayload,
    DashboardAnswersLockChangedPayload,
    DashboardGameStatusChangedPayload,
    ConnectedCountPayload
} from '@shared/types/socket/payloads';

// Import consolidated types from core
import type {
    ParticipantData,
    LeaderboardEntry as LeaderboardEntryData,
    AnswerSubmissionPayload as GameAnswerPayload
} from '@shared/types';

import { isTournamentQuestion } from '@shared/types/tournament/question';
import { LiveQuestionPayload } from '@shared/types/quiz/liveQuestion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// --- Type Guards for Shared Types ---

export function isQuestionData(data: unknown): data is QuestionData {
    if (!data || typeof data !== 'object') return false;

    const q = data as Record<string, unknown>;
    return (
        typeof q.uid === 'string' &&
        typeof q.text === 'string' &&
        Array.isArray(q.answerOptions) &&
        Array.isArray(q.correctAnswers) &&
        typeof q.questionType === 'string'
    );
}

export function isParticipantData(data: unknown): data is ParticipantData {
    if (!data || typeof data !== 'object') return false;

    const p = data as Record<string, unknown>;
    return (
        typeof p.id === 'string' &&
        typeof p.userId === 'string' &&
        typeof p.username === 'string'
    );
}

export function isErrorPayload(data: unknown): data is ErrorPayload {
    if (!data || typeof data !== 'object') return false;

    const e = data as Record<string, unknown>;
    return typeof e.message === 'string';
}

export function isGameJoinedPayload(data: unknown): data is GameJoinedPayload {
    if (!data || typeof data !== 'object') return false;

    const g = data as Record<string, unknown>;
    return (
        typeof g.accessCode === 'string' &&
        isParticipantData(g.participant) &&
        typeof g.gameStatus === 'string'
    );
}

export function isJoinGamePayload(data: unknown): data is JoinGamePayload {
    if (!data || typeof data !== 'object') return false;

    const j = data as Record<string, unknown>;
    return (
        typeof j.accessCode === 'string' &&
        typeof j.userId === 'string' &&
        typeof j.username === 'string'
    );
}

export function isTimerUpdatePayload(data: unknown): data is TimerUpdatePayload {
    if (!data || typeof data !== 'object') return false;

    const t = data as Record<string, unknown>;
    return (
        (typeof t.timeLeftMs === 'number' || t.timeLeftMs === null) &&
        typeof t.running === 'boolean'
    );
}

// --- Game Timer Update Type Guard ---

export function isGameTimerUpdatePayload(data: unknown): data is GameTimerUpdatePayload {
    if (!data || typeof data !== 'object') return false;

    const g = data as Record<string, unknown>;
    return (
        g.timer !== undefined &&
        typeof g.timer === 'object' &&
        g.timer !== null
    );
}

// --- Generic Type Validation ---

export function validateEventPayload<T>(
    data: unknown,
    guard: (data: unknown) => data is T,
    eventName: string
): T | null {
    if (guard(data)) {
        return data;
    }

    console.warn(`Invalid payload for event ${eventName}:`, data);
    return null;
}

// --- Safe Event Handler Wrapper ---

export function createSafeEventHandler<T>(
    handler: (data: T) => void,
    guard: (data: unknown) => data is T,
    eventName: string
) {
    return (data: unknown) => {
        const validatedData = validateEventPayload(data, guard, eventName);
        if (validatedData) {
            handler(validatedData);
        }
    };
}

// --- Teacher Quiz Socket Type Guards ---

// Note: SetQuestionPayload and TeacherTimerActionPayload are now imported from shared types

export interface GameErrorDetails {
    code?: string;
    message?: string;
    details?: string;
    error?: string;
    questionUid?: string;
}

export interface LobbyErrorPayload {
    error: string;
    message?: string;
}

// Note: Dashboard payloads now imported from shared types
// - DashboardQuestionChangedPayload
// - DashboardAnswersLockChangedPayload  
// - DashboardGameStatusChangedPayload
// - ConnectedCountPayload

// Type guards for teacher quiz socket types
export function isSetQuestionPayload(data: unknown): data is SetQuestionPayload {
    if (!data || typeof data !== 'object') return false;

    const s = data as Record<string, unknown>;
    return (
        typeof s.gameId === 'string' &&
        typeof s.questionUid === 'string'
    );
}

export function isTeacherTimerActionPayload(data: unknown): data is TeacherTimerActionPayload {
    if (!data || typeof data !== 'object') return false;

    const t = data as Record<string, unknown>;
    return (
        typeof t.gameId === 'string' &&
        typeof t.action === 'string' &&
        ['start', 'pause', 'resume', 'stop', 'set_duration'].includes(t.action as string)
    );
}

// --- Tournament-specific Type Guards and Interfaces ---

// NOTE: TournamentQuestion interface is now imported from shared types
// The local definition has been replaced by the canonical shared type

// --- Projector-specific Type Guards and Interfaces ---

export interface ProjectorQuestion extends QuestionData {
    // Projector-specific fields extending shared QuestionData
    uid: string;
    text: string;
    questionType: string;
    answers?: string[]; // Match QuestionData type
    time?: number;
    explanation?: string;
    tags?: string[];
    // Additional fields for projection display
}

export interface ProjectorState {
    currentQuestionIdx: number | null;
    questions: ProjectorQuestion[];
    chrono?: {
        timeLeftMs: number | null;
        running: boolean;
    };
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionUid?: string | null;
    timerTimeLeft?: number | null;
    locked?: boolean;
    ended?: boolean;
    stats?: Record<string, unknown>;
    participants?: ParticipantData[];
    accessCode?: string;
}

export interface ProjectorJoinedRoomPayload {
    room: string;
    socketId: string;
}

export interface ProjectorTimerUpdatePayload {
    timer?: {
        startedAt: number;
        duration: number;
        isPaused: boolean;
        timeRemaining?: number;
    };
}

// Type Guards for Projector Events

export function isProjectorQuestion(data: unknown): data is ProjectorQuestion {
    if (!data || typeof data !== 'object') return false;

    const q = data as Record<string, unknown>;
    return (
        typeof q.uid === 'string' &&
        typeof q.text === 'string' &&
        typeof q.questionType === 'string' &&
        Array.isArray(q.answers)
    );
}

export function isProjectorState(data: unknown): data is ProjectorState {
    if (!data || typeof data !== 'object') return false;

    const p = data as Record<string, unknown>;
    return (
        (p.currentQuestionIdx === null || typeof p.currentQuestionIdx === 'number') &&
        Array.isArray(p.questions) &&
        p.questions.every(isProjectorQuestion)
    );
}

export function isProjectorJoinedRoomPayload(data: unknown): data is ProjectorJoinedRoomPayload {
    if (!data || typeof data !== 'object') return false;

    const p = data as Record<string, unknown>;
    return (
        typeof p.room === 'string' &&
        typeof p.socketId === 'string'
    );
}

export function isProjectorConnectedCountPayload(data: unknown): data is ConnectedCountPayload {
    if (!data || typeof data !== 'object') return false;

    const p = data as Record<string, unknown>;
    return typeof p.count === 'number';
}

export function isProjectorTimerUpdatePayload(data: unknown): data is ProjectorTimerUpdatePayload {
    if (!data || typeof data !== 'object') return false;

    const p = data as Record<string, unknown>;

    // Allow undefined timer (stopped timer case)
    if (p.timer === undefined) return true;

    if (typeof p.timer !== 'object' || p.timer === null) return false;

    const timer = p.timer as Record<string, unknown>;
    return (
        typeof timer.startedAt === 'number' &&
        typeof timer.duration === 'number' &&
        typeof timer.isPaused === 'boolean'
    );
}

// --- Answer Received Type Guards ---

export function isAnswerReceivedPayload(data: any): data is AnswerReceivedPayload {
    return data &&
        typeof data === 'object' &&
        typeof data.questionUid === 'string' &&
        typeof data.timeSpent === 'number' &&
        (data.correct === undefined || typeof data.correct === 'boolean') &&
        (data.correctAnswers === undefined || Array.isArray(data.correctAnswers)) &&
        (data.explanation === undefined || typeof data.explanation === 'string');
}

// --- Game State Update Type Guard ---

export function isGameStateUpdatePayload(data: unknown): data is GameStateUpdatePayload {
    if (!data || typeof data !== 'object') return false;

    const g = data as Record<string, unknown>;
    return (
        typeof g.status === 'string' &&
        ['waiting', 'active', 'paused', 'finished'].includes(g.status as string)
    );
}

// --- Correct Answers Display Type Guards ---

export interface CorrectAnswersPayload {
    questionUid?: string;
    correctAnswers?: boolean[];
    numericAnswer?: {
        correctAnswer: number;
        tolerance?: number;
    };
    terminatedQuestions?: Record<string, boolean>;
}

export function isCorrectAnswersPayload(data: unknown): data is CorrectAnswersPayload {
    if (!data || typeof data !== 'object') return false;

    const c = data as Record<string, unknown>;
    return typeof c.questionUid === 'string' &&
        (c.correctAnswers === undefined || Array.isArray(c.correctAnswers)) &&
        (c.numericAnswer === undefined || (
            typeof c.numericAnswer === 'object' &&
            c.numericAnswer !== null &&
            typeof (c.numericAnswer as any).correctAnswer === 'number' &&
            ((c.numericAnswer as any).tolerance === undefined || typeof (c.numericAnswer as any).tolerance === 'number')
        )) &&
        (c.terminatedQuestions === undefined || (
            typeof c.terminatedQuestions === 'object' &&
            c.terminatedQuestions !== null
        ));
}

export function isFeedbackPayload(data: unknown): data is FeedbackPayload {
    if (!data || typeof data !== 'object') return false;

    const f = data as Record<string, unknown>;
    return (
        typeof f.questionUid === 'string' &&
        typeof f.feedbackRemaining === 'number'
    );
}

// No timer status string literals to update in this file; all type guards use canonical types from shared
