"use strict";
/**
 * Game Timing Constants
 *
 * Centralized timing constants for game flow, feedback, and progression.
 * These values control the pacing and user experience during gameplay.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_TIMING = void 0;
exports.getCorrectAnswersDisplayTime = getCorrectAnswersDisplayTime;
exports.getFeedbackDisplayTime = getFeedbackDisplayTime;
/**
 * Game timing constants used throughout the application
 */
exports.GAME_TIMING = {
    /**
     * Time to show correct answers before moving to next question or feedback (in seconds)
     * All modes use 1.5s for consistent user experience
     */
    CORRECT_ANSWERS_DISPLAY: {
        TOURNAMENT: 1.5,
        QUIZ: 1.5,
        PRACTICE: 1.5,
        CLASS: 1.5
    },
    /**
     * Default feedback wait time when question.feedbackWaitTime is null (in seconds)
     * This is the duration for showing explanations and feedback
     */
    FEEDBACK_DISPLAY: {
        DEFAULT: 5,
        MINIMUM: 1,
        MAXIMUM: 30
    },
    /**
     * Timer-related constants
     */
    TIMER: {
        /** Default question time limit (in seconds) */
        DEFAULT_QUESTION_TIME: 30,
        /** Minimum time limit (in seconds) */
        MINIMUM_TIME: 5,
        /** Maximum time limit (in seconds) */
        MAXIMUM_TIME: 300
    }
};
/**
 * Helper function to get correct answers display time for a play mode
 */
function getCorrectAnswersDisplayTime(playMode) {
    return exports.GAME_TIMING.CORRECT_ANSWERS_DISPLAY[playMode.toUpperCase()] || exports.GAME_TIMING.CORRECT_ANSWERS_DISPLAY.QUIZ;
}
/**
 * Helper function to get feedback display time, using question's feedbackWaitTime or default
 */
function getFeedbackDisplayTime(questionFeedbackWaitTime) {
    if (typeof questionFeedbackWaitTime === 'number' && questionFeedbackWaitTime > 0) {
        return Math.min(Math.max(questionFeedbackWaitTime, exports.GAME_TIMING.FEEDBACK_DISPLAY.MINIMUM), exports.GAME_TIMING.FEEDBACK_DISPLAY.MAXIMUM);
    }
    return exports.GAME_TIMING.FEEDBACK_DISPLAY.DEFAULT;
}
