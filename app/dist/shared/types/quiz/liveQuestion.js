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
        timeLimit: questionObject.timeLimit, // MANDATORY
        gradeLevel: questionObject.gradeLevel,
        difficulty: questionObject.difficulty,
        themes: questionObject.themes,
    };
    // Handle multiple choice and single choice questions
    if (questionObject.questionType === 'multipleChoice' || questionObject.defaultMode === 'multipleChoice' ||
        questionObject.questionType === 'singleChoice' || questionObject.defaultMode === 'singleChoice') {
        const answerOptions = questionObject.multipleChoiceQuestion?.answerOptions;
        if (!answerOptions) {
            throw new Error(`Multiple/single choice question ${questionObject.uid} is missing answer options`);
        }
        return {
            ...baseQuestion,
            multipleChoiceQuestion: {
                answerOptions: answerOptions
            }
        };
    }
    // Handle numeric questions
    if (questionObject.questionType === 'numeric' || questionObject.defaultMode === 'numeric') {
        const unit = questionObject.numericQuestion?.unit;
        const result = {
            ...baseQuestion,
            numericQuestion: {
                // Convert null to undefined for Zod compatibility
                ...(unit !== null && unit !== undefined ? { unit } : {})
            }
        };
        return result;
    }
    // For other question types
    return baseQuestion;
}
