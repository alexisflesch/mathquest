"use strict";
/**
 * Shared Tournament Question Types
 *
 * These types represent tournament-specific question structures used across frontend components.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTournamentQuestion = isTournamentQuestion;
exports.getQuestionUid = getQuestionUid;
exports.getQuestionText = getQuestionText;
exports.getQuestionAnswers = getQuestionAnswers;
/**
 * Type guard to check if a question object is a TournamentQuestion
 */
function isTournamentQuestion(data) {
    if (!data || typeof data !== 'object')
        return false;
    const q = data;
    return (
    // Must have a question field of one of the expected types
    q.question !== undefined &&
        (typeof q.question === 'string' ||
            (typeof q.question === 'object' && q.question !== null)));
}
/**
 * Helper function to extract question UID from various question formats
 */
function getQuestionUid(tournamentQuestion) {
    // Check if uid is directly available
    if (tournamentQuestion.uid) {
        return tournamentQuestion.uid;
    }
    // Extract from question object
    const { question } = tournamentQuestion;
    if (typeof question === 'object' && question !== null) {
        if ('uid' in question && typeof question.uid === 'string') {
            return question.uid;
        }
    }
    return undefined;
}
/**
 * Helper function to extract question text from various question formats
 */
function getQuestionText(tournamentQuestion) {
    const { question } = tournamentQuestion;
    if (typeof question === 'string') {
        return question;
    }
    if (typeof question === 'object' && question !== null) {
        if ('text' in question && typeof question.text === 'string') {
            return question.text;
        }
        // Fallback for legacy 'question' field
        if ('question' in question && typeof question.question === 'string') {
            return question.question;
        }
    }
    return 'Question text not available';
}
/**
 * Helper function to extract answer options from various question formats
 */
function getQuestionAnswers(tournamentQuestion) {
    // Check direct answers field first
    if (Array.isArray(tournamentQuestion.answers)) {
        return tournamentQuestion.answers;
    }
    // Extract from question object
    const { question } = tournamentQuestion;
    if (typeof question === 'object' && question !== null) {
        // For FilteredQuestion
        if ('answers' in question && Array.isArray(question.answers)) {
            return question.answers;
        }
        // For QuestionData
        if ('answerOptions' in question && Array.isArray(question.answerOptions)) {
            return question.answerOptions;
        }
    }
    return [];
}
