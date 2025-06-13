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
    text: string;
    type: string;
    answerOptions: string[];
    questionType?: string;
    explanation?: string;
    correctAnswers?: boolean[];
    timeLimit?: number;
    gradeLevel?: string;
    difficulty?: number;
    themes?: string[];
}
/**
 * Standardized question payload for live events (sent to students/projector)
 */
export interface LiveQuestionPayload {
    question: FilteredQuestion;
    timer?: number;
    questionIndex?: number;
    totalQuestions?: number;
    questionState?: 'pending' | 'active' | 'paused' | 'stopped' | 'finished';
    modeSpecificData?: {
        tournoiState?: 'pending' | 'running' | 'paused' | 'stopped' | 'finished';
        code?: string;
        [key: string]: any;
    };
}
/**
 * Filters a database question object to only include data safe to send to clients.
 * Uses the canonical database format with answerOptions.
 *
 * @param questionObject - The question object from the database (Prisma format)
 * @returns FilteredQuestion - The question data safe for client emission
 */
export declare function filterQuestionForClient(questionObject: any): FilteredQuestion;
