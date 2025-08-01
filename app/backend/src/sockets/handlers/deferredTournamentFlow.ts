// Deferred tournament game flow logic
// Handles individual player sessions for asynchronous tournament replay

import { Server as SocketIOServer, Socket } from 'socket.io';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/services/gameStateService';
import { redisClient } from '@/config/redis';
import { cleanupGameRedisKeys, cleanupDeferredSessionRedisKeys } from '@/utils/redisCleanup';
import { filterQuestionForClient } from '@shared/types/quiz/liveQuestion';
import { GameTimerState } from '@shared/types/core/timer';
import { computeTimerTimes } from '@/core/services/timerHelpers';
import { GameState } from '@shared/types/core/game';
import { ErrorPayload } from '@shared/types/socketEvents';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { errorPayloadSchema } from '@shared/types/socketEvents.zod';
import { prisma } from '@/db/prisma';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { getCorrectAnswersDisplayTime, getFeedbackDisplayTime } from '@shared/constants/gameTimings';

const logger = createLogger('DeferredTournamentFlow');

// Track running deferred tournament sessions by userId
const runningDeferredSessions = new Map<string, string>(); // userId -> accessCode

/**
 * Clean up deferred sessions for a specific access code when game ends
 * @param accessCode - The game access code
 */
export function cleanupDeferredSessionsForGame(accessCode: string): void {
    const sessionsToRemove: string[] = [];

    // Find all user IDs with sessions for this access code
    runningDeferredSessions.forEach((sessionAccessCode, userId) => {
        if (sessionAccessCode === accessCode) {
            sessionsToRemove.push(userId);
        }
    });

    // Remove the sessions
    for (const userId of sessionsToRemove) {
        runningDeferredSessions.delete(userId);
    }

    if (sessionsToRemove.length > 0) {
        logger.info({
            accessCode,
            removedUserIds: sessionsToRemove,
            remainingSessions: runningDeferredSessions.size
        }, 'Cleaned up deferred sessions for ended game');
    }
}

export interface DeferredTournamentSession {
    userId: string;
    accessCode: string;
    questions: any[];
    currentQuestionIndex: number;
    playerRoom: string;
    sessionStartTime: number;
    attemptCount: number; // NEW
}

/**
 * Start an individual deferred tournament session for a player
 * This creates a separate game flow for the individual player with proper timer initialization
 * 
 * @param io - Socket.IO server instance
 * @param socket - Player's socket connection
 * @param accessCode - Tournament access code
 * @param userId - Player's user ID
 * @param questions - Array of tournament questions
 */
