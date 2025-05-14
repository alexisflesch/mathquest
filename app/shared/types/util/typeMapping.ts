/**
 * Type Mapping Utilities
 * 
 * This file contains utilities for mapping between different structures
 * of similar types, helping to handle inconsistencies between frontend
 * and backend representations of the same entities.
 */

import { Question } from '../quiz/question';
import { BaseQuestion, Answer } from '../question';

// Define a QuestionLike type that encompasses the various input shapes we might receive
export interface QuestionLike {
    id?: string;
    uid?: string;
    text?: string;
    type?: string;
    responses?: Array<AnswerLike>;
    time?: number;
    explanation?: string;
    theme?: string;
    discipline?: string;
    difficulty?: number;
    level?: string | string[];
    correct?: boolean | number[];
    hidden?: boolean;
    title?: string;
}

// Define an AnswerLike type for answers with different property names
export interface AnswerLike {
    text?: string;
    correct?: boolean;
}

/**
 * Maps a question-like object to a standard Question object,
 * handling property name inconsistencies
 */
export function mapToStandardQuestion(input: QuestionLike): Question {
    // Start with the essential properties
    const question: Question = {
        uid: input.uid || input.id || '',
        text: input.text || '',
        type: input.type || 'choix_simple', // Retaining 'choix_simple' as it's a string literal value, not a property name
    } as Question; // Cast to Question to satisfy stricter checks temporarily

    // Handle responses/answers with consistent property names
    if (Array.isArray(input.responses)) {
        (question as any).responses = input.responses.map(mapToStandardAnswer);
    }

    // Handle optional properties
    if (input.time !== undefined) (question as any).time = input.time;
    if (input.explanation !== undefined) (question as any).explanation = input.explanation;
    if (input.theme !== undefined) (question as any).theme = input.theme;
    if (input.discipline !== undefined) (question as any).discipline = input.discipline;
    if (input.difficulty !== undefined) (question as any).difficulty = input.difficulty;
    if (input.level !== undefined) (question as any).level = input.level;
    if (input.correct !== undefined) (question as any).correct = input.correct;
    if (input.hidden !== undefined) (question as any).hidden = input.hidden;
    if (input.title !== undefined) {
        (question as any).title = input.title;
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
export function mapToStandardAnswer(input: AnswerLike): Answer {
    return {
        text: input.text || '',
        correct: input.correct === true
    };
}

/**
 * Creates a deep clone of a question object
 */
export function cloneQuestion<T extends BaseQuestion>(question: T): T {
    const clone = { ...question } as T;

    if (Array.isArray((question as BaseQuestion).answers)) {
        (clone as BaseQuestion).answers = (question as BaseQuestion).answers!.map((answer: Answer) => ({ ...answer }));
    }

    return clone;
}
