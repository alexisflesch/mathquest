import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import { z } from 'zod';
import { emitParticipantCount } from '@/sockets/utils/participantCountUtils';
import gameStateService, { getCanonicalTimer } from '@/core/services/gameStateService';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
// Import shared types
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
    GameTimerUpdatePayload
} from '@shared/types/socketEvents';
import {
    joinGamePayloadSchema,
    gameJoinedPayloadSchema,
    playerJoinedGamePayloadSchema,
    errorPayloadSchema,
    gameAlreadyPlayedPayloadSchema
} from '@shared/types/socketEvents.zod';
import { GAME_EVENTS } from '@shared/types/socket/events';
// Import core participant types
import { GameParticipant, ParticipantData, ParticipationType, ParticipantStatus } from '@shared/types/core/participant';
import { calculateTimerForLateJoiner } from '../../../core/services/timerUtils';
import { assignJoinOrderBonus } from '@/utils/joinOrderBonus';
import { broadcastLeaderboardToProjection } from '@/utils/projectionLeaderboardBroadcast';
import { joinGame as joinGameModular } from '@/core/services/gameParticipant/joinService';
import { DifferedScoreService } from '@/core/services/gameParticipant/scoreService';
import { emitParticipantList } from '../lobbyHandler';

const logger = createLogger('JoinGameHandler');

// Use z.infer for all payload types
export type JoinGamePayload = z.infer<typeof joinGamePayloadSchema>;
export type GameJoinedPayload = z.infer<typeof gameJoinedPayloadSchema>;
export type PlayerJoinedGamePayload = z.infer<typeof playerJoinedGamePayloadSchema>;
export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
export type GameAlreadyPlayedPayload = z.infer<typeof gameAlreadyPlayedPayloadSchema>;