export async function startDeferredTournamentSession(
    io: SocketIOServer,
    socket: Socket,
    accessCode: string,
    userId: string,
    questions: any[]
): Promise<void> {
    logger.info({
        accessCode,
        userId,
        questionCount: questions.length,
        socketId: socket.id,
        stack: new Error().stack
    }, '🔥 DEFERRED FLOW DEBUG: startDeferredTournamentSession called (with stack trace for call origin)');

    const sessionKey = `${accessCode}_${userId}`;

    // Prevent duplicate sessions for the same user
    if (runningDeferredSessions.has(userId)) {
        logger.warn({ accessCode, userId, stack: new Error().stack }, 'Deferred tournament session already running for this user (with stack trace)');
        return;
    }

    // Create unique room for this player's session
    const playerRoom = `deferred_${accessCode}_${userId}`;
    await socket.join(playerRoom);

    logger.info({
        accessCode,
        userId,
        playerRoom,
        socketId: socket.id
    }, '🔥 DEFERRED FLOW DEBUG: Player joined deferred tournament room');

    // Note: Game event handlers (GAME_ANSWER, REQUEST_NEXT_QUESTION) are already registered
    // when the socket connects, so we don't need to register them again here.
    logger.info({ accessCode, userId }, '🔥 DEFERRED FLOW DEBUG: Using existing game event handlers for deferred player');

    runningDeferredSessions.set(userId, accessCode);

    logger.info({
        accessCode,
        userId,
        playerRoom,
        questionCount: questions.length
    }, 'Starting deferred tournament session');

    // [MODERNIZATION] Redis cleanup at deferred session start is now disabled to prevent participant/score loss.
    // If you need to clear Redis for a new session, do it at session end only.

    // Catch-all entry log
    // Place entry log after accessCode and userId are defined
    logger.info({ accessCode, userId, logPoint: 'DEFERRED_SESSION_ENTRY' }, '[DEBUG] Entered startDeferredTournamentSession');

    try {
        // Initialize individual game state for this player
        const playerGameState: GameState = {
            gameId: accessCode, // Use accessCode as gameId for consistency
            accessCode,
            status: 'active',
            currentQuestionIndex: 0,
            questionUids: questions.map(q => q.uid),
            answersLocked: false,
            gameMode: 'tournament',
            // [MODERNIZATION] timer field removed. All timer state is managed by CanonicalTimerService.
            settings: {
                timeMultiplier: 1.0,
                showLeaderboard: true
            }
        };

        // Store individual session state with unique key (include attemptCount for full isolation)
        const attemptCount = await getDeferredAttemptCount(accessCode, userId);
        // Store attemptCount on socket for this session
        socket.data.deferredAttemptCount = attemptCount;
        const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
        await gameStateService.updateGameState(sessionStateKey, playerGameState);

        // Initialize session score to 0 (isolated from global leaderboard)
        await redisClient.hset(sessionStateKey, 'score', '0');

        logger.info({
            accessCode,
            userId,
            attemptCount,
            sessionStateKey,
            note: 'Initialized deferred session with score 0'
        }, '[DEFERRED] Session state initialized');

        // Set session as active in Redis
        const { setDeferredSessionActive } = await import('@/core/services/gameParticipant/deferredTimerUtils');
        await setDeferredSessionActive({ accessCode, userId, attemptCount });

        // Always ensure participant exists for deferred mode at session start
        const { joinGame } = await import('@/core/services/gameParticipant/joinService');
        let username = `guest-${userId.substring(0, 8)}`;
        let avatarEmoji = undefined;
        logger.info({
            accessCode,
            userId,
            username,
            avatarEmoji,
            logPoint: 'PRE_JOIN_GAME_CALL',
            stack: new Error().stack
        }, '[DEBUG] Calling joinGame from startDeferredTournamentSession');
        const joinResult = await joinGame({ userId, accessCode, username, avatarEmoji });
        logger.info({
            accessCode,
            userId,
            joinResult,
            logPoint: 'POST_JOIN_GAME_CALL',
            stack: new Error().stack
        }, '[DEBUG] joinGame returned in startDeferredTournamentSession');
        if (!joinResult.success || !joinResult.participant) {
            logger.error({ accessCode, userId, error: joinResult.error }, 'Failed to create/join participant at deferred session start');
            return;
        }

        // Start the question progression for this individual player
        await runDeferredQuestionSequence(io, socket, {
            userId,
            accessCode,
            questions,
            currentQuestionIndex: 0,
            playerRoom,
            sessionStartTime: Date.now(),
            attemptCount // Pass fixed attemptCount
        });

    } catch (error) {
        logger.error({ accessCode, userId, error }, 'Error in deferred tournament session');

        // Clean up on error
        runningDeferredSessions.delete(userId);
        socket.leave(playerRoom);

        // Emit error to player
        const errorPayload: ErrorPayload = {
            message: 'Error starting deferred tournament session'
        };

        try {
            errorPayloadSchema.parse(errorPayload);
            socket.emit(SOCKET_EVENTS.GAME.ERROR, errorPayload);
        } catch (error) {
            logger.error('Invalid game_error payload:', error);
        }
    }
}

/**
 * Run the question sequence for an individual deferred tournament session
 */
