import { PrismaClient } from '@prisma/client';
import { Question } from '../types/quizTypes';
interface ScoreCalculationResult {
    scoreBeforePenalty: number;
    timePenalty: number;
    normalizedQuestionScore: number;
}
export interface ProcessedAnswerForScoring {
    answerIdx?: number | number[];
    clientTimestamp: number;
    serverReceiveTime?: number;
    isCorrect: boolean;
    value?: string | string[];
    timeMs: number;
}
/**
 * Calculates the score for a given answer based on the new rules.
 * Assumes the answer has been processed to determine correctness, value, and time taken.
 * @param question The question object.
 * @param answer The processed answer object.
 * @param totalQuestionsInEvent Total number of questions in the quiz/tournament for normalization.
 * @returns ScoreCalculationResult object.
 */
export declare function calculateScore(question: Question, answer: ProcessedAnswerForScoring, totalQuestionsInEvent: number): ScoreCalculationResult;
import { TournamentParticipant } from '../types/tournamentTypes';
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