// Update handler signature with shared types
export function joinGameHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    // Update payload type
    return async (payload: JoinGamePayload) => {
        logger.debug({ payload }, 'Received join_game payload');
        // Zod validation for payload
        const parseResult = joinGamePayloadSchema.safeParse(payload);
        logger.debug({ parseResult }, 'Result of joinGamePayloadSchema.safeParse');
        if (!parseResult.success) {
            const errorPayload: ErrorPayload = {
                message: 'Invalid join game payload',
                code: 'INVALID_PAYLOAD',
            };
            logger.warn({ errorPayload }, 'Emitting game_error due to invalid payload');
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        const { accessCode, userId, username, avatarEmoji } = parseResult.data;

        // Special handling for practice mode
        if (accessCode === 'PRACTICE') {
            logger.info({ userId, username, avatarEmoji }, 'Joining practice mode');

            // For practice mode, we don't need a database game instance
            // Join a practice-specific room for this user
            const practiceRoomName = `practice_${userId}`;
            await socket.join(practiceRoomName);
            socket.data.currentGameRoom = practiceRoomName;

            logger.debug({ practiceRoomName, socketId: socket.id }, 'Player joined practice room');        // Send successful join response for practice mode
            const gameJoinedPayload: GameJoinedPayload = {
                accessCode: 'PRACTICE',
                gameStatus: 'active', // Practice mode is immediately active
                isDiffered: false, // Practice mode is not deferred
                participant: {
                    id: userId,
                    userId: userId, // Same as id for practice mode
                    username,
                    avatarEmoji: avatarEmoji || '🐼', // Ensure avatarEmoji is never undefined
                    score: 0
                }
            };

            logger.info({ gameJoinedPayload }, 'Emitting game_joined for practice mode');
            socket.emit(SOCKET_EVENTS.GAME.GAME_JOINED as any, gameJoinedPayload);
            return;
        }

        try {
            logger.debug({ accessCode, userId, username, avatarEmoji }, 'Looking up gameInstance');
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    status: true,
                    initiatorUserId: true,
                    playMode: true
                }
            });
            logger.debug({ gameInstance }, 'Result of gameInstance lookup');
            if (!gameInstance) {
                const errorPayload: ErrorPayload = { message: 'Game not found.' };
                logger.warn({ errorPayload }, 'Emitting game_error: game not found');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                return;
            }
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            if (gameInstance.isDiffered) {
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    const errorPayload: ErrorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload }, 'Emitting game_error: differed window not available');
                    socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                    return;
                }
                // Note: Tournament replay prevention is now handled by GameParticipantService.joinGame()
                // This ensures consistent replay blocking for both live and deferred tournaments
            } else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz') {
                    roomName = `game_${accessCode}`;
                } else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.debug({ roomName, socketId: socket.id }, '[DEBUG] Player joining room');
                await socket.join(roomName);

                // Also join lobby room for participant list updates
                await socket.join(`lobby_${accessCode}`);

                // --- DEBUG: Print room membership after join ---
                const joinedRoomSockets = io.sockets.adapter.rooms.get(roomName);
                const joinedRoomSocketIds = joinedRoomSockets ? Array.from(joinedRoomSockets) : [];
                logger.info('[joinGame] Player joined room:', { roomName, socketId: socket.id, joinedRoomSocketIds });
                logger.debug({ roomName, socketId: socket.id, rooms: Array.from(socket.rooms) }, '[DEBUG] Player joined room');
                socket.data.currentGameRoom = roomName;
            }
            // REPLACE legacy participantService with modular joinService
            const joinResult = await joinGameModular({
                userId,
                accessCode,
                username,
                avatarEmoji
            });
            logger.debug({ joinResult }, 'Result of participantService.joinGame');
            if (!joinResult.success || !joinResult.participant) {
                // Handle join errors
                const errorPayload: ErrorPayload = { message: joinResult.error || 'Join failed.' };
                logger.warn({ errorPayload }, 'Emitting game_error: join failed');
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                return;
            }
            socket.data.userId = userId;
            socket.data.accessCode = accessCode;
            socket.data.username = username || 'Unknown';

            // Redis keys
            const participantsKey = `mathquest:game:participants:${accessCode}`;
            const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
            const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;

            // UX ENHANCEMENT: Assign join-order bonus for early joiners (only if not already assigned in lobby)
            const joinOrderBonus = await assignJoinOrderBonus(accessCode, userId);

            // Apply join-order bonus to participant score
            // For deferred sessions (attempt > 1), use deferred score. For live sessions, use live score.
            const isInDeferredSession = joinResult.participant.nbAttempts > 1;
            const currentScore = isInDeferredSession ?
                (joinResult.participant.deferredScore ?? 0) :
                (joinResult.participant.liveScore ?? 0);
            const finalScore = currentScore + joinOrderBonus;

            // Create participant data using core types (map from Prisma structure)
            const participantDataForRedis: ParticipantData = {
                id: joinResult.participant.id,
                userId: joinResult.participant.userId,
                username: username || 'Unknown',
                score: finalScore, // Include join-order bonus
                avatarEmoji: avatarEmoji || (joinResult.participant as any).user?.avatarEmoji || '🐼', // Use parameter first, then user avatar, then default
                joinedAt: (joinResult.participant as any).joinedAt ?
                    (typeof (joinResult.participant as any).joinedAt === 'string' ?
                        (joinResult.participant as any).joinedAt :
                        (joinResult.participant as any).joinedAt.toISOString()) :
                    new Date().toISOString(),
                online: true,
                socketId: socket.id // Track current socket ID
            };

            // For live games (not differed), assign join-order bonus for better projection UX
            if (!gameInstance.isDiffered && (gameInstance.playMode === 'quiz' || gameInstance.playMode === 'tournament')) {
                const joinOrderBonus = await assignJoinOrderBonus(accessCode, userId);
                if (joinOrderBonus > 0) {
                    participantDataForRedis.score = (participantDataForRedis.score || 0) + joinOrderBonus;
                    logger.info({
                        accessCode,
                        userId,
                        username,
                        joinOrderBonus,
                        newScore: participantDataForRedis.score
                    }, 'Applied join-order bonus for projection leaderboard UX');
                }
            }

            logger.debug({ participantsKey, userId: joinResult.participant.userId, participantDataForRedis }, 'Storing participant in Redis by userId');

            // Store main participant data keyed by userId
            await redisClient.hset(participantsKey, joinResult.participant.userId, JSON.stringify(participantDataForRedis));

            // Update leaderboard in Redis with participant score (including any join-order bonus)
            const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`;
            await redisClient.zadd(leaderboardKey, finalScore, userId);

            logger.debug({
                accessCode,
                userId,
                finalScore,
                joinOrderBonus,
                leaderboardKey
            }, 'Added participant to leaderboard with final score (including join-order bonus)');

            // Update mappings
            logger.debug({ userIdToSocketIdKey, userId, socketId: socket.id }, 'Updating userIdToSocketId mapping');
            await redisClient.hset(userIdToSocketIdKey, userId, socket.id);
            logger.debug({ socketIdToUserIdKey, socketId: socket.id, userId }, 'Updating socketIdToUserId mapping');
            await redisClient.hset(socketIdToUserIdKey, socket.id, userId);

            const gameJoinedPayload: GameJoinedPayload = {
                accessCode,
                participant: {
                    id: joinResult.participant.id,
                    userId: joinResult.participant.userId,
                    username: username || 'Unknown',
                    score: participantDataForRedis.score, // Use the score with join-order bonus
                    avatarEmoji: avatarEmoji || (joinResult.participant as any).user?.avatarEmoji || '🐼',
                    joinedAt: (joinResult.participant as any).joinedAt ?
                        (typeof (joinResult.participant as any).joinedAt === 'string' ?
                            (joinResult.participant as any).joinedAt :
                            (joinResult.participant as any).joinedAt.toISOString()) :
                        new Date().toISOString(),
                    online: true,
                },
                gameStatus: gameInstance.status as GameJoinedPayload['gameStatus'],
                isDiffered: gameInstance.isDiffered,
                differedAvailableFrom: gameInstance.differedAvailableFrom?.toISOString(),
                differedAvailableTo: gameInstance.differedAvailableTo?.toISOString(),
            };
            logger.info({ gameJoinedPayload }, 'Emitting game_joined');
            socket.emit(SOCKET_EVENTS.GAME.GAME_JOINED as any, gameJoinedPayload);

            // Use modular scoreService for best score update if needed (for deferred)
            if (gameInstance.isDiffered) {
                await DifferedScoreService.updateBestScoreInRedis({
                    gameInstanceId: gameInstance.id,
                    userId,
                    score: joinResult.participant.deferredScore || 0
                });
            }

            // Canonical: On join, emit either current question (if active) or participants_list (if pending)
            if (!gameInstance.isDiffered && (gameInstance.playMode === 'tournament' || gameInstance.playMode === 'quiz')) {
                if (gameInstance.status === 'active') {
                    logger.info({ accessCode, userId, playMode: gameInstance.playMode }, 'Live game is active, sending current state to late joiner');
                    try {
                        const currentGameState = await gameStateService.getFullGameState(accessCode);
                        if (currentGameState && currentGameState.gameState && currentGameState.gameState.currentQuestionIndex >= 0) {
                            const { gameState } = currentGameState;
                            // Get the current question data
                            const gameInstanceWithQuestions = await prisma.gameInstance.findUnique({
                                where: { id: gameInstance.id },
                                include: {
                                    gameTemplate: {
                                        include: {
                                            questions: {
                                                include: { question: true },
                                                orderBy: { sequence: 'asc' }
                                            }
                                        }
                                    }
                                }
                            });
                            if (gameInstanceWithQuestions?.gameTemplate?.questions &&
                                gameState.currentQuestionIndex < gameInstanceWithQuestions.gameTemplate.questions.length) {
                                const currentQuestion = gameInstanceWithQuestions.gameTemplate.questions[gameState.currentQuestionIndex]?.question;
                                if (currentQuestion) {
                                    const { filterQuestionForClient } = await import('@shared/types/quiz/liveQuestion');
                                    let filteredQuestion = filterQuestionForClient(currentQuestion);
                                    if (filteredQuestion.timeLimit == null) {
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        const { timeLimit, ...rest } = filteredQuestion;
                                        filteredQuestion = rest;
                                    }
                                    const questionPayload = {
                                        ...filteredQuestion,
                                        currentQuestionIndex: gameState.currentQuestionIndex,
                                        totalQuestions: gameInstanceWithQuestions.gameTemplate.questions.length
                                    };
                                    logger.info({
                                        accessCode,
                                        userId,
                                        playMode: gameInstance.playMode,
                                        questionIndex: gameState.currentQuestionIndex,
                                        payload: questionPayload
                                    }, '[MODERNIZATION] Sending current question to late joiner (schema-compliant)');
                                    socket.emit(SOCKET_EVENTS.GAME.GAME_QUESTION as any, questionPayload);
                                    // Also send timer update (canonical)
                                    const durationMs = typeof currentQuestion.timeLimit === 'number' && currentQuestion.timeLimit > 0 ? currentQuestion.timeLimit * 1000 : 0;
                                    if (durationMs > 0) {
                                        const canonicalTimer = await getCanonicalTimer(
                                            accessCode,
                                            currentQuestion.uid,
                                            gameState.gameMode,
                                            gameState.status === 'completed',
                                            durationMs,
                                            undefined
                                        );
                                        if (canonicalTimer) {
                                            const timerUpdatePayload: GameTimerUpdatePayload = {
                                                timer: canonicalTimer,
                                                questionUid: canonicalTimer.questionUid
                                            };
                                            socket.emit(SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED as any, timerUpdatePayload);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        logger.error({ error, accessCode, userId }, 'Error sending current state to late joiner');
                    }
                } else if (gameInstance.status === 'pending') {
                    // Canonical: participant_list emission is now handled by lobbyHandler only
                    logger.info({ accessCode, userId }, '[MODERNIZATION] Game is pending, participant_list emission handled by lobbyHandler');
                }
            }

            if (!gameInstance.isDiffered && socket.data.currentGameRoom) {
                const playerJoinedPayload = {
                    participant: {
                        id: joinResult.participant.id,
                        userId: joinResult.participant.userId,
                        username: username || 'Unknown',
                        score: participantDataForRedis.score,
                        avatarEmoji: avatarEmoji || (joinResult.participant as any).user?.avatarEmoji || '🐼',
                        online: true
                    }
                };

                logger.info({ playerJoinedPayload, room: socket.data.currentGameRoom }, 'Emitting player_joined_game to room');
                socket.to(socket.data.currentGameRoom).emit('player_joined_game', playerJoinedPayload);

                // UX ENHANCEMENT: Broadcast updated leaderboard to projection room when student joins
                // This ensures students appear on the projection leaderboard immediately for better teacher UX
                try {
                    await broadcastLeaderboardToProjection(io, accessCode, gameInstance.id);
                    logger.info({
                        accessCode,
                        gameId: gameInstance.id,
                        userId,
                        username
                    }, 'Broadcasted leaderboard update to projection room after student join');
                } catch (error) {
                    logger.error({ error, accessCode, userId }, 'Error broadcasting leaderboard to projection room after join');
                }
            }

            // CRITICAL FIX: Start deferred tournament game flow for individual player
            if (gameInstance.status === 'completed' && gameInstance.playMode === 'tournament') {
                logger.info({ accessCode, userId }, 'Starting deferred tournament game flow for individual player');

                // Get questions for this tournament
                const gameInstanceWithQuestions = await prisma.gameInstance.findUnique({
                    where: { id: gameInstance.id },
                    include: {
                        gameTemplate: {
                            include: {
                                questions: {
                                    include: { question: true },
                                    orderBy: { sequence: 'asc' }
                                }
                            }
                        }
                    }
                });

                if (gameInstanceWithQuestions?.gameTemplate?.questions) {
                    const actualQuestions = gameInstanceWithQuestions.gameTemplate.questions
                        .map(gtq => gtq.question)
                        .filter(q => q != null);

                    if (actualQuestions.length > 0) {
                        logger.info({ accessCode, userId, questionCount: actualQuestions.length }, '[DEBUG] About to import startDeferredTournamentSession');
                        try {
                            const { startDeferredTournamentSession } = await import('../deferredTournamentFlow');
                            logger.info({ accessCode, userId }, '[DEBUG] Successfully imported startDeferredTournamentSession');
                            await startDeferredTournamentSession(io, socket, accessCode, userId, actualQuestions);
                            logger.info({ accessCode, userId }, '[DEBUG] startDeferredTournamentSession completed');
                        } catch (err) {
                            logger.error({ accessCode, userId, err }, '[ERROR] Failed to start deferred tournament session');
                        }
                    }
                }
            }


            // --- MODERNIZATION: Emit correct_answers to student if trophy is active ---
            // Only for live games (not differed), after join is complete
            if (!gameInstance.isDiffered) {
                const displayState = await gameStateService.getProjectionDisplayState(accessCode);
                if (displayState?.showCorrectAnswers && displayState.correctAnswersData) {
                    // Use canonical event and payload (match showCorrectAnswersHandler)
                    const correctAnswersPayload = {
                        questionUid: displayState.correctAnswersData.questionUid,
                        correctAnswers: displayState.correctAnswersData.correctAnswers || []
                    };
                    socket.emit(SOCKET_EVENTS.GAME.CORRECT_ANSWERS as keyof ServerToClientEvents, correctAnswersPayload);
                    logger.info({ accessCode, userId, questionUid: correctAnswersPayload.questionUid }, '[JOIN_GAME] Emitted correct_answers to student on join (trophy active)');
                }
            }

            // Emit updated participant count to teacher dashboard
            await emitParticipantCount(io, accessCode);

            // MODERNIZATION: Emit unified participant list for lobby display
            await emitParticipantList(io, accessCode);

            // Emit updated participant count
            const participantCount = await prisma.gameParticipant.count({
                where: { gameInstanceId: gameInstance.id }
            });
            logger.info({ participantCount, room: socket.data.currentGameRoom }, 'Emitting participant_count_update to room');
            if (socket.data.currentGameRoom) {
                // FIX: Emit full participants array, not just count
                const dbParticipants = await prisma.gameParticipant.findMany({
                    where: { gameInstanceId: gameInstance.id },
                    include: { user: true }
                });
                const participants: ParticipantData[] = dbParticipants.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    username: p.user?.username || 'Unknown',
                    avatar: p.user?.avatarEmoji || '�',
                    score: gameInstance.isDiffered ? (p.deferredScore ?? 0) : (p.liveScore ?? 0),
                    avatarEmoji: p.user?.avatarEmoji || '🐼',
                    joinedAt: p.joinedAt ? (typeof p.joinedAt === 'string' ? p.joinedAt : p.joinedAt.toISOString()) : new Date().toISOString(),
                    online: true,
                    socketId: undefined // Not tracked here
                }));
                socket.to(socket.data.currentGameRoom).emit('game_participants', { participants });
            }

            // --- DEBUG: Log Redis state ---
            const redisParticipants = await redisClient.hgetall(participantsKey);
            logger.debug({ redisParticipants }, 'Current Redis participants');

            // --- DEBUG: Log all socket rooms ---
            const allRooms = Array.from(io.sockets.adapter.rooms.keys());
            logger.debug({ allRooms }, 'Current socket rooms');

            // --- DEBUG: Log specific socket details ---
            const socketDetails = {
                id: socket.id,
                rooms: Array.from(socket.rooms),
                data: socket.data,
            };
            logger.debug({ socketDetails }, 'Current socket details');
        } catch (err) {
            // Log to both logger and console for guaranteed visibility
            logger.error({
                err: err instanceof Error ? err.message : err,
                stack: err instanceof Error ? err.stack : undefined,
                accessCode,
                userId,
                payload,
                context: 'joinGameHandler catch block',
            }, 'Error in joinGameHandler (full error and stack)');
            // --- CONSOLE LOG FOR TEST DEBUGGING ---
            console.error('[joinGameHandler CATCH] ERROR:', err);
            if (err instanceof Error && err.stack) {
                console.error('[joinGameHandler CATCH] STACK:', err.stack);
            }
            console.error('[joinGameHandler CATCH] accessCode:', accessCode, 'userId:', userId, 'payload:', payload);
            // --------------------------------------
            const errorPayload: ErrorPayload = { message: 'Internal error joining game.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
        }
    };
}
