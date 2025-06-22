"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameAnswerHandler = gameAnswerHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const gameStateService_1 = require("@/core/gameStateService");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const sharedLeaderboard_1 = require("../sharedLeaderboard");
const events_2 = require("@shared/types/socket/events");
const helpers_1 = require("../teacherControl/helpers");
const answer_1 = require("@shared/types/core/answer");
const canonicalTimerService_1 = require("@/services/canonicalTimerService");
const logger = (0, logger_1.default)('GameAnswerHandler');
function gameAnswerHandler(io, socket) {
    logger.info({ socketId: socket.id }, 'gameAnswerHandler registered');
    // Define the handler function
    const handler = async (payload) => {
        // First log to ensure we're receiving the event
        logger.info('[GAME_ANSWER EVENT RECEIVED]', payload, 'Socket ID:', socket.id, 'Connected:', socket.connected);
        logger.info({ socketId: socket.id, event: 'game_answer', payload, connected: socket.connected }, 'TOP OF HANDLER: gameAnswerHandler invoked');
        // Variable to track answer correctness, defined at the top level so it's available to all code paths
        let isCorrect = false;
        // Zod validation for payload
        const parseResult = answer_1.AnswerSubmissionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            logger.warn({
                socketId: socket.id,
                error: 'Invalid answer submission payload',
                details: parseResult.error.format(),
                payload
            }, 'Zod validation failed for answer submission');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'INVALID_PAYLOAD',
                message: 'Invalid answer submission payload.'
            });
            return;
        }
        const validPayload = parseResult.data;
        const { accessCode, userId, questionUid, answer, timeSpent } = validPayload;
        try {
            logger.debug({ accessCode, userId, questionUid, answer, timeSpent }, 'Looking up gameInstance');
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    initiatorUserId: true,
                    playMode: true
                }
            });
            logger.debug({ gameInstance }, 'Result of gameInstance lookup');
            if (!gameInstance) {
                logger.warn({ socketId: socket.id, error: 'Game not found', accessCode }, 'EARLY RETURN: Game instance not found');
                const errorPayload = { message: 'Game not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionUid }, 'Emitting game_error: game not found');
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            if (gameInstance.isDiffered) {
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    logger.warn({ socketId: socket.id, error: 'Differed mode not available', accessCode }, 'EARLY RETURN: Differed window not available');
                    const errorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload, accessCode, userId, questionUid }, 'Emitting game_error: differed window not available');
                    socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                    return;
                }
            }
            // Extra logging before participant lookup
            logger.debug({ accessCode, userId, questionUid }, 'Looking up participant');
            let participant;
            try {
                participant = await prisma_1.prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId },
                    include: { user: true }
                });
            }
            catch (err) {
                logger.error({ err, accessCode, userId, questionUid }, 'Error during participant lookup');
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, { message: 'Error looking up participant.' });
                return;
            }
            logger.debug({ participant }, 'Result of participant lookup');
            if (!participant) {
                logger.warn({ socketId: socket.id, error: 'Participant not found', userId, gameInstanceId: gameInstance.id }, 'EARLY RETURN: Participant not found');
                const errorPayload = { message: 'Participant not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionUid }, 'Emitting game_error: participant not found');
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // Remove completedAt check since field was removed
            // For deferred tournaments, we now allow unlimited replays
            // CRITICAL: Add timer validation before processing answer
            // Fetch current game state to check timer status
            const fullGameState = await (0, gameStateService_1.getFullGameState)(accessCode);
            if (!fullGameState) {
                logger.warn({ socketId: socket.id, error: 'Game state not found', accessCode }, 'EARLY RETURN: Game state not found');
                const errorPayload = { message: 'Game state not found.' };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            const { gameState } = fullGameState;
            // Check if game is active
            if (gameState.status !== 'active') {
                logger.warn({
                    socketId: socket.id,
                    accessCode,
                    userId,
                    questionUid,
                    gameStatus: gameState.status,
                    playMode: gameInstance.playMode
                }, 'EARLY RETURN: Answer submitted but game is not active');
                const errorPayload = {
                    message: 'Game is not active. Answers cannot be submitted.',
                    code: 'GAME_NOT_ACTIVE'
                };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // Check if answers are locked
            if (gameState.answersLocked) {
                logger.warn({ socketId: socket.id, accessCode, userId, questionUid }, 'EARLY RETURN: Answers are locked');
                const errorPayload = {
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // Check timer status and expiration
            if (gameState.timer) {
                const timerObj = gameState.timer;
                // Add detailed timer state logging
                logger.info({
                    socketId: socket.id,
                    accessCode,
                    userId,
                    questionUid,
                    timerState: {
                        status: timerObj.status,
                        timeLeftMs: timerObj.timeLeftMs,
                        durationMs: timerObj.durationMs,
                        timestamp: timerObj.timestamp
                    },
                    playMode: gameInstance.playMode,
                    gameStatus: gameState.status
                }, 'TIMER VALIDATION: Checking timer state for answer submission');
                // For all modes: check if timer is stopped (when timer exists)
                if (timerObj.status === 'stop') {
                    logger.warn({
                        socketId: socket.id,
                        accessCode,
                        userId,
                        questionUid,
                        timerStatus: timerObj.status,
                        playMode: gameInstance.playMode
                    }, 'EARLY RETURN: Answer submitted but timer is stopped');
                    const errorPayload = {
                        message: 'Trop tard ! Le temps est écoulé.',
                        code: 'TIMER_STOPPED'
                    };
                    logger.info({ errorPayload, socketId: socket.id }, 'Emitting game_error: timer stopped');
                    socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                    return;
                }
                // For all modes: check if timer has expired
                if (timerObj.durationMs && timerObj.durationMs > 0) {
                    let timeLeftMs = timerObj.timeLeftMs || 0;
                    // Calculate actual remaining time if timer is running
                    if (timerObj.status === 'play' && timerObj.timestamp) {
                        const elapsed = Date.now() - timerObj.timestamp;
                        timeLeftMs = Math.max(0, timerObj.timeLeftMs - elapsed);
                    }
                    if (timeLeftMs <= 0) {
                        logger.warn({
                            socketId: socket.id,
                            accessCode,
                            userId,
                            questionUid,
                            timeLeftMs,
                            playMode: gameInstance.playMode
                        }, 'EARLY RETURN: Answer submitted after timer expired');
                        const errorPayload = {
                            message: 'Time has expired for this question.',
                            code: 'TIME_EXPIRED'
                        };
                        socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                        return;
                    }
                }
            }
            const participantService = new gameParticipantService_1.GameParticipantService();
            logger.debug({ userId, gameInstanceId: gameInstance.id, questionUid, answer, timeSpent }, 'Calling participantService.submitAnswer');
            // Compute time penalty using canonical timer for all modes
            let canonicalElapsedMs = undefined;
            let timeSpentForSubmission = 0;
            const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
            logger.info({
                accessCode,
                userId,
                questionUid,
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered
            }, '[TIMER_DEBUG] About to calculate elapsed time in gameAnswerHandler');
            if (gameInstance.playMode === 'quiz' || (gameInstance.playMode === 'tournament' && !gameInstance.isDiffered)) {
                // Global timer for quiz and live tournament
                canonicalElapsedMs = await canonicalTimerService.getElapsedTimeMs(accessCode, questionUid, gameInstance.playMode, gameInstance.isDiffered);
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    playMode: gameInstance.playMode,
                    isDiffered: gameInstance.isDiffered,
                    canonicalElapsedMs
                }, '[TIMER_DEBUG] Canonical elapsed time for answer submission (quiz/live)');
                timeSpentForSubmission = canonicalElapsedMs ?? 0;
            }
            else if (gameInstance.playMode === 'tournament' && gameInstance.isDiffered) {
                // Per-user session timer for differed tournaments
                canonicalElapsedMs = await canonicalTimerService.getElapsedTimeMs(accessCode, questionUid, gameInstance.playMode, gameInstance.isDiffered, userId);
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    playMode: gameInstance.playMode,
                    isDiffered: gameInstance.isDiffered,
                    canonicalElapsedMs
                }, '[TIMER_DEBUG] Canonical elapsed time for answer submission (differed)');
                timeSpentForSubmission = canonicalElapsedMs ?? 0;
            }
            else if (gameInstance.playMode === 'practice') {
                // No timer for practice mode
                timeSpentForSubmission = 0;
            }
            // Submit answer using the new scoring service (handles duplicates and scoring)
            const submissionResult = await participantService.submitAnswer(gameInstance.id, userId, {
                questionUid: questionUid, // Use questionUid to match AnswerSubmissionPayload
                answer,
                timeSpent: timeSpentForSubmission,
                accessCode: payload.accessCode, // Include required accessCode field
                userId: userId // Include required userId field
            });
            if (!submissionResult.success) {
                logger.error({ accessCode, userId, questionUid, error: submissionResult.error }, 'Answer submission failed');
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, {
                    message: submissionResult.error || 'Failed to submit answer',
                    code: 'SUBMISSION_ERROR'
                });
                return;
            }
            // Extract scoring information from the result
            const scoreResult = submissionResult.scoreResult;
            if (scoreResult) {
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    scoreUpdated: scoreResult.scoreUpdated,
                    scoreAdded: scoreResult.scoreAdded,
                    totalScore: scoreResult.totalScore,
                    answerChanged: scoreResult.answerChanged,
                    message: scoreResult.message
                }, 'Answer processed with scoring result');
                // Emit feedback about the submission
                if (!scoreResult.scoreUpdated && scoreResult.answerChanged === false) {
                    // Same answer resubmitted
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                        questionUid,
                        timeSpent
                    });
                    logger.info({ userId, questionUid, message: 'Duplicate answer - no points added' }, 'Same answer resubmitted');
                }
                else if (scoreResult.scoreUpdated) {
                    // New score awarded
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                        questionUid,
                        timeSpent
                    });
                    logger.info({
                        userId,
                        questionUid,
                        scoreAdded: scoreResult.scoreAdded,
                        totalScore: scoreResult.totalScore,
                        answerChanged: scoreResult.answerChanged
                    }, 'Answer scored successfully');
                }
                else {
                    // Answer recorded but no points
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                        questionUid,
                        timeSpent
                    });
                    logger.info({ userId, questionUid, message: 'Answer recorded but no points' }, 'Answer processed');
                }
            }
            // Emit real-time answer statistics to teacher dashboard
            try {
                const answerStats = await (0, helpers_1.getAnswerStats)(accessCode, questionUid);
                const dashboardStatsPayload = {
                    questionUid,
                    stats: answerStats
                };
                // Emit to dashboard room - consistent naming across all game types
                const dashboardRoom = `dashboard_${gameInstance.id}`;
                logger.debug({
                    accessCode,
                    questionUid,
                    answerStats,
                    dashboardRoom,
                    playMode: gameInstance.playMode
                }, 'Emitting answer stats update to dashboard room');
                io.to(dashboardRoom).emit(events_2.TEACHER_EVENTS.DASHBOARD_ANSWER_STATS_UPDATE, dashboardStatsPayload);
            }
            catch (statsError) {
                logger.error({
                    accessCode,
                    questionUid,
                    error: statsError
                }, 'Error computing or emitting answer stats');
            }
            // Refetch participant to get updated score
            const updatedParticipant = await prisma_1.prisma.gameParticipant.findUnique({
                where: { id: participant.id },
                include: { user: true }
            });
            logger.debug({ updatedParticipant }, 'Result of updated participant lookup');
            if (!updatedParticipant || !updatedParticipant.user) {
                logger.warn({ socketId: socket.id, error: 'Error fetching updated participant', participantId: participant.id }, 'EARLY RETURN: Error fetching updated participant');
                // This should ideally not happen if the previous findFirst succeeded
                const errorPayload = { message: 'Error fetching updated participant data.' };
                logger.warn({ errorPayload }, 'Emitting game_error: error fetching updated participant');
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // Use shared leaderboard calculation
            const leaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
            logger.debug({ leaderboard }, 'Leaderboard data');
            if (gameInstance.isDiffered) {
                // Practice mode: send correctAnswers and feedback immediately
                const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionUid } });
                socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                    questionUid,
                    timeSpent,
                    correct: isCorrect,
                    correctAnswers: question && Array.isArray(question.correctAnswers) ? question.correctAnswers : undefined,
                    explanation: question?.explanation || undefined
                });
                // 3. Get GameInstance to find gameTemplateId
                const gameInst = await prisma_1.prisma.gameInstance.findUnique({ where: { id: participant.gameInstanceId } });
                if (!gameInst) {
                    socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, { message: 'Game instance not found for participant.' });
                    return;
                }
                const allQuestions = await prisma_1.prisma.questionsInGameTemplate.findMany({
                    where: { gameTemplateId: gameInst.gameTemplateId },
                    orderBy: { sequence: 'asc' }
                });
                // 4. Use participant.answers (array) to determine which questions are answered
                // Since answers field was removed, we'll track progress differently
                // For now, we'll use Redis or another method to track answered questions
                const answersArr = [];
                // TODO: Implement Redis-based answer tracking if needed
                // For practice mode, we don't automatically send the next question
                // Instead, the client will request the next question after showing feedback
                logger.info({ accessCode, userId, questionUid }, 'Waiting for client to request next question via request_next_question event');
                // Count total answered questions to determine if this was the last one
                logger.info(`[GAME_ANSWER] Raw answers array:`, JSON.stringify(answersArr));
                // More robust extraction of questionUid
                const answeredQuestions = [];
                for (const a of answersArr) {
                    if (a && typeof a === 'object' && 'questionUid' in a && typeof a.questionUid === 'string') {
                        answeredQuestions.push(a.questionUid);
                    }
                }
                // Add the current question if it's missing from the answers array
                if (questionUid && !answeredQuestions.includes(questionUid)) {
                    logger.info(`[GAME_ANSWER] Adding current questionUid ${questionUid} to answered questions`);
                    answeredQuestions.push(questionUid);
                }
                const answeredSet = new Set(answeredQuestions);
                const totalQuestions = allQuestions.length;
                logger.info(`[GAME_ANSWER] Found ${answeredSet.size}/${totalQuestions} answered questions:`, Array.from(answeredSet));
                logger.debug({
                    answeredQuestions,
                    totalQuestions,
                    answeredSetSize: answeredSet.size,
                    allQuestionIds: allQuestions.map(q => q.questionUid)
                }, 'Checking if all questions are answered');
                // Check if this was the last question, but don't automatically end the game
                logger.info(`[GAME_ANSWER] Checking if all questions are answered: answeredSet.size=${answeredSet.size}, totalQuestions=${totalQuestions}`);
                logger.debug({
                    answeredSet: Array.from(answeredSet),
                    totalQuestions,
                    answersArr: JSON.stringify(answersArr)
                }, 'Detailed answer checking');
                if (answeredSet.size >= totalQuestions) {
                    // This is the last question - but we'll wait for the player to request the end of game
                    // after they've reviewed the feedback for the last question
                    logger.info(`[GAME_ANSWER] All questions answered! Waiting for player to request game end via request_next_question`);
                    logger.info({ accessCode, userId, questionUid }, 'All questions answered, waiting for request_next_question to complete game');
                    // We've answered all questions, but we don't automatically send game_ended
                    // The client will call request_next_question after showing feedback, 
                    // and that handler will detect that there are no more questions and end the game
                }
                else {
                    logger.info(`[GAME_ANSWER] Not all questions answered yet. Waiting for client to request next question.`);
                }
            }
            else {
                // Tournament and quiz mode: DO NOT send correctAnswers or feedback here
                // Only emit answer_received (without correctAnswers/explanation)
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                }
                else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
                io.to(roomName).emit(events_1.SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE, { leaderboard });
                // Only emit answer_received with minimal info (NO correct field for tournament/quiz)
                logger.info({ questionUid, timeSpent }, 'Emitting answer_received for non-differed mode (without correct field)');
                try {
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, { questionUid, timeSpent });
                    logger.info(`[GAME_ANSWER] Successfully emitted answer_received for question ${questionUid} to socket ${socket.id}`);
                }
                catch (emitError) {
                    logger.error({ emitError, socketId: socket.id }, 'Error emitting answer_received');
                    console.error('[GAME_ANSWER] Error emitting answer_received:', emitError);
                }
            }
        }
        catch (err) {
            logger.error({ err, accessCode, userId, questionUid }, 'Unexpected error in gameAnswerHandler');
            try {
                // Try to send error response
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, { message: 'Unexpected error during answer submission.' });
                // Also send back answer_received to unblock the client (without correct field)
                if (questionUid && timeSpent !== undefined) {
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, { questionUid, timeSpent });
                    logger.info(`[GAME_ANSWER] Sent fallback answer_received after error for question ${questionUid}`);
                }
            }
            catch (emitError) {
                logger.error({ emitError, socketId: socket.id }, 'Error sending error response');
            }
        }
    };
    // NOTE: Handler registration is done in game/index.ts to prevent duplicate registrations
    // Do NOT register the handler here: socket.on('game_answer', handler) - REMOVED
    return handler;
}
