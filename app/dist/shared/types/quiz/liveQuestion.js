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
 * Handles both polymorphic and legacy question formats.
 *
 * @param questionObject - The question object from the database (Prisma format)
 * @returns FilteredQuestion - The question data safe for client emission
 */
function filterQuestionForClient(questionObject) {
    if (!questionObject) {
        throw new Error('Cannot filter null or undefined question object');
    }
    const baseQuestion = {
        uid: questionObject.uid,
        questionType: questionObject.questionType || questionObject.defaultMode,
        text: questionObject.text,
        // Additional properties for frontend compatibility
        timeLimit: questionObject.timeLimit,
        gradeLevel: questionObject.gradeLevel,
        difficulty: questionObject.difficulty,
        themes: questionObject.themes,
    };
    // Handle polymorphic structure: extract answerOptions from multipleChoiceQuestion
    if (questionObject.multipleChoiceQuestion?.answerOptions) {
        return {
            ...baseQuestion,
            answerOptions: questionObject.multipleChoiceQuestion.answerOptions,
        };
    }
    // Handle legacy structure: answerOptions directly on question
    if (questionObject.answerOptions) {
        return {
            ...baseQuestion,
            answerOptions: questionObject.answerOptions,
        };
    }
    // For numeric questions or questions without answer options
    return baseQuestion;
}
