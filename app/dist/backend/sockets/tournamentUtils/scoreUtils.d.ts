import { PrismaClient } from '@prisma/client';
import { Question } from '../types/quizTypes';
import { TournamentParticipant, TournamentAnswer } from '../types/tournamentTypes';
interface ScoreCalculationResult {
    baseScore: number;
    timePenalty: number;
    totalScore: number;
}
/**
 * Calculates the score for a given answer.
 * @param question The question object.
 * @param answer The participant's answer object.
 * @param questionStartTime The timestamp when the question was presented (used for context, not direct calc here if answer.timeMs is duration).
 * @param totalQuestions The total number of questions in the tournament (for scaling, if any).
 * @returns ScoreCalculationResult object.
 */
export declare function calculateScore(question: Question, answer: TournamentAnswer, questionStartTime: number, totalQuestions: number): ScoreCalculationResult;
/**
 * Saves a participant's score to the database.
 * @param prisma PrismaClient instance.
 * @param tournoiId The ID of the tournament.
 * @param participant The participant object containing ID and new score.
 */
export declare function saveParticipantScore(prisma: PrismaClient, tournoiId: string, participant: Pick<TournamentParticipant, 'id' | 'score'>): Promise<void>;
/**
 * Placeholder for scaling scores in a quiz context, if needed.
 */
export declare function scaleScoresForQuiz(quizId: string, io: any): void;
declare const scoreUtils: {
    calculateScore: typeof calculateScore;
    saveParticipantScore: typeof saveParticipantScore;
    scaleScoresForQuiz: typeof scaleScoresForQuiz;
};
export default scoreUtils;
