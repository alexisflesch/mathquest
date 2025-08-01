/**
 * Socket Event Constants
 * 
 * This file contains constants for all socket event names used in the application.
 * Using these constants ensures consistency between frontend and backend.
 * 
 * Updated to align with the new backend socket event naming conventions.
 */

// ===== Teacher Dashboard Events =====
export const TEACHER_EVENTS = {
    // Connection and state
    JOIN_DASHBOARD: 'join_dashboard',
    GET_GAME_STATE: 'get_game_state',

    // Question control
    SET_QUESTION: 'set_question',

    // Timer control
    TIMER_ACTION: 'quiz_timer_action',
    START_TIMER: 'start_timer',
    PAUSE_TIMER: 'pause_timer',
    /** Set timer duration for a question (does not affect play/pause/stop) */
    TIMER_SET_DURATION: 'timer_set_duration',

    // Game control
    LOCK_ANSWERS: 'lock_answers',
    END_GAME: 'end_game',

    // NEW: Teacher-triggered question actions
    SHOW_CORRECT_ANSWERS: 'show_correct_answers', // Trophy button: Close question and show answers
    TOGGLE_PROJECTION_STATS: 'toggle_projection_stats', // Bar graph button: Toggle stats on projection
    REVEAL_LEADERBOARD: 'reveal_leaderboard', // Trophy button: Reveal leaderboard

    // Broadcast events (from server to client)
    GAME_CONTROL_STATE: 'game_control_state',
    DASHBOARD_JOINED: 'dashboard_joined',
    TIMER_UPDATE: 'quiz_timer_update',
    CONNECTED_COUNT: 'quiz_connected_count',

    // Dashboard-specific events
    DASHBOARD_QUESTION_CHANGED: 'dashboard_question_changed',
    DASHBOARD_TIMER_UPDATED: 'dashboard_timer_updated', // Canonical event for all dashboard/projection timer updates
    DASHBOARD_ANSWERS_LOCK_CHANGED: 'dashboard_answers_lock_changed',
    DASHBOARD_GAME_STATUS_CHANGED: 'dashboard_game_status_changed',
    DASHBOARD_ANSWER_STATS_UPDATE: 'dashboard_answer_stats_update',

    // Additional dashboard events
    STATS_UPDATE: 'stats_update',
    ANSWERS_LOCKED: 'answers_locked',
    ANSWER_STATS_UPDATE: 'answer_stats_update',

    // Teacher control responses
    TIMER_UPDATE_RESPONSE: 'timer_update_response',

    // Error handling
    ERROR_DASHBOARD: 'error_dashboard'
};

// ===== Tournament Events =====
export const TOURNAMENT_EVENTS = {
    // Student/Player actions
    START_TOURNAMENT: 'start_tournament',
    JOIN_TOURNAMENT: 'join_tournament',
    TOURNAMENT_ANSWER: 'tournament_answer',

    // Server responses (tournament-specific variants)
    TOURNAMENT_STARTED: 'tournament_started',
    TOURNAMENT_JOINED: 'tournament_joined',
    TOURNAMENT_PLAYER_JOINED: 'tournament_player_joined',
    TOURNAMENT_STATE_UPDATE: 'tournament_state_update',
    TOURNAMENT_ANSWER_RESULT: 'tournament_answer_result',
    TOURNAMENT_QUESTION_UPDATE: 'tournament_question_update',
    TOURNAMENT_QUESTION_STATE_UPDATE: 'tournament_question_state_update',
    TOURNAMENT_LEADERBOARD_UPDATE: 'tournament_leaderboard_update',
    TOURNAMENT_ENDED: 'tournament_ended',
    TOURNAMENT_TIMER_UPDATE: 'tournament_timer_update',
    TOURNAMENT_ERROR: 'tournament_error',

    // Additional tournament events
    TOURNAMENT_ALREADY_STARTED: 'tournament_already_started',
    TOURNAMENT_NOTIFICATION: 'tournament_notification',
    TOURNAMENT_QUESTION: 'tournament_question',
    TOURNAMENT_SET_TIMER: 'tournament_set_timer',
    REDIRECT_TO_TOURNAMENT: 'redirect_to_tournament',

    // Countdown events
    TOURNAMENT_STARTING: 'tournament_starting',
    COUNTDOWN_TICK: 'countdown_tick',
    COUNTDOWN_COMPLETE: 'countdown_complete'
};

// ===== Lobby Events (DEPRECATED - Use GAME_EVENTS.JOIN_GAME instead) =====
export const LOBBY_EVENTS = {
    // Player actions - DEPRECATED
    JOIN_LOBBY: 'join_lobby', // DEPRECATED: Use GAME_EVENTS.JOIN_GAME
    LEAVE_LOBBY: 'leave_lobby', // DEPRECATED: Use GAME_EVENTS.LEAVE_GAME
    GET_PARTICIPANTS: 'get_participants', // DEPRECATED: Use GAME_EVENTS.REQUEST_PARTICIPANTS

    // Server responses - DEPRECATED
    LOBBY_ERROR: 'lobby_error', // DEPRECATED: Use GAME_EVENTS.GAME_ERROR
    PARTICIPANT_JOINED: 'participant_joined', // DEPRECATED: Use GAME_EVENTS.PLAYER_JOINED_GAME
    PARTICIPANT_LEFT: 'participant_left', // DEPRECATED: Use GAME_EVENTS.PLAYER_LEFT_GAME
    PARTICIPANTS_LIST: 'participants_list', // DEPRECATED: Use GAME_EVENTS.GAME_PARTICIPANTS
    ROOM_LEFT: 'room_left', // DEPRECATED: Use GAME_EVENTS.PLAYER_LEFT_GAME
    ROOM_JOINED: 'room_joined', // DEPRECATED: Use GAME_EVENTS.GAME_JOINED
    REDIRECT_TO_GAME: 'redirect_to_game', // DEPRECATED: Use GAME_EVENTS.GAME_JOINED with status
    GAME_STARTED: 'game_started' // DEPRECATED: Use GAME_EVENTS.GAME_STATE_UPDATE
};

