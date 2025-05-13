// filepath: /home/aflesch/mathquest/app/sockets/tournamentUtils/computeStats.ts
/**
 * computeStats.ts - Utility to compute answer stats for a question in a tournament
 * 
 * This module provides functions to analyze participant answers and generate statistics.
 */

import { TournamentState, TournamentAnswer as PlayerSubmittedAnswer } from '../types/tournamentTypes';
import { Question, QuestionOptionAnswer as QuestionAnswerOption } from '../types/quizTypes';

interface AnswerStat {
    answer: string; // The text of the answer option
    count: number;  // How many times this answer was chosen
    correct: boolean; // Whether this answer option is correct
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
export function computeAnswerStats(
    tState: TournamentState | undefined | null,
    questionUid: string
): AnswerStats | null {
    if (!tState) {
        console.warn('computeAnswerStats: Tournament state is null or undefined.');
        return { stats: [], totalAnswers: 0 };
    }

    const question: Question | undefined = tState.questions?.find(q => q.uid === questionUid);

    // Ensure question and its answer options are defined
    // Prefer 'answers' field, fallback to 'reponses' if 'answers' is not present
    const questionOptions: QuestionAnswerOption[] | undefined = question?.answers || question?.reponses;

    if (!question || !questionOptions || questionOptions.length === 0) {
        console.warn(`computeAnswerStats: Question with UID ${questionUid} not found or has no answer options.`);
        return { stats: [], totalAnswers: 0 };
    }

    const answerCounts: { [answerText: string]: { count: number; correct: boolean } } = {};
    let totalSubmittedAnswers = 0;

    // Initialize counts for all predefined answer options
    questionOptions.forEach(opt => {
        if (opt.texte !== undefined) { // Ensure texte property exists
            answerCounts[opt.texte] = { count: 0, correct: !!opt.correct };
        }
    });

    const playerAnswersForQuestion = tState.answers?.[questionUid];

    if (playerAnswersForQuestion) {
        Object.values(playerAnswersForQuestion).forEach((playerSubmission: PlayerSubmittedAnswer) => {
            // Assuming playerSubmission.value contains the text of the answer submitted by the player
            if (playerSubmission && playerSubmission.value !== undefined && playerSubmission.value !== null) {
                const submittedAnswerText = String(playerSubmission.value);

                if (answerCounts.hasOwnProperty(submittedAnswerText)) {
                    answerCounts[submittedAnswerText].count++;
                } else {
                    // This case means a player submitted an answer text that wasn't among the predefined options.
                    // This could happen with open-ended questions, or if data is inconsistent.
                    // For now, we'll log a warning and optionally count it as a new, incorrect category.
                    console.warn(`computeAnswerStats: Encountered an answer ("${submittedAnswerText}") not predefined for question ${questionUid}. It will be ignored for stats.`);
                    // If you want to include it in stats (e.g., as incorrect):
                    // answerCounts[submittedAnswerText] = { count: 1, correct: false };
                }
                totalSubmittedAnswers++; // Count every submission that has a value
            }
        });
    }

    // If totalSubmittedAnswers is based on valid submissions that match options:
    // let validSubmissionsCount = 0;
    // Object.values(answerCounts).forEach(ac => validSubmissionsCount += ac.count);
    // totalSubmittedAnswers = validSubmissionsCount;


    const stats: AnswerStat[] = Object.entries(answerCounts).map(([answerText, data]) => ({
        answer: answerText,
        count: data.count,
        correct: data.correct,
    }));

    return { stats, totalAnswers: totalSubmittedAnswers };
}

// For CommonJS compatibility
const exportsObject = {
    computeAnswerStats,
};

if (typeof module !== 'undefined' && module.exports) {
    Object.assign(module.exports, exportsObject);
    // @ts-ignore
    module.exports.default = exportsObject; // For default export pattern
}
