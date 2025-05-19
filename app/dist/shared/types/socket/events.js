/**
 * Socket Event Constants
 *
 * This file contains constants for all socket event names used in the application.
 * Using these constants ensures consistency between frontend and backend.
 */
// ===== Quiz Events =====
export const QUIZ_EVENTS = {
    // Teacher events
    SET_QUESTION: 'quiz_set_question',
    TIMER_ACTION: 'quiz_timer_action',
    SET_TIMER: 'quiz_set_timer',
    LOCK_UNLOCK: 'quiz_lock_unlock',
    END_QUIZ: 'quiz_end',
    CLOSE_QUESTION: 'quiz_close_question',
    PAUSE_RESUME: 'quiz_pause_resume',
    GET_STATE: 'quiz_get_state',
    // Student events
    JOIN: 'quiz_join',
    SUBMIT_ANSWER: 'quiz_submit_answer',
    // Broadcast events
    STATE_UPDATE: 'quiz_state_update',
    PLAYER_JOINED: 'quiz_player_joined',
    ANSWER_RECEIVED: 'quiz_answer_received',
    QUESTION_CLOSED: 'quiz_question_closed',
    QUIZ_ENDED: 'quiz_ended',
    TIMER_UPDATE: 'quiz_timer_update'
};
// ===== Tournament Events =====
export const TOURNAMENT_EVENTS = {
    // Teacher events
    START: 'tournament_start',
    PAUSE: 'tournament_pause',
    RESUME: 'tournament_resume',
    END: 'tournament_end',
    // Student events
    JOIN: 'tournament_join',
    SUBMIT_ANSWER: 'tournament_submit_answer',
    // Broadcast events
    PLAYER_JOINED: 'tournament_player_joined',
    STATE_UPDATE: 'tournament_state_update',
    QUESTION_UPDATE: 'tournament_question_update',
    LEADERBOARD_UPDATE: 'tournament_leaderboard_update',
    TOURNAMENT_ENDED: 'tournament_ended',
    TIMER_UPDATE: 'tournament_timer_update'
};
// ===== Lobby Events =====
export const LOBBY_EVENTS = {
    CREATE_QUIZ: 'lobby_create_quiz',
    CREATE_TOURNAMENT: 'lobby_create_tournament',
    LIST_ACTIVE: 'lobby_list_active',
    QUIZ_CREATED: 'lobby_quiz_created',
    TOURNAMENT_CREATED: 'lobby_tournament_created',
    ACTIVE_LIST: 'lobby_active_list'
};
// Export a combined object for all events
export const SOCKET_EVENTS = {
    QUIZ: QUIZ_EVENTS,
    TOURNAMENT: TOURNAMENT_EVENTS,
    LOBBY: LOBBY_EVENTS,
    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error'
};
