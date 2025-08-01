// /home/aflesch/mathquest/app/shared/types/socketEvents.ts
// This file defines the types for Socket.IO events and their payloads,
// shared between the backend and frontend.

// Import Zod schemas for type derivation
import {
    feedbackPayloadSchema,
    answerFeedbackPayloadSchema,
    gameStateUpdatePayloadSchema,
    revealLeaderboardPayloadSchema
} from './socketEvents.zod';
import type { z } from 'zod';

// Derive types from Zod schemas
export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;
export type RevealLeaderboardPayload = z.infer<typeof revealLeaderboardPayloadSchema>;

// Import consolidated core types
import type {
    ParticipantData,
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerActionPayload,
    AnswerSubmissionPayload as GameAnswerPayload,
    LeaderboardEntry
} from './core';
import type { LiveQuestionPayload } from './quiz/liveQuestion';
import type { SetQuestionPayload, DashboardAnswerStatsUpdatePayload, JoinDashboardPayload } from './socket/dashboardPayloads';
import type {
    PracticeClientToServerEvents,
    PracticeServerToClientEvents
} from './practice/events';

// Define LeaderboardEntryData for this file's usage
type LeaderboardEntryData = LeaderboardEntry;

// ===== UNIFIED JOIN EVENT PAYLOAD =====

/**
 * Unified payload for joining a game (replaces separate lobby and game join events)
 * Used for both lobby and live game joining in the new unified flow
 */
export interface JoinGamePayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
}

// ===== LEGACY EVENT PAYLOADS (DEPRECATED) =====
// These will be removed after the unified join flow is implemented

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

// Re-export core types for backward compatibility
export type { ParticipantData, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload } from './core';
export type { LeaderboardEntry as LeaderboardEntryData } from './core';

export type { AnswerSubmissionPayload as GameAnswerPayload } from './core';

// Placeholder for other payloads - we'll add more as we identify them.

// Example of a payload for an error event
export interface ErrorPayload {
    message: string;
    code?: string | number; // Optional error code
    details?: Record<string, any>; // Optional error details for validation errors
}

// Room management payloads
export interface RoomJoinedPayload {
    room: string;
    timestamp: string;
}

export interface RoomLeftPayload {
    room: string;
    timestamp: string;
}

// Payload for when a player has already played/completed a differed game
export interface GameAlreadyPlayedPayload {
    accessCode: string;
}

// Payload for when a client successfully joins a game
export interface GameJoinedPayload {
    accessCode: string;
    participant: ParticipantData; // Detailed information about the participant who joined
    gameStatus: 'pending' | 'active' | 'completed' | 'archived'; // Current status of the game
    gameMode: 'tournament' | 'quiz' | 'practice' | 'class';
    differedAvailableFrom?: string; // ISO string
    differedAvailableTo?: string;   // ISO string
    // Potentially include initial game state info here if needed immediately on join
}

// Payload for broadcasting when a new player joins a live game
export interface PlayerJoinedGamePayload {
    // Using ParticipantData directly might be too much if only a subset is needed for broadcast.
    // However, for consistency and if most fields are useful, it's acceptable.
    // If a smaller subset is preferred, define a new interface like PlayerInfoForBroadcast.
    participant: ParticipantData;
}

// Example of a payload for a generic notification
export interface NotificationPayload {
    message: string;
    defaultMode: 'info' | 'warning' | 'error' | 'success';
}

// Game participants list payload
export interface GameParticipantsPayload {
    participants: ParticipantData[];
}

// --- Specific Data Structures for Payloads ---

// Game state update payload
export interface GameStateUpdatePayload {
    status?: 'waiting' | 'active' | 'paused' | 'finished';
    currentQuestion?: QuestionData;
    questionIndex?: number;
    totalQuestions?: number;
    timer?: number;
    participants?: ParticipantData[];
    gameMode?: 'tournament' | 'quiz' | 'practice' | 'class';
}

export interface QuestionData {
    uid: string;
    title?: string;
    text: string;
    answerOptions: string[]; // Array of text options
    correctAnswers: boolean[]; // Array of booleans indicating correct answers (required everywhere)
    questionType: string; // e.g., QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER
    timeLimit?: number; // Time in seconds
    currentQuestionIndex?: number; // 0-based index of the current question
    totalQuestions?: number;     // Total number of questions in the game/quiz

