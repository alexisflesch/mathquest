/**
 * Socket Event Constants
 *
 * This file contains constants for all socket event names used in the application.
 * Using these constants ensures consistency between frontend and backend.
 */
export declare const QUIZ_EVENTS: {
    SET_QUESTION: string;
    TIMER_ACTION: string;
    SET_TIMER: string;
    LOCK_UNLOCK: string;
    END_QUIZ: string;
    CLOSE_QUESTION: string;
    PAUSE_RESUME: string;
    GET_STATE: string;
    JOIN: string;
    SUBMIT_ANSWER: string;
    STATE_UPDATE: string;
    PLAYER_JOINED: string;
    ANSWER_RECEIVED: string;
    QUESTION_CLOSED: string;
    QUIZ_ENDED: string;
    TIMER_UPDATE: string;
};
export declare const TOURNAMENT_EVENTS: {
    START: string;
    PAUSE: string;
    RESUME: string;
    END: string;
    JOIN: string;
    SUBMIT_ANSWER: string;
    PLAYER_JOINED: string;
    STATE_UPDATE: string;
    QUESTION_UPDATE: string;
    LEADERBOARD_UPDATE: string;
    TOURNAMENT_ENDED: string;
    TIMER_UPDATE: string;
};
export declare const LOBBY_EVENTS: {
    CREATE_QUIZ: string;
    CREATE_TOURNAMENT: string;
    LIST_ACTIVE: string;
    QUIZ_CREATED: string;
    TOURNAMENT_CREATED: string;
    ACTIVE_LIST: string;
};
export declare const SOCKET_EVENTS: {
    QUIZ: {
        SET_QUESTION: string;
        TIMER_ACTION: string;
        SET_TIMER: string;
        LOCK_UNLOCK: string;
        END_QUIZ: string;
        CLOSE_QUESTION: string;
        PAUSE_RESUME: string;
        GET_STATE: string;
        JOIN: string;
        SUBMIT_ANSWER: string;
        STATE_UPDATE: string;
        PLAYER_JOINED: string;
        ANSWER_RECEIVED: string;
        QUESTION_CLOSED: string;
        QUIZ_ENDED: string;
        TIMER_UPDATE: string;
    };
    TOURNAMENT: {
        START: string;
        PAUSE: string;
        RESUME: string;
        END: string;
        JOIN: string;
        SUBMIT_ANSWER: string;
        PLAYER_JOINED: string;
        STATE_UPDATE: string;
        QUESTION_UPDATE: string;
        LEADERBOARD_UPDATE: string;
        TOURNAMENT_ENDED: string;
        TIMER_UPDATE: string;
    };
    LOBBY: {
        CREATE_QUIZ: string;
        CREATE_TOURNAMENT: string;
        LIST_ACTIVE: string;
        QUIZ_CREATED: string;
        TOURNAMENT_CREATED: string;
        ACTIVE_LIST: string;
    };
    CONNECT: string;
    DISCONNECT: string;
    CONNECT_ERROR: string;
};
