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
    text: string;
    questionType: string;
    answerOptions?: string[];
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
    timer?: GameTimerState;
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
 * Handles both polymorphic and legacy question formats.
 *
 * @param questionObject - The question object from the database (Prisma format)
 * @returns FilteredQuestion - The question data safe for client emission
 */
export declare function filterQuestionForClient(questionObject: any): FilteredQuestion;
