/**
 * quizState.js - Quiz State Management
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

const quizState = {};

/**
 * Creates a default question timer state object
 * @param {number} initialTime - Initial time for the timer in seconds
 * @returns {Object} Question timer state object
 */
function createDefaultQuestionTimer(initialTime = 20) {
    return {
        status: 'stop',        // 'play', 'pause', or 'stop'
        timeLeft: initialTime, // Time left in seconds
        initialTime,           // Initial time in seconds
        timestamp: null,       // Timestamp of last status change
    };
}

/**
 * Gets the timer state for a specific question, creating it if it doesn't exist
 * @param {string} quizId - The quiz ID
 * @param {string} questionId - The question ID
 * @returns {Object} Question timer state object
 */
function getQuestionTimer(quizId, questionId) {
    if (!quizState[quizId]) {
        return null;
    }

    // Initialize questionTimers object if it doesn't exist
    if (!quizState[quizId].questionTimers) {
        quizState[quizId].questionTimers = {};
    }

    // Create timer for this question if it doesn't exist
    if (!quizState[quizId].questionTimers[questionId]) {
        // Try to get the initial time from the question definition
        let initialTime = 20; // Default

        if (quizState[quizId].questions) {
            const question = quizState[quizId].questions.find(q => q.uid === questionId);
            if (question && typeof question.temps === 'number') {
                initialTime = question.temps;
            }
        }

        quizState[quizId].questionTimers[questionId] = createDefaultQuestionTimer(initialTime);
    }

    return quizState[quizId].questionTimers[questionId];
}

module.exports = { quizState, createDefaultQuestionTimer, getQuestionTimer };
