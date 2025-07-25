"use strict";
/**
 * Shared LiveQuestion Types
 *
 * These types represent the standardized question payload structure used for live events
 * (sent to clients during live tournaments/quizzes).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterQuestionForClient = filterQuestionForClient;
/**
 * Filters a database question object to only include data safe to send to clients.
 * Uses the canonical database format with answerOptions.
 *
 * @param questionObject - The question object from the database (Prisma format)
 * @returns FilteredQuestion - The question data safe for client emission
 */
function filterQuestionForClient(questionObject) {
    if (!questionObject) {
        throw new Error('Cannot filter null or undefined question object');
    }
    return {
        uid: questionObject.uid,
        questionType: questionObject.questionType || questionObject.defaultMode,
        text: questionObject.text,
        answerOptions: questionObject.answerOptions || [],
        // Additional properties for frontend compatibility
        timeLimit: questionObject.timeLimit,
        gradeLevel: questionObject.gradeLevel,
        difficulty: questionObject.difficulty,
        themes: questionObject.themes,
        // Note: correctAnswers and explanation are intentionally excluded for security
    };
}
