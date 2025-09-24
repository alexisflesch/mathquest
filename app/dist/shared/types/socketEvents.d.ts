import { feedbackPayloadSchema, revealLeaderboardPayloadSchema } from './socketEvents.zod';
import type { z } from 'zod';
export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;
export type RevealLeaderboardPayload = z.infer<typeof revealLeaderboardPayloadSchema>;
import type { ParticipantData, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload, AnswerSubmissionPayload as GameAnswerPayload, LeaderboardEntry } from './core';
import type { LiveQuestionPayload } from './quiz/liveQuestion';
import type { SetQuestionPayload, DashboardAnswerStatsUpdatePayload, JoinDashboardPayload } from './socket/dashboardPayloads';
import type { PracticeClientToServerEvents, PracticeServerToClientEvents } from './practice/events';
type LeaderboardEntryData = LeaderboardEntry;
/**
 * Unified payload for joining a game (replaces separate lobby and game join events)
 * Used for both lobby and live game joining in the new unified flow
 */
export interface JoinGamePayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
    isDiffered?: boolean;
}
/**
 * @deprecated Use JoinGamePayload instead
 * Payload for joining a game lobby
 */
export interface JoinLobbyPayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
}
export type { ParticipantData, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload } from './core';
export type { LeaderboardEntry as LeaderboardEntryData } from './core';
export type { AnswerSubmissionPayload as GameAnswerPayload } from './core';
export interface ErrorPayload {
    message: string;
    code?: string | number;
    details?: Record<string, any>;
}
export interface RoomJoinedPayload {
    room: string;
    timestamp: string;
}
export interface RoomLeftPayload {
    room: string;
    timestamp: string;
}
export interface GameAlreadyPlayedPayload {
    accessCode: string;
}
export interface GameJoinedPayload {
    accessCode: string;
    participant: ParticipantData;
    gameStatus: 'pending' | 'active' | 'completed' | 'archived';
    gameMode: 'tournament' | 'quiz' | 'practice';
    differedAvailableFrom?: string;
    differedAvailableTo?: string;
}
export interface PlayerJoinedGamePayload {
    participant: ParticipantData;
}
export interface NotificationPayload {
    message: string;
    defaultMode: 'info' | 'warning' | 'error' | 'success';
}
export interface GameParticipantsPayload {
    participants: ParticipantData[];
}
export interface GameStateUpdatePayload {
    status?: 'waiting' | 'active' | 'paused' | 'finished';
    currentQuestion?: QuestionData;
    questionIndex?: number;
    totalQuestions?: number;
    timer?: number;
    participants?: ParticipantData[];
    gameMode?: 'tournament' | 'quiz' | 'practice';
}
export interface QuestionData {
    uid: string;
    title?: string;
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    timeLimit?: number;
    currentQuestionIndex?: number;
    totalQuestions?: number;
    gradeLevel?: string;
    discipline?: string;
    themes?: string[];
    tags?: string[];
    difficulty?: number;
    explanation?: string;
}
/**
 * @deprecated Use JoinGamePayload instead
 * Payload for leaving a game lobby
 */
export interface LeaveLobbyPayload {
    accessCode: string;
    userId?: string;
}
/**
 * @deprecated Use JoinGamePayload instead
 * Payload for requesting participants list
 */
export interface GetParticipantsPayload {
    accessCode: string;
}
/**
 * Shared payload for joining live games (both quiz and tournament modes)
 */
export interface SharedJoinPayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
    playMode?: 'quiz' | 'tournament' | 'practice';
}
/**
 * Shared payload for answering questions in live games
 */
