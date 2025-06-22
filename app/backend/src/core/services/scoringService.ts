/**
 * Scoring Service - Centralized scoring logic for MathQuest
 * 
 * This service handles all scoring calculations and answer submission logic.
 * Prevents score inflation by tracking answer changes and applies proper time penalties.
 */

import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import type { AnswerSubmissionPayload } from '@shared/types/core/answer';

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
    /** Time penalty applied (in points) */
    timePenalty?: number;
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
): { score: number, timePenalty: number } {
    if (!isCorrect || !question) return { score: 0, timePenalty: 0 };

    const baseScore = 1000;

    // Convert milliseconds to seconds for penalty calculation
    const serverTimeSpentSeconds = Math.max(0, serverTimeSpent / 1000);
    const timePenalty = Math.floor(serverTimeSpentSeconds * 10); // 10 points per second

    const finalScore = Math.max(baseScore - timePenalty, 0);

    logger.info({
        questionType: question.questionType,
        baseScore,
        serverTimeSpent,
        serverTimeSpentSeconds,
        timePenalty,
        finalScore,
        isCorrect
    }, 'Score calculation details (diagnostic)');

    // Return both score and timePenalty for answer record
    return {
        score: finalScore,
        timePenalty
    };
}

/**
 * Check if the answer is correct for a given question
 * @param question Question object with correctAnswers
 * @param answer User's submitted answer
 * @returns Whether the answer is correct
 */
