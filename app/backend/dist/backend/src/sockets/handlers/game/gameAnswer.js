"use strict";
// [MODERNIZATION] All socket handlers in this directory use canonical shared types from shared/and Zod validation for all payloads.
// All event payloads are validated at runtime using schemas from @shared/types/socketEvents.zod or equivalent.
// No legacy or untyped payloads remain.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameAnswerHandler = gameAnswerHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const sharedLeaderboard_1 = require("../sharedLeaderboard");
const events_2 = require("@shared/types/socket/events");
const helpers_1 = require("../teacherControl/helpers");
const answer_1 = require("@shared/types/core/answer");
const logger = (0, logger_1.default)('GameAnswerHandler');
// Refactored handler: accepts timer/session context as argument
function gameAnswerHandler(io, socket, context) {
    logger.info({ socketId: socket.id }, 'gameAnswerHandler registered');
    // Define the handler function
    const handler = async (payload) => {
        // Always declare these for use in error/final logging
        let accessCode = undefined;
        let userId = undefined;
        let questionUid = undefined;
        let timeSpent = undefined;
        let answer = undefined;
        let scoringMode = undefined;
        let scoringPerformed = undefined;
        let scoringResult = undefined;
        // Variable to track answer correctness, defined at the top level so it's available to all code paths
        let isCorrect = false;
        const participantService = new gameParticipantService_1.GameParticipantService();
        try {
            // Zod validation for payload
            const parseResult = answer_1.AnswerSubmissionPayloadSchema.safeParse(payload);
            if (!parseResult.success) {
                logger.warn({
                    socketId: socket.id,
                    error: 'Invalid answer submission payload',
                    details: parseResult.error.format(),
                    payload
                }, '[DIAGNOSTIC] EARLY RETURN: Zod validation failed for answer submission');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'INVALID_PAYLOAD',
                    message: 'Invalid answer submission payload.'
                });
                logger.info({
                    socketId: socket.id,
                    event: 'game_answer',
                    reason: 'invalid_payload',
                    payload,
                    timestamp: new Date().toISOString()
                }, '[DIAGNOSTIC] EARLY RETURN: Invalid payload in gameAnswerHandler');
                return;
            }
            const validPayload = parseResult.data;
            accessCode = validPayload.accessCode;
            userId = validPayload.userId;
            questionUid = validPayload.questionUid;
            timeSpent = validPayload.timeSpent;
            answer = validPayload.answer;
            // Use the provided context (timer, gameState, participant, gameInstance)
            const { timer, gameState, participant, gameInstance } = context;
            // IMPORTANT: The loaded gameState object is nested (gameState.gameState.status), not flat.
            // See diagnostic logs and loader structure. All property accesses must use gameState.gameState.<field>.
            // Validate game state
            // Modernized: Allow answer submission in deferred mode if status is 'active' or 'completed' and within deferred window
            const isDeferred = gameInstance && gameInstance.isDiffered;
            console.log(isDeferred, 'isDeferred value in gameAnswerHandler');
            const now = Date.now();
            const withinDeferredWindow = isDeferred && gameInstance.differedAvailableTo && now < new Date(gameInstance.differedAvailableTo).getTime();
            const statusOk = isDeferred
                ? (gameState.gameState.status === 'active' || gameState.gameState.status === 'completed')
                : gameState.gameState.status === 'active';
            if (!gameState ||
                (!isDeferred && gameState.gameState.status !== 'active') ||
                (isDeferred && (!statusOk || !withinDeferredWindow))) {
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, {
                    message: isDeferred ? 'Deferred play not available (expired or not completed).' : 'Game is not active. Answers cannot be submitted.',
                    code: isDeferred ? 'DEFERRED_NOT_AVAILABLE' : 'GAME_NOT_ACTIVE'
                });
                return;
            }
            // Validate answers locked
            if (gameState.gameState.answersLocked) {
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, {
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                });
                return;
            }
            // Validate timer
            // Use the timer provided in context (already resolved for the correct mode/session)
            // No timer selection logic remains here; all selection is done at the call site.
            if (timer) {
                if (timer.status === 'stop') {
                    socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, {
                        message: 'Trop tard ! Le temps est écoulé.',
                        code: 'TIMER_STOPPED'
                    });
                    return;
                }
                if (timer.totalPlayTimeMs !== undefined && timer.lastStateChange !== undefined) {
                    let timeLeftMs = timer.totalPlayTimeMs;
                    if (timer.status === 'play') {
                        timeLeftMs += Date.now() - timer.lastStateChange;
                    }
                    // If you want to enforce a max duration, do it here (not in handler)
                }
            }
            // Compute time penalty using canonical timer for all modes
            let canonicalElapsedMs = undefined;
            let timeSpentForSubmission = 0;
            if (timer) {
                if (timer.totalPlayTimeMs !== undefined && timer.lastStateChange !== undefined) {
                    if (timer.status === 'play') {
                        canonicalElapsedMs = timer.totalPlayTimeMs + (Date.now() - timer.lastStateChange);
                    }
                    else {
                        canonicalElapsedMs = timer.totalPlayTimeMs;
                    }
                    timeSpentForSubmission = canonicalElapsedMs ?? 0;
                }
            }
            if (gameInstance.playMode === 'practice') {
                timeSpentForSubmission = 0;
            }
            // Submit answer using the new scoring service (handles duplicates and scoring)
            const submissionResult = await participantService.submitAnswer(gameInstance.id, userId, {
                questionUid: questionUid, // Use questionUid to match AnswerSubmissionPayload
                answer,
                timeSpent: timeSpentForSubmission,
                accessCode: payload.accessCode, // Include required accessCode field
                userId: userId // Include required userId field
            }, isDeferred // PATCH: propagate deferred mode)
            );
            scoringPerformed = true;
            scoringMode = participant.participationType === 'DEFERRED' ? 'DEFERRED' : gameInstance.playMode;
            scoringResult = submissionResult;
            logger.info({
                accessCode,
                userId,
                questionUid,
                scoringMode,
                scoringPerformed,
                submissionResult,
                attemptCount: participant?.attemptCount,
                answerKeyUsed: participant.participationType === 'DEFERRED'
                    ? `mathquest:game:answers:${accessCode}:${questionUid}:${participant?.attemptCount}`
                    : `mathquest:game:answers:${accessCode}:${questionUid}`
            }, '[DIAGNOSTIC] Scoring service called in gameAnswerHandler (with answer key and attempt)');
            if (!submissionResult.success) {
                logger.error({ accessCode, userId, questionUid, error: submissionResult.error }, 'Answer submission failed');
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    scoringMode,
                    scoringPerformed,
                    submissionResult
                }, '[DIAGNOSTIC] EXIT: gameAnswerHandler (submission failed)');
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
                    message: scoreResult.message,
                    attemptCount: participant?.attemptCount,
                    answerKeyUsed: participant.participationType === 'DEFERRED'
                        ? `mathquest:game:answers:${accessCode}:${questionUid}:${participant?.attemptCount}`
                        : `mathquest:game:answers:${accessCode}:${questionUid}`
                }, '[DIAGNOSTIC] Answer processed with scoring result and answer key');
                // Emit feedback about the submission
                if (!scoreResult.scoreUpdated && scoreResult.answerChanged === false) {
                    // Same answer resubmitted
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                        questionUid,
                        timeSpent,
                        timePenalty: scoreResult.timePenalty
                    });
                    logger.info({ userId, questionUid, message: 'Duplicate answer - no points added' }, 'Same answer resubmitted');
                }
                else if (scoreResult.scoreUpdated) {
                    // New score awarded
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                        questionUid,
                        timeSpent,
                        timePenalty: scoreResult.timePenalty
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
                        timeSpent,
                        timePenalty: scoreResult.timePenalty
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
                // --- Practice and Deferred Mode Feedback Logic ---
                if (gameInstance.playMode === 'practice') {
                    // Practice mode: send correctAnswers and feedback immediately
                    const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionUid } });
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, {
                        questionUid,
                        timeSpent,
                        correct: isCorrect,
                        correctAnswers: question && Array.isArray(question.correctAnswers) ? question.correctAnswers : undefined,
                        explanation: question?.explanation || undefined
                    });
                    // For practice mode, we don't automatically send the next question
                    // Instead, the client will request the next question after showing feedback
                    logger.info({ accessCode, userId, questionUid }, 'Waiting for client to request next question via request_next_question event');
                }
                else if (gameInstance.isDiffered || gameInstance.playMode === 'tournament') {
                    // Tournament (live or deferred): DO NOT send explanation/correctAnswers here
                    // Feedback/explanation is sent at the end of the timer in the tournament flow
                    logger.info({ accessCode, userId, questionUid }, 'Tournament mode: answer_received emitted without explanation/correctAnswers');
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, { questionUid, timeSpent });
                }
            }
            else {
                // Quiz mode or other: minimal answer_received
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                }
                else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
                io.to(roomName).emit(events_1.SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE, { leaderboard });
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
            logger.info({
                accessCode,
                userId,
                questionUid,
                scoringMode,
                scoringPerformed,
                scoringResult,
                exit: true,
                error: err,
                timestamp: new Date().toISOString()
            }, '[DIAGNOSTIC] EXIT: gameAnswerHandler (error path)');
            try {
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, { message: 'Unexpected error during answer submission.' });
                if (questionUid && timeSpent !== undefined) {
                    socket.emit(events_1.SOCKET_EVENTS.GAME.ANSWER_RECEIVED, { questionUid, timeSpent });
                    logger.info(`[GAME_ANSWER] Sent fallback answer_received after error for question ${questionUid}`);
                }
            }
            catch (emitError) {
                logger.error({ emitError, socketId: socket.id }, 'Error sending error response');
            }
        }
        logger.info({
            accessCode,
            userId,
            questionUid,
            scoringMode,
            scoringPerformed,
            scoringResult,
            exit: true,
            timestamp: new Date().toISOString()
        }, '[DIAGNOSTIC] EXIT: gameAnswerHandler (success path)');
    };
    return handler;
}
;
// NOTE: Handler registration is done in game/index.ts to prevent duplicate registrations
// Do NOT register the handler here: socket.on('game_answer', handler) - REMOVED
