"use strict";
/**
 * Socket Event Constants
 *
 * This file contains constants for all socket event names used in the application.
 * Using these constants ensures consistency between frontend and backend.
 *
 * Updated to align with the new backend socket event naming conventions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.GAME_EVENTS = exports.PROJECTOR_EVENTS = exports.LOBBY_EVENTS = exports.TOURNAMENT_EVENTS = exports.TEACHER_EVENTS = void 0;
// ===== Teacher Dashboard Events =====
exports.TEACHER_EVENTS = {
    // Connection and state
    JOIN_DASHBOARD: 'join_dashboard',
    GET_GAME_STATE: 'get_game_state',
    // Question control
    SET_QUESTION: 'set_question',
    // Timer control
    TIMER_ACTION: 'quiz_timer_action',
    START_TIMER: 'start_timer',
    PAUSE_TIMER: 'pause_timer',
    // Game control
    LOCK_ANSWERS: 'lock_answers',
    END_GAME: 'end_game',
    // Broadcast events (from server to client)
    GAME_CONTROL_STATE: 'game_control_state',
    DASHBOARD_JOINED: 'dashboard_joined',
    TIMER_UPDATE: 'quiz_timer_update',
    CONNECTED_COUNT: 'quiz_connected_count',
    // Dashboard-specific events
    DASHBOARD_QUESTION_CHANGED: 'dashboard_question_changed',
    DASHBOARD_TIMER_UPDATED: 'dashboard_timer_updated',
    DASHBOARD_ANSWERS_LOCK_CHANGED: 'dashboard_answers_lock_changed',
    DASHBOARD_GAME_STATUS_CHANGED: 'dashboard_game_status_changed',
    // Error handling
    ERROR_DASHBOARD: 'error_dashboard'
};
// ===== Tournament Events =====
exports.TOURNAMENT_EVENTS = {
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
    REDIRECT_TO_TOURNAMENT: 'redirect_to_tournament'
};
// ===== Lobby Events =====
exports.LOBBY_EVENTS = {
    // Player actions
    JOIN_LOBBY: 'join_lobby',
    LEAVE_LOBBY: 'leave_lobby',
    GET_PARTICIPANTS: 'get_participants',
    // Server responses
    LOBBY_ERROR: 'lobby_error',
    PARTICIPANT_JOINED: 'participant_joined',
    PARTICIPANT_LEFT: 'participant_left',
    PARTICIPANTS_LIST: 'participants_list',
    REDIRECT_TO_GAME: 'redirect_to_game',
    GAME_STARTED: 'game_started',
    REDIRECT_TO_QUIZ: 'redirect_to_quiz'
};
// ===== Projector Events =====
exports.PROJECTOR_EVENTS = {
    // Projector actions
    JOIN_PROJECTOR: 'join_projector',
    LEAVE_PROJECTOR: 'leave_projector',
    // Server responses
    PROJECTOR_STATE: 'projector_state',
    PROJECTION_TIMER_UPDATED: 'projection_timer_updated',
    PROJECTOR_CONNECTED_COUNT: 'projector_connected_count',
    JOINED_ROOM: 'joined_room'
};
// ===== Student/Game Events =====
exports.GAME_EVENTS = {
    // Player actions
    JOIN_GAME: 'join_game',
    GAME_ANSWER: 'game_answer',
    REQUEST_PARTICIPANTS: 'request_participants',
    REQUEST_NEXT_QUESTION: 'request_next_question',
    START_GAME: 'start_game',
    // Server responses
    GAME_JOINED: 'game_joined',
    PLAYER_JOINED_GAME: 'player_joined_game',
    GAME_PARTICIPANTS: 'game_participants',
    GAME_QUESTION: 'game_question',
    ANSWER_RECEIVED: 'answer_received',
    GAME_ENDED: 'game_ended',
    GAME_ERROR: 'game_error',
    GAME_ANSWERS_LOCK_CHANGED: 'game_answers_lock_changed',
    // Timer events
    GAME_TIMER_UPDATED: 'game_timer_updated', // Primary backend timer event
    TIMER_UPDATE: 'timer_update',
    GAME_UPDATE: 'game_update',
    TIMER_SET: 'timer_set',
    // Game state events
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
exports.SOCKET_EVENTS = {
    TEACHER: exports.TEACHER_EVENTS,
    GAME: exports.GAME_EVENTS,
    TOURNAMENT: exports.TOURNAMENT_EVENTS,
    LOBBY: exports.LOBBY_EVENTS,
    PROJECTOR: exports.PROJECTOR_EVENTS,
    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error'
};
