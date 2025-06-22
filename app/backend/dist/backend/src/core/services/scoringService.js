"use strict";
/**
 * Scoring Service - Centralized scoring logic for MathQuest
 *
 * This service handles all scoring calculations and answer submission logic.
 * Prevents score inflation by tracking answer changes and applies proper time penalties.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
exports.calculateAnswerScore = calculateAnswerScore;
exports.checkAnswerCorrectness = checkAnswerCorrectness;
exports.submitAnswerWithScoring = submitAnswerWithScoring;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const logger = (0, logger_1.default)('ScoringService');
/**
 * Core scoring calculation
 * @param isCorrect Whether the answer is correct
 * @param serverTimeSpent Time spent in milliseconds (server-calculated)
 * @param question Question object with timeLimit and other properties
 * @returns Score for this answer
 */
function calculateAnswerScore(isCorrect, serverTimeSpent, question) {
    if (!isCorrect || !question)
        return 0;
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
    return finalScore;
}
/**
 * Check if the answer is correct for a given question
 * @param question Question object with correctAnswers
 * @param answer User's submitted answer
 * @returns Whether the answer is correct
 */
function checkAnswerCorrectness(question, answer) {
    if (!question || !question.correctAnswers)
        return false;
    // Multiple choice (multiple answers): answer is array of indices, correctAnswers is boolean array
    if (Array.isArray(question.correctAnswers) && Array.isArray(answer)) {
        // Check that all and only correct indices are selected
        const correctIndices = question.correctAnswers
            .map((v, i) => v ? i : -1)
            .filter((i) => i !== -1);
        // Sort both arrays for comparison
        const submitted = [...answer].sort();
        const correct = [...correctIndices].sort();
        return (submitted.length === correct.length &&
            submitted.every((v, i) => v === correct[i]));
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
async function submitAnswerWithScoring(gameInstanceId, userId, answerData) {
    try {
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            answer: answerData.answer
        }, 'Starting answer submission with scoring');
        // Find the participant - get the most recent one if multiple exist
        const participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId,
                userId
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });
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
        let previousAnswerObj = null;
        let previousScore = 0;
        let previousIsCorrect = false;
        let previousAnswer = undefined;
        let previousAnswerExists = false;
        let gameInstance = null;
        gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            select: { playMode: true, accessCode: true }
        });
        if (gameInstance) {
            const redisKey = `mathquest:game:answers:${gameInstance.accessCode}:${answerData.questionUid}`;
            const prev = await redis_1.redisClient.hget(redisKey, userId);
            if (prev) {
                previousAnswerObj = JSON.parse(prev);
                previousScore = previousAnswerObj.score || 0;
                previousIsCorrect = previousAnswerObj.isCorrect || false;
                previousAnswer = previousAnswerObj.answer;
                previousAnswerExists = true;
            }
        }
        // Compare new answer to previous answer (handle single/multiple choice)
        let isSameAnswer = false;
        if (previousAnswerExists) {
            const a1 = answerData.answer;
            const a2 = previousAnswer;
            if (Array.isArray(a1) && Array.isArray(a2)) {
                const arr1 = a1;
                const arr2 = a2;
                // Multiple choice: compare arrays (order-insensitive)
                isSameAnswer =
                    arr1.length === arr2.length &&
                        arr1.every((v) => arr2.includes(v)) &&
                        arr2.every((v) => arr1.includes(v));
            }
            else if ((typeof a1 === 'string' || typeof a1 === 'number' || typeof a1 === 'boolean') &&
                (typeof a2 === 'string' || typeof a2 === 'number' || typeof a2 === 'boolean')) {
                // Single choice: compare directly
                isSameAnswer = a1 === a2;
            }
            else {
                // Fallback: not the same
                isSameAnswer = false;
            }
        }
        if (isSameAnswer) {
            // Same answer - no score update, just return current state
            logger.info({
                gameInstanceId,
                userId,
                questionUid: answerData.questionUid,
                answer: answerData.answer,
                previousAnswer
            }, 'Same answer resubmitted - no score update');
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
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: answerData.questionUid }
        });
        if (!question) {
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
        let serverTimeSpent = 0;
        let timerDebugInfo = {};
        if (gameInstance.playMode === 'practice') {
            // Practice mode: no timer
            serverTimeSpent = 0;
        }
        else if (gameInstance.playMode === 'quiz' || (gameInstance.playMode === 'tournament' && !gameInstance.isDiffered)) {
            // Quiz and live tournament: timer attached to GameInstance
            serverTimeSpent = typeof answerData.timeSpent === 'number' ? answerData.timeSpent : 0;
            timerDebugInfo = {
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered,
                answerDataTimeSpent: answerData.timeSpent,
                serverTimeSpent
            };
        }
        else if (gameInstance.playMode === 'tournament' && gameInstance.isDiffered) {
            // Differed tournament: timer attached to GameParticipant
            serverTimeSpent = typeof answerData.timeSpent === 'number' ? answerData.timeSpent : 0;
            timerDebugInfo = {
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered,
                answerDataTimeSpent: answerData.timeSpent,
                serverTimeSpent
            };
        }
        logger.info({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            timerDebugInfo
        }, '[DIAGNOSE] Timer and mode info before scoring');
        const isCorrect = checkAnswerCorrectness(question, answerData.answer);
        const newScore = calculateAnswerScore(isCorrect, serverTimeSpent, question);
        // Replace previous score for this question (not increment)
        let scoreDelta = newScore - previousScore;
        // For differed tournaments, always replace the score (not increment)
        let scoreUpdateData = { score: { increment: scoreDelta } };
        if (gameInstance.playMode === 'tournament' && gameInstance.isDiffered) {
            scoreUpdateData = { score: newScore };
        }
        // Update participant score in DB
        const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
            where: { id: participant.id },
            data: scoreUpdateData
        });
        // Update Redis with new answer
        if (gameInstance) {
            const redisKey = `mathquest:game:answers:${gameInstance.accessCode}:${answerData.questionUid}`;
            await redis_1.redisClient.hset(redisKey, userId, JSON.stringify({
                userId,
                answer: answerData.answer,
                timeSpent: answerData.timeSpent,
                serverTimeSpent,
                submittedAt: Date.now(),
                isCorrect,
                score: newScore
            }));
            // Update Redis participant data to sync with database
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
            if (redisParticipantData) {
                const participantData = JSON.parse(redisParticipantData);
                participantData.score = updatedParticipant.score;
                await redis_1.redisClient.hset(participantKey, userId, JSON.stringify(participantData));
            }
            // Update Redis leaderboard ZSET
            const leaderboardKey = `mathquest:game:leaderboard:${gameInstance.accessCode}`;
            await redis_1.redisClient.zadd(leaderboardKey, updatedParticipant.score || 0, userId);
        }
        return {
            scoreUpdated: scoreDelta !== 0,
            scoreAdded: scoreDelta,
            totalScore: updatedParticipant.score || 0,
            answerChanged: previousAnswerExists,
            previousAnswer,
            message: scoreDelta !== 0 ? 'Score updated' : 'Answer recorded but no points awarded'
        };
    }
    catch (error) {
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
exports.ScoringService = {
    calculateAnswerScore,
    checkAnswerCorrectness,
    submitAnswerWithScoring
};
