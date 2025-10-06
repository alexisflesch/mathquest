/**
 * Question types for the Teacher Question Editor
 * Based on the YAML question format used in the app
 */

export type QuestionType = 'numeric' | 'single_choice' | 'multiple_choice';

export interface BaseEditorQuestion {
    uid: string;
    author?: string;
    discipline?: string;
    title?: string;
    text: string;
    questionType: QuestionType;
    themes?: string[];
    tags?: string[];
    timeLimit?: number;
    difficulty?: number;
    gradeLevel?: string;
    explanation?: string;
    feedbackWaitTime?: number;
}

export interface NumericQuestion extends BaseEditorQuestion {
    questionType: 'numeric';
    correctAnswer: number;
}

export interface MultipleChoiceQuestion extends BaseEditorQuestion {
    questionType: 'single_choice' | 'multiple_choice';
    answerOptions: string[];
    correctAnswers: boolean[];
}

export type EditorQuestion = NumericQuestion | MultipleChoiceQuestion;

/**
 * Utility functions for question validation and conversion
 */
export const isNumericQuestion = (question: EditorQuestion): question is NumericQuestion => {
    return question.questionType === 'numeric';
};

export const isMultipleChoiceQuestion = (question: EditorQuestion): question is MultipleChoiceQuestion => {
    return question.questionType === 'single_choice' || question.questionType === 'multiple_choice';
};

/**
 * Convert EditorQuestion to YAML-compatible format
 */
export const questionToYaml = (question: EditorQuestion): any => {
    const base = {
        uid: question.uid,
        author: question.author || 'Teacher',
        discipline: question.discipline || 'Unknown',
        title: question.title || '',
        text: question.text,
        questionType: question.questionType,
        themes: question.themes || [],
        tags: question.tags || [],
        timeLimit: question.timeLimit || 30,
        difficulty: question.difficulty || 1,
        gradeLevel: question.gradeLevel || 'CE1',
        explanation: question.explanation || '',
        feedbackWaitTime: question.feedbackWaitTime || 15,
    };

    if (isNumericQuestion(question)) {
        return {
            ...base,
            correctAnswer: question.correctAnswer,
        };
    } else {
        return {
            ...base,
            answerOptions: question.answerOptions,
            correctAnswers: question.correctAnswers,
        };
    }
};

/**
 * Create a new empty question with default values
 */
export const createEmptyQuestion = (uid?: string): EditorQuestion => {
    const questionUid = uid || `question-${Date.now()}`;
    return {
        uid: questionUid,
        author: 'Teacher',
        discipline: 'Mathématiques',
        title: 'Nouvelle question',
        // Leave the stored text empty by default; helper/placeholder text is shown in the editor UI
        text: '',
        questionType: 'numeric',
        themes: [],
        tags: [],
        timeLimit: 30,
        difficulty: 1,
        gradeLevel: 'CP',
        explanation: '',
        feedbackWaitTime: 15,
        correctAnswer: 0,
    };
};