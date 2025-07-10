// Shared game flow logic for quiz and tournament modes
// Place all core progression, timer, answer reveal, feedback, and leaderboard logic here
// This module should be imported by both quiz and tournament handlers

import { Server as SocketIOServer, Socket } from 'socket.io';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/services/gameStateService';
import { filterQuestionForClient } from '@shared/types/quiz/liveQuestion';
import { prisma } from '@/db/prisma';
import { emitQuestionHandler } from './game/emitQuestionHandler';
import { dashboardTimerUpdatedPayloadSchema } from '@shared/types/socketEvents.zod';
import type { GameTimerState } from '@shared/types/core/timer';
import { computeTimerTimes } from '@/core/services/timerHelpers';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { calculateLeaderboard, persistLeaderboardToGameInstance } from './sharedLeaderboard';
import { syncSnapshotWithLiveData, emitLeaderboardFromSnapshot } from '@/core/services/gameParticipant/leaderboardSnapshotService';

const logger = createLogger('SharedGameFlow');

// Track running game flows to prevent duplicates
const runningGameFlows = new Set<string>();

export interface GameFlowOptions {
    playMode: 'quiz' | 'tournament';
    onQuestionStart?: (questionIndex: number) => void;
    onQuestionEnd?: (questionIndex: number) => void;
    onFeedback?: (questionIndex: number) => void;
    onGameEnd?: () => void;
    // Add more hooks as needed
}

/**
 * Shared function to orchestrate the game/tournament flow
 * Handles question progression, timers, answer reveal, feedback, and leaderboard
 * @param io Socket.IO server
 * @param accessCode Game access code (room)
 * @param questions Array of questions
 * @param options GameFlowOptions for mode-specific hooks
 */
