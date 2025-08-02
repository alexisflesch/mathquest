/**
 * Shared LiveQuestion Types
 * 
 * These types represent the standardized question payload structure used for live events
 * (sent to clients during live tournaments/quizzes).
 */

import { GameTimerState } from '../core/timer';

/**
 * Filtered question data (without correct answer information)
 */
export interface FilteredQuestion {
    uid: string;
    text: string;             // The question text
    questionType: string;     // Question type (multiple-choice, numeric, etc.)
    timeLimit: number;        // Time limit for this question (MANDATORY)

    // Polymorphic question data (student doesn't get correct answers)
    multipleChoiceQuestion?: {
        answerOptions: string[];
    };
    numericQuestion?: {
        unit?: string;
    };

    // Additional properties required by frontend components (non-sensitive)
    gradeLevel?: string;        // Grade level of the question
    difficulty?: number;        // Difficulty rating
    themes?: string[];          // Question themes/categories
    // Note: correctAnswers, correctAnswer, tolerance and explanation are intentionally excluded for security
}

/**
 * Standardized question payload for live events (sent to students/projector)
 */
export interface LiveQuestionPayload {
    question: FilteredQuestion;   // The filtered question object
    timer?: GameTimerState;       // Timer state for this question
    questionIndex?: number;       // Index of the current question (0-based)
    totalQuestions?: number;      // Total number of questions
    questionState?: 'pending' | 'active' | 'paused' | 'stopped' | 'finished';
    modeSpecificData?: {          // Additional data specific to quiz/tournament mode
        tournoiState?: 'pending' | 'running' | 'paused' | 'stopped' | 'finished';
        code?: string;            // Tournament/quiz code
        [key: string]: any;       // Other mode-specific fields
    };
}

/**
 * Filters a database question object to only include data safe to send to clients.
 * Handles both polymorphic and legacy question formats.
 * 
 * @param questionObject - The question object from the database (Prisma format)
 * @returns FilteredQuestion - The question data safe for client emission  
 */
export function filterQuestionForClient(questionObject: any): FilteredQuestion {
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
