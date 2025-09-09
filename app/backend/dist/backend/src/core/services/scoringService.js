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
const timerKeyUtil_1 = require("./timerKeyUtil");
const canonicalTimerService_1 = require("./canonicalTimerService");
const logger = (0, logger_1.default)('ScoringService');
/**
 * Core scoring calculation with new balanced scoring system
 * @param question Question object with timeLimit and other properties
 * @param answer User's submitted answer
 * @param serverTimeSpent Time spent in milliseconds (server-calculated)
 * @param accessCode Game access code to get total questions for scaling
 * @returns Score for this answer
 */
async function calculateAnswerScore(question, answer, serverTimeSpent, accessCode) {
    if (!question)
        return { score: 0, timePenalty: 0 };
    // Get total questions for game scaling (default to 10 if not available)
    let totalQuestions = 10;
    if (accessCode) {
        try {
            const gameDataKey = `mathquest:game:${accessCode}`;
            const gameData = await redis_1.redisClient.get(gameDataKey);
            if (gameData) {
                const parsed = JSON.parse(gameData);
                if (parsed.questionUids && Array.isArray(parsed.questionUids)) {
                    totalQuestions = parsed.questionUids.length;
                }
            }
            else {
                // Redis didn't have metadata for this game - try to derive question count from DB
                try {
                    const gi = await prisma_1.prisma.gameInstance.findUnique({
                        where: { accessCode },
                        select: { gameTemplateId: true }
                    });
                    if (gi && gi.gameTemplateId) {
                        const qCount = await prisma_1.prisma.questionsInGameTemplate.count({ where: { gameTemplateId: gi.gameTemplateId } });
                        if (qCount > 0)
                            totalQuestions = qCount;
                    }
                }
                catch (dbErr) {
                    logger.warn({ error: dbErr, accessCode }, 'Failed to fetch question count from DB; falling back to default of 10');
                }
            }
        }
        catch (error) {
            logger.warn({ error, accessCode }, 'Failed to get total questions for scaling, using default of 10');
        }
    }
    // Calculate base score per question (scaled so total game = 1000 points)
    const baseScorePerQuestion = 1000 / totalQuestions;
    // Calculate correctness score based on question type
    let correctnessScore = 0;
    if (question.multipleChoiceQuestion) {
        // Balanced partial scoring for multiple-choice questions
        // raw_score = max(0, (C_B / B) - (C_M / M))
        // where:
        //  - B = number of correct options
        //  - C_B = number of correctly selected options
        //  - M = number of incorrect options
        //  - C_M = number of incorrectly selected options
        try {
            const mc = question.multipleChoiceQuestion;
            const correctAnswersArr = Array.isArray(mc.correctAnswers) ? mc.correctAnswers : [];
            const B = correctAnswersArr.filter(Boolean).length;
            const M = Math.max(0, correctAnswersArr.length - B);
            const selected = Array.isArray(answer) ? answer : (typeof answer === 'number' ? [answer] : []);
            const selectedSet = new Set(selected);
            let C_B = 0;
            let C_M = 0;
            for (let i = 0; i < correctAnswersArr.length; i++) {
                const isCorrect = !!correctAnswersArr[i];
                if (selectedSet.has(i)) {
                    if (isCorrect)
                        C_B++;
                    else
                        C_M++;
                }
            }
            const partCorrect = B > 0 ? (C_B / B) : 0;
            const partIncorrect = M > 0 ? (C_M / M) : 0;
            const raw_score = Math.max(0, partCorrect - partIncorrect);
            correctnessScore = raw_score;
        }
        catch (err) {
            logger.warn({ error: err, questionUid: question.uid }, 'Failed to compute partial multiple-choice score, falling back to strict correctness');
            correctnessScore = checkAnswerCorrectness(question, answer) ? 1 : 0;
        }
    }
    else if (question.numericQuestion || question.questionType === 'numeric') {
        // Numeric questions: binary correct/incorrect
        const isCorrect = checkAnswerCorrectness(question, answer);
        correctnessScore = isCorrect ? 1 : 0;
    }
    else {
        // Default: check if answer is correct
        const isCorrect = checkAnswerCorrectness(question, answer);
        correctnessScore = isCorrect ? 1 : 0;
    }
    // Apply time penalty using logarithmic decay
    // Get duration from timer Redis key instead of database
    let timeLimit = 60000; // Default 60 seconds in ms
    if (accessCode) {
        try {
            // Try the basic timer key first (for live/quiz mode)
            let timerKey = `mathquest:timer:${accessCode}:${question.uid}`;
            let timerData = await redis_1.redisClient.get(timerKey);
            if (!timerData) {
                // If not found, we might need to check if this is a more complex key pattern
                // For now, use the simple pattern as it's the most common
                logger.warn({ accessCode, questionUid: question.uid }, 'Timer data not found in Redis, using default duration');
            }
            else {
                const parsed = JSON.parse(timerData);
                if (parsed.durationMs) {
                    timeLimit = parsed.durationMs;
                }
            }
        }
        catch (error) {
            logger.warn({ error, accessCode, questionUid: question.uid }, 'Failed to get duration from timer Redis key, using default');
        }
    }
    const timeLimitSeconds = timeLimit / 1000;
    const serverTimeSpentSeconds = Math.max(0, serverTimeSpent / 1000);
    // Logarithmic time penalty: time_penalty_factor = min(1, log(t + 1) / log(T + 1))
    const alpha = 0.3; // 30% maximum penalty
    const timePenaltyFactor = Math.min(1, Math.log(serverTimeSpentSeconds + 1) / Math.log(timeLimitSeconds + 1));
    // Final score calculation
    const scoreBeforePenalty = baseScorePerQuestion * correctnessScore;
    const timePenalty = scoreBeforePenalty * alpha * timePenaltyFactor;
    const finalScore = Math.max(0, scoreBeforePenalty - timePenalty);
    logger.info({
        questionType: question.questionType,
        totalQuestions,
        baseScorePerQuestion,
        correctnessScore,
        serverTimeSpentSeconds,
        timeLimitSeconds,
        timePenaltyFactor,
        alpha,
        scoreBeforePenalty,
        timePenalty,
        finalScore,
        answer
    }, 'New scoring calculation details');
    return {
        score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
        timePenalty: Math.round(timePenalty * 100) / 100
    };
}
/**
 * Check if the answer is correct for a given question
 * @param question Question object with correctAnswers, correctAnswer, tolerance, and questionType
 * @param answer User's submitted answer
 * @returns Whether the answer is correct
 */
