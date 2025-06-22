// Shared game flow logic for quiz and tournament modes
// Place all core progression, timer, answer reveal, feedback, and leaderboard logic here
// This module should be imported by both quiz and tournament handlers

import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/gameStateService';
import { filterQuestionForClient } from '@shared/types/quiz/liveQuestion';
import { prisma } from '@/db/prisma';
import { emitQuestionHandler } from './game/emitQuestionHandler';

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
        logger.info({ accessCode }, `[SharedGameFlow] Proceeding with first question immediately.`);
        for (let i = 0; i < questions.length; i++) {
            // Set and persist timer in game state before emitting question
            const timeLimitSec = questions[i].timeLimit || 30;
            const durationMs = timeLimitSec * 1000;
            const timer = {
                status: 'play' as const,
                timeLeftMs: durationMs,
                durationMs: durationMs,
                questionUid: questions[i].uid,
                timestamp: Date.now(),
                localTimeLeftMs: null
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

            // ⚠️ SECURITY: Filter question to remove sensitive data (correctAnswers, explanation, etc.)
            const filteredQuestion = filterQuestionForClient(questions[i]);

            const gameQuestionPayload = {
                question: filteredQuestion,
                questionIndex: i, // Use shared type field name
                totalQuestions: questions.length, // Add total questions count
                feedbackWaitTime: questions[i].feedbackWaitTime || (options.playMode === 'tournament' ? 1.5 : 1),
                timer: timer // Use timer state for initial question emission
            };

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

            // Emit timer update to start frontend countdown
            const gameTimerUpdatePayload = {
                questionUid: questions[i].uid,
                timer: {
                    status: 'play' as const,
                    timeLeftMs: timeLimitSec * 1000,
                    durationMs: timeLimitSec * 1000,
                    questionUid: questions[i].uid,
                    timestamp: timer.timestamp,
                    localTimeLeftMs: null
                }
            };
            logger.info({ room: `game_${accessCode}`, event: 'game_timer_updated', payload: gameTimerUpdatePayload }, '[DEBUG] Emitting game_timer_updated');
            io.to(`game_${accessCode}`).emit('game_timer_updated', gameTimerUpdatePayload);
            logger.info({ accessCode, event: 'game_timer_updated', questionUid: questions[i].uid }, '[TRACE] Emitted game_timer_updated');

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
            const { calculateLeaderboard, persistLeaderboardToGameInstance } = await import('./sharedLeaderboard');
            const finalLeaderboard = await calculateLeaderboard(accessCode);
            await persistLeaderboardToGameInstance(accessCode, finalLeaderboard);
            logger.info({ accessCode, leaderboard: finalLeaderboard }, '[SharedGameFlow] Final leaderboard persisted to database');
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
        const gameEndedPayload = {
            accessCode,
            totalQuestions: questions.length
        };
        logger.info({ room: `game_${accessCode}`, event: 'game_ended', payload: gameEndedPayload }, '[DEBUG] Emitting game_ended for navigation');
        io.to(`game_${accessCode}`).emit('game_ended', gameEndedPayload);
        logger.info({ accessCode, event: 'game_ended' }, '[TRACE] Emitted game_ended');

        options.onGameEnd?.();

    } catch (error) {
        logger.error({ accessCode, error }, '[SharedGameFlow] Error in game flow');
    } finally {
        // Clean up running game flow tracking
        runningGameFlows.delete(accessCode);
        logger.info({ accessCode }, '[SharedGameFlow] Game flow completed and cleaned up');
    }
}
