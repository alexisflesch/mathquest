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
 */

const quizState = {};

module.exports = quizState;
