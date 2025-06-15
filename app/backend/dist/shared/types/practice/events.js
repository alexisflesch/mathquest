"use strict";
/**
 * Practice Session Socket Events
 *
 * Defines socket event types and payloads for practice mode functionality.
 * These events are completely separate from game events to ensure clean
 * architecture and prevent mixing of concerns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRACTICE_EVENTS = void 0;
/**
 * Practice-specific socket event names
 * Using PRACTICE_ prefix to distinguish from game events
 */
exports.PRACTICE_EVENTS = {
    // Client to Server Events
    START_PRACTICE_SESSION: 'START_PRACTICE_SESSION',
    SUBMIT_PRACTICE_ANSWER: 'SUBMIT_PRACTICE_ANSWER',
    REQUEST_PRACTICE_FEEDBACK: 'REQUEST_PRACTICE_FEEDBACK',
    GET_NEXT_PRACTICE_QUESTION: 'GET_NEXT_PRACTICE_QUESTION',
    RETRY_PRACTICE_QUESTION: 'RETRY_PRACTICE_QUESTION',
    END_PRACTICE_SESSION: 'END_PRACTICE_SESSION',
    GET_PRACTICE_SESSION_STATE: 'GET_PRACTICE_SESSION_STATE',
    // Server to Client Events
    PRACTICE_SESSION_CREATED: 'PRACTICE_SESSION_CREATED',
    PRACTICE_QUESTION_READY: 'PRACTICE_QUESTION_READY',
    PRACTICE_ANSWER_SUBMITTED: 'PRACTICE_ANSWER_SUBMITTED',
    PRACTICE_ANSWER_FEEDBACK: 'PRACTICE_ANSWER_FEEDBACK',
    PRACTICE_SESSION_COMPLETED: 'PRACTICE_SESSION_COMPLETED',
    PRACTICE_SESSION_ERROR: 'PRACTICE_SESSION_ERROR',
    PRACTICE_SESSION_STATE: 'PRACTICE_SESSION_STATE',
};