export async function runGameFlow(
    io: SocketIOServer,
    accessCode: string,
    questions: any[],
    options: GameFlowOptions
) {
    logger.info({ accessCode }, `[SharedGameFlow] runGameFlow entry`);

    // Prevent duplicate game flows for the same access code
    if (runningGameFlows.has(accessCode)) {
        logger.warn({ accessCode }, `[SharedGameFlow] Game flow already running for this access code. Skipping duplicate.`);
        return;
    }

    runningGameFlows.add(accessCode);
    logger.info({ accessCode, playMode: options.playMode, questionCount: questions.length }, `[SharedGameFlow] Starting game flow. Initial delay removed as countdown is now handled by caller.`);


    try {
        // [MODERNIZATION] Redis cleanup at game start is now disabled to prevent participant/score loss.
        // If you need to clear Redis for a new game, do it at game end only.

        // Update all PENDING participants to ACTIVE when game starts
        // This prevents them from being removed when they disconnect
        await prisma.gameParticipant.updateMany({
            where: {
                gameInstance: { accessCode },
                status: 'PENDING'
            },
            data: {
                status: 'ACTIVE'
            }
        });
        logger.info({ accessCode }, '[SharedGameFlow] Updated all PENDING participants to ACTIVE status');

        logger.info({ accessCode }, `[SharedGameFlow] Proceeding with first question immediately.`);
        for (let i = 0; i < questions.length; i++) {
            // Set and persist timer in game state before emitting question
            const timeLimitSec = questions[i].timeLimit || 30;
            const durationMs = timeLimitSec * 1000;
            const timerEndDateMs = Date.now() + durationMs;
            const timer: GameTimerState = {
                status: 'run',
                timerEndDateMs,
                questionUid: typeof questions[i].uid === 'string' && questions[i].uid ? questions[i].uid : 'unknown',
            };
            // Fetch and update game state
            const currentState = await gameStateService.getFullGameState(accessCode);
            if (currentState && currentState.gameState) {
                const updatedState = {
                    ...currentState.gameState,
                    currentQuestionIndex: i,
                    timer
                };
                await gameStateService.updateGameState(accessCode, updatedState);
            }
            if (i === 0) {
                const room = io.sockets.adapter.rooms.get(`game_${accessCode}`);
                const socketIds = room ? Array.from(room) : [];
                logger.info({ accessCode, room: `game_${accessCode}`, socketIds }, '[DEBUG] Sockets in live room before emitting first game_question');
            }
            logger.info({ accessCode, questionIndex: i, questionUid: questions[i].uid }, '[DEBUG] Preparing to emit game_question');


            // Modernized: Canonical, flat payload for game_question
            const { questionDataForStudentSchema } = await import('@/../../shared/types/socketEvents.zod');
            let filteredQuestion = filterQuestionForClient(questions[i]);
            // Remove timeLimit if null or undefined (schema expects it omitted, not null)
            if (filteredQuestion.timeLimit == null) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { timeLimit, ...rest } = filteredQuestion;
                filteredQuestion = rest;
            }
            const canonicalPayload = {
                ...filteredQuestion,
                currentQuestionIndex: i,
                totalQuestions: questions.length
            };
            // Define liveRoom and projectionRoom before use
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${currentState?.gameState?.gameId || ''}`;
            // Validate with Zod before emitting
            const parseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
            if (!parseResult.success) {
                logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
            } else {
                io.to([liveRoom, projectionRoom]).emit('game_question', canonicalPayload);
                logger.info({ rooms: [liveRoom, projectionRoom], event: 'game_question', questionUid: questions[i].uid, canonicalPayload }, '[MODERNIZATION] Emitted canonical GAME_QUESTION to live and projection rooms');
            }

            // Fetch all sockets in the room
            const roomName = `game_${accessCode}`;
            const socketsInRoom = await io.in(roomName).fetchSockets();
            // Map userIds to real Socket instances (not RemoteSocket)
            const allSockets = Array.from(io.sockets.sockets.values());
            for (const remoteSocket of socketsInRoom) {
                const userId = remoteSocket.data.userId;
                if (!userId) continue;
                // Find a real Socket instance for this userId
                const realSocket = allSockets.find(s => s.data && s.data.userId === userId);
                if (realSocket) {
                    const emitQuestion = emitQuestionHandler(io, realSocket);
                    await emitQuestion({
                        accessCode,
                        userId,
                        questionUid: questions[i].uid
                    });
                }
            }

            logger.info({ accessCode, event: 'game_question', questionUid: questions[i].uid }, '[TRACE] Emitted game_question');

            // Track question start time for all users currently in the room for server-side timing
            try {
                const roomName = `game_${accessCode}`;
                const socketsInRoom = await io.in(roomName).fetchSockets();
                const currentTime = Date.now();

                for (const socket of socketsInRoom) {
                    if (socket.data.userId) {
                        const questionStartKey = `mathquest:game:question_start:${accessCode}:${questions[i].uid}:${socket.data.userId}`;
                        // Only set if not already set (in case of reconnections)
                        const existingStartTime = await redisClient.get(questionStartKey);
                        if (!existingStartTime) {
                            await redisClient.set(questionStartKey, currentTime.toString(), 'EX', 300); // Expire after 5 minutes
                        }
                    }
                }

                logger.debug({
                    accessCode,
                    questionUid: questions[i].uid,
                    userCount: socketsInRoom.length
                }, 'Tracked question start time for all users in room');
            } catch (error) {
                logger.error({
                    accessCode,
                    questionUid: questions[i].uid,
                    error
                }, 'Failed to track question start times for users');
            }

            // --- Ensure canonical timer is started for quiz and tournament (for late joiners) ---
            if (options.playMode === 'quiz' || options.playMode === 'tournament') {
                const canonicalTimerService = new CanonicalTimerService(redisClient);
                await canonicalTimerService.resetTimer(accessCode, questions[i].uid, options.playMode, false);
                await canonicalTimerService.startTimer(accessCode, questions[i].uid, options.playMode, false);
            }

            // Emit timer update to start frontend countdown
            const canonicalTimer = toCanonicalTimer({ ...timer, questionUid: typeof questions[i].uid === 'string' && questions[i].uid.length > 0 ? questions[i].uid : '' });
            emitCanonicalTimerEvents(io, [
                { room: `game_${accessCode}`, event: 'game_timer_updated', extra: {} },
                { room: liveRoom, event: 'game_timer_updated', extra: {} },
                { room: projectionRoom, event: 'game_timer_updated', extra: {} }
            ], {
                accessCode,
                timer: canonicalTimer,
                questionUid: canonicalTimer.questionUid,
                questionIndex: i,
                totalQuestions: questions.length,
                answersLocked: currentState?.gameState?.answersLocked
            });

            options.onQuestionStart?.(i);
            await new Promise((resolve) => setTimeout(resolve, questions[i].timeLimit * 1000));
            logger.info({ room: `game_${accessCode}`, event: 'correct_answers', questionUid: questions[i].uid }, '[DEBUG] Emitting correct_answers');
            // Send correct answers with the event (not filtered out like in game_question)
            const correctAnswersPayload = {
                questionUid: questions[i].uid,
                correctAnswers: questions[i].correctAnswers || []
            };
            io.to(`game_${accessCode}`).emit('correct_answers', correctAnswersPayload);
            logger.info({ accessCode, event: 'correct_answers', questionUid: questions[i].uid, correctAnswers: questions[i].correctAnswers }, '[TRACE] Emitted correct_answers');
            options.onQuestionEnd?.(i);

            // 🔒 SECURITY: Emit leaderboard only after question ends (timer expired)
            // This prevents students from determining answer correctness during submission
            try {
                // First, sync the snapshot with current live data
                const syncedSnapshot = await syncSnapshotWithLiveData(accessCode);

                // Then emit the leaderboard from the snapshot (source of truth)
                await emitLeaderboardFromSnapshot(
                    io,
                    accessCode,
                    [`game_${accessCode}`],
                    'after_question_end'
                );

                logger.info({
                    accessCode,
                    event: 'leaderboard_update',
                    questionUid: questions[i].uid,
                    leaderboardCount: syncedSnapshot.length,
                    timing: 'after_question_end'
                }, '[SECURITY] Emitted secure leaderboard_update after question timer expired using snapshot');
            } catch (leaderboardError) {
                logger.error({
                    accessCode,
                    questionUid: questions[i].uid,
                    error: leaderboardError
                }, '[SECURITY] Error emitting secure leaderboard update');
            }

            // [MODERNIZATION] Removed legacy call to gameStateService.calculateScores.
            // All scoring is now handled via ScoringService.submitAnswerWithScoring or canonical participant service.
            // If batch scoring is needed, refactor to use canonical logic per participant/answer.

            // Two separate timing concerns:
            // 1. Delay between correct answers and feedback event (fixed 1.5s for tournaments)
            const correctAnswersToFeedbackDelay = options.playMode === 'tournament' ? 1.5 : 1;

            // 2. Feedback display duration (from question or default to 5s)
            const feedbackDisplayDuration = (typeof questions[i].feedbackWaitTime === 'number' && questions[i].feedbackWaitTime > 0)
                ? questions[i].feedbackWaitTime
                : 5; // Default to 5 seconds when feedbackWaitTime is null

            // Wait for the delay between correct answers and feedback
            await new Promise((resolve) => setTimeout(resolve, correctAnswersToFeedbackDelay * 1000));

            // Only emit feedback event if there's an explanation to show
            if (questions[i].explanation) {
                // Emit feedback event with the full feedback display duration and explanation
                logger.info({ room: `game_${accessCode}`, event: 'feedback', questionUid: questions[i].uid, feedbackDisplayDuration }, '[DEBUG] Emitting feedback');

                // DETAILED LOGGING: Debug explanation transmission
                const feedbackPayload = {
                    questionUid: questions[i].uid,
                    feedbackRemaining: feedbackDisplayDuration,
                    explanation: questions[i].explanation // Include explanation in feedback event
                };

                logger.info('=== BACKEND FEEDBACK PAYLOAD DEBUG ===', {
                    accessCode,
                    questionIndex: i,
                    questionUid: questions[i].uid,
                    questionExplanation: questions[i].explanation,
                    explanationLength: questions[i].explanation.length,
                    explanationExists: true,
                    payloadExplanation: feedbackPayload.explanation,
                    fullPayload: JSON.stringify(feedbackPayload)
                });

                io.to(`game_${accessCode}`).emit('feedback', feedbackPayload);
                logger.info({ accessCode, event: 'feedback', questionUid: questions[i].uid, feedbackDisplayDuration, hasExplanation: true }, '[TRACE] Emitted feedback');
                options.onFeedback?.(i);

                // Wait for feedback display duration before proceeding to next question
                await new Promise((resolve) => setTimeout(resolve, feedbackDisplayDuration * 1000));
            } else {
                // No explanation - skip feedback phase and proceed directly
                logger.info({ accessCode, questionUid: questions[i].uid }, '[DEBUG] Skipping feedback phase - no explanation available');
                options.onFeedback?.(i); // Still call the callback for consistency
            }
        }

        // Game completed - persist final leaderboard to database
        try {
            const finalLeaderboard = await calculateLeaderboard(accessCode);
            await persistLeaderboardToGameInstance(accessCode, finalLeaderboard);
            logger.info({ accessCode, leaderboard: finalLeaderboard }, '[SharedGameFlow] Final leaderboard persisted to database');

            // Clear Redis game data after persisting scores to database
            // This ensures clean state and prevents old scores from contaminating future sessions
            const gameDataKeys = [
                `mathquest:game:participants:${accessCode}`,
                `mathquest:game:leaderboard:${accessCode}`,
                `mathquest:game:answers:${accessCode}:*`,
                `mathquest:game:join_order:${accessCode}`,
                `mathquest:game:userIdToSocketId:${accessCode}`,
                `mathquest:game:socketIdToUserId:${accessCode}`
            ];

            for (const key of gameDataKeys) {
                if (key.includes('*')) {
                    // Handle wildcard keys
                    const keys = await redisClient.keys(key);
                    if (keys.length > 0) {
                        await redisClient.del(...keys);
                    }
                } else {
                    await redisClient.del(key);
                }
            }

            logger.info({ accessCode, clearedKeys: gameDataKeys }, '[REDIS-CLEANUP] Cleared Redis game data at game end after persisting scores');
        } catch (error) {
            logger.error({ accessCode, error }, '[SharedGameFlow] Error persisting final leaderboard');
        }

        // Update tournament database fields when game ends
        try {
            const endedAt = new Date();
            const differedAvailableFrom = endedAt;
            const differedAvailableTo = new Date(endedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

            await prisma.gameInstance.update({
                where: { accessCode },
                data: {
                    status: 'completed',
                    endedAt: endedAt,
                    differedAvailableFrom: differedAvailableFrom,
                    differedAvailableTo: differedAvailableTo
                }
            });

            // --- MODERNIZATION: Ensure Redis game state is also marked as completed ---
            const redisState = await gameStateService.getFullGameState(accessCode);
            if (redisState && redisState.gameState) {
                if (redisState.gameState.status !== 'completed') {
                    logger.warn({ accessCode, redisStatus: redisState.gameState.status }, '[MODERNIZATION] Redis game state was not marked completed when DB was. Forcing sync.');
                    const updatedRedisState = {
                        ...redisState.gameState,
                        status: 'completed' as const,
                        endedAt: endedAt.getTime()
                    };
                    await gameStateService.updateGameState(accessCode, updatedRedisState);
                }
            }

            logger.info({
                accessCode,
                status: 'completed',
                endedAt: endedAt.toISOString(),
                differedAvailableFrom: differedAvailableFrom.toISOString(),
                differedAvailableTo: differedAvailableTo.toISOString()
            }, '[SharedGameFlow] Tournament database fields updated on completion');
        } catch (error) {
            logger.error({ accessCode, error }, '[SharedGameFlow] Error updating tournament database fields');
        }

        // Game completed, emit game_ended with stats for navigation
        const latestState = await gameStateService.getFullGameState(accessCode);
        const projectionRoom = `projection_${latestState?.gameState?.gameId || ''}`;
        const liveRoom = `game_${accessCode}`;
        const gameEndedPayload = {
            accessCode,
            totalQuestions: questions.length
        };
        io.to([liveRoom, projectionRoom]).emit('game_ended', gameEndedPayload);
        logger.info({ rooms: [liveRoom, projectionRoom], event: 'game_ended', payload: gameEndedPayload }, '[TRACE] Emitted game_ended to live and projection rooms');

        options.onGameEnd?.();

    } catch (error) {
        logger.error({ accessCode, error }, '[SharedGameFlow] Error in game flow');
    } finally {
        // Clean up running game flow tracking
        runningGameFlows.delete(accessCode);
        logger.info({ accessCode }, '[SharedGameFlow] Game flow completed and cleaned up');
    }
}

function toCanonicalTimer(timer: any): any {
    const status = timer && typeof timer.status === 'string' && ['run', 'pause', 'stop'].includes(timer.status) ? timer.status : 'run';
    const canonical = {
        ...timer,
        status,
        questionUid: typeof timer?.questionUid === 'string' && timer.questionUid.length > 0 ? timer.questionUid : 'unknown',
    };
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer input:', timer);
    logger.warn('[CANONICALIZER DEBUG] toCanonicalTimer output:', canonical);
    return canonical;
}
interface CanonicalTimerRoom {
    room: string;
    event: string;
    extra?: Record<string, unknown>;
}
type CanonicalDashboardTimerUpdatedPayload = {
    accessCode: string;
    timer: any;
    questionUid?: string;
    questionIndex?: number;
    totalQuestions?: number;
    answersLocked?: boolean;
};
function emitCanonicalTimerEvents(
    io: SocketIOServer,
    rooms: CanonicalTimerRoom[],
    payloadBase: CanonicalDashboardTimerUpdatedPayload
) {
    const canonicalPayload = {
        ...payloadBase,
        timer: toCanonicalTimer(payloadBase.timer),
        questionUid: typeof payloadBase.questionUid === 'string' && payloadBase.questionUid ? payloadBase.questionUid : 'unknown',
        questionIndex: typeof payloadBase.questionIndex === 'number' ? payloadBase.questionIndex : 0,
        totalQuestions: typeof payloadBase.totalQuestions === 'number' ? payloadBase.totalQuestions : 1,
        answersLocked: typeof payloadBase.answersLocked === 'boolean' ? payloadBase.answersLocked : false
    };
    const validation = dashboardTimerUpdatedPayloadSchema.safeParse(canonicalPayload);
    if (!validation.success) {
        logger.error({ error: validation.error.format(), payload: canonicalPayload }, '[TIMER] Invalid canonical timer payload, not emitting');
        return;
    }
    for (const { room, event, extra } of rooms) {
        io.to(room).emit(event, { ...canonicalPayload, ...extra });
    }
}