async function runDeferredQuestionSequence(
    io: SocketIOServer,
    socket: Socket,
    session: DeferredTournamentSession
): Promise<void> {
    const { userId, accessCode, questions, playerRoom, attemptCount } = session;

    logger.info({
        accessCode,
        userId,
        questionCount: questions.length
    }, 'Starting deferred question sequence');

    // Instantiate canonical timer service
    const canonicalTimerService = new CanonicalTimerService(redisClient);
    const playMode = 'tournament';
    // For deferred tournaments, use isolated timers per player
    const isDeferred = true;

    try {
        // Process each question sequentially
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            // Use fixed attemptCount for all questions in this session
            logger.info({ accessCode, userId, attemptCount, questionUid: question.uid, logPoint: 'DEFERRED_QUESTION_LOOP_ENTRY' }, '[DEBUG] Entered deferred tournament question loop');


            // Log question object and time limit calculation
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                questionFull: question,
                timeLimitRaw: question.timeLimit,
                logPoint: 'DEFERRED_TIMER_START_ATTEMPT',
            }, '[DEBUG] About to start timer for deferred tournament question');

            const timeLimitSec = typeof question.timeLimit === 'number' && question.timeLimit > 0 ? question.timeLimit : 30;
            const durationMs = timeLimitSec * 1000;
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                timeLimitSec,
                durationMs,
                logPoint: 'DEFERRED_TIMER_DURATION_CALC',
            }, '[DEBUG] Timer duration calculated for deferred tournament question');

            // --- UNIFIED TIMER LOGIC ---
            // Always use CanonicalTimerService with correct key (userId and attemptCount for deferred)
            // Use the fixed attemptCount for the entire session (do NOT increment)
            await canonicalTimerService.resetTimer(accessCode, question.uid, playMode, isDeferred, userId, attemptCount);
            await canonicalTimerService.startTimer(accessCode, question.uid, playMode, isDeferred, userId, attemptCount);
            logger.info({
                accessCode,
                userId,
                attemptCount,
                questionUid: question.uid,
                logPoint: 'DEFERRED_TIMER_STARTED',
            }, '[DEBUG] Timer started for deferred tournament question');
            // --- END UNIFIED TIMER LOGIC ---

            // Retrieve timer state from canonical service (optional, for emitting to client)
            // const timer = await canonicalTimerService.getTimer(accessCode, question.uid, playMode, isDeferred, userId);
            // For now, keep timer object as before for payload
            const timerEndDateMs = Date.now() + durationMs;
            const timer: GameTimerState = {
                status: 'run',
                timerEndDateMs,
                questionUid: question.uid
            };

            // Update session state
            const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
            const currentState = await gameStateService.getFullGameState(sessionStateKey);
            if (currentState && currentState.gameState) {
                const updatedState = {
                    ...currentState.gameState,
                    currentQuestionIndex: i,
                    timer
                };
                await gameStateService.updateGameState(sessionStateKey, updatedState);
            }

            // Send question to player

            // Modernization: Use canonical, flat payload for game_question
            const { questionDataForStudentSchema } = await import('@/../../shared/types/socketEvents.zod');
            let canonicalPayload = {
                ...filterQuestionForClient(question),
                currentQuestionIndex: i,
                totalQuestions: questions.length
            };
            if (canonicalPayload.timeLimit == null) {
                const { timeLimit, ...rest } = canonicalPayload;
                canonicalPayload = rest;
            }
            const parseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
            if (!parseResult.success) {
                logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
            } else {
                logger.info({
                    accessCode,
                    userId,
                    playerRoom,
                    questionIndex: i,
                    canonicalPayload
                }, 'Emitting canonical game_question for deferred session');
                io.to(playerRoom).emit('game_question', canonicalPayload);
            }

            // Emit timer update
            const timerUpdatePayload = {
                questionUid: question.uid,
                timer: timer
            };
            io.to(playerRoom).emit('game_timer_updated', timerUpdatePayload);

            // Track question start time for this user (include attempt count for deferred session isolation)
            try {
                const questionStartKey = `mathquest:game:question_start:${accessCode}:${question.uid}:${userId}:${attemptCount}`;
                await redisClient.set(questionStartKey, Date.now().toString(), 'EX', 300);
                logger.debug({
                    accessCode,
                    userId,
                    attemptCount,
                    questionUid: question.uid,
                    questionStartKey
                }, '[REDIS-KEY] Created question start tracking key for deferred session');
            } catch (error) {
                logger.error({ accessCode, userId, questionUid: question.uid, error }, 'Failed to track question start time');
            }

            // Wait for question duration
            await new Promise(resolve => setTimeout(resolve, durationMs));

            // Send correct answers
            const correctAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: question.correctAnswers || []
            };
            io.to(playerRoom).emit('correct_answers', correctAnswersPayload);

            // Wait for correct answers display duration before proceeding
            const correctAnswersDisplayTime = getCorrectAnswersDisplayTime('tournament'); // 1.5s for all modes
            await new Promise(resolve => setTimeout(resolve, correctAnswersDisplayTime * 1000));

            // 🔒 SECURITY: Emit leaderboard only after question ends (timer expired)
            // This prevents students from determining answer correctness during submission
            try {
                // DEFERRED SESSION FIX: Send single-user leaderboard using session state (isolated score)
                // Get current participant data from database
                const gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode },
                    select: { id: true }
                });

                if (!gameInstance) {
                    logger.error({ accessCode, userId }, '[DEFERRED] Could not find game instance for leaderboard update');
                    return;
                }

                const participant = await prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        userId: userId
                    },
                    include: {
                        user: true
                    }
                });

                if (participant) {
                    // Get the session state score (isolated from global leaderboard)
                    const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
                    const sessionData = await redisClient.hgetall(sessionStateKey);
                    const currentScore = sessionData?.score ? parseFloat(sessionData.score) : 0;

                    // Create a single-entry leaderboard with just this user's data
                    const singleUserLeaderboard = [{
                        userId: participant.userId,
                        username: participant.user?.username || 'Unknown',
                        score: currentScore, // Use session score (isolated from global leaderboard)
                        avatarEmoji: participant.user?.avatarEmoji || '🐼',
                        rank: 1 // Always rank 1 since it's just them
                    }];

                    // Emit directly to the player's room
                    io.to(playerRoom).emit('leaderboard_update', { leaderboard: singleUserLeaderboard });

                    logger.info({
                        accessCode,
                        userId,
                        score: currentScore,
                        sessionStateKey,
                        username: participant.user?.username,
                        event: 'leaderboard_update',
                        questionUid: question.uid,
                        timing: 'after_question_end',
                        playerRoom
                    }, '[DEFERRED] Sent single-user leaderboard after question end (using session state)');
                } else {
                    logger.warn({
                        accessCode,
                        userId,
                        questionUid: question.uid
                    }, '[DEFERRED] Could not find participant for leaderboard update');
                }
            } catch (leaderboardError) {
                logger.error({
                    accessCode,
                    userId,
                    questionUid: question.uid,
                    error: leaderboardError
                }, '[DEFERRED] Error emitting secure leaderboard update');
            }

            // Handle feedback if available
            if (question.explanation) {
                // Check if explanation was already sent (e.g., via ANSWER_RECEIVED)
                const explanationSentKey = `mathquest:explanation_sent:${accessCode}:${question.uid}:${userId}`;
                const alreadySent = await redisClient.get(explanationSentKey);
                if (!alreadySent) {
                    // No additional delay needed here - correct answers already displayed for 1.5s above
                    const feedbackDisplayDuration = getFeedbackDisplayTime(question.feedbackWaitTime);
                    const feedbackPayload = {
                        questionUid: question.uid,
                        feedbackRemaining: feedbackDisplayDuration,
                        explanation: question.explanation
                    };
                    io.to(playerRoom).emit('feedback', feedbackPayload);
                    await new Promise(resolve => setTimeout(resolve, feedbackDisplayDuration * 1000));
                }
            }
        }

        // Tournament completed for this player
        const gameEndedPayload = {
            accessCode,
            totalQuestions: questions.length
        };

        io.to(playerRoom).emit('game_ended', gameEndedPayload);

        // Mark session as over in Redis
        const { setDeferredSessionOver } = await import('@/core/services/gameParticipant/deferredTimerUtils');
        await setDeferredSessionOver({ accessCode, userId, attemptCount });

        // Clean up Redis keys for this specific deferred session using deferred-specific utility
        // TEMPORARILY COMMENTED OUT FOR TESTING - to verify key format consistency
        /*
        try {
            await cleanupDeferredSessionRedisKeys(accessCode, userId, attemptCount, 'deferredSessionComplete');
            
            logger.info({
                accessCode,
                userId,
                attemptCount
            }, '[REDIS-CLEANUP] Cleaned up Redis keys for completed deferred session using deferred-specific utility');

        } catch (cleanupError) {
            logger.error({
                accessCode,
                userId,
                attemptCount,
                error: cleanupError
            }, '[REDIS-CLEANUP] Error cleaning up deferred session Redis keys');
            // Don't throw - cleanup errors shouldn't prevent session completion
        }
        */

        logger.info({
            accessCode,
            userId,
            attemptCount
        }, '[TEST] Redis cleanup DISABLED for testing - keys should remain for verification');

        logger.info({
            accessCode,
            userId,
            totalQuestions: questions.length
        }, 'Deferred tournament session completed and session marked over');

        // ANTI-CHEATING: Persist final deferred scores to database
        try {
            logger.info({
                accessCode,
                userId,
                note: 'ANTI-CHEATING: Persisting final deferred scores to database'
            }, '[ANTI-CHEATING] Starting deferred score persistence');

            // Get the game instance
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { id: true }
            });

            if (gameInstance) {
                // Get the participant's final score from Redis
                const participantKey = `mathquest:game:participants:${accessCode}`;
                const redisParticipantData = await redisClient.hget(participantKey, userId);

                if (redisParticipantData) {
                    const participantData = JSON.parse(redisParticipantData);
                    const finalScore = participantData.score || 0;

                    // Find the participant in the database
                    const dbParticipant = await prisma.gameParticipant.findFirst({
                        where: {
                            gameInstanceId: gameInstance.id,
                            userId: userId
                        },
                        orderBy: {
                            joinedAt: 'desc'
                        }
                    });

                    if (dbParticipant) {
                        // For deferred mode, keep the maximum between current DB score and new session score
                        const currentDeferredScore = dbParticipant.deferredScore || 0;
                        const bestScore = Math.max(currentDeferredScore, finalScore);

                        await prisma.gameParticipant.update({
                            where: { id: dbParticipant.id },
                            data: { deferredScore: bestScore }
                        });

                        logger.info({
                            accessCode,
                            userId,
                            participantId: dbParticipant.id,
                            sessionScore: finalScore,
                            currentDeferredScore,
                            bestScore,
                            note: 'ANTI-CHEATING: Successfully persisted best deferred score to database (Math.max logic)'
                        }, '[ANTI-CHEATING] Deferred score persisted to database (best score kept)');
                    } else {
                        logger.error({ accessCode, userId }, '[ANTI-CHEATING] Participant not found in database for deferred score persistence');
                    }
                } else {
                    logger.warn({ accessCode, userId }, '[ANTI-CHEATING] No Redis participant data found for deferred score persistence');
                }
            } else {
                logger.error({ accessCode }, '[ANTI-CHEATING] Game instance not found for deferred score persistence');
            }
        } catch (error) {
            logger.error({
                accessCode,
                userId,
                error: error instanceof Error ? error.message : String(error)
            }, '[ANTI-CHEATING] Error persisting deferred scores to database');
        }

        // Note: Redis cleanup already performed above using shared utility after session completion

    } catch (error) {
        logger.error({ accessCode, userId, error }, 'Error in deferred question sequence');

        // Emit error to player
        const errorPayload: ErrorPayload = {
            message: 'Error during tournament question sequence'
        };

        try {
            errorPayloadSchema.parse(errorPayload);
            io.to(playerRoom).emit('game_error', errorPayload);
        } catch (validationError) {
            logger.error('Invalid game_error payload:', validationError);
        }
    } finally {
        // Clean up session tracking
        runningDeferredSessions.delete(userId);

        logger.info({ accessCode, userId }, 'Deferred tournament session cleaned up');
    }
}

/**
 * Check if a user already has a running deferred tournament session
 */
export function hasDeferredSession(userId: string): boolean {
    return runningDeferredSessions.has(userId);
}

/**
 * Get the access code for a user's running deferred session
 */
export function getDeferredSessionAccessCode(userId: string): string | undefined {
    return runningDeferredSessions.get(userId);
}

/**
 * Clean up a deferred session (for disconnections, etc.)
 */
export function cleanupDeferredSession(userId: string): void {
    runningDeferredSessions.delete(userId);
    logger.info({ userId }, 'Deferred session cleaned up');
}

// Utility to get current attemptCount for a user in a deferred tournament
async function getDeferredAttemptCount(accessCode: string, userId: string): Promise<number> {
    const gameInstance = await prisma.gameInstance.findUnique({ where: { accessCode }, select: { id: true } });
    if (!gameInstance) return 1;
    const participant = await prisma.gameParticipant.findFirst({
        where: { gameInstanceId: gameInstance.id, userId },
        select: { nbAttempts: true }
    });
    return participant?.nbAttempts || 1;
}
