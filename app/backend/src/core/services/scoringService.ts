/**
 * Scoring Service - Centralized scoring logic for MathQuest
 * 
 * This service handles all scoring calculations and answer submission logic.
 * Prevents score inflation by tracking answer changes and applies proper time penalties.
 */

import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import { TimingService } from '@/services/timingService';
import type { AnswerSubmissionPayload } from '@shared/types';

const logger = createLogger('ScoringService');

export interface ScoreResult {
    /** Whether the score was updated */
    scoreUpdated: boolean;
    /** The score that was added (0 if no update) */
    scoreAdded: number;
    /** The new total score for the participant */
    totalScore: number;
    /** Whether this was a changed answer */
    answerChanged: boolean;
    /** The previous answer if any */
    previousAnswer?: any;
    /** Feedback message */
    message: string;
}

/**
 * Core scoring calculation
 * @param isCorrect Whether the answer is correct
 * @param serverTimeSpent Time spent in milliseconds (server-calculated)
 * @param question Question object with timeLimit and other properties
 * @returns Score for this answer
 */
export function calculateAnswerScore(
    isCorrect: boolean,
    serverTimeSpent: number,
    question: any
): number {
    if (!isCorrect || !question) return 0;

    const baseScore = 1000;

    // Convert milliseconds to seconds for penalty calculation
    const serverTimeSpentSeconds = Math.max(0, serverTimeSpent / 1000);
    const timePenalty = Math.floor(serverTimeSpentSeconds * 10); // 10 points per second

    const finalScore = Math.max(baseScore - timePenalty, 0);

    logger.debug({
        baseScore,
        serverTimeSpent,
        serverTimeSpentSeconds,
        timePenalty,
        finalScore,
        isCorrect
    }, 'Score calculation details');

    return finalScore;
}

/**
 * Check if the answer is correct for a given question
 * @param question Question object with correctAnswers
 * @param answer User's submitted answer
 * @returns Whether the answer is correct
 */
export function checkAnswerCorrectness(question: any, answer: any): boolean {
    if (!question || !question.correctAnswers) return false;

    if (Array.isArray(question.correctAnswers) && typeof answer === 'number') {
        // Multiple choice: answer is index, correctAnswers is boolean array
        if (answer >= 0 && answer < question.correctAnswers.length) {
            return question.correctAnswers[answer] === true;
        }
    } else if (question.correctAnswers) {
        // Direct comparison for other question types
        return question.correctAnswers === answer;
    }

    return false;
}

/**
 * Submit an answer with proper duplicate checking and scoring
 * @param gameInstanceId Game instance ID
 * @param userId User ID
 * @param answerData Answer submission data
 * @returns Score result with details
 */
