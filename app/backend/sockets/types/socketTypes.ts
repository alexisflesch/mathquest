/**
 * TypeScript definitions for Socket.IO events
 */
import { Server, Socket } from 'socket.io';
import { Question, QuizState } from './quizTypes';
import { TournamentState } from './tournamentTypes';

/**
 * Payload for quiz_set_question event
 */
export interface SetQuestionPayload {
    quizId: string;
    questionUid: string;
    questionIdx?: number;
    teacherId?: string;
    tournamentCode?: string;
}

/**
 * Payload for quiz_timer_action event
 */
export interface TimerActionPayload {
    status: 'play' | 'pause' | 'stop';
    questionId: string;
    timeLeft?: number;
    quizId: string;
    teacherId?: string;
    tournamentCode?: string;
}

/**
 * Payload for quiz_set_timer event
 */
export interface SetTimerPayload {
    quizId: string;
    timeLeft: number;
    teacherId?: string;
    tournamentCode?: string;
    questionUid?: string;
}

/**
 * Payload for quiz_lock/quiz_unlock events
 */
export interface LockUnlockPayload {
    quizId: string;
    teacherId?: string;
    tournamentCode?: string;
}

/**
 * Payload for quiz_end event
 */
export interface EndQuizPayload {
    quizId: string;
    teacherId?: string;
    tournamentCode?: string;
    forceEnd?: boolean;
}

/**
 * Payload for quiz_close_question event
 */
export interface CloseQuestionPayload {
    quizId: string;
    questionUid: string;
    teacherId?: string;
}

/**
 * Payload for join_quiz event
 */
export interface JoinQuizPayload {
    quizId: string;
    role: 'teacher' | 'student' | 'projector';
    teacherId?: string;
    studentId?: string;
}

/**
 * Payload for get_quiz_state event
 */
export interface GetQuizStatePayload {
    quizId: string;
}

/**
 * Payload for quiz_pause/quiz_resume events
 */
export interface PauseResumePayload {
    quizId: string;
    teacherId?: string;
    tournamentCode?: string;
}

/**
 * Tournament events payloads
 */
export interface JoinTournamentPayload {
    code: string;
    pseudo?: string;
    avatar?: string;
    isDiffered?: boolean;
    joueurId?: string;
    classId?: string;
    cookie_id?: string;
}

export interface TournamentAnswerPayload {
    code: string;
    questionUid: string;
    answerIdx: number | number[];
    clientTimestamp: number;
    isDiffered?: boolean;
}

export interface StartTournamentPayload {
    code: string;
    enseignantId: string;
}

export interface PauseTournamentPayload {
    code: string;
}

export interface ResumeTournamentPayload {
    code: string;
}

/**
 * Socket event handler function types
 */
export type QuizEventHandler = (
    io: Server,
    socket: Socket,
    prisma: any,
    payload: any
) => void | Promise<void>;

export type TournamentEventHandler = (
    io: Server,
    socket: Socket,
    prisma: any,
    payload: any
) => void | Promise<void>;
