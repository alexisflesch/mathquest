/**
 * Socket Type Guards and Runtime Validation
 * 
 * Provides type guards and runtime validation for socket event payloads
 * to ensure type safety when using shared types from socketEvents.ts
 * 
 * Phase 3 of Frontend Modernization
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

export function isGameAnswerPayload(data: unknown): data is GameAnswerPayload {
    if (!data || typeof data !== 'object') return false;

    const a = data as Record<string, unknown>;
    return (
        typeof a.accessCode === 'string' &&
        typeof a.userId === 'string' &&
        typeof a.questionUid === 'string' &&
        typeof a.timeSpent === 'number'
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

export function isLeaderboardEntryData(data: unknown): data is LeaderboardEntryData {
    if (!data || typeof data !== 'object') return false;

    const l = data as Record<string, unknown>;
    return (
        typeof l.userId === 'string' &&
        typeof l.username === 'string' &&
        typeof l.score === 'number'
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

export function isGameErrorDetails(data: unknown): data is GameErrorDetails {
    if (!data || typeof data !== 'object') return false;

    const g = data as Record<string, unknown>;
    // GameErrorDetails is flexible - it just needs at least one error-related field
    return (
        typeof g.code === 'string' ||
        typeof g.message === 'string' ||
        typeof g.details === 'string' ||
        typeof g.error === 'string'
    );
}

export function isLobbyErrorPayload(data: unknown): data is LobbyErrorPayload {
    if (!data || typeof data !== 'object') return false;

    const l = data as Record<string, unknown>;
    return typeof l.error === 'string';
}

export function isConnectedCountPayload(data: unknown): data is ConnectedCountPayload {
    if (!data || typeof data !== 'object') return false;

    const c = data as Record<string, unknown>;
    return typeof c.count === 'number';
}

export function isDashboardQuestionChangedPayload(data: unknown): data is DashboardQuestionChangedPayload {
    if (!data || typeof data !== 'object') return false;

    const d = data as Record<string, unknown>;
    return typeof d.questionUid === 'string';
}

export function isDashboardAnswersLockChangedPayload(data: unknown): data is DashboardAnswersLockChangedPayload {
    if (!data || typeof data !== 'object') return false;

    const d = data as Record<string, unknown>;
    return typeof d.answersLocked === 'boolean';
}

export function isDashboardGameStatusChangedPayload(data: unknown): data is DashboardGameStatusChangedPayload {
    if (!data || typeof data !== 'object') return false;

    const d = data as Record<string, unknown>;
    return typeof d.status === 'string';
}

// Teacher quiz state type guard
export interface TeacherQuizState {
    currentQuestionIdx: number | null;
    questions: QuestionData[];
    chrono: { timeLeftMs: number | null; running: boolean };
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
    profSocketId?: string | null;
    timerStatus?: 'play' | 'pause' | 'stop' | null;
    timerQuestionUid?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number;
    questionStates?: Record<string, boolean>;
}

// Type guard for TeacherQuizState
export function isTeacherQuizState(data: unknown): data is TeacherQuizState {
    if (!data || typeof data !== 'object') return false;

    const q = data as Record<string, unknown>;
    return (
        (typeof q.currentQuestionIdx === 'number' || q.currentQuestionIdx === null) &&
        Array.isArray(q.questions) &&
        typeof q.chrono === 'object' &&
        typeof q.locked === 'boolean' &&
        typeof q.ended === 'boolean'
    );
}

// --- Tournament-specific Type Guards and Interfaces ---

// NOTE: TournamentQuestion interface is now imported from shared types
// The local definition has been replaced by the canonical shared type

export interface TournamentAnswerReceived {
    rejected?: boolean;
    received?: boolean;
    message?: string;
    correct?: boolean;
    questionUid?: string;
    timeSpent?: number;
    correctAnswers?: number[];
    explanation?: string;
    points?: number;
    totalPoints?: number;
    rank?: number;
}

export interface TournamentGameJoinedPayload {
    gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
    socketId?: string;
    accessCode?: string;
}

export interface TournamentGameUpdatePayload {
    status: 'pause' | 'play' | 'stop';
    paused?: boolean;
    waiting?: boolean;
}

export interface TournamentCorrectAnswersPayload {
    questionUid?: string;
    correctAnswers: number[];
}

export interface TournamentGameEndedPayload {
    score?: number;
    totalQuestions?: number;
    finalScore?: number;
    finalRank?: number;
}

export interface TournamentGameErrorPayload {
    message: string;
    code?: string;
}

// Type Guards for Tournament Events

// NOTE: isTournamentQuestion is now imported from shared types

export function isTournamentAnswerReceived(data: unknown): data is TournamentAnswerReceived {
    if (!data || typeof data !== 'object') return false;

    const a = data as Record<string, unknown>;
    // At least one of the key properties should be present
    return (
        typeof a.correct === 'boolean' ||
        typeof a.rejected === 'boolean' ||
        typeof a.received === 'boolean' ||
        typeof a.message === 'string'
    );
}

export function isTournamentGameJoinedPayload(data: unknown): data is TournamentGameJoinedPayload {
    if (!data || typeof data !== 'object') return false;

    const g = data as Record<string, unknown>;
    return (
        typeof g.gameStatus === 'string' &&
        ['waiting', 'active', 'paused', 'finished'].includes(g.gameStatus as string)
    );
}

export function isTournamentGameUpdatePayload(data: unknown): data is TournamentGameUpdatePayload {
    if (!data || typeof data !== 'object') return false;

    const u = data as Record<string, unknown>;
    return (
        typeof u.status === 'string' &&
        ['pause', 'play', 'stop'].includes(u.status as string)
    );
}

export function isTournamentCorrectAnswersPayload(data: unknown): data is TournamentCorrectAnswersPayload {
    if (!data || typeof data !== 'object') return false;

    const c = data as Record<string, unknown>;
    return (
        typeof c.questionUid === 'string' &&
        Array.isArray(c.correctAnswers)
    );
}

export function isTournamentGameEndedPayload(data: unknown): data is TournamentGameEndedPayload {
    if (!data || typeof data !== 'object') return false;

    const e = data as Record<string, unknown>;
    // At least one score/ranking property should be present
    return (
        typeof e.score === 'number' ||
        typeof e.totalQuestions === 'number' ||
        typeof e.finalScore === 'number' ||
        typeof e.finalRank === 'number'
    );
}

export function isTournamentGameErrorPayload(data: unknown): data is TournamentGameErrorPayload {
    if (!data || typeof data !== 'object') return false;

    const t = data as Record<string, unknown>;
    return (
        typeof t.message === 'string' &&
        (t.code === undefined || typeof t.code === 'string')
    );
}

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

// --- Game End Type Guards ---

export interface GameEndedPayload {
    accessCode: string;
    correct?: number;
    total?: number;
    score?: number;
    totalQuestions?: number;
}

export function isGameEndedPayload(data: unknown): data is GameEndedPayload {
    if (!data || typeof data !== 'object') return false;

    const g = data as Record<string, unknown>;
    return typeof g.accessCode === 'string';
}

// --- Correct Answers Display Type Guards ---

export interface CorrectAnswersPayload {
    questionUid?: string;
    correctAnswers?: boolean[];
}

export function isCorrectAnswersPayload(data: unknown): data is CorrectAnswersPayload {
    if (!data || typeof data !== 'object') return false;

    const c = data as Record<string, unknown>;
    return typeof c.questionUid === 'string' &&
        (c.correctAnswers === undefined || Array.isArray(c.correctAnswers));
}

// --- Live Question Type Guard ---

export function isLiveQuestionPayload(data: unknown): data is LiveQuestionPayload {
    if (!data || typeof data !== 'object') return false;
    const lq = data as Record<string, unknown>;
    if (!lq.question || typeof lq.question !== 'object') return false;
    const q = lq.question as Record<string, unknown>;
    return (
        typeof q.uid === 'string' &&
        typeof q.text === 'string' &&
        typeof q.questionType === 'string' &&
        Array.isArray(q.answerOptions) &&
        // Optional fields - note: null is also allowed for database nullable fields
        (q.explanation === undefined || q.explanation === null || typeof q.explanation === 'string') &&
        (q.correctAnswers === undefined || Array.isArray(q.correctAnswers)) &&
        (q.timeLimit === undefined || typeof q.timeLimit === 'number') &&
        (q.gradeLevel === undefined || typeof q.gradeLevel === 'string') &&
        (q.difficulty === undefined || typeof q.difficulty === 'number') &&
        (q.themes === undefined || Array.isArray(q.themes)) &&
        (lq.timer === undefined || typeof lq.timer === 'object') &&
        (lq.questionIndex === undefined || typeof lq.questionIndex === 'number') &&
        (lq.totalQuestions === undefined || typeof lq.totalQuestions === 'number') &&
        (lq.questionState === undefined || typeof lq.questionState === 'string') &&
        (lq.modeSpecificData === undefined || typeof lq.modeSpecificData === 'object') &&
        (lq.feedbackWaitTime === undefined || typeof lq.feedbackWaitTime === 'number')
    );
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
