import { PrismaClient } from '@prisma/client';
import { Question } from '../types/quizTypes';
// TournamentAnswer is the raw stored type. We'll define a new type for processed answers.
// import { TournamentAnswer } from '../types/tournamentTypes'; 
import createLogger from '../../logger';

const logger = createLogger('ScoreUtils');

// Define the ScoreCalculationResult interface directly here (if not already in a shared types file)
// Updated to reflect new requirements
interface ScoreCalculationResult {
    scoreBeforePenalty: number;    // Score based on correctness (QCU/QCM logic)
    timePenalty: number;           // Calculated time penalty (0-500)
    normalizedQuestionScore: number; // Final score for the question after penalty and normalization
}

// Define the type for a fully processed answer, required by calculateScore
export interface ProcessedAnswerForScoring {
    answerIdx?: number | number[]; // Index or indices of selected answer(s)
    clientTimestamp: number;    // Original client timestamp
    serverReceiveTime?: number; // Server receive time, for context if needed
    isCorrect: boolean;         // Overall correctness (true if any part of QCM is right, or QCU is right)
    // This might need refinement based on how it's used by the caller.
    // For QCM, the detailed correctness is handled within calculateScore.
    value?: string | string[];  // The actual textual value(s) submitted (e.g., text of choice(s))
    timeMs: number;             // Time taken to answer in milliseconds. Must be calculated by the caller.
}

const MAX_SCORE_BASE = 1000;
const MAX_TIME_PENALTY = 500;
// TIME_PENALTY_SCALE_FACTOR is no longer used with the linear penalty.

/**
 * Calculates the score for a given answer based on the new rules.
 * Assumes the answer has been processed to determine correctness, value, and time taken.
 * @param question The question object.
 * @param answer The processed answer object.
 * @param totalQuestionsInEvent Total number of questions in the quiz/tournament for normalization.
 * @returns ScoreCalculationResult object.
 */
export function calculateScore(
    question: Question,
    answer: ProcessedAnswerForScoring,
    totalQuestionsInEvent: number
): ScoreCalculationResult {
    if (!question || !answer || totalQuestionsInEvent <= 0) {
        logger.warn('[calculateScore] Missing question, processed answer object, or invalid totalQuestionsInEvent.', {
            questionId: question?.uid, answerProvided: !!answer, totalQuestionsInEvent
        });
        return { scoreBeforePenalty: 0, timePenalty: 0, normalizedQuestionScore: 0 };
    }

    // 1. Calculate Time Penalty
    let timePenalty = 0;
    // TODO: For quizzes, question.temps might not be the definitive "availableTimeSeconds".
    // This needs a more robust way to determine how long the question was available for answering in a quiz context.
    const availableTimeSeconds = question.temps || 20; // Default to 20s if not set

    if (answer.timeMs >= 0 && availableTimeSeconds > 0) {
        const proportionOfTimeTaken = Math.min(answer.timeMs / (availableTimeSeconds * 1000), 1);
        timePenalty = Math.round(proportionOfTimeTaken * MAX_TIME_PENALTY);
    }
    timePenalty = Math.max(0, Math.min(timePenalty, MAX_TIME_PENALTY)); // Ensure penalty is within [0, MAX_TIME_PENALTY]

    // 2. Calculate Score Before Penalty (Base Score)
    let scoreBeforePenalty = 0;
    const correctResponses = question.reponses?.filter(r => r.correct) || [];
    const numCorrectOptions = correctResponses.length;

    if (!question.reponses || numCorrectOptions === 0) {
        logger.warn(`[calculateScore] Question ${question.uid} has no responses or no correct responses defined.`);
        // scoreBeforePenalty remains 0
    } else if (question.type === 'QCU' || (question.type === 'QCM' && numCorrectOptions === 1)) {
        // Treat as QCU: 1000 if correct, 0 if incorrect.
        // The caller should set answer.isCorrect based on comparing answer.answerIdx with the correct option.
        // For QCM with 1 correct answer, answer.isCorrect should be true if the single correct option was chosen.
        if (answer.isCorrect) { // Relies on caller to set this correctly for QCU-like scenarios
            scoreBeforePenalty = MAX_SCORE_BASE;
        }
    } else if (question.type === 'QCM') {
        const pointsPerOption = MAX_SCORE_BASE / numCorrectOptions;
        let currentScoreForQCM = 0;
        const selectedIndices = Array.isArray(answer.answerIdx) ? answer.answerIdx : (typeof answer.answerIdx === 'number' ? [answer.answerIdx] : []);

        question.reponses.forEach((response, index) => {
            const isSelected = selectedIndices.includes(index);
            if (isSelected) {
                if (response.correct) {
                    currentScoreForQCM += pointsPerOption;
                } else {
                    currentScoreForQCM -= pointsPerOption;
                }
            }
        });
        scoreBeforePenalty = Math.max(0, Math.round(currentScoreForQCM));
    } else {
        logger.warn(`[calculateScore] Unhandled question type: ${question.type} for question ${question.uid}`);
        // scoreBeforePenalty remains 0 for unhandled types
    }

    // 3. Apply Penalty
    const scoreAfterPenalty = Math.max(0, scoreBeforePenalty - timePenalty);

    // 4. Normalize Score
    const normalizedQuestionScore = totalQuestionsInEvent > 0 ? Math.round(scoreAfterPenalty / totalQuestionsInEvent) : 0;

    logger.debug(
        `[calculateScore] Q_UID: ${question.uid}, Type: ${question.type}, AnswerValue: '''${JSON.stringify(answer.value)}''', CorrectOverall: ${answer.isCorrect}, ` +
        `TimeTakenMs: ${answer.timeMs}, AvailableTimeSec: ${availableTimeSeconds}, ` +
        `ScoreBeforePenalty: ${scoreBeforePenalty}, TimePenalty: ${timePenalty}, ScoreAfterPenalty: ${scoreAfterPenalty}, ` +
        `TotalQuestions: ${totalQuestionsInEvent}, NormalizedScore: ${normalizedQuestionScore}`
    );

    return { scoreBeforePenalty, timePenalty, normalizedQuestionScore };
}

