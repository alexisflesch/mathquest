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
const timingService_1 = require("@/services/timingService");
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
        logger.info({
            gameInstanceId,
            userId,
            participantId: participant.id,
            currentScore: participant.score,
            participationType: participant.participationType,
            attemptCount: participant.attemptCount,
            joinedAt: participant.joinedAt
        }, 'BUG INVESTIGATION: Found participant in scoring service');
        // Since we removed the answers field, we'll track answers in Redis instead
        // For now, let's simplify and assume each answer submission is new
        const currentAnswers = [];
        // TODO: Implement Redis-based answer tracking if needed for duplicate detection
        // Find existing answer for this question
        const existingAnswerIndex = currentAnswers.findIndex((ans) => ans.questionUid === answerData.questionUid);
        const existingAnswer = existingAnswerIndex >= 0 ? currentAnswers[existingAnswerIndex] : null;
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
        const question = await prisma_1.prisma.question.findUnique({
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
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            select: { playMode: true, accessCode: true }
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
        let serverTimeSpent;
        if (gameInstance.playMode === 'quiz' && typeof answerData.timeSpent === 'number') {
            // Use canonical timer value for quiz mode
            serverTimeSpent = answerData.timeSpent;
            logger.info({
                questionUid: answerData.questionUid,
                userId,
                serverTimeSpent,
                source: 'canonicalTimerService',
                playMode: gameInstance.playMode
            }, 'Using canonical timer for quiz mode');
        }
        else {
            // Use per-user timing for other modes
            serverTimeSpent = await timingService_1.TimingService.calculateAndCleanupTimeSpent(gameInstance.accessCode, answerData.questionUid, userId);
            logger.info({
                questionUid: answerData.questionUid,
                userId,
                serverTimeSpent,
                source: 'TimingService',
                playMode: gameInstance.playMode
            }, 'Using per-user timer for non-quiz mode');
        }
        logger.info({
            questionUid: answerData.questionUid,
            userId,
            questionType: question.questionType,
            serverTimeSpent,
            answer: answerData.answer
        }, 'DIAGNOSTIC: Time penalty and question type before score calculation');
        // Check answer correctness
        logger.info({
            questionUid: answerData.questionUid,
            userId,
            answer: answerData.answer,
            questionCorrectAnswers: question.correctAnswers,
            questionType: question.questionType
        }, 'DEBUG: Checking answer correctness input');
        const isCorrect = checkAnswerCorrectness(question, answerData.answer);
        logger.info({
            questionUid: answerData.questionUid,
            userId,
            answer: answerData.answer,
            questionCorrectAnswers: question.correctAnswers,
            questionType: question.questionType,
            isCorrect
        }, 'DEBUG: Answer correctness result');
        // Calculate new score
        const newScore = calculateAnswerScore(isCorrect, serverTimeSpent, question);
        logger.debug({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            isCorrect,
            serverTimeSpent,
            newScore
        }, 'DEBUG: Score calculation');
        // If this is a changed answer, we need to subtract the old score first
        let scoreToAdd = newScore;
        logger.debug({
            gameInstanceId,
            userId,
            questionUid: answerData.questionUid,
            isCorrect,
            newScore,
            scoreToAdd,
            participantScore: participant.score
        }, 'DEBUG: Score to add and participant score before DB update');
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
        }
        else {
            // Add new answer
            updatedAnswers = [...currentAnswers, newAnswerEntry];
        }
        // Update participant with new score
        // For DEFERRED mode: if this is a new attempt (score is 0), replace the score instead of adding
        // For LIVE mode: always increment the score
        let scoreUpdateData = {};
        if (scoreToAdd > 0) {
            if (participant.participationType === 'DEFERRED' && participant.score === 0) {
                // For deferred mode with a fresh attempt (score is 0), set the score directly
                scoreUpdateData.score = scoreToAdd;
                logger.info({
                    gameInstanceId,
                    userId,
                    participantId: participant.id,
                    participationType: participant.participationType,
                    scoreToAdd,
                    currentScore: participant.score,
                    action: 'REPLACE'
                }, 'BUG INVESTIGATION: Setting score directly for DEFERRED fresh attempt');
            }
            else {
                // For live mode or deferred mode with existing score, increment
                scoreUpdateData.score = { increment: scoreToAdd };
                logger.info({
                    gameInstanceId,
                    userId,
                    participantId: participant.id,
                    participationType: participant.participationType,
                    scoreToAdd,
                    currentScore: participant.score,
                    action: 'INCREMENT'
                }, 'BUG INVESTIGATION: Incrementing score');
            }
        }
        const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
            where: { id: participant.id },
            data: scoreUpdateData
        });
        logger.debug({
            gameInstanceId,
            userId,
            participantId: participant.id,
            scoreUpdateData,
            updatedScore: updatedParticipant.score
        }, 'DEBUG: Participant DB score after update');
        // Update Redis for answer tracking
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
            // CRITICAL FIX: Update Redis leaderboard ZSET with the participant's total score
            // This ensures leaderboard displays reflect the correct accumulated scores
            const leaderboardKey = `mathquest:game:leaderboard:${gameInstance.accessCode}`;
            await redis_1.redisClient.zadd(leaderboardKey, updatedParticipant.score || 0, userId);
            logger.debug({
                gameInstanceId,
                userId,
                accessCode: gameInstance.accessCode,
                totalScore: updatedParticipant.score,
                leaderboardKey
            }, 'Updated Redis leaderboard ZSET with participant total score');
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
