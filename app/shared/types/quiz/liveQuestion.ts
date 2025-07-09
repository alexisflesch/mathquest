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
    questionType: string;     // Question type (single_choice, multiple_choice, etc.) - CANONICAL FIELD NAME
    answerOptions: string[];  // Answer options - CANONICAL FIELD NAME
    // Additional properties required by frontend components (non-sensitive)
    timeLimit?: number;         // Time limit for this question
    gradeLevel?: string;        // Grade level of the question
    difficulty?: number;        // Difficulty rating
    themes?: string[];          // Question themes/categories
    // Note: correctAnswers and explanation are intentionally excluded for security
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
 * Uses the canonical database format with answerOptions.
 * 
 * @param questionObject - The question object from the database (Prisma format)
 * @returns FilteredQuestion - The question data safe for client emission  
 */
export function filterQuestionForClient(questionObject: any): FilteredQuestion {
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
