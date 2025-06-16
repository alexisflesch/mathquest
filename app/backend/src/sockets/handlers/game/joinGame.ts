import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameParticipantService } from '@/core/services/gameParticipantService';
// import { GameInstanceService } from '@/core/services/gameInstanceService'; // Not directly used, consider removing if not needed elsewhere
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import { z } from 'zod';
import { emitParticipantCount } from '@/sockets/utils/participantCountUtils';
import gameStateService from '@/core/gameStateService';
// Import shared types
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
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
import { GameParticipant, ParticipantData } from '@shared/types/core/participant';

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
            socket.emit('game_error', errorPayload);
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

            logger.debug({ practiceRoomName, socketId: socket.id }, 'Player joined practice room');

            // Send successful join response for practice mode
            const gameJoinedPayload: GameJoinedPayload = {
                accessCode: 'PRACTICE',
                gameStatus: 'active', // Practice mode is immediately active
                isDiffered: false, // Practice mode is not deferred
                participant: {
                    id: userId,
                    userId: userId, // Same as id for practice mode
                    username,
                    avatar: avatarEmoji || '🐼', // Use avatarEmoji as avatar
                    avatarEmoji: avatarEmoji || '🐼',
                    score: 0
                }
            };

            logger.info({ gameJoinedPayload }, 'Emitting game_joined for practice mode');
            socket.emit('game_joined', gameJoinedPayload);
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
                socket.emit('game_error', errorPayload);
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
                    socket.emit('game_error', errorPayload);
                    return;
                }
                const existing = await prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId }
                });
                logger.debug({ existing }, 'Existing participant for differed game');
                if (existing && existing.completedAt) {
                    const gameAlreadyPlayedPayload: GameAlreadyPlayedPayload = { accessCode };
                    logger.info({ gameAlreadyPlayedPayload }, 'Emitting game_already_played');
                    socket.emit('game_already_played', gameAlreadyPlayedPayload);
                    return;
                }
            } else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz') {
                    roomName = `game_${accessCode}`;
                } else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.debug({ roomName, socketId: socket.id }, '[DEBUG] Player joining room');
                await socket.join(roomName);
                // --- DEBUG: Print room membership after join ---
                const joinedRoomSockets = io.sockets.adapter.rooms.get(roomName);
                const joinedRoomSocketIds = joinedRoomSockets ? Array.from(joinedRoomSockets) : [];
                console.log('[joinGame] Player joined room:', { roomName, socketId: socket.id, joinedRoomSocketIds });
                logger.debug({ roomName, socketId: socket.id, rooms: Array.from(socket.rooms) }, '[DEBUG] Player joined room');
                socket.data.currentGameRoom = roomName;
            }
            const participantService = new GameParticipantService();
            logger.debug({ userId, accessCode, username, avatarEmoji }, 'Calling participantService.joinGame');
            const joinResult = await participantService.joinGame(userId, accessCode, username, avatarEmoji);
            logger.debug({ joinResult }, 'Result of participantService.joinGame');
            if (!joinResult.success || !joinResult.participant) {
                const errorPayload: ErrorPayload = { message: joinResult.error || 'Join failed.' };
                logger.warn({ errorPayload }, 'Emitting game_error: join failed');
                socket.emit('game_error', errorPayload);
                return;
            }
            socket.data.userId = userId;
            socket.data.accessCode = accessCode;
            socket.data.username = username || 'Unknown';

            // Redis keys
            const participantsKey = `mathquest:game:participants:${accessCode}`;
            const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
            const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;

            // Create participant data using core types (map from Prisma structure)
            const participantDataForRedis: ParticipantData = {
                id: joinResult.participant.id,
                userId: joinResult.participant.userId,
                username: username || 'Unknown',
                avatar: avatarEmoji || (joinResult.participant as any).user?.avatarEmoji || '�', // Use parameter first, then user avatar, then default
                score: joinResult.participant.score ?? 0, // Ensure it's always a number
                avatarEmoji: avatarEmoji || (joinResult.participant as any).user?.avatarEmoji || '🐼', // Use parameter first, then user avatar, then default
                joinedAt: (joinResult.participant as any).joinedAt ?
                    (typeof (joinResult.participant as any).joinedAt === 'string' ?
                        (joinResult.participant as any).joinedAt :
                        (joinResult.participant as any).joinedAt.toISOString()) :
                    new Date().toISOString(),
                online: true,
                socketId: socket.id // Track current socket ID
            };
            logger.debug({ participantsKey, userId: joinResult.participant.userId, participantDataForRedis }, 'Storing participant in Redis by userId');
            // Store main participant data keyed by userId
            await redisClient.hset(participantsKey, joinResult.participant.userId, JSON.stringify(participantDataForRedis));

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
                    avatar: avatarEmoji || (joinResult.participant as any).user?.avatarEmoji || '�',
                    score: joinResult.participant.score ?? 0, // Ensure it's always a number
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
            socket.emit('game_joined', gameJoinedPayload);

            // For live tournaments (not deferred), check if game is active and send current state to late joiners
            if (!gameInstance.isDiffered && gameInstance.status === 'active' && gameInstance.playMode === 'tournament') {
                logger.info({ accessCode, userId }, 'Live tournament is active, sending current state to late joiner');

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
                                const filteredQuestion = filterQuestionForClient(currentQuestion);

                                // Calculate remaining time for late joiner
                                let actualTimer = gameState.timer;
                                if (gameState.timer && gameState.timer.status === 'play' && gameState.timer.timestamp) {
                                    const elapsed = Date.now() - gameState.timer.timestamp;
                                    const timeLeftMs = Math.max(0, gameState.timer.timeLeftMs - elapsed);

                                    actualTimer = {
                                        ...gameState.timer,
                                        timeLeftMs,
                                        timestamp: Date.now()
                                    };
                                }

                                // Send current question with actual remaining time
                                const lateJoinerQuestionPayload = {
                                    question: filteredQuestion,
                                    questionIndex: gameState.currentQuestionIndex, // Use shared type field name
                                    totalQuestions: gameInstanceWithQuestions.gameTemplate.questions.length, // Add total questions count
                                    feedbackWaitTime: currentQuestion.feedbackWaitTime || 1.5,
                                    timer: actualTimer
                                };

                                logger.info({
                                    accessCode,
                                    userId,
                                    questionIndex: gameState.currentQuestionIndex,
                                    originalTimeLeft: gameState.timer?.timeLeftMs,
                                    actualTimeLeft: actualTimer?.timeLeftMs,
                                    payload: lateJoinerQuestionPayload
                                }, 'Sending current question to late joiner');

                                socket.emit('game_question', lateJoinerQuestionPayload);

                                // Also send timer update
                                if (actualTimer) {
                                    const timerUpdatePayload = {
                                        timer: {
                                            isPaused: actualTimer.status === 'pause',
                                            timeLeftMs: actualTimer.timeLeftMs,
                                            startedAt: actualTimer.timestamp || undefined,
                                            durationMs: actualTimer.durationMs
                                        }
                                    };
                                    socket.emit('game_timer_updated', timerUpdatePayload);
                                }
                            }
                        }
                    }
                } catch (error) {
                    logger.error({ error, accessCode, userId }, 'Error sending current state to late joiner');
                }
            }

            if (!gameInstance.isDiffered && socket.data.currentGameRoom) {
                const playerJoinedPayload: PlayerJoinedGamePayload = {
                    participant: {
                        id: joinResult.participant.id,
                        userId: joinResult.participant.userId,
                        username: username || 'Unknown',
                        avatar: (joinResult.participant as any).user?.avatarEmoji || '�',
                        score: joinResult.participant.score ?? 0, // Ensure it's always a number
                        avatarEmoji: (joinResult.participant as any).user?.avatarEmoji || '🐼',
                        online: true
                    }
                };
                logger.info({ playerJoinedPayload, room: socket.data.currentGameRoom }, 'Emitting player_joined_game to room');
                socket.to(socket.data.currentGameRoom).emit('player_joined_game', playerJoinedPayload);
            }

            // CRITICAL FIX: Start deferred tournament game flow for individual player
            if (gameInstance.isDiffered && gameInstance.playMode === 'tournament') {
                logger.info({ accessCode, userId }, 'Starting deferred tournament game flow for individual player');

                // Import runGameFlow here to avoid circular dependencies
                const { runGameFlow } = await import('../sharedGameFlow');

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
                        logger.info({ accessCode, userId, questionCount: actualQuestions.length }, 'Starting individual deferred tournament game flow');

                        // Start game flow for this individual player
                        // Use a unique room identifier for this player's session
                        const playerRoom = `game_${accessCode}_${userId}`;
                        socket.join(playerRoom);

                        // Get current game state and merge updates
                        const currentState = await gameStateService.getFullGameState(accessCode);
                        if (currentState && currentState.gameState) {
                            const updatedState = {
                                ...currentState.gameState,
                                status: 'active' as const,
                                currentQuestionIndex: 0,
                                timer: {
                                    ...currentState.gameState.timer,
                                    startedAt: Date.now(),
                                    duration: (actualQuestions[0]?.timeLimit || 30) * 1000,
                                    isPaused: false
                                }
                            };
                            await gameStateService.updateGameState(accessCode, updatedState);
                        }

                        // Start the individual game flow using the player-specific room
                        runGameFlow(
                            io,
                            accessCode, // Keep the same access code for game state consistency
                            actualQuestions,
                            { playMode: 'tournament' }
                        );
                    }
                }
            }

            // Emit updated participant count to teacher dashboard
            await emitParticipantCount(io, accessCode);

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
                    score: p.score ?? 0,
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
            logger.error({ err, accessCode, userId, stack: err instanceof Error ? err.stack : undefined }, 'Error in joinGameHandler');
            const errorPayload: ErrorPayload = { message: 'Internal error joining game.' };
            socket.emit('game_error', errorPayload);
        }
    };
}
