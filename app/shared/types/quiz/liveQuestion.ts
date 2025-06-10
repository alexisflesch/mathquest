/**
 * Shared LiveQuestion Types
 * 
 * These types represent the standardized question payload structure used for live events
 * (sent to clients during live tournaments/quizzes).
 */

/**
 * Filtered question data (without correct answer information)
 */
export interface FilteredQuestion {
    uid: string;
    text: string;        // The question text
    type: string;         // Question type (choix_simple, choix_multiple, etc.)
    answers: string[];   // Only answer texts, no correct info
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
        type: questionObject.questionType,
        text: questionObject.text,
        answers: questionObject.answerOptions || [],
    };
}
