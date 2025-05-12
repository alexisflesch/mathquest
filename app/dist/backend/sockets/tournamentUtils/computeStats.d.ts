/**
 * computeStats.ts - Utility to compute answer stats for a question in a tournament
 *
 * This module provides functions to analyze participant answers and generate statistics.
 */
import { TournamentState } from '../types/tournamentTypes';
interface AnswerStat {
    answer: string;
    count: number;
    correct: boolean;
}
export interface AnswerStats {
    stats: AnswerStat[];
    totalAnswers: number;
}
/**
 * Computes statistics for answers to a specific tournament question.
 * @param tState The current state of a single tournament.
 * @param questionUid The UID of the question to compute stats for.
 * @returns AnswerStats object, or null if data is insufficient.
 */
export declare function computeAnswerStats(tState: TournamentState | undefined | null, questionUid: string): AnswerStats | null;
export {};
