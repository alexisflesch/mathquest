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

// New type for the timer/session context
export interface GameAnswerContext {
    timer: any; // Canonical timer object (already resolved)
    gameState: any; // Canonical game/session state (already resolved)
    participant: any; // Canonical participant (already resolved)
    gameInstance: any; // Canonical gameInstance (already resolved)
}

// Refactored handler: accepts timer/session context as argument
export function gameAnswerHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    context: GameAnswerContext
) {
    logger.info({ socketId: socket.id }, 'gameAnswerHandler registered');

    // Define the handler function
    const handler = async (payload: any) => {
        // Always declare these for use in error/final logging
        let accessCode: string | undefined = undefined;
        let userId: string | undefined = undefined;
        let questionUid: string | undefined = undefined;
        let timeSpent: number | undefined = undefined;
        let answer: any = undefined;
        let scoringMode: string | undefined = undefined;
        let scoringPerformed: boolean | undefined = undefined;
        let scoringResult: any = undefined;
        // Variable to track answer correctness, defined at the top level so it's available to all code paths
        let isCorrect = false;
        const participantService = new GameParticipantService();
        try {
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
                (isDeferred && (!statusOk || !withinDeferredWindow))
            ) {
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, {
                    message: isDeferred ? 'Deferred play not available (expired or not completed).' : 'Game is not active. Answers cannot be submitted.',
                    code: isDeferred ? 'DEFERRED_NOT_AVAILABLE' : 'GAME_NOT_ACTIVE'
                });
                return;
            }
            // Validate answers locked
            if (gameState.gameState.answersLocked) {
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, {
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                });
                return;
            }
            // Validate timer
            // Use the timer provided in context (already resolved for the correct mode/session)
            // No timer selection logic remains here; all selection is done at the call site.
            if (!timer) {
                logger.warn({
                    accessCode,
                    userId,
                    questionUid,
                    message: 'No timer context provided to answer handler. Rejecting answer.'
                }, '[TIMER] Missing timer context in answer handler, rejecting answer.');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, {
                    message: 'Trop tard ! Le temps est écoulé.',
                    code: 'TIMER_STOPPED',
                    timerState: timer
                });
                return;
            }
            // [MODERNIZATION] Canonical timer check: only accept answers if timer.status === 'run' and timer.timerEndDateMs > Date.now()
            logger.info({
                accessCode,
                userId,
                questionUid,
                timerStatus: timer.status,
                timerEndDateMs: timer.timerEndDateMs,
                timerFull: timer
            }, '[TIMER] Timer state at answer submission');
            if (timer.status !== 'run' || typeof timer.timerEndDateMs !== 'number' || timer.timerEndDateMs <= Date.now()) {
                logger.info({
                    accessCode,
                    userId,
                    questionUid,
                    timerStatus: timer.status,
                    timerEndDateMs: timer.timerEndDateMs,
                    message: 'Timer not running or time is up. Rejecting answer.'
                }, '[TIMER] Timer not running or expired, rejecting answer.');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, {
                    message: 'Trop tard ! Le temps est écoulé.',
                    code: 'TIMER_STOPPED',
                    timerState: timer
                });
                return;
            }

            // Compute time penalty using canonical timer for all modes
            let canonicalElapsedMs: number | undefined = undefined;
            let timeSpentForSubmission: number = 0;
            if (timer) {
                if (timer.totalPlayTimeMs !== undefined && timer.lastStateChange !== undefined) {
                    if (timer.status === 'play') {
                        canonicalElapsedMs = timer.totalPlayTimeMs + (Date.now() - timer.lastStateChange);
                    } else {
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
                    answerKeyUsed: participant.participationType === 'DEFERRED'
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
                // --- Practice and Deferred Mode Feedback Logic ---
                if (gameInstance.playMode === 'practice') {
                    // Practice mode: send correctAnswers and feedback immediately
                    const question = await prisma.question.findUnique({ where: { uid: questionUid } });
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, {
                        questionUid,
                        timeSpent,
                        correct: isCorrect,
                        correctAnswers: question && Array.isArray(question.correctAnswers) ? question.correctAnswers : undefined,
                        explanation: question?.explanation || undefined
                    });
                    // For practice mode, we don't automatically send the next question
                    // Instead, the client will request the next question after showing feedback
                    logger.info({ accessCode, userId, questionUid }, 'Waiting for client to request next question via request_next_question event');
                } else if (gameInstance.isDiffered || gameInstance.playMode === 'tournament') {
                    // Tournament (live or deferred): DO NOT send explanation/correctAnswers here
                    // Feedback/explanation is sent at the end of the timer in the tournament flow
                    logger.info({ accessCode, userId, questionUid }, 'Tournament mode: answer_received emitted without explanation/correctAnswers');
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, { questionUid, timeSpent });
                }
            } else {
                // Quiz mode or other: minimal answer_received
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                } else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
                io.to(roomName).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
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
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, { message: 'Unexpected error during answer submission.' });
                if (questionUid && timeSpent !== undefined) {
                    socket.emit(SOCKET_EVENTS.GAME.ANSWER_RECEIVED as any, { questionUid, timeSpent });
                    logger.info(`[GAME_ANSWER] Sent fallback answer_received after error for question ${questionUid}`);
                }
            } catch (emitError) {
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
};

// NOTE: Handler registration is done in game/index.ts to prevent duplicate registrations
// Do NOT register the handler here: socket.on('game_answer', handler) - REMOVED
