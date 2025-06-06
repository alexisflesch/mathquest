/**
 * Shared LiveQuestion Types
 * 
 * These types represent the standardized question payload structure used for live events
 * (sent to clients during live tournaments/quizzes).
 */

import { Question } from './question';

/**
 * Filtered question data (without correct answer information)
 */
export interface FilteredQuestion {
    uid: string;
    text: string;        // The question text
    type: string;         // Question type (choix_simple, choix_multiple, etc.)
    answers: string[];   // Renamed from responses: Only answer texts, no correct info
}

/**
 * Standardized question payload for live events (sent to students/projector)
 */
export interface LiveQuestionPayload {
    question: FilteredQuestion;   // The filtered question object
    timer?: number;               // Timer duration for this question
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
 * Filters a full question object to only include data safe to send to clients.
 * 
 * @param questionObject - The full question object from the database or state
 * @returns FilteredQuestion - The question data safe for client emission
 */
export function filterQuestionForClient(questionObject: Question): FilteredQuestion {
    if (!questionObject) {
        throw new Error('Cannot filter null or undefined question object');
    }

    return {
        uid: questionObject.uid,
        type: questionObject.questionType,
        text: questionObject.text || questionObject.question || 'Question text not available',
        answers: (Array.isArray(questionObject.answers)
            ? questionObject.answers.map(ans => typeof ans === 'string' ? ans : ans.text)
            : []),
    };
}
