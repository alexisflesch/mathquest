/**
 * Type Mapping Utilities
 *
 * This file contains utilities for mapping between different structures
 * of similar types, helping to handle inconsistencies between frontend
 * and backend representations of the same entities.
 */
/**
 * Maps a question-like object to a standard Question object,
 * handling property name inconsistencies
 */
export function mapToStandardQuestion(input) {
    // Start with the essential properties
    const question = {
        uid: input.uid || input.id || '',
        text: input.text || '',
        type: input.type || 'choix_simple', // Retaining 'choix_simple' as it's a string literal value, not a property name
    }; // Cast to Question to satisfy stricter checks temporarily
    // Handle responses/answers with consistent property names
    if (Array.isArray(input.responses)) {
        question.responses = input.responses.map(mapToStandardAnswer);
    }
    // Handle optional properties
    if (input.time !== undefined)
        question.time = input.time;
    if (input.explanation !== undefined)
        question.explanation = input.explanation;
    if (input.theme !== undefined)
        question.theme = input.theme;
    if (input.discipline !== undefined)
        question.discipline = input.discipline;
    if (input.difficulty !== undefined)
        question.difficulty = input.difficulty;
    if (input.level !== undefined)
        question.level = input.level;
    if (input.correct !== undefined)
        question.correct = input.correct;
    if (input.hidden !== undefined)
        question.hidden = input.hidden;
    if (input.title !== undefined) {
        question.title = input.title;
    }
    // This mapping is complex due to the evolving nature of the Question type.
    // It might need to be adjusted once the Question type definition is finalized.
    // For now, we ensure that if the input had a 'text' field, it's mapped to 'text'.
    // If the final Question type also has a 'question' field, that might need separate handling.
    return question;
}
/**
 * Maps an answer-like object to a standard Answer object
 */
export function mapToStandardAnswer(input) {
    return {
        text: input.text || '',
        correct: input.correct === true
    };
}
/**
 * Creates a deep clone of a question object
 */
export function cloneQuestion(question) {
    const clone = Object.assign({}, question);
    if (Array.isArray(question.answers)) {
        clone.answers = question.answers.map((answer) => (Object.assign({}, answer)));
    }
    return clone;
}