export async function submitAnswerWithScoring(
    gameInstanceId: string,
    userId: string,
    answerData: AnswerSubmissionPayload
): Promise<ScoreResult> {
    try {
        // Find the participant
        const participant = await prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId,
                userId
            }
        });

        if (!participant) {
            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: 0,
                answerChanged: false,
                message: 'Participant not found'
            };
        }

        // Parse current answers
        const currentAnswers = Array.isArray(participant.answers) ? participant.answers : [];

        // Find existing answer for this question
        const existingAnswerIndex = currentAnswers.findIndex(
            (ans: any) => ans.questionUid === answerData.questionUid
        );

        const existingAnswer = existingAnswerIndex >= 0 ? currentAnswers[existingAnswerIndex] as any : null;

        // Check if this is the same answer as before
        const isSameAnswer = existingAnswer && existingAnswer.answer === answerData.answer;

        if (isSameAnswer) {
            // Same answer - no score update, just return current state
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                answer: answerData.answer,
                previousAnswer: existingAnswer.answer
            }, 'Same answer resubmitted - no score update');

            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: participant.score || 0,
                answerChanged: false,
                previousAnswer: existingAnswer?.answer,
                message: 'Same answer already submitted'
            };
        }

        // Different answer or first submission - proceed with scoring
        const question = await prisma.question.findUnique({
            where: { uid: answerData.questionUid }
        });

        if (!question) {
            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: participant.score || 0,
                answerChanged: !!existingAnswer,
                previousAnswer: existingAnswer?.answer,
                message: 'Question not found'
            };
        }

        // Calculate server-side timing
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId }
        });

        if (!gameInstance) {
            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: participant.score || 0,
                answerChanged: !!existingAnswer,
                previousAnswer: existingAnswer?.answer,
                message: 'Game instance not found'
            };
        }

        const serverTimeSpent = await TimingService.calculateAndCleanupTimeSpent(
            gameInstance.accessCode,
            answerData.questionUid,
            userId
        );

        // Check answer correctness
        const isCorrect = checkAnswerCorrectness(question, answerData.answer);

        // Calculate new score
        const newScore = calculateAnswerScore(isCorrect, serverTimeSpent, question);

        // If this is a changed answer, we need to subtract the old score first
        let scoreToAdd = newScore;
        if (existingAnswer) {
            // For answer changes, we recalculate based on new timing but note it's a change
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                oldAnswer: existingAnswer?.answer,
                newAnswer: answerData.answer,
                newScore
            }, 'Answer changed - recalculating score with time penalty');
        }

        // Update the answers array
        const newAnswerEntry = {
            questionUid: answerData.questionUid,
            answer: answerData.answer,
            timeTakenMs: answerData.timeSpent,
            timestamp: new Date().toISOString(),
            serverTimeSpent,
            isCorrect,
            score: newScore
        };

        let updatedAnswers;
        if (existingAnswerIndex >= 0) {
            // Replace existing answer
            updatedAnswers = [...currentAnswers];
            updatedAnswers[existingAnswerIndex] = newAnswerEntry;
        } else {
            // Add new answer
            updatedAnswers = [...currentAnswers, newAnswerEntry];
        }

        // Update participant with new answers and score
        const scoreUpdate = scoreToAdd > 0 ? { increment: scoreToAdd } : undefined;
        const updatedParticipant = await prisma.gameParticipant.update({
            where: { id: participant.id },
            data: {
                answers: updatedAnswers,
                ...(scoreUpdate && { score: scoreUpdate })
            }
        });

        // Update Redis for answer tracking
        if (gameInstance) {
            const redisKey = `mathquest:game:answers:${gameInstance.accessCode}:${answerData.questionUid}`;
            await redisClient.hset(
                redisKey,
                userId,
                JSON.stringify({
                    userId,
                    answer: answerData.answer,
                    timeSpent: answerData.timeSpent,
                    serverTimeSpent,
                    submittedAt: Date.now(),
                    isCorrect,
                    score: newScore
                })
            );

            // Update Redis participant data to sync with database
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            if (redisParticipantData) {
                const participantData = JSON.parse(redisParticipantData);
                participantData.score = updatedParticipant.score;
                await redisClient.hset(participantKey, userId, JSON.stringify(participantData));
            }
        }

        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            scoreAdded: scoreToAdd,
            newTotalScore: updatedParticipant.score,
            isCorrect,
            answerChanged: !!existingAnswer,
            serverTimeSpent
        }, 'Answer scored and updated');

        return {
            scoreUpdated: scoreToAdd > 0,
            scoreAdded: scoreToAdd,
            totalScore: updatedParticipant.score || 0,
            answerChanged: !!existingAnswer,
            previousAnswer: existingAnswer?.answer,
            message: scoreToAdd > 0 ? 'Score updated' : 'Answer recorded but no points awarded'
        };

    } catch (error) {
        logger.error({
            error,
            gameInstanceId,
            userId,
            answerData
        }, 'Error in submitAnswerWithScoring');

        return {
            scoreUpdated: false,
            scoreAdded: 0,
            totalScore: 0,
            answerChanged: false,
            message: 'Error processing answer'
        };
    }
}

export const ScoringService = {
    calculateAnswerScore,
    checkAnswerCorrectness,
    submitAnswerWithScoring
};
