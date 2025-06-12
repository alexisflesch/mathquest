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
        type: questionObject.questionType || questionObject.type,
        text: questionObject.text,
        answers: questionObject.answerOptions || questionObject.answers || [],
        // Additional properties for frontend compatibility
        questionType: questionObject.questionType || questionObject.type,
        answerOptions: questionObject.answerOptions || questionObject.answers || [],
        explanation: questionObject.explanation,
        correctAnswers: questionObject.correctAnswers,
        timeLimit: questionObject.timeLimit,
        gradeLevel: questionObject.gradeLevel,
        difficulty: questionObject.difficulty,
        themes: questionObject.themes,
    };
}