export interface SharedAnswerPayload {
    accessCode: string;
    userId: string;
    questionUid: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
    playMode?: 'quiz' | 'tournament' | 'practice';
}
export interface ClientToServerEvents extends PracticeClientToServerEvents {
    join_game: (payload: JoinGamePayload) => void;
    game_answer: (payload: GameAnswerPayload) => void;
    submit_answer: (payload: GameAnswerPayload) => void;
    request_participants: (payload: {
        accessCode: string;
    }) => void;
    request_next_question: (payload: {
        accessCode: string;
        userId: string;
        currentQuestionUid: string | null;
    }) => void;
    set_question: (payload: SetQuestionPayload) => void;
    quiz_timer_action: (payload: TimerActionPayload) => void;
    lock_answers: (payload: {
        accessCode?: string;
        gameId?: string;
        lock: boolean;
    }) => void;
    end_game: (payload: {
        accessCode: string;
        gameId?: string;
    }) => void;
    join_dashboard: (payload: JoinDashboardPayload) => void;
    get_game_state: (payload: {
        accessCode: string;
    }) => void;
    set_timer: (payload: {
        gameId?: string;
        time: number;
        questionUid?: string;
    }) => void;
    update_tournament_code: (payload: {
        gameId: string;
        newCode: string;
    }) => void;
    join_tournament: (payload: {
        code: string;
        username?: string;
        avatar?: string;
        isDeferred?: boolean;
        userId?: string;
        classId?: string;
        cookieId?: string;
    }) => void;
    /**
     * [LEGACY, to be modernized] Start tournament (creator only)
     * This is required for now for the live page start button. Remove when backend/contract is modernized.
     */
    start_tournament: (payload: {
        accessCode: string;
    }) => void;
}
export interface ServerToClientEvents extends PracticeServerToClientEvents {
    connect: () => void;
    disconnect: (reason: string) => void;
    connection_established: (payload: {
        socketId: string;
        timestamp: string;
        user: Partial<SocketData>;
    }) => void;
    game_joined: (payload: GameJoinedPayload) => void;
    game_question: (payload: LiveQuestionPayload) => void;
    answer_received: (payload: AnswerReceivedPayload) => void;
    leaderboard_update: (payload: {
        leaderboard: LeaderboardEntryData[];
    }) => void;
    player_joined_game: (payload: PlayerJoinedGamePayload) => void;
    player_left_game: (payload: {
        userId: string;
        socketId: string;
    }) => void;
    game_participants: (payload: {
        participants: ParticipantData[];
    }) => void;
    participants_list: (payload: import('./lobbyParticipantListPayload').LobbyParticipantListPayload) => void;
    game_control_question_set: (payload: {
        questionIndex: number;
        timer: any;
    }) => void;
    game_control_question_ended: (payload: {
        questionIndex: number;
        answers: any;
        leaderboard: any;
    }) => void;
    question_ended: (payload: {
        questionIndex: number;
        questionUid?: string;
        showLeaderboard?: boolean;
    }) => void;
    game_state_update: (payload: GameStateUpdatePayload) => void;
    timer_update: (payload: TimerUpdatePayload) => void;
    game_timer_updated: (payload: GameTimerUpdatePayload) => void;
    answers_locked: (payload: {
        locked: boolean;
    }) => void;
    stats_update: (payload: any) => void;
    game_ended: (payload: {
        accessCode: string;
        correct?: number;
        total?: number;
        score?: number;
        totalQuestions?: number;
    }) => void;
    correct_answers: (payload: {
        questionUid: string;
        correctAnswers?: boolean[];
        numericAnswer?: {
            correctAnswer: number;
            tolerance?: number;
        };
        terminatedQuestions?: Record<string, boolean>;
    }) => void;
    feedback: (payload: {
        questionUid: string;
        feedbackRemaining: number;
        [key: string]: any;
    }) => void;
    answer_feedback: (payload: {
        status: string;
        code: string;
        message: string;
    }) => void;
    game_error: (payload: ErrorPayload) => void;
    game_already_played: (payload: GameAlreadyPlayedPayload) => void;
    notification: (payload: NotificationPayload) => void;
    error_dashboard: (payload: ErrorPayload) => void;
    dashboard_joined: (payload: {
        gameId: string;
    }) => void;
    game_control_state: (payload: any) => void;
    dashboard_question_changed: (payload: {
        questionUid: string;
        questionIndex?: number;
    }) => void;
    dashboard_timer_updated: (payload: TimerUpdatePayload) => void;
    dashboard_answers_lock_changed: (payload: {
        locked: boolean;
    }) => void;
    dashboard_game_status_changed: (payload: {
        status: string;
    }) => void;
    dashboard_answer_stats_update: (payload: DashboardAnswerStatsUpdatePayload) => void;
    quiz_connected_count: (payload: {
        count: number;
    }) => void;
    projector_state: (payload: any) => void;
    projection_leaderboard_update: (payload: import('./socket/projectionLeaderboardUpdatePayload').ProjectionLeaderboardUpdatePayload) => void;
    projection_show_stats: (payload: import('./socket/projectionShowStats').ProjectionShowStatsPayload) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    userId?: string;
    username?: string;
    role?: 'STUDENT' | 'TEACHER' | 'GUEST';
    accessCode?: string;
    currentGameRoom?: string;
    practiceSessionId?: string;
    practiceUserId?: string;
}
export type { TournamentQuestion } from './tournament/question';
/**
 * Payload for answer received confirmation
 */
export interface AnswerReceivedPayload {
    questionUid: string;
    timeSpent: number;
    correct?: boolean;
    correctAnswers?: boolean[];
    explanation?: string;
}
