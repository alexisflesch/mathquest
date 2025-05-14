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
    text: string;
    type: string;
    answers: string[];
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
 * Filters a full question object to only include data safe to send to clients.
 *
 * @param questionObject - The full question object from the database or state
 * @returns FilteredQuestion - The question data safe for client emission
 */
export declare function filterQuestionForClient(questionObject: Question): FilteredQuestion;
