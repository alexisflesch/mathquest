"use strict";
/**
 * quizState.ts - Quiz State Management
 *
 * This module provides a centralized in-memory state store for all active quizzes.
 * It maintains information about:
 * - Active questions
 * - Timer states
 * - Teacher socket associations
 * - Participation statistics
 *
 * The state is structured as a map where:
 * - Keys are quiz IDs
 * - Values are quiz state objects containing current status information
 *
 * This state is used by both the quiz handlers and tournament handlers
 * to coordinate the teacher dashboard and student views.
 *
 * UPDATED: Now includes per-question timer tracking to store individual
 * timer states for each question in a quiz.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizState = void 0;
exports.createDefaultQuestionTimer = createDefaultQuestionTimer;
exports.getQuestionTimer = getQuestionTimer;
const quizState = {};
exports.quizState = quizState;
/**
 * Creates a default question timer state object
 * @param initialTime - Initial time for the timer in seconds
 * @returns Question timer state object
 */
function createDefaultQuestionTimer(initialTime = 20) {
    return {
        status: 'stop', // 'play', 'pause', or 'stop'
        timeLeft: initialTime, // Time left in seconds
        initialTime, // Initial time in seconds
        timestamp: null, // Timestamp of last status change
    };
}
/**
 * Gets the timer state for a specific question, creating it if it doesn't exist
 * @param quizId - The quiz ID
 * @param questionId - The question ID
 * @returns Question timer state object
 */
function getQuestionTimer(quizId, questionId) {
    var _a;
    if (!quizState[quizId]) {
        return null;
    }
    // Initialize questionTimers object if it doesn't exist
    if (!quizState[quizId].questionTimers) {
        quizState[quizId].questionTimers = {};
    }
    // Create timer for this question if it doesn't exist
    if (!((_a = quizState[quizId].questionTimers) === null || _a === void 0 ? void 0 : _a[questionId])) {
        // Try to get the initial time from the question definition
        let initialTime = 20; // Default
        if (quizState[quizId].questions) {
            const question = quizState[quizId].questions.find(q => q.uid === questionId);
            if (question && typeof question.time === 'number') {
                initialTime = question.time;
            }
        }
        quizState[quizId].questionTimers[questionId] = createDefaultQuestionTimer(initialTime);
    }
    return quizState[quizId].questionTimers[questionId];
}
/**
 * Wraps a quiz state object with a setter for currentQuestionUid that logs every assignment
 * @param quizId
 * @param state
 */
function wrapQuizStateWithCurrentQuestionUidLogger(quizId, state) {
    var _a;
    if (!state || ((_a = Object.getOwnPropertyDescriptor(state, 'currentQuestionUid')) === null || _a === void 0 ? void 0 : _a.set))
        return;
    let _currentQuestionUid = state.currentQuestionUid;
    Object.defineProperty(state, 'currentQuestionUid', {
        get() { return _currentQuestionUid; },
        set(value) {
            // Using dynamic require to maintain the original functionality
            // In TypeScript we would ideally import this at the top
            const logger = require('../../logger')("QuizState");
            logger.debug(`[GLOBAL] Set currentQuestionUid = ${value} for quizId=${quizId} (stack: ${new Error().stack})`);
            _currentQuestionUid = value;
        },
        configurable: true,
        enumerable: true
    });
}
// Patch: Wrap every new quizState object with the logger
Object.defineProperty(quizState, 'wrapWithLogger', {
    value: wrapQuizStateWithCurrentQuestionUidLogger,
    enumerable: false
});
// For CommonJS compatibility
const exportsObject = {
    quizState,
    createDefaultQuestionTimer,
    getQuestionTimer,
    // Note: wrapQuizStateWithCurrentQuestionUidLogger is not typically exported directly
    // as it's an internal mechanism applied via Object.defineProperty.
    // If it needs to be callable from JS, it should be explicitly added here.
};
if (typeof module !== 'undefined' && module.exports) {
    Object.assign(module.exports, exportsObject);
    // @ts-ignore
    module.exports.default = exportsObject; // For default export pattern
}
