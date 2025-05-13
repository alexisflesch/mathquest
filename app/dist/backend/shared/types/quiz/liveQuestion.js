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
 * Filters a full question object to only include data safe to send to clients.
 *
 * @param questionObject - The full question object from the database or state
 * @returns FilteredQuestion - The question data safe for client emission
 */
function filterQuestionForClient(questionObject) {
    if (!questionObject) {
        throw new Error('Cannot filter null or undefined question object');
    }
    return {
        uid: questionObject.uid,
        type: questionObject.type,
        texte: questionObject.texte || questionObject.question || 'Question text not available',
        reponses: (Array.isArray(questionObject.reponses)
            ? questionObject.reponses
            : (Array.isArray(questionObject.answers) ? questionObject.answers : [])).map(r => r.texte)
    };
}
