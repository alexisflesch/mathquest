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
    // We allow the question field to be either the FilteredQuestion, QuestionData, or string
    // to support both live_question events and direct question rendering
    question: FilteredQuestion | QuestionData | string;

    // Tournament-specific fields
    code?: string;                      // Tournament access code
    remainingTime?: number;             // Time remaining for the current question
    tournoiState?: 'pending' | 'running' | 'paused' | 'stopped' | 'finished'; // Tournament state
}

/**
 * Type guard to check if a question object is a TournamentQuestion
 */
export function isTournamentQuestion(data: unknown): data is TournamentQuestion {
    if (!data || typeof data !== 'object') return false;

    const q = data as Record<string, unknown>;
    return (
        // Must have a question field of one of the expected types
        q.question !== undefined &&
        (
            typeof q.question === 'string' ||
            (typeof q.question === 'object' && q.question !== null)
        )
    );
}

/**
 * Helper function to extract question UID from various question formats
 */
export function getQuestionUid(tournamentQuestion: TournamentQuestion): string | undefined {
    // Extract from question object
    const { question } = tournamentQuestion;

    if (typeof question === 'object' && question !== null) {
        if ('uid' in question && typeof question.uid === 'string') {
            return question.uid;
        }
    }

    return undefined;
}

/**
 * Helper function to extract question text from various question formats
 */
export function getQuestionText(tournamentQuestion: TournamentQuestion): string {
    const { question } = tournamentQuestion;

    if (typeof question === 'string') {
        return question;
    }

    if (typeof question === 'object' && question !== null) {
        if ('text' in question && typeof question.text === 'string') {
            return question.text;
        }
    }

    return 'Question text not available';
}

/**
 * Helper function to extract answer options from various question formats
 */
export function getQuestionAnswers(tournamentQuestion: TournamentQuestion): string[] {
    // Extract from question object
    const { question } = tournamentQuestion;

    if (typeof question === 'object' && question !== null) {
        // For FilteredQuestion
        if ('answers' in question && Array.isArray(question.answers)) {
            return question.answers;
        }
        // For QuestionData
        if ('answerOptions' in question && Array.isArray(question.answerOptions)) {
            return question.answerOptions;
        }
    }

    return [];
}