// ... existing saveParticipantScore and scaleScoresForQuiz functions ...
// Ensure TournamentParticipant is imported if used by saveParticipantScore
import { TournamentParticipant } from '../types/tournamentTypes';

/**
 * Saves a participant's score to the database.
 * @param prisma PrismaClient instance.
 * @param tournoiId The ID of the tournament.
 * @param participant The participant object containing ID and new score.
 */
export async function saveParticipantScore(
    prisma: PrismaClient,
    tournoiId: string,
    participant: Pick<TournamentParticipant, 'id' | 'score'>
): Promise<void> {
    if (!tournoiId || !participant || !participant.id || typeof participant.score !== 'number') {
        logger.error('[saveParticipantScore] Invalid arguments provided.', { tournoiId, participantId: participant?.id, score: participant?.score });
        return;
    }
    // Ensure participant.id is not a temporary socket ID
    if (participant.id.startsWith('socket_')) {
        logger.warn(`[saveParticipantScore] Attempted to save score for temporary participant ID: ${participant.id}. Skipping.`);
        return;
    }

    try {
        const existingScore = await prisma.score.findFirst({
            where: {
                tournoi_id: tournoiId,
                joueur_id: participant.id,
            },
        });

        if (existingScore) {
            await prisma.score.update({
                where: { id: existingScore.id },
                data: { score: participant.score, date_score: new Date() },
            });
            logger.info(`[saveParticipantScore] Updated score for participant ${participant.id} in tournoi ${tournoiId} to ${participant.score}`);
        } else {
            // Ensure the joueur (participant) exists in the Joueur table before creating a score entry
            const joueurExists = await prisma.joueur.findUnique({ where: { id: participant.id } });
            if (!joueurExists) {
                // This case should ideally not happen if participants are created/validated upon joining a tournament.
                // If it can happen, you might need to create a Joueur entry here or handle it as an error.
                logger.error(`[saveParticipantScore] Joueur with ID ${participant.id} not found. Cannot create score entry.`);
                return;
            }
            await prisma.score.create({
                data: {
                    tournoi_id: tournoiId,
                    joueur_id: participant.id, // This is the foreign key to Joueur table
                    score: participant.score,
                    date_score: new Date(),
                },
            });
            logger.info(`[saveParticipantScore] Created score for participant ${participant.id} in tournoi ${tournoiId} with score ${participant.score}`);
        }
    } catch (error: any) {
        logger.error(`[saveParticipantScore] Error saving score for participant ${participant.id} in tournoi ${tournoiId}: ${error.message}`, { stack: error.stack });
    }
}

/**
 * Placeholder for scaling scores in a quiz context, if needed.
 */
export function scaleScoresForQuiz(quizId: string, io: any /* Server type from socket.io */): void {
    logger.info(`[scaleScoresForQuiz] Placeholder for quiz ${quizId}. Currently does nothing.`);
    // Future logic for scaling scores at the end of a quiz or specific intervals.
}

// For CommonJS bridge compatibility if needed, though direct ES module imports are preferred.
const scoreUtils = {
    calculateScore,
    saveParticipantScore,
    scaleScoresForQuiz,
};

export default scoreUtils;
