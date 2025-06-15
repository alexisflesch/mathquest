import type { ParticipantData, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload, AnswerSubmissionPayload as GameAnswerPayload, LeaderboardEntry } from './core';
import type { LiveQuestionPayload } from './quiz/liveQuestion';
import type { PracticeClientToServerEvents, PracticeServerToClientEvents } from './practice/events';
type LeaderboardEntryData = LeaderboardEntry;
export interface JoinGamePayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
    isDiffered?: boolean;
}
export type { ParticipantData, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload } from './core';
export type { LeaderboardEntry as LeaderboardEntryData } from './core';
export type { AnswerSubmissionPayload as GameAnswerPayload } from './core';
export interface ErrorPayload {
    message: string;
    code?: string | number;
    details?: Record<string, any>;
}
export interface GameAlreadyPlayedPayload {
    accessCode: string;
}
export interface GameJoinedPayload {
    accessCode: string;
    participant: ParticipantData;
    gameStatus: 'pending' | 'active' | 'completed' | 'archived';
    isDiffered: boolean;
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
export interface GameStateUpdatePayload {
    status: 'waiting' | 'active' | 'paused' | 'finished';
    currentQuestion?: QuestionData;
    questionIndex?: number;
    totalQuestions?: number;
    timer?: number;
    participants?: ParticipantData[];
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
    set_question: (payload: {
        gameId?: string;
        accessCode?: string;
        questionUid: string;
        questionIndex: number;
    }) => void;
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
    join_dashboard: (payload: {
        gameId: string;
    }) => void;
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
    answer_received: (payload: {
        questionUid: string;
        timeSpent: number;
        correct?: boolean;
        correctAnswers?: boolean[];
        explanation?: string;
    }) => void;
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
    game_end: (payload: {
        accessCode?: string;
        [key: string]: any;
    }) => void;
    correct_answers: (payload: {
        questionUid: string;
        correctAnswers?: boolean[];
    }) => void;
    feedback: (payload: {
        questionUid: string;
        feedbackRemaining: number;
        [key: string]: any;
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
    quiz_connected_count: (payload: {
        count: number;
    }) => void;
    projector_state: (payload: any) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    userId?: string;
    username?: string;
    role?: 'player' | 'teacher' | 'admin' | 'projector';
    accessCode?: string;
    currentGameRoom?: string;
    practiceSessionId?: string;
    practiceUserId?: string;
}
export type { TournamentQuestion } from './tournament/question';
