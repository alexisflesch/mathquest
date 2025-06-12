/**
 * Shared Tournament Question Types
 *
 * These types represent tournament-specific question structures used across frontend components.
 */
import { LiveQuestionPayload, FilteredQuestion } from '../quiz/liveQuestion';
import { QuestionData } from '../socketEvents';
/**
 * Comprehensive tournament question interface that supports all frontend components.
 * This extends the shared LiveQuestionPayload type and adds tournament-specific fields.
 */
export interface TournamentQuestion extends Omit<LiveQuestionPayload, 'question'> {
    question: FilteredQuestion | QuestionData | string;
    code?: string;
    remainingTime?: number;
    tournoiState?: 'pending' | 'running' | 'paused' | 'stopped' | 'finished';
    uid?: string;
    type?: string;
    answers?: string[];
}
/**
 * Type guard to check if a question object is a TournamentQuestion
 */
export declare function isTournamentQuestion(data: unknown): data is TournamentQuestion;
/**
 * Helper function to extract question UID from various question formats
 */
export declare function getQuestionUid(tournamentQuestion: TournamentQuestion): string | undefined;
/**
 * Helper function to extract question text from various question formats
 */
export declare function getQuestionText(tournamentQuestion: TournamentQuestion): string;
/**
 * Helper function to extract answer options from various question formats
 */
export declare function getQuestionAnswers(tournamentQuestion: TournamentQuestion): string[];
