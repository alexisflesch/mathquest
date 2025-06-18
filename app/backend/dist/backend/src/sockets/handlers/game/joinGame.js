"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGameHandler = joinGameHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
// import { GameInstanceService } from '@/core/services/gameInstanceService'; // Not directly used, consider removing if not needed elsewhere
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const participantCountUtils_1 = require("@/sockets/utils/participantCountUtils");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const timerUtils_1 = require("../../../core/timerUtils");
const logger = (0, logger_1.default)('JoinGameHandler');
// Update handler signature with shared types
function joinGameHandler(io, socket) {
    // Update payload type
    return async (payload) => {
        logger.debug({ payload }, 'Received join_game payload');
        // Zod validation for payload
        const parseResult = socketEvents_zod_1.joinGamePayloadSchema.safeParse(payload);
        logger.debug({ parseResult }, 'Result of joinGamePayloadSchema.safeParse');
        if (!parseResult.success) {
            const errorPayload = {
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
            logger.debug({ practiceRoomName, socketId: socket.id }, 'Player joined practice room'); // Send successful join response for practice mode
            const gameJoinedPayload = {
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
            socket.emit('game_joined', gameJoinedPayload);
            return;
        }
        try {
            logger.debug({ accessCode, userId, username, avatarEmoji }, 'Looking up gameInstance');
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
                const errorPayload = { message: 'Game not found.' };
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
                    const errorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload }, 'Emitting game_error: differed window not available');
                    socket.emit('game_error', errorPayload);
                    return;
                }
                const existing = await prisma_1.prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId }
                });
                logger.debug({ existing }, 'Existing participant for differed game');
                if (existing && existing.completedAt) {
                    const gameAlreadyPlayedPayload = { accessCode };
                    logger.info({ gameAlreadyPlayedPayload }, 'Emitting game_already_played');
                    socket.emit('game_already_played', gameAlreadyPlayedPayload);
                    return;
                }
            }
            else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz') {
                    roomName = `game_${accessCode}`;
                }
                else if (gameInstance.playMode === 'tournament') {
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
            const participantService = new gameParticipantService_1.GameParticipantService();
            logger.debug({ userId, accessCode, username, avatarEmoji }, 'Calling participantService.joinGame');
            const joinResult = await participantService.joinGame(userId, accessCode, username, avatarEmoji);
            logger.debug({ joinResult }, 'Result of participantService.joinGame');
            if (!joinResult.success || !joinResult.participant) {
                const errorPayload = { message: joinResult.error || 'Join failed.' };
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
            const participantDataForRedis = {
                id: joinResult.participant.id,
                userId: joinResult.participant.userId,
                username: username || 'Unknown',
                score: joinResult.participant.score ?? 0, // Ensure it's always a number
                avatarEmoji: avatarEmoji || joinResult.participant.user?.avatarEmoji || '🐼', // Use parameter first, then user avatar, then default
                joinedAt: joinResult.participant.joinedAt ?
                    (typeof joinResult.participant.joinedAt === 'string' ?
                        joinResult.participant.joinedAt :
                        joinResult.participant.joinedAt.toISOString()) :
                    new Date().toISOString(),
                online: true,
                socketId: socket.id // Track current socket ID
            };
            logger.debug({ participantsKey, userId: joinResult.participant.userId, participantDataForRedis }, 'Storing participant in Redis by userId');
            // Store main participant data keyed by userId
            await redis_1.redisClient.hset(participantsKey, joinResult.participant.userId, JSON.stringify(participantDataForRedis));
            // Update mappings
            logger.debug({ userIdToSocketIdKey, userId, socketId: socket.id }, 'Updating userIdToSocketId mapping');
            await redis_1.redisClient.hset(userIdToSocketIdKey, userId, socket.id);
            logger.debug({ socketIdToUserIdKey, socketId: socket.id, userId }, 'Updating socketIdToUserId mapping');
            await redis_1.redisClient.hset(socketIdToUserIdKey, socket.id, userId);
            const gameJoinedPayload = {
                accessCode,
                participant: {
                    id: joinResult.participant.id,
                    userId: joinResult.participant.userId,
                    username: username || 'Unknown',
                    score: joinResult.participant.score ?? 0, // Ensure it's always a number
                    avatarEmoji: avatarEmoji || joinResult.participant.user?.avatarEmoji || '🐼',
                    joinedAt: joinResult.participant.joinedAt ?
                        (typeof joinResult.participant.joinedAt === 'string' ?
                            joinResult.participant.joinedAt :
                            joinResult.participant.joinedAt.toISOString()) :
                        new Date().toISOString(),
                    online: true,
                },
                gameStatus: gameInstance.status,
                isDiffered: gameInstance.isDiffered,
                differedAvailableFrom: gameInstance.differedAvailableFrom?.toISOString(),
                differedAvailableTo: gameInstance.differedAvailableTo?.toISOString(),
            };
            logger.info({ gameJoinedPayload }, 'Emitting game_joined');
            socket.emit('game_joined', gameJoinedPayload);
            // For live games (quiz and tournament, not deferred), check if game is active and send current state to late joiners
            if (!gameInstance.isDiffered && gameInstance.status === 'active' && (gameInstance.playMode === 'tournament' || gameInstance.playMode === 'quiz')) {
                logger.info({ accessCode, userId, playMode: gameInstance.playMode }, 'Live game is active, sending current state to late joiner');
                try {
                    const currentGameState = await gameStateService_1.default.getFullGameState(accessCode);
                    if (currentGameState && currentGameState.gameState && currentGameState.gameState.currentQuestionIndex >= 0) {
                        const { gameState } = currentGameState;
                        // Get the current question data
                        const gameInstanceWithQuestions = await prisma_1.prisma.gameInstance.findUnique({
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
                                const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@shared/types/quiz/liveQuestion')));
                                const filteredQuestion = filterQuestionForClient(currentQuestion);
                                // Calculate remaining time for late joiner using shared utility
                                const actualTimer = (0, timerUtils_1.calculateTimerForLateJoiner)(gameState.timer);
                                // Send current question with actual remaining time
                                const lateJoinerQuestionPayload = {
                                    question: filteredQuestion,
                                    questionIndex: gameState.currentQuestionIndex, // Use shared type field name
                                    totalQuestions: gameInstanceWithQuestions.gameTemplate.questions.length, // Add total questions count
                                    feedbackWaitTime: currentQuestion.feedbackWaitTime || (gameInstance.playMode === 'tournament' ? 1.5 : 1),
                                    timer: actualTimer || gameState.timer
                                };
                                logger.info({
                                    accessCode,
                                    userId,
                                    playMode: gameInstance.playMode,
                                    questionIndex: gameState.currentQuestionIndex,
                                    originalTimeLeft: gameState.timer?.timeLeftMs,
                                    originalStatus: gameState.timer?.status,
                                    actualTimeLeft: actualTimer?.timeLeftMs,
                                    actualStatus: actualTimer?.status,
                                    elapsed: gameState.timer?.timestamp ? Date.now() - gameState.timer.timestamp : 'no timestamp',
                                    payload: lateJoinerQuestionPayload
                                }, 'Sending current question to late joiner');
                                socket.emit('game_question', lateJoinerQuestionPayload);
                                // Also send timer update
                                if (actualTimer) {
                                    const timerUpdatePayload = {
                                        timer: actualTimer,
                                        questionUid: actualTimer.questionUid ?? undefined
                                    };
                                    socket.emit('game_timer_updated', timerUpdatePayload);
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    logger.error({ error, accessCode, userId }, 'Error sending current state to late joiner');
                }
            }
            if (!gameInstance.isDiffered && socket.data.currentGameRoom) {
                const playerJoinedPayload = {
                    participant: {
                        id: joinResult.participant.id,
                        userId: joinResult.participant.userId,
                        username: username || 'Unknown',
                        score: joinResult.participant.score ?? 0, // Ensure it's always a number
                        avatarEmoji: avatarEmoji || joinResult.participant.user?.avatarEmoji || '🐼',
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
                const { runGameFlow } = await Promise.resolve().then(() => __importStar(require('../sharedGameFlow')));
                // Get questions for this tournament
                const gameInstanceWithQuestions = await prisma_1.prisma.gameInstance.findUnique({
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
                        const currentState = await gameStateService_1.default.getFullGameState(accessCode);
                        if (currentState && currentState.gameState) {
                            const updatedState = {
                                ...currentState.gameState,
                                status: 'active',
                                currentQuestionIndex: 0,
                                timer: {
                                    status: 'play',
                                    timeLeftMs: (actualQuestions[0]?.timeLimit || 30) * 1000,
                                    durationMs: (actualQuestions[0]?.timeLimit || 30) * 1000,
                                    questionUid: actualQuestions[0]?.uid || null,
                                    timestamp: Date.now(),
                                    localTimeLeftMs: null
                                }
                            };
                            await gameStateService_1.default.updateGameState(accessCode, updatedState);
                        }
                        // Start the individual game flow using the player-specific room
                        runGameFlow(io, accessCode, // Keep the same access code for game state consistency
                        actualQuestions, { playMode: 'tournament' });
                    }
                }
            }
            // Emit updated participant count to teacher dashboard
            await (0, participantCountUtils_1.emitParticipantCount)(io, accessCode);
            // Emit updated participant count
            const participantCount = await prisma_1.prisma.gameParticipant.count({
                where: { gameInstanceId: gameInstance.id }
            });
            logger.info({ participantCount, room: socket.data.currentGameRoom }, 'Emitting participant_count_update to room');
            if (socket.data.currentGameRoom) {
                // FIX: Emit full participants array, not just count
                const dbParticipants = await prisma_1.prisma.gameParticipant.findMany({
                    where: { gameInstanceId: gameInstance.id },
                    include: { user: true }
                });
                const participants = dbParticipants.map(p => ({
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
            const redisParticipants = await redis_1.redisClient.hgetall(participantsKey);
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
        }
        catch (err) {
            logger.error({ err, accessCode, userId, stack: err instanceof Error ? err.stack : undefined }, 'Error in joinGameHandler');
            const errorPayload = { message: 'Internal error joining game.' };
            socket.emit('game_error', errorPayload);
        }
    };
}