    // Additional fields used throughout the frontend
    gradeLevel?: string; // Educational grade level
    discipline?: string; // Subject/discipline 
    themes?: string[]; // Question themes
    tags?: string[]; // Question tags
    difficulty?: number; // Difficulty level
    explanation?: string; // Question explanation
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

// ===== Projector Event Payloads =====

/**
 * Payload for joining a projection session
 */
export interface JoinProjectorPayload {
    gameId: string;
}

/**
 * Payload for leaving a projection session
 */
export interface LeaveProjectorPayload {
    gameId: string;
}

// ===== Shared Live Handler Payloads =====

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

// --- Core Socket.IO Event Definitions ---

// Events emitted by the client and listened to by the server
export interface ClientToServerEvents extends PracticeClientToServerEvents {
    join_game: (payload: JoinGamePayload) => void;
    game_answer: (payload: GameAnswerPayload) => void;
    submit_answer: (payload: GameAnswerPayload) => void; // Alias for game_answer
    request_participants: (payload: { accessCode: string }) => void;
    request_next_question: (payload: { accessCode: string; userId: string; currentQuestionUid: string | null }) => void;
    // Teacher controls - using actual event names from TEACHER_EVENTS
    set_question: (payload: SetQuestionPayload) => void;
    quiz_timer_action: (payload: TimerActionPayload) => void;
    lock_answers: (payload: { accessCode?: string; gameId?: string; lock: boolean }) => void;
    end_game: (payload: { accessCode: string; gameId?: string }) => void;
    join_dashboard: (payload: JoinDashboardPayload) => void;
    get_game_state: (payload: { accessCode: string }) => void;
    set_timer: (payload: { gameId?: string; time: number; questionUid?: string }) => void;
    update_tournament_code: (payload: { gameId: string; newCode: string }) => void;
    // Tournament events
    join_tournament: (payload: { code: string; username?: string; avatar?: string; isDeferred?: boolean; userId?: string; classId?: string; cookieId?: string }) => void;
    /**
     * [LEGACY, to be modernized] Start tournament (creator only)
     * This is required for now for the live page start button. Remove when backend/contract is modernized.
     */
    start_tournament: (payload: { accessCode: string }) => void;
    // Add other client-to-server events here
}

// Events emitted by the server and listened to by the client
export interface ServerToClientEvents extends PracticeServerToClientEvents {
    connect: () => void;
    disconnect: (reason: string) => void;
    connection_established: (payload: { socketId: string; timestamp: string; user: Partial<SocketData> }) => void; // Example welcome event

    game_joined: (payload: GameJoinedPayload) => void; // Updated to use GameJoinedPayload
    game_question: (payload: LiveQuestionPayload) => void;
    answer_received: (payload: AnswerReceivedPayload) => void;
    leaderboard_update: (payload: { leaderboard: LeaderboardEntryData[] }) => void;
    player_joined_game: (payload: PlayerJoinedGamePayload) => void; // Updated to use PlayerJoinedGamePayload
    player_left_game: (payload: { userId: string; socketId: string }) => void; // Broadcast when a player leaves
    game_participants: (payload: { participants: ParticipantData[] }) => void; // Full list of participants

    // Lobby events
    participants_list: (payload: import('./lobbyParticipantListPayload').LobbyParticipantListPayload) => void; // Canonical lobby participants list

    // Game control events
    game_control_question_set: (payload: { questionIndex: number; timer: any }) => void;
    game_control_question_ended: (payload: { questionIndex: number; answers: any; leaderboard: any }) => void;
    question_ended: (payload: { questionIndex: number; questionUid?: string; showLeaderboard?: boolean }) => void;

    game_state_update: (payload: GameStateUpdatePayload) => void;
    timer_update: (payload: TimerUpdatePayload) => void;
    game_timer_updated: (payload: GameTimerUpdatePayload) => void;
    answers_locked: (payload: { locked: boolean }) => void;
    stats_update: (payload: any) => void;
    game_ended: (payload: { accessCode: string; correct?: number; total?: number; score?: number; totalQuestions?: number; /* any final stats */ }) => void;
    correct_answers: (payload: { questionUid: string; correctAnswers?: boolean[] }) => void; // Backend emits this event
    feedback: (payload: { questionUid: string; feedbackRemaining: number;[key: string]: any }) => void; // Backend emits this event
    answer_feedback: (payload: { status: string; code: string; message: string }) => void; // Added for answer feedback

    game_error: (payload: ErrorPayload) => void;
    game_already_played: (payload: GameAlreadyPlayedPayload) => void; // Updated to use GameAlreadyPlayedPayload
    notification: (payload: NotificationPayload) => void;

    // Teacher dashboard events
    error_dashboard: (payload: ErrorPayload) => void;
    dashboard_joined: (payload: { gameId: string }) => void;
    game_control_state: (payload: any) => void;
    dashboard_question_changed: (payload: { questionUid: string; questionIndex?: number }) => void;
    dashboard_timer_updated: (payload: TimerUpdatePayload) => void;
    dashboard_answers_lock_changed: (payload: { locked: boolean }) => void;
    dashboard_game_status_changed: (payload: { status: string }) => void;
    dashboard_answer_stats_update: (payload: DashboardAnswerStatsUpdatePayload) => void;
    quiz_connected_count: (payload: { count: number }) => void;
    projector_state: (payload: any) => void;

    projection_leaderboard_update: (payload: import('./socket/projectionLeaderboardUpdatePayload').ProjectionLeaderboardUpdatePayload) => void;
    projection_show_stats: (payload: import('./socket/projectionShowStats').ProjectionShowStatsPayload) => void;

    // Add other server-to-client events here
}

// Events used for server-to-server communication (if any)
// For most applications, this might not be used directly with client-facing Socket.IO.
export interface InterServerEvents {
    // e.g., ping: () => void;
}

// Data associated with each socket instance on the server-side
// Can be used to store session-like information.
export interface SocketData {
    userId?: string;    // Player ID or Teacher ID
    username?: string;
    role?: 'STUDENT' | 'TEACHER' | 'GUEST';
    accessCode?: string; // If the socket is associated with a specific game/lobby
    currentGameRoom?: string; // Room name for current game
    // Practice session data
    practiceSessionId?: string; // Current practice session ID
    practiceUserId?: string; // User ID for practice session
    // Add any other data you want to associate with the socket
}

// TODO: Define GameStatePayload for overall game state updates.
// TODO: Review and refine 'any' types to be more specific where possible.

// Re-export tournament question types for easy access
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

/**
 * Teacher to Server Events
 */
export interface TeacherToServerEvents {
    /**
     * Teacher requests to reveal the full leaderboard (trophy button)
     */
    reveal_leaderboard: (payload: RevealLeaderboardPayload) => void;
    // ...existing events
}