function checkAnswerCorrectness(question, answer) {
    if (!question)
        return false;
    // Debug: Log the complete question structure
    logger.info({
        questionUid: question.uid,
        questionTitle: question.title,
        hasNumericQuestion: !!question.numericQuestion,
        hasMultipleChoiceQuestion: !!question.multipleChoiceQuestion,
        numericQuestionData: question.numericQuestion,
        multipleChoiceQuestionData: question.multipleChoiceQuestion,
        submittedAnswer: answer,
        submittedAnswerType: typeof answer
    }, '[DEBUG] Question structure and answer for correctness check');
    // Numeric questions: check with tolerance (polymorphic structure)
    if (question.numericQuestion) {
        const numericQuestion = question.numericQuestion;
        logger.info({
            questionUid: question.uid,
            correctAnswer: numericQuestion.correctAnswer,
            tolerance: numericQuestion.tolerance,
            submittedAnswer: answer,
            submittedAnswerType: typeof answer
        }, '[DEBUG] Numeric question correctness check details');
        if (numericQuestion.correctAnswer === undefined) {
            logger.warn({
                questionUid: question.uid,
                numericQuestion
            }, '[DEBUG] Numeric question has undefined correctAnswer');
            return false;
        }
        if (typeof answer !== 'number') {
            // Try to parse as number
            const parsedAnswer = parseFloat(answer);
            if (isNaN(parsedAnswer)) {
                logger.warn({
                    questionUid: question.uid,
                    originalAnswer: answer,
                    parsedAnswer
                }, '[DEBUG] Could not parse answer as number');
                return false;
            }
            answer = parsedAnswer;
        }
        const tolerance = numericQuestion.tolerance || 0;
        const difference = Math.abs(answer - numericQuestion.correctAnswer);
        const isWithinTolerance = difference <= tolerance;
        logger.info({
            questionUid: question.uid,
            correctAnswer: numericQuestion.correctAnswer,
            submittedAnswer: answer,
            tolerance,
            difference,
            isWithinTolerance
        }, '[DEBUG] Numeric answer tolerance check result');
        return isWithinTolerance;
    }
    // Multiple choice questions: use correctAnswers array (polymorphic structure)
    if (question.multipleChoiceQuestion) {
        const multipleChoiceQuestion = question.multipleChoiceQuestion;
        if (!multipleChoiceQuestion.correctAnswers)
            return false;
        // Multiple choice (multiple answers): answer is array of indices, correctAnswers is boolean array
        if (Array.isArray(multipleChoiceQuestion.correctAnswers) && Array.isArray(answer)) {
            // Check that all and only correct indices are selected
            const correctIndices = multipleChoiceQuestion.correctAnswers
                .map((v, i) => v ? i : -1)
                .filter((i) => i !== -1);
            // Sort both arrays for comparison
            const submitted = [...answer].sort();
            const correct = [...correctIndices].sort();
            return (submitted.length === correct.length &&
                submitted.every((v, i) => v === correct[i]));
        }
        // Multiple choice (single answer): answer is index, correctAnswers is boolean array
        if (Array.isArray(multipleChoiceQuestion.correctAnswers) && typeof answer === 'number') {
            return multipleChoiceQuestion.correctAnswers[answer] === true;
        }
        // Fallback: direct comparison for other types
        if (multipleChoiceQuestion.correctAnswers) {
            return multipleChoiceQuestion.correctAnswers === answer;
        }
        return false;
    }
    // Legacy fallback for old flat structure (should not be used with polymorphic data)
    // Numeric questions: check with tolerance
    if (question.questionType === 'numeric' && question.correctAnswer !== undefined) {
        if (typeof answer !== 'number') {
            // Try to parse as number
            const parsedAnswer = parseFloat(answer);
            if (isNaN(parsedAnswer))
                return false;
            answer = parsedAnswer;
        }
        const tolerance = question.tolerance || 0;
        const difference = Math.abs(answer - question.correctAnswer);
        return difference <= tolerance;
    }
    // Multiple choice questions: use correctAnswers array
    if (!question.correctAnswers)
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
 * @param isDeferredOverride Optional override for deferred mode detection
 * @param attemptCountOverride Optional attempt count override for deferred sessions
 * @returns Score result with details
 */
async function submitAnswerWithScoring(gameInstanceId, userId, answerData, isDeferredOverride, attemptCountOverride) {
    try {
        logger.info({
            gameInstanceId,
            userId,
            answerData,
            isDeferredOverride,
            attemptCountOverride,
            note: '[DIAGNOSTIC] submitAnswerWithScoring called with isDeferredOverride and attemptCountOverride'
        }, '[DIAGNOSTIC] Top-level entry to submitAnswerWithScoring');
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
        let previousAnswerObj = null;
        let previousScore = 0;
        let previousIsCorrect = false;
        let previousAnswer = undefined;
        let previousAnswerExists = false;
        let gameInstance = null;
        gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { id: gameInstanceId },
            select: { playMode: true, accessCode: true, status: true, differedAvailableFrom: true, differedAvailableTo: true }
        });
        // --- PATCH: Use status for deferred mode detection ---
        const isDeferred = gameInstance?.playMode === 'tournament' && gameInstance?.status === 'completed';
        logger.info({ gameInstanceId, userId, playMode: gameInstance?.playMode, status: gameInstance?.status, isDeferred }, '[LOG] GameInstance fetch result (using status for deferred mode)');
        // Use canonical attemptCount for all modes (deferred bug workaround removed)
        // NEW: Use attemptCountOverride for deferred sessions if provided
        const attemptCount = (isDeferred && attemptCountOverride !== undefined) ? attemptCountOverride : participant.nbAttempts;
        // Use canonical attemptCount for all modes (deferred bug workaround removed)
        const attemptCountForTimer = attemptCount;
        logger.info({
            gameInstanceId,
            userId,
            isDeferred,
            participantNbAttempts: participant.nbAttempts,
            attemptCountOverride,
            finalAttemptCount: attemptCount,
            attemptCountForTimer,
            note: 'DEFERRED_FIX: Attempt count selection for timer and scoring'
        }, '[DEFERRED_FIX] Attempt count determination');
        // FIX: Always use attempt-namespaced key for DEFERRED participants
        let answerKey;
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
        }
        else {
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
        const prev = await redis_1.redisClient.hget(answerKey, userId);
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
        }
        else {
            logger.info({ gameInstanceId, userId, answerKey }, '[LOG] No previous answer found in Redis for this key');
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
            const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
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
        const question = await prisma_1.prisma.question.findUnique({
            where: { uid: answerData.questionUid },
            include: {
                multipleChoiceQuestion: true,
                numericQuestion: true
            }
        });
        if (!question) {
            logger.error({ gameInstanceId, userId, questionUid: answerData.questionUid }, '[ERROR] Question not found');
            // Get current total score from Redis
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
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
        let serverTimeSpent = 0;
        let timerDebugInfo = {};
        const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
        const playMode = gameInstance.playMode;
        const accessCode = gameInstance.accessCode;
        const questionUid = answerData.questionUid;
        if (playMode !== 'practice') {
            serverTimeSpent = await canonicalTimerService.getElapsedTimeMs(accessCode, questionUid, playMode, isDeferred, userId, attemptCountForTimer);
            // Use canonical public timer key util for all modes
            const timerKey = (0, timerKeyUtil_1.getTimerKey)({
                accessCode,
                userId: userId || '',
                questionUid,
                attemptCount: attemptCountForTimer,
                isDeferred
            });
            const rawTimer = await redis_1.redisClient.get(timerKey);
            let timerState = null;
            try {
                timerState = rawTimer ? JSON.parse(rawTimer) : null;
            }
            catch (e) {
                timerState = rawTimer;
            }
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
        }
        else {
            serverTimeSpent = 0;
            timerDebugInfo = { playMode, note: 'Practice mode: no timer' };
        }
        // [LOG REMOVED] Noisy timer/mode diagnostic
        // Calculate if answer is correct for Redis storage
        const isCorrect = checkAnswerCorrectness(question, answerData.answer);
        const { score: newScore, timePenalty } = await calculateAnswerScore(question, answerData.answer, serverTimeSpent, gameInstance.accessCode);
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
            const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
            const currentRedisScore = redisParticipantData ?
                (JSON.parse(redisParticipantData).score || 0) : 0;
            currentTotalScore = currentRedisScore + scoreDelta;
            // No max logic here - we trust that scoreDelta correctly represents the change
            // The max logic will be applied later during persistence to database
        }
        else {
            // For live mode, increment the score
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
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
            await redis_1.redisClient.hset(answerKey, userId, JSON.stringify({
                userId,
                answer: answerData.answer,
                serverTimeSpent,
                submittedAt: Date.now(),
                isCorrect,
                score: newScore
            }));
            // [LOG REMOVED] Noisy diagnostic log for Redis answer storage
            // Update Redis participant data with new total score
            const participantKey = `mathquest:game:participants:${gameInstance.accessCode}`;
            // [LOG REMOVED] Noisy log for Redis participant update
            const redisParticipantData = await redis_1.redisClient.hget(participantKey, userId);
            let participantData;
            if (redisParticipantData) {
                participantData = JSON.parse(redisParticipantData);
                participantData.score = currentTotalScore;
            }
            else {
                // Create initial participant data if it doesn't exist
                participantData = {
                    score: currentTotalScore,
                    userId: userId,
                    timestamp: Date.now()
                };
            }
            await redis_1.redisClient.hset(participantKey, userId, JSON.stringify(participantData));
            // [LOG REMOVED] Noisy log for Redis participant update
            if (isDeferred) {
                // 🔒 DEFERRED MODE FIX: Update session state instead of global leaderboard
                // Store score in isolated session state, not global Redis leaderboard
                const sessionStateKey = `deferred_session:${gameInstance.accessCode}:${userId}:${attemptCount}`;
                await redis_1.redisClient.hset(sessionStateKey, 'score', currentTotalScore.toString());
                logger.info({
                    gameInstanceId,
                    userId,
                    sessionStateKey,
                    currentTotalScore,
                    attemptCount,
                    note: 'Updated deferred session score (isolated from global leaderboard)'
                }, '[DEFERRED] Score updated in session state');
            }
            else {
                // Update Redis leaderboard ZSET with new total score (live mode only)
                const leaderboardKey = `mathquest:game:leaderboard:${gameInstance.accessCode}`;
                // [LOG REMOVED] Noisy log for leaderboard ZSET update
                await redis_1.redisClient.zadd(leaderboardKey, currentTotalScore, userId);
                // [LOG REMOVED] Noisy log for leaderboard ZSET update
            }
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