export function checkAnswerCorrectness(question: any, answer: any): boolean {
    if (!question || !question.correctAnswers) return false;

    // Multiple choice (multiple answers): answer is array of indices, correctAnswers is boolean array
    if (Array.isArray(question.correctAnswers) && Array.isArray(answer)) {
        // Check that all and only correct indices are selected
        const correctIndices = question.correctAnswers
            .map((v: boolean, i: number) => v ? i : -1)
            .filter((i: number) => i !== -1);
        // Sort both arrays for comparison
        const submitted = [...answer].sort();
        const correct = [...correctIndices].sort();
        return (
            submitted.length === correct.length &&
            submitted.every((v, i) => v === correct[i])
        );
    }
    // Multiple choice (single answer): answer is index, correctAnswers is boolean array
    if (Array.isArray(question.correctAnswers) && typeof answer === 'number') {
        return question.correctAnswers[answer] === true;
    }
    // Fallback: direct comparison for other types
    if (question.correctAnswers) {
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
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            answer: answerData.answer
        }, 'Starting answer submission with scoring');

        // Find the participant - get the most recent one if multiple exist
        const participant = await prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId,
                userId
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });

        logger.info({ gameInstanceId, userId, found: !!participant, participantId: participant?.id }, '[LOG] Participant fetch result');

        if (!participant) {
            logger.error({
                gameInstanceId,
                userId
            }, 'BUG INVESTIGATION: Participant not found in scoring service');
            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: 0,
                answerChanged: false,
                message: 'Participant not found'
            };
        }

        // Fetch previous answer from Redis (if any)
        let previousAnswerObj: any = null;
        let previousScore = 0;
        let previousIsCorrect = false;
        let previousAnswer: any = undefined;
        let previousAnswerExists = false;
        let gameInstance: any = null;
        gameInstance = await prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            select: { playMode: true, accessCode: true, isDiffered: true }
        });
        logger.info({ gameInstanceId, userId, playMode: gameInstance?.playMode, isDiffered: gameInstance?.isDiffered }, '[LOG] GameInstance fetch result');
        // Determine answer key (namespace by attempt for DEFERRED)
        let answerKey: string;
        let attemptCount = participant.attemptCount || 1;
        // FIX: Always use attempt-namespaced key for DEFERRED participants
        if (participant.participationType === 'DEFERRED') {
            answerKey = `mathquest:game:answers:${gameInstance.accessCode}:${answerData.questionUid}:${attemptCount}`;
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                attemptCount,
                answerKey,
                playMode: gameInstance?.playMode,
                isDiffered: gameInstance?.isDiffered,
                participationType: participant.participationType,
                note: 'USING NAMESPACED ANSWER KEY for DEFERRED participant (forced)'
            }, '[FIXED-2] Using attempt-based answer key for DEFERRED participant');
        } else {
            answerKey = `mathquest:game:answers:${gameInstance.accessCode}:${answerData.questionUid}`;
        }
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            answerKey,
            attemptCount,
            playMode: gameInstance?.playMode,
            isDiffered: gameInstance?.isDiffered,
            participationType: participant.participationType
        }, '[DIAGNOSTIC] Using answer key for duplicate check and storage');
        logger.info({ gameInstanceId, userId, answerKey }, '[LOG] About to read previous answer from Redis');
        const prev = await redisClient.hget(answerKey, userId);
        logger.info({ gameInstanceId, userId, answerKey, prevFound: !!prev }, '[LOG] Redis hget result for previous answer');
        if (prev) {
            previousAnswerObj = JSON.parse(prev);
            previousScore = previousAnswerObj.score || 0;
            previousIsCorrect = previousAnswerObj.isCorrect || false;
            previousAnswer = previousAnswerObj.answer;
            previousAnswerExists = true;
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                attemptCount,
                answerKey,
                previousAnswer,
                previousScore,
                previousIsCorrect,
                mode: gameInstance?.isDiffered ? 'DEFERRED' : 'LIVE/QUIZ',
                note: 'Previous answer found for duplicate/score logic.'
            }, '[DIAGNOSTIC] Previous answer state for duplicate/score logic');
        } else {
            logger.info({ gameInstanceId, userId, answerKey }, '[LOG] No previous answer found in Redis for this key');
        }
        // Compare new answer to previous answer (handle single/multiple choice)
        let isSameAnswer = false;
        if (previousAnswerExists) {
            const a1 = answerData.answer;
            const a2 = previousAnswer;
            if (Array.isArray(a1) && Array.isArray(a2)) {
                const arr1 = a1 as any[];
                const arr2 = a2 as any[];
                // Multiple choice: compare arrays (order-insensitive)
                isSameAnswer =
                    arr1.length === arr2.length &&
                    arr1.every((v) => arr2.includes(v)) &&
                    arr2.every((v) => arr1.includes(v));
            } else if (
                (typeof a1 === 'string' || typeof a1 === 'number' || typeof a1 === 'boolean') &&
                (typeof a2 === 'string' || typeof a2 === 'number' || typeof a2 === 'boolean')
            ) {
                // Single choice: compare directly
                isSameAnswer = a1 === a2;
            } else {
                // Fallback: not the same
                isSameAnswer = false;
            }
        }
        logger.info({ gameInstanceId, userId, isSameAnswer, previousAnswerExists }, '[LOG] Answer comparison result');
        if (isSameAnswer) {
            // Same answer - no score update, just return current state
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                answer: answerData.answer,
                previousAnswer,
                attemptCount,
                answerKey,
                mode: gameInstance?.isDiffered ? 'DEFERRED' : 'LIVE/QUIZ',
                note: 'Duplicate answer detected, no score update.'
            }, '[DIAGNOSTIC] Duplicate answer detected for DEFERRED/LIVE/QUIZ');
            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: participant.score || 0,
                answerChanged: false,
                previousAnswer,
                message: 'Same answer already submitted'
            };
        }
        // Different answer or first submission - proceed with scoring
        logger.info({ gameInstanceId, userId, questionUid: answerData.questionUid }, '[LOG] Proceeding to fetch question for scoring');
        const question = await prisma.question.findUnique({
            where: { uid: answerData.questionUid }
        });
        if (!question) {
            logger.error({ gameInstanceId, userId, questionUid: answerData.questionUid }, '[ERROR] Question not found');
            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: participant.score || 0,
                answerChanged: previousAnswerExists,
                previousAnswer,
                message: 'Question not found'
            };
        }
        // Calculate server-side timing (factorized by mode)
        let serverTimeSpent: number = 0;
        let timerDebugInfo: any = {};
        if (gameInstance.playMode === 'practice') {
            // Practice mode: no timer
            serverTimeSpent = 0;
        } else if (gameInstance.playMode === 'quiz' || (gameInstance.playMode === 'tournament' && !gameInstance.isDiffered)) {
            // Quiz and live tournament: timer attached to GameInstance
            serverTimeSpent = typeof answerData.timeSpent === 'number' ? answerData.timeSpent : 0;
            timerDebugInfo = {
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered,
                answerDataTimeSpent: answerData.timeSpent,
                serverTimeSpent
            };
        } else if (gameInstance.playMode === 'tournament' && gameInstance.isDiffered) {
            // DEFERRED tournament: timer must be per-user/per-attempt
            serverTimeSpent = typeof answerData.timeSpent === 'number' ? answerData.timeSpent : 0;
            timerDebugInfo = {
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered,
                answerDataTimeSpent: answerData.timeSpent,
                serverTimeSpent,
                canonical: true,
                note: 'Timer is per-user/per-attempt for DEFERRED mode.'
            };
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                attemptCount,
                serverTimeSpent,
                timerDebugInfo,
                note: 'Timer/penalty logic for DEFERRED answer submission.'
            }, '[DIAGNOSTIC] Timer/penalty logic for DEFERRED answer submission');
        }
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            timerDebugInfo
        }, '[DIAGNOSE] Timer and mode info before scoring');
        const isCorrect = checkAnswerCorrectness(question, answerData.answer);
        logger.info({ gameInstanceId, userId, questionUid: answerData.questionUid, isCorrect }, '[LOG] Answer correctness check result');
        const { score: newScore, timePenalty } = calculateAnswerScore(isCorrect, serverTimeSpent, question);
        logger.info({ gameInstanceId, userId, questionUid: answerData.questionUid, newScore, timePenalty }, '[LOG] Calculated new score and time penalty');
        // Replace previous score for this question (not increment)
        let scoreDelta = newScore - previousScore;
        // For differed tournaments, always replace the score (not increment)
        let scoreUpdateData: any = { score: { increment: scoreDelta } };
        if (gameInstance.playMode === 'tournament' && gameInstance.isDiffered) {
            scoreUpdateData = { score: newScore };
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                previousScore,
                newScore,
                scoreDelta,
                attemptCount,
                timePenalty,
                note: 'DEFERRED mode: replacing score for this attempt.'
            }, '[DIAGNOSTIC] DEFERRED mode score replacement logic');
        }
        logger.info({ gameInstanceId, userId, scoreUpdateData }, '[LOG] About to update participant score in DB');
        // Update participant score in DB
        const updatedParticipant = await prisma.gameParticipant.update({
            where: { id: participant.id },
            data: scoreUpdateData
        });
        logger.info({ gameInstanceId, userId, updatedScore: updatedParticipant.score }, '[LOG] Updated participant score in DB');
        // Update Redis with new answer
        if (gameInstance) {
            logger.info({ gameInstanceId, userId, answerKey }, '[LOG] About to store answer in Redis');
            await redisClient.hset(
                answerKey,
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
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                answerKey,
                attemptCount,
                playMode: gameInstance?.playMode,
                isDiffered: gameInstance?.isDiffered
            }, '[DIAGNOSTIC] Stored answer in Redis with attempt-based key');
            // Update Redis participant data to sync with database
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            logger.info({ gameInstanceId, userId, participantKey }, '[LOG] About to update participant data in Redis');
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            if (redisParticipantData) {
                const participantData = JSON.parse(redisParticipantData);
                participantData.score = updatedParticipant.score;
                await redisClient.hset(participantKey, userId, JSON.stringify(participantData));
                logger.info({ gameInstanceId, userId, participantKey, updatedScore: updatedParticipant.score }, '[LOG] Updated participant data in Redis');
            }
            // Update Redis leaderboard ZSET
            const leaderboardKey = `mathquest:game:leaderboard:${gameInstance.accessCode}`;
            logger.info({ gameInstanceId, userId, leaderboardKey, score: updatedParticipant.score }, '[LOG] About to update leaderboard ZSET');
            await redisClient.zadd(leaderboardKey, updatedParticipant.score || 0, userId);
            logger.info({ gameInstanceId, userId, leaderboardKey, score: updatedParticipant.score }, '[LOG] Updated leaderboard ZSET');
        }
        logger.info({ gameInstanceId, userId, scoreDelta, totalScore: updatedParticipant.score }, '[LOG] Final score result for answer submission');
        return {
            scoreUpdated: scoreDelta !== 0,
            scoreAdded: scoreDelta,
            totalScore: updatedParticipant.score || 0,
            answerChanged: previousAnswerExists,
            previousAnswer,
            message: scoreDelta !== 0 ? 'Score updated' : 'Answer recorded but no points awarded',
            timePenalty // Include timePenalty in the result
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
