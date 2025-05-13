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
    texte?: string;
    text?: string;
    question?: string;
    type?: string;
    reponses?: Array<AnswerLike>;
    answers?: Array<AnswerLike>;
    temps?: number;
    explication?: string;
    theme?: string;
    discipline?: string;
    difficulte?: number;
    niveau?: string | string[];
    correct?: boolean | number[];
    hidden?: boolean;
    titre?: string;
    title?: string;
}

// Define an AnswerLike type for answers with different property names
export interface AnswerLike {
    texte?: string;
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
        texte: input.texte || input.question || input.text || '',
        type: input.type || 'choix_simple',
    };

    // Handle answers/reponses with consistent property names
    if (Array.isArray(input.reponses)) {
        question.reponses = input.reponses.map(mapToStandardAnswer);
    } else if (Array.isArray(input.answers)) {
        question.answers = input.answers.map(mapToStandardAnswer);
        // Also set reponses for compatibility
        question.reponses = question.answers;
    }

    // Handle optional properties
    if (input.temps !== undefined) question.temps = input.temps;
    if (input.explication !== undefined) question.explication = input.explication;
    if (input.theme !== undefined) question.theme = input.theme;
    if (input.discipline !== undefined) question.discipline = input.discipline;
    if (input.difficulte !== undefined) question.difficulte = input.difficulte;
    if (input.niveau !== undefined) question.niveau = input.niveau;
    if (input.correct !== undefined) question.correct = input.correct;
    if (input.hidden !== undefined) question.hidden = input.hidden;
    if (input.titre !== undefined || input.title !== undefined) {
        question.title = input.titre || input.title;
    }

    // If question.texte was used as the source, also set question.question for compatibility
    if (input.texte && !question.question) {
        question.question = input.texte;
    }

    return question;
}

/**
 * Maps an answer-like object to a standard Answer object
 */
export function mapToStandardAnswer(input: AnswerLike): Answer {
    return {
        texte: input.texte || input.text || '',
        correct: input.correct === true
    };
}

/**
 * Creates a deep clone of a question object
 */
export function cloneQuestion<T extends BaseQuestion>(question: T): T {
    const clone = { ...question };

    if (Array.isArray(question.reponses)) {
        clone.reponses = question.reponses.map(answer => ({ ...answer }));
    }

    return clone;
}
