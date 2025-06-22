// [MODERNIZATION] All socket handlers in this directory use canonical shared types from shared/and Zod validation for all payloads.
// All event payloads are validated at runtime using schemas from @shared/types/socketEvents.zod or equivalent.
// No legacy or untyped payloads remain.

import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameParticipantService } from '@/core/services/gameParticipantService';
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import { getFullGameState } from '@/core/services/gameStateService';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
    LeaderboardEntryData,
    ErrorPayload
} from '@shared/types/socketEvents';
import { z } from 'zod';
import { gameAnswerPayloadSchema } from '@shared/types/socketEvents.zod';
import { calculateLeaderboard, persistLeaderboardToGameInstance } from '../sharedLeaderboard';
import { collectAnswers } from '../sharedAnswers';
import { ScoringService } from '@/core/services/scoringService';
import { GAME_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';
import { getAnswerStats } from '../teacherControl/helpers';
import type { DashboardAnswerStatsUpdatePayload } from '@shared/types/socket/dashboardPayloads';
import { AnswerSubmissionPayloadSchema } from '@shared/types/core/answer';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';

const logger = createLogger('GameAnswerHandler');

// [MODERNIZATION] All answer submission and scoring logic is now routed through scoringService.ts (submitAnswerWithScoring).
// This handler is canonical for all play modes (quiz, live tournament, deferred, practice).
// No legacy or alternate scoring logic remains.

export type GameAnswerPayload = z.infer<typeof gameAnswerPayloadSchema>;

export function gameAnswerHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    logger.info({ socketId: socket.id }, 'gameAnswerHandler registered');

    // Define the handler function
    const handler = async (payload: any) => {
        // === ENTRY LOGGING ===
        logger.info({
            socketId: socket.id,
            event: 'game_answer',
            entry: true,
            payload,
            connected: socket.connected,
            timestamp: new Date().toISOString()
        }, '[DIAGNOSTIC] ENTRY: gameAnswerHandler invoked');
        // Log every received payload, even if invalid
        logger.info({
            socketId: socket.id,
            event: 'game_answer',
            receivedPayload: payload,
            timestamp: new Date().toISOString()
        }, '[DIAGNOSTIC] PAYLOAD RECEIVED in gameAnswerHandler');

        // Variable to track answer correctness, defined at the top level so it's available to all code paths
        let isCorrect = false;
        let scoringPerformed = false;
        let scoringMode = 'unknown';
        let scoringResult: any = null;

        // Zod validation for payload
        const parseResult = AnswerSubmissionPayloadSchema.safeParse(payload);
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
            // Log unconditional early return for invalid payload
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

        const { accessCode, userId, questionUid, answer, timeSpent } = validPayload;

        try {
            logger.debug({ accessCode, userId, questionUid, answer, timeSpent }, 'Looking up gameInstance');
            const gameInstance = await prisma.gameInstance.findUnique({
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
                logger.warn({ socketId: socket.id, error: 'Game not found', accessCode }, '[DIAGNOSTIC] EARLY RETURN: Game instance not found');
                const errorPayload: ErrorPayload = { message: 'Game not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionUid }, 'Emitting game_error: game not found');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                logger.info({
                    socketId: socket.id,
                    event: 'game_answer',
                    reason: 'game_not_found',
                    accessCode,
                    userId,
                    questionUid,
                    timestamp: new Date().toISOString()
                }, '[DIAGNOSTIC] EARLY RETURN: Game instance not found in gameAnswerHandler');
                return;
            }
            if (gameInstance.isDiffered) {
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    logger.warn({ socketId: socket.id, error: 'Differed mode not available', accessCode }, '[DIAGNOSTIC] EARLY RETURN: Differed window not available');
                    const errorPayload: ErrorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload, accessCode, userId, questionUid }, 'Emitting game_error: differed window not available');
                    socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                    logger.info({
                        socketId: socket.id,
                        event: 'game_answer',
                        reason: 'differed_window_not_available',
                        accessCode,
                        userId,
                        questionUid,
                        timestamp: new Date().toISOString()
                    }, '[DIAGNOSTIC] EARLY RETURN: Differed window not available in gameAnswerHandler');
                    return;
                }
            }
            // Extra logging before participant lookup
            logger.debug({ accessCode, userId, questionUid }, 'Looking up participant');
            let participant;
            try {
                participant = await prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId },
                    include: { user: true }
                });
            } catch (err) {
                logger.error({ err, accessCode, userId, questionUid }, 'Error during participant lookup');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, { message: 'Error looking up participant.' });
                return;
            }
            logger.debug({ participant }, 'Result of participant lookup');
            if (!participant) {
                logger.warn({ socketId: socket.id, error: 'Participant not found', userId, gameInstanceId: gameInstance.id }, '[DIAGNOSTIC] EARLY RETURN: Participant not found');
                const errorPayload: ErrorPayload = { message: 'Participant not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionUid }, 'Emitting game_error: participant not found');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                logger.info({
                    socketId: socket.id,
                    event: 'game_answer',
                    reason: 'participant_not_found',
                    accessCode,
                    userId,
                    questionUid,
                    timestamp: new Date().toISOString()
                }, '[DIAGNOSTIC] EARLY RETURN: Participant not found in gameAnswerHandler');
                return;
            }
            // After participant lookup, determine DEFERRED mode per participant
            let isDifferedForLogic = false;
            if (participant && participant.participationType === 'DEFERRED') {
                isDifferedForLogic = true;
            }
            logger.info({
                accessCode,
                userId,
                questionUid,
                participationType: participant?.participationType,
                attemptCount: participant?.attemptCount,
                isDifferedForLogic,
                gameInstanceIsDiffered: gameInstance.isDiffered,
                // Log all answer keys for this user/question in Redis for debugging
                answerKeys: [
                    `mathquest:game:answers:${accessCode}:${questionUid}`,
                    `mathquest:game:answers:${accessCode}:${questionUid}:${participant?.attemptCount}`
                ]
            }, '[DIAGNOSTIC] DEFERRED mode determination and answer key debug for answer logic');

            // Remove completedAt check since field was removed
            // For deferred tournaments, we now allow unlimited replays

            // CRITICAL: Add timer validation before processing answer
            // Fetch current game state to check timer status
            const fullGameState = await getFullGameState(accessCode);
            if (!fullGameState) {
                logger.warn({ socketId: socket.id, error: 'Game state not found', accessCode }, '[DIAGNOSTIC] EARLY RETURN: Game state not found');
                const errorPayload: ErrorPayload = { message: 'Game state not found.' };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                logger.info({
                    socketId: socket.id,
                    event: 'game_answer',
                    reason: 'game_state_not_found',
                    accessCode,
                    userId,
                    questionUid,
                    timestamp: new Date().toISOString()
                }, '[DIAGNOSTIC] EARLY RETURN: Game state not found in gameAnswerHandler');
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
                }, '[DIAGNOSTIC] EARLY RETURN: Answer submitted but game is not active');
                const errorPayload: ErrorPayload = {
                    message: 'Game is not active. Answers cannot be submitted.',
                    code: 'GAME_NOT_ACTIVE'
                };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                logger.info({
                    socketId: socket.id,
                    event: 'game_answer',
                    reason: 'game_not_active',
                    accessCode,
                    userId,
                    questionUid,
                    gameStatus: gameState.status,
                    playMode: gameInstance.playMode,
                    timestamp: new Date().toISOString()
                }, '[DIAGNOSTIC] EARLY RETURN: Game not active in gameAnswerHandler');
                return;
            }

            // Check if answers are locked
            if (gameState.answersLocked) {
                logger.warn({ socketId: socket.id, accessCode, userId, questionUid }, '[DIAGNOSTIC] EARLY RETURN: Answers are locked');
                const errorPayload: ErrorPayload = {
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                logger.info({
                    socketId: socket.id,
                    event: 'game_answer',
                    reason: 'answers_locked',
                    accessCode,
                    userId,
                    questionUid,
                    timestamp: new Date().toISOString()
                }, '[DIAGNOSTIC] EARLY RETURN: Answers locked in gameAnswerHandler');
                return;
            }

            // Check timer status and expiration
            if (gameState.timer) {
                const timerObj = gameState.timer as any;

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
                    }, '[DIAGNOSTIC] EARLY RETURN: Answer submitted but timer is stopped');
                    const errorPayload: ErrorPayload = {
                        message: 'Trop tard ! Le temps est écoulé.',
                        code: 'TIMER_STOPPED'
                    };
                    logger.info({ errorPayload, socketId: socket.id }, 'Emitting game_error: timer stopped');
                    socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                    logger.info({
                        socketId: socket.id,
                        event: 'game_answer',
                        reason: 'timer_stopped',
                        accessCode,
                        userId,
                        questionUid,
                        timerStatus: timerObj.status,
                        playMode: gameInstance.playMode,
                        timestamp: new Date().toISOString()
                    }, '[DIAGNOSTIC] EARLY RETURN: Timer stopped in gameAnswerHandler');
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
                        }, '[DIAGNOSTIC] EARLY RETURN: Answer submitted after timer expired');
                        const errorPayload: ErrorPayload = {
                            message: 'Time has expired for this question.',
                            code: 'TIME_EXPIRED'
                        };
                        socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                        logger.info({
                            socketId: socket.id,
                            event: 'game_answer',
                            reason: 'timer_expired',
                            accessCode,
                            userId,
                            questionUid,
                            timeLeftMs,
                            playMode: gameInstance.playMode,
                            timestamp: new Date().toISOString()
                        }, '[DIAGNOSTIC] EARLY RETURN: Timer expired in gameAnswerHandler');
                        return;
                    }
                }
            }

            const participantService = new GameParticipantService();
            logger.debug({ userId, gameInstanceId: gameInstance.id, questionUid, answer, timeSpent }, 'Calling participantService.submitAnswer');

            // Compute time penalty using canonical timer for all modes
            let canonicalElapsedMs: number | undefined = undefined;
            let timeSpentForSubmission: number = 0;
            const canonicalTimerService = new CanonicalTimerService(redisClient);
            logger.info({
                accessCode,
                userId,
                questionUid,
                playMode: gameInstance.playMode,
                isDiffered: isDifferedForLogic
            }, '[TIMER_DEBUG] About to calculate elapsed time in gameAnswerHandler');
            if (gameInstance.playMode === 'quiz' || (gameInstance.playMode === 'tournament' && !isDifferedForLogic)) {
                // Global timer for quiz and live tournament
                canonicalElapsedMs = await canonicalTimerService.getElapsedTimeMs(accessCode, questionUid, gameInstance.playMode, false);
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    playMode: gameInstance.playMode,
                    isDiffered: false,
                    canonicalElapsedMs
                }, '[TIMER_DEBUG] Canonical elapsed time for answer submission (quiz/live)');
                timeSpentForSubmission = canonicalElapsedMs ?? 0;
            } else if (gameInstance.playMode === 'tournament' && isDifferedForLogic) {
                // Per-user session timer for differed tournaments
                canonicalElapsedMs = await canonicalTimerService.getElapsedTimeMs(accessCode, questionUid, gameInstance.playMode, true, userId);
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    playMode: gameInstance.playMode,
                    isDiffered: true,
                    canonicalElapsedMs
                }, '[TIMER_DEBUG] Canonical elapsed time for answer submission (differed)');
                timeSpentForSubmission = canonicalElapsedMs ?? 0;
            } else if (gameInstance.playMode === 'practice') {
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
                // Do NOT pass isDiffered here; DEFERRED logic is determined by participationType in handler and scoring service
            });
            scoringPerformed = true;
            scoringMode = isDifferedForLogic ? 'DEFERRED' : gameInstance.playMode;
            scoringResult = submissionResult;
            logger.info({
                accessCode,
                userId,
                questionUid,
                scoringMode,
                scoringPerformed,
                submissionResult,
                attemptCount: participant?.attemptCount,
                answerKeyUsed: isDifferedForLogic
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
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, {
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
                    answerKeyUsed: isDifferedForLogic
                        ? `mathquest:game:answers:${accessCode}:${questionUid}:${participant?.attemptCount}`
                        : `mathquest:game:answers:${accessCode}:${questionUid}`
                }, '[DIAGNOSTIC] Answer processed with scoring result and answer key');

                // Emit feedback about the submission
                if (!scoreResult.scoreUpdated && scoreResult.answerChanged === false) {
                    // Same answer resubmitted
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, {
                        questionUid,
                        timeSpent,
                        timePenalty: scoreResult.timePenalty
                    });
                    logger.info({ userId, questionUid, message: 'Duplicate answer - no points added' }, 'Same answer resubmitted');
                } else if (scoreResult.scoreUpdated) {
                    // New score awarded
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, {
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
                } else {
                    // Answer recorded but no points
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, {
                        questionUid,
                        timeSpent,
                        timePenalty: scoreResult.timePenalty
                    });
                    logger.info({ userId, questionUid, message: 'Answer recorded but no points' }, 'Answer processed');
                }
            }

            // Emit real-time answer statistics to teacher dashboard
            try {
                const answerStats = await getAnswerStats(accessCode, questionUid);
                const dashboardStatsPayload: DashboardAnswerStatsUpdatePayload = {
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

                io.to(dashboardRoom).emit(TEACHER_EVENTS.DASHBOARD_ANSWER_STATS_UPDATE as any, dashboardStatsPayload);
            } catch (statsError) {
                logger.error({
                    accessCode,
                    questionUid,
                    error: statsError
                }, 'Error computing or emitting answer stats');
            }
            // Refetch participant to get updated score
            const updatedParticipant = await prisma.gameParticipant.findUnique({
                where: { id: participant.id },
                include: { user: true }
            });
            logger.debug({ updatedParticipant }, 'Result of updated participant lookup');
            if (!updatedParticipant || !updatedParticipant.user) {
                logger.warn({ socketId: socket.id, error: 'Error fetching updated participant', participantId: participant.id }, 'EARLY RETURN: Error fetching updated participant');
                // This should ideally not happen if the previous findFirst succeeded
                const errorPayload: ErrorPayload = { message: 'Error fetching updated participant data.' };
                logger.warn({ errorPayload }, 'Emitting game_error: error fetching updated participant');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                return;
            }
            // Use shared leaderboard calculation
            const leaderboard = await calculateLeaderboard(accessCode);
            logger.debug({ leaderboard }, 'Leaderboard data');
            if (gameInstance.isDiffered) {
                // Practice mode: send correctAnswers and feedback immediately
                const question = await prisma.question.findUnique({ where: { uid: questionUid } });
                socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, {
                    questionUid,
                    timeSpent,
                    correct: isCorrect,
                    correctAnswers: question && Array.isArray(question.correctAnswers) ? question.correctAnswers : undefined,
                    explanation: question?.explanation || undefined
                });
                // 3. Get GameInstance to find gameTemplateId
                const gameInst = await prisma.gameInstance.findUnique({ where: { id: participant.gameInstanceId } });
                if (!gameInst) {
                    socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, { message: 'Game instance not found for participant.' });
                    return;
                }
                const allQuestions = await prisma.questionsInGameTemplate.findMany({
                    where: { gameTemplateId: gameInst.gameTemplateId },
                    orderBy: { sequence: 'asc' }
                });
                // 4. Use participant.answers (array) to determine which questions are answered
                // Since answers field was removed, we'll track progress differently
                // For now, we'll use Redis or another method to track answered questions
                const answersArr: any[] = [];

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
                } else {
                    logger.info(`[GAME_ANSWER] Not all questions answered yet. Waiting for client to request next question.`);
                }
            } else {
                // Tournament and quiz mode: DO NOT send correctAnswers or feedback here
                // Only emit answer_received (without correctAnswers/explanation)
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                } else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
                io.to(roomName).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
                // Only emit answer_received with minimal info (NO correct field for tournament/quiz)
                logger.info({ questionUid, timeSpent }, 'Emitting answer_received for non-differed mode (without correct field)');
                try {
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, { questionUid, timeSpent });
                    logger.info(`[GAME_ANSWER] Successfully emitted answer_received for question ${questionUid} to socket ${socket.id}`);
                } catch (emitError) {
                    logger.error({ emitError, socketId: socket.id }, 'Error emitting answer_received');
                    console.error('[GAME_ANSWER] Error emitting answer_received:', emitError);
                }
            }
        } catch (err) {
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
                // Try to send error response
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, { message: 'Unexpected error during answer submission.' });

                // Also send back answer_received to unblock the client (without correct field)
                if (questionUid && timeSpent !== undefined) {
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, { questionUid, timeSpent });
                    logger.info(`[GAME_ANSWER] Sent fallback answer_received after error for question ${questionUid}`);
                }
            } catch (emitError) {
                logger.error({ emitError, socketId: socket.id }, 'Error sending error response');
            }
        }

        // At the end of the try block, before returning or exiting:
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

    // NOTE: Handler registration is done in game/index.ts to prevent duplicate registrations
    // Do NOT register the handler here: socket.on('game_answer', handler) - REMOVED

    return handler;
}
