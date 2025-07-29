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
import { getTimerKey } from './timerKeyUtil';
import { CanonicalTimerService } from './canonicalTimerService';

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
    answerData: AnswerSubmissionPayload,
    isDeferredOverride?: boolean
): Promise<ScoreResult> {
    try {
        logger.info({
            gameInstanceId,
            userId,
            answerData,
            isDeferredOverride,
            note: '[DIAGNOSTIC] submitAnswerWithScoring called with isDeferredOverride'
        }, '[DIAGNOSTIC] Top-level entry to submitAnswerWithScoring');

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
            select: { playMode: true, accessCode: true, status: true, differedAvailableFrom: true, differedAvailableTo: true }
        });
        // --- PATCH: Use status for deferred mode detection ---
        const isDeferred = gameInstance?.playMode === 'tournament' && gameInstance?.status === 'completed';
        logger.info({ gameInstanceId, userId, playMode: gameInstance?.playMode, status: gameInstance?.status, isDeferred }, '[LOG] GameInstance fetch result (using status for deferred mode)');
        // Use canonical attemptCount for all modes (deferred bug workaround removed)
        const attemptCount = participant.nbAttempts;
        // Use canonical attemptCount for all modes (deferred bug workaround removed)
        const attemptCountForTimer = attemptCount;
        // FIX: Always use attempt-namespaced key for DEFERRED participants
        let answerKey: string;
        if (isDeferred) {
            answerKey = `mathquest:game:answers:${gameInstance.accessCode}:${answerData.questionUid}:${attemptCount}`;
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                attemptCount,
                attemptCountForTimer,
                answerKey,
                playMode: gameInstance?.playMode,
                status: gameInstance?.status,
                participationType: isDeferred ? 'DEFERRED' : 'LIVE',
                note: '[CLEANUP] Using canonical attemptCount for timer and answer key in DEFERRED mode.'
            }, '[MODERN] Using canonical attempt-based answer key for DEFERRED participant');
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
            status: gameInstance?.status,
            participationType: isDeferred ? 'DEFERRED' : 'LIVE'
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
                mode: gameInstance?.playMode,
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
                mode: gameInstance?.playMode,
                note: 'Duplicate answer detected, no score update.'
            }, '[DIAGNOSTIC] Duplicate answer detected for DEFERRED/LIVE/QUIZ');

            // Get current total score from Redis
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            const currentRedisScore = redisParticipantData ?
                (JSON.parse(redisParticipantData).score || 0) : 0;

            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: currentRedisScore,
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

            // Get current total score from Redis
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            const currentRedisScore = redisParticipantData ?
                (JSON.parse(redisParticipantData).score || 0) : 0;

            return {
                scoreUpdated: false,
                scoreAdded: 0,
                totalScore: currentRedisScore,
                answerChanged: previousAnswerExists,
                previousAnswer,
                message: 'Question not found'
            };
        }
        // Calculate server-side timing (SECURITY FIX: always use CanonicalTimerService)
        let serverTimeSpent: number = 0;
        let timerDebugInfo: any = {};
        const canonicalTimerService = new CanonicalTimerService(redisClient);
        const playMode = gameInstance.playMode;
        const accessCode = gameInstance.accessCode;
        const questionUid = answerData.questionUid;
        if (playMode !== 'practice') {
            serverTimeSpent = await canonicalTimerService.getElapsedTimeMs(
                accessCode,
                questionUid,
                playMode,
                isDeferred,
                userId,
                attemptCountForTimer
            );
            // Use canonical public timer key util for all modes
            const timerKey = getTimerKey({
                accessCode,
                userId: userId || '',
                questionUid,
                attemptCount: attemptCountForTimer,
                isDeferred
            });
            const rawTimer = await redisClient.get(timerKey);
            let timerState = null;
            try { timerState = rawTimer ? JSON.parse(rawTimer) : null; } catch (e) { timerState = rawTimer; }
            timerDebugInfo = {
                playMode,
                isDeferred,
                accessCode,
                questionUid,
                userId,
                attemptCount,
                attemptCountForTimer,
                serverTimeSpent,
                timerState,
                timerKey,
                note: '[MODERN] CanonicalTimerService.getElapsedTimeMs used for penalty, using canonical attemptCount in all modes.'
            };
        } else {
            serverTimeSpent = 0;
            timerDebugInfo = { playMode, note: 'Practice mode: no timer' };
        }
        // [LOG REMOVED] Noisy timer/mode diagnostic
        const isCorrect = checkAnswerCorrectness(question, answerData.answer);
        logger.info({ gameInstanceId, userId, questionUid: answerData.questionUid, isCorrect }, '[LOG] Answer correctness check result');
        const { score: newScore, timePenalty } = calculateAnswerScore(isCorrect, serverTimeSpent, question);
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            newScore,
            timePenalty,
            serverTimeSpent,
            isDeferred,
            playMode: gameInstance?.playMode,
            attemptCount,
            timerDebugInfo
        }, '[TIME_PENALTY] Calculated score and time penalty (canonical)');
        // Replace previous score for this question (not increment)
        let scoreDelta = newScore - previousScore;

        // ANTI-CHEATING: Store scores in Redis only during game, not in database
        // Database will be updated only when game ends via persistLeaderboardToGameInstance
        let currentTotalScore = 0;

        // Calculate new total score based on mode
        if (isDeferred) {
            // For deferred mode, we need to handle score replacement properly
            // The scoreDelta already accounts for the difference between new and previous answer scores
            // So we just add the delta to get the new total (this replaces the previous answer score)
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            const currentRedisScore = redisParticipantData ?
                (JSON.parse(redisParticipantData).score || 0) : 0;
            currentTotalScore = currentRedisScore + scoreDelta;

            // No max logic here - we trust that scoreDelta correctly represents the change
            // The max logic will be applied later during persistence to database
        } else {
            // For live mode, increment the score
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            const currentRedisScore = redisParticipantData ?
                (JSON.parse(redisParticipantData).score || 0) : 0;
            currentTotalScore = currentRedisScore + scoreDelta;
        }

        logger.info({
            gameInstanceId,
            userId,
            currentTotalScore,
            scoreDelta,
            isDeferred,
            note: 'ANTI-CHEATING: Updating Redis only, database will be updated at game end'
        }, '[ANTI-CHEATING] Calculated new total score for Redis update');
        // [LOG REMOVED] Noisy log for DB score update
        // Update Redis with new answer (remove answerData.timeSpent, store serverTimeSpent only)
        if (gameInstance) {
            await redisClient.hset(
                answerKey,
                userId,
                JSON.stringify({
                    userId,
                    answer: answerData.answer,
                    serverTimeSpent,
                    submittedAt: Date.now(),
                    isCorrect,
                    score: newScore
                })
            );
            // [LOG REMOVED] Noisy diagnostic log for Redis answer storage
            // Update Redis participant data with new total score
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            // [LOG REMOVED] Noisy log for Redis participant update
            const redisParticipantData = await redisClient.hget(participantKey, userId);
            if (redisParticipantData) {
                const participantData = JSON.parse(redisParticipantData);
                participantData.score = currentTotalScore;
                await redisClient.hset(participantKey, userId, JSON.stringify(participantData));
                // [LOG REMOVED] Noisy log for Redis participant update
            }
            // Update Redis leaderboard ZSET with new total score
            const leaderboardKey = `mathquest:game:leaderboard:${gameInstance.accessCode}`;
            // [LOG REMOVED] Noisy log for leaderboard ZSET update
            await redisClient.zadd(leaderboardKey, currentTotalScore, userId);
            // [LOG REMOVED] Noisy log for leaderboard ZSET update
        }
        logger.info({ gameInstanceId, userId, scoreDelta, totalScore: currentTotalScore }, '[LOG] Final score result for answer submission');
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            scoreDelta,
            totalScore: currentTotalScore,
            timePenalty,
            serverTimeSpent,
            isDeferred,
            playMode: gameInstance?.playMode,
            attemptCount,
            note: 'ANTI-CHEATING: Redis-only update, database will be updated at game end'
        }, '[ANTI-CHEATING] Final score and time penalty for answer submission');
        return {
            scoreUpdated: scoreDelta !== 0,
            scoreAdded: scoreDelta,
            totalScore: currentTotalScore,
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