// ===== Projector Events =====
export const PROJECTOR_EVENTS = {
    // Projector actions
    JOIN_PROJECTION: 'join_projection',
    LEAVE_PROJECTION: 'leave_projection',

    // Server responses
    PROJECTION_JOINED: 'projection_joined',
    PROJECTION_LEFT: 'projection_left',
    PROJECTION_ERROR: 'projection_error',
    PROJECTION_QUESTION_CHANGED: 'projection_question_changed',
    // PROJECTION_TIMER_UPDATED: 'projection_timer_updated', // DEPRECATED: use DASHBOARD_TIMER_UPDATED
    PROJECTION_CONNECTED_COUNT: 'projection_connected_count',
    PROJECTION_STATE: 'projection_state',
    PROJECTION_LEADERBOARD_UPDATE: 'projection_leaderboard_update', // For real-time leaderboard updates on projection display

    // NEW: Projection content display controls
    PROJECTION_SHOW_STATS: 'projection_show_stats', // Show answer statistics
    PROJECTION_HIDE_STATS: 'projection_hide_stats', // Hide answer statistics
    PROJECTION_CORRECT_ANSWERS: 'projection_correct_answers', // Display correct answers (from teacher trophy button)

    // MODERN: Always sent on join, contains canonical stats state
    PROJECTION_STATS_STATE: 'projection_stats_state',
};

// [MODERNIZATION] Canonical event for projection stats display
// Use PROJECTOR_EVENTS.PROJECTION_SHOW_STATS for event name
// Canonical payload: ProjectionShowStatsPayload (see ./projectionShowStats)
// Canonical Zod schema: ProjectionShowStatsPayloadSchema (see ./projectionShowStats)

// ===== Student/Game Events =====
export const GAME_EVENTS = {
    // Player actions - UNIFIED JOIN FLOW
    JOIN_GAME: 'join_game', // Unified event for both lobby and game joining
    LEAVE_GAME: 'leave_game', // Unified event for leaving (replaces leave_lobby)
    GAME_ANSWER: 'game_answer',
    REQUEST_PARTICIPANTS: 'request_participants',
    REQUEST_NEXT_QUESTION: 'request_next_question',
    START_GAME: 'start_game',

    // Server responses
    GAME_JOINED: 'game_joined',
    PLAYER_JOINED_GAME: 'player_joined_game',
    PLAYER_LEFT_GAME: 'player_left_game', // New event for when player leaves
    GAME_PARTICIPANTS: 'game_participants',
    GAME_QUESTION: 'game_question',
    ANSWER_RECEIVED: 'answer_received',
    ANSWER_FEEDBACK: 'answer_feedback',
    GAME_ENDED: 'game_ended',
    GAME_ERROR: 'game_error',
    GAME_ANSWERS_LOCK_CHANGED: 'game_answers_lock_changed',
    LEADERBOARD_UPDATE: 'leaderboard_update', // For broadcasting leaderboard changes

    // Timer events
    GAME_TIMER_UPDATED: 'game_timer_updated', // Primary backend timer event
    TIMER_UPDATE: 'timer_update',
    GAME_UPDATE: 'game_update',
    TIMER_SET: 'timer_set',

    // Game state events
    GAME_STATE_UPDATE: 'game_state_update',
    CORRECT_ANSWERS: 'correct_answers',
    GAME_ALREADY_PLAYED: 'game_already_played',
    GAME_REDIRECT_TO_LOBBY: 'game_redirect_to_lobby',
    GAME_CODE_UPDATED: 'game_code_updated',
    GAME_FINISHED_REDIRECT: 'game_finished_redirect',

    // Additional events used in live games
    EXPLICATION: 'explication',
    FEEDBACK: 'feedback',
    LIVE_QUESTION: 'live_question',

    // Legacy support for tournaments (also act as game events)
    JOIN_TOURNAMENT: 'join_tournament',
    TOURNAMENT_ANSWER: 'tournament_answer',
    START_TOURNAMENT: 'start_tournament',

    // Connection events (also available in live games)
    CONNECT_TIMEOUT: 'connect_timeout',
    RECONNECT: 'reconnect',
    ERROR: 'error'
};

// Export a combined object for all events
export const SOCKET_EVENTS = {
    TEACHER: TEACHER_EVENTS,
    GAME: GAME_EVENTS,
    TOURNAMENT: TOURNAMENT_EVENTS,
    LOBBY: LOBBY_EVENTS,
    PROJECTOR: PROJECTOR_EVENTS,

    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    CONNECTION_ESTABLISHED: 'connection_established'
};
