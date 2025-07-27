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
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const redis_1 = require("@/config/redis");
const participantCountUtils_1 = require("@/sockets/utils/participantCountUtils");
const gameStateService_1 = __importStar(require("@/core/services/gameStateService"));
const events_1 = require("@shared/types/socket/events");
const leaderboardSnapshotService_1 = require("@/core/services/gameParticipant/leaderboardSnapshotService");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const joinOrderBonus_1 = require("@/utils/joinOrderBonus");
const projectionLeaderboardBroadcast_1 = require("@/utils/projectionLeaderboardBroadcast");
const joinService_1 = require("@/core/services/gameParticipant/joinService");
const scoreService_1 = require("@/core/services/gameParticipant/scoreService");
const lobbyHandler_1 = require("../lobbyHandler");
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
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
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
                // Practice mode is not deferred - always fresh session
                participant: {
                    id: userId,
                    userId: userId, // Same as id for practice mode
                    username,
                    avatarEmoji: avatarEmoji || '🐼', // Ensure avatarEmoji is never undefined
                    score: 0
                }
            };
            logger.info({ gameJoinedPayload }, 'Emitting game_joined for practice mode');
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_JOINED, gameJoinedPayload);
            return;
        }
        try {
            logger.debug({ accessCode, userId, username, avatarEmoji }, 'Looking up gameInstance');
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
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
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            // FIXED: A game is deferred when status is 'completed' and available for replay
            const isDeferred = gameInstance.status === 'completed';
            if (isDeferred) {
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    const errorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload }, 'Emitting game_error: differed window not available');
                    socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                    return;
                }
                // Note: Tournament replay prevention is now handled by GameParticipantService.joinGame()
                // This ensures consistent replay blocking for both live and deferred tournaments
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
            const joinResult = await (0, joinService_1.joinGame)({
                userId,
                accessCode,
                username,
                avatarEmoji
            });
            logger.debug({ joinResult }, 'Result of participantService.joinGame');
            if (!joinResult.success || !joinResult.participant) {
                // Handle join errors
                const errorPayload = { message: joinResult.error || 'Join failed.' };
                logger.warn({ errorPayload }, 'Emitting game_error: join failed');
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
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
            // Skip join order bonus for deferred mode (when completed tournaments are accessed individually)
            const isCurrentlyDeferred = gameInstance.status === 'completed';
            const joinOrderBonus = isCurrentlyDeferred ? 0 : await (0, joinOrderBonus_1.assignJoinOrderBonus)(accessCode, userId);
            // 🐛 BUG FIX: Preserve existing Redis score when user rejoins/reloads
            // During live gameplay, scores are stored in Redis, not database. 
            // When user rejoins, we must preserve their Redis score, not overwrite with database score (which is 0).
            let finalScore = 0;
            const existingRedisData = await redis_1.redisClient.hget(participantsKey, userId);
            if (existingRedisData) {
                // User is rejoining - preserve their existing Redis score
                const existingParticipant = JSON.parse(existingRedisData);
                finalScore = existingParticipant.score || 0;
                logger.info({
                    accessCode,
                    userId,
                    username,
                    existingScore: finalScore,
                    trigger: 'rejoin_preserve_score'
                }, '🔄 [REJOIN] Preserved existing Redis score for rejoining participant');
            }
            else {
                // New user - use database score + join bonus
                const isInDeferredSession = joinResult.participant.nbAttempts > 1;
                const currentScore = isInDeferredSession ?
                    (joinResult.participant.deferredScore ?? 0) :
                    (joinResult.participant.liveScore ?? 0);
                finalScore = currentScore + joinOrderBonus;
                logger.info({
                    accessCode,
                    userId,
                    username,
                    databaseScore: currentScore,
                    joinOrderBonus,
                    finalScore,
                    trigger: 'new_join_with_bonus'
                }, '🆕 [NEW-JOIN] Applied database score + join bonus for new participant');
            }
            // Create participant data using core types (map from Prisma structure)
            const participantDataForRedis = {
                id: joinResult.participant.id,
                userId: joinResult.participant.userId,
                username: username || 'Unknown',
                score: finalScore, // Include join-order bonus
                avatarEmoji: avatarEmoji || joinResult.participant.user?.avatarEmoji || '🐼', // Use parameter first, then user avatar, then default
                joinedAt: joinResult.participant.joinedAt ?
                    (typeof joinResult.participant.joinedAt === 'string' ?
                        joinResult.participant.joinedAt :
                        joinResult.participant.joinedAt.toISOString()) :
                    new Date().toISOString(),
                online: true,
                socketId: socket.id // Track current socket ID
            };
            // For live games (not deferred), assign join-order bonus for better projection UX
            if (!isDeferred && (gameInstance.playMode === 'quiz' || gameInstance.playMode === 'tournament')) {
                const joinOrderBonus = await (0, joinOrderBonus_1.assignJoinOrderBonus)(accessCode, userId);
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
            await redis_1.redisClient.hset(participantsKey, joinResult.participant.userId, JSON.stringify(participantDataForRedis));
            // 🚨 CRITICAL BUG FIX: Preserve existing Redis scores during user rejoin
            // During active gameplay, Redis is the source of truth. Never overwrite existing scores.
            const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`;
            const existingLeaderboardScore = await redis_1.redisClient.zscore(leaderboardKey, userId);
            if (existingLeaderboardScore === null) {
                // User not in leaderboard yet - safe to add with final score
                await redis_1.redisClient.zadd(leaderboardKey, finalScore, userId);
                logger.info({
                    accessCode,
                    userId,
                    finalScore,
                    joinOrderBonus,
                    leaderboardKey,
                    action: 'added_new_user'
                }, '[LEADERBOARD] Added new participant to Redis leaderboard');
            }
            else {
                // User already in leaderboard - preserve existing score in BOTH leaderboard AND participant data
                participantDataForRedis.score = parseFloat(existingLeaderboardScore);
                await redis_1.redisClient.hset(participantsKey, joinResult.participant.userId, JSON.stringify(participantDataForRedis));
                logger.warn({
                    accessCode,
                    userId,
                    existingScore: existingLeaderboardScore,
                    attemptedScore: finalScore,
                    leaderboardKey,
                    action: 'preserved_existing_score'
                }, '[LEADERBOARD] Preserved existing Redis leaderboard score - did not overwrite');
            }
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
                    score: participantDataForRedis.score, // Use the score with join-order bonus
                    avatarEmoji: avatarEmoji || joinResult.participant.user?.avatarEmoji || '🐼',
                    joinedAt: joinResult.participant.joinedAt ?
                        (typeof joinResult.participant.joinedAt === 'string' ?
                            joinResult.participant.joinedAt :
                            joinResult.participant.joinedAt.toISOString()) :
                        new Date().toISOString(),
                    online: true,
                },
                gameStatus: gameInstance.status,
                // Include deferred status based on game completion and availability
                differedAvailableFrom: gameInstance.differedAvailableFrom?.toISOString(),
                differedAvailableTo: gameInstance.differedAvailableTo?.toISOString(),
            };
            logger.info({ gameJoinedPayload }, 'Emitting game_joined');
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_JOINED, gameJoinedPayload);
            // 🎯 LEADERBOARD ON JOIN: Send current leaderboard state to new joiners
            // This handles late joiners, reconnections, and page reloads gracefully
            try {
                // Only send leaderboard if game has started (status: 'active' or 'completed')
                // Skip if game is still pending (no participants have scores yet)
                if (gameInstance.status === 'active' || gameInstance.status === 'completed') {
                    // DEFERRED SESSION FIX: Send empty leaderboard for deferred sessions to avoid stale data contamination
                    if (isDeferred) {
                        // For deferred sessions, send empty leaderboard on join
                        // Individual player progress will be sent after each question
                        socket.emit('leaderboard_update', { leaderboard: [] });
                        logger.info({
                            accessCode,
                            userId,
                            gameStatus: gameInstance.status,
                            trigger: 'join_game_deferred_empty_leaderboard'
                        }, '[JOIN-LEADERBOARD] Sent empty leaderboard for deferred session - avoiding stale data');
                    }
                    else {
                        // Use snapshot-based emission for live sessions
                        await (0, leaderboardSnapshotService_1.emitLeaderboardFromSnapshot)(io, accessCode, [socket.id], // Emit only to this specific socket
                        'join_game_initial_load');
                        logger.info({
                            accessCode,
                            userId,
                            gameStatus: gameInstance.status,
                            trigger: 'join_game_initial_load',
                            dataSource: 'leaderboard_snapshot'
                        }, '[JOIN-LEADERBOARD] Emitted initial leaderboard state to new joiner from snapshot');
                    }
                }
                else {
                    logger.debug({
                        accessCode,
                        userId,
                        gameStatus: gameInstance.status
                    }, '[JOIN-LEADERBOARD] Skipping leaderboard emission - game not started yet');
                }
            }
            catch (leaderboardError) {
                logger.error({
                    accessCode,
                    userId,
                    error: leaderboardError
                }, '[JOIN-LEADERBOARD] Error emitting initial leaderboard to new joiner');
            }
            // Use modular scoreService for best score update if needed (for deferred)
            if (isDeferred) {
                await scoreService_1.DifferedScoreService.updateBestScoreInRedis({
                    gameInstanceId: gameInstance.id,
                    userId,
                    score: joinResult.participant.deferredScore || 0
                });
            }
            // Canonical: On join, emit either current question (if active) or participants_list (if pending)
            if (!isDeferred && (gameInstance.playMode === 'tournament' || gameInstance.playMode === 'quiz')) {
                if (gameInstance.status === 'active') {
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
                                    socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_QUESTION, questionPayload);
                                    // Also send timer update (canonical)
                                    const durationMs = typeof currentQuestion.timeLimit === 'number' && currentQuestion.timeLimit > 0 ? currentQuestion.timeLimit * 1000 : 0;
                                    if (durationMs > 0) {
                                        const canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, currentQuestion.uid, gameState.gameMode, gameState.status === 'completed', durationMs, undefined);
                                        if (canonicalTimer) {
                                            const timerUpdatePayload = {
                                                timer: canonicalTimer,
                                                questionUid: canonicalTimer.questionUid
                                            };
                                            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED, timerUpdatePayload);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (error) {
                        logger.error({ error, accessCode, userId }, 'Error sending current state to late joiner');
                    }
                }
                else if (gameInstance.status === 'pending') {
                    // Canonical: participant_list emission is now handled by lobbyHandler only
                    logger.info({ accessCode, userId }, '[MODERNIZATION] Game is pending, participant_list emission handled by lobbyHandler');
                }
            }
            if (!isDeferred && socket.data.currentGameRoom) {
                const playerJoinedPayload = {
                    participant: {
                        id: joinResult.participant.id,
                        userId: joinResult.participant.userId,
                        username: username || 'Unknown',
                        score: participantDataForRedis.score,
                        avatarEmoji: avatarEmoji || joinResult.participant.user?.avatarEmoji || '🐼',
                        online: true
                    }
                };
                logger.info({ playerJoinedPayload, room: socket.data.currentGameRoom }, 'Emitting player_joined_game to room');
                socket.to(socket.data.currentGameRoom).emit('player_joined_game', playerJoinedPayload);
                // UX ENHANCEMENT: Broadcast updated leaderboard to projection room when student joins
                // This ensures students appear on the projection leaderboard immediately for better teacher UX
                try {
                    await (0, projectionLeaderboardBroadcast_1.broadcastLeaderboardToProjection)(io, accessCode, gameInstance.id);
                    logger.info({
                        accessCode,
                        gameId: gameInstance.id,
                        userId,
                        username
                    }, 'Broadcasted leaderboard update to projection room after student join');
                }
                catch (error) {
                    logger.error({ error, accessCode, userId }, 'Error broadcasting leaderboard to projection room after join');
                }
            }
            // CRITICAL FIX: Start deferred tournament game flow for individual player
            if (gameInstance.status === 'completed' && gameInstance.playMode === 'tournament') {
                logger.info({ accessCode, userId }, 'Starting deferred tournament game flow for individual player');
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
                        logger.info({ accessCode, userId, questionCount: actualQuestions.length }, '[DEBUG] About to import startDeferredTournamentSession');
                        try {
                            const { startDeferredTournamentSession } = await Promise.resolve().then(() => __importStar(require('../deferredTournamentFlow')));
                            logger.info({ accessCode, userId }, '[DEBUG] Successfully imported startDeferredTournamentSession');
                            await startDeferredTournamentSession(io, socket, accessCode, userId, actualQuestions);
                            logger.info({ accessCode, userId }, '[DEBUG] startDeferredTournamentSession completed');
                        }
                        catch (err) {
                            logger.error({ accessCode, userId, err }, '[ERROR] Failed to start deferred tournament session');
                        }
                    }
                }
            }
            // --- MODERNIZATION: Emit correct_answers to student if trophy is active ---
            // Only for live games (not deferred), after join is complete
            if (!isDeferred) {
                const displayState = await gameStateService_1.default.getProjectionDisplayState(accessCode);
                if (displayState?.showCorrectAnswers && displayState.correctAnswersData) {
                    // Use canonical event and payload (match showCorrectAnswersHandler)
                    const correctAnswersPayload = {
                        questionUid: displayState.correctAnswersData.questionUid,
                        correctAnswers: displayState.correctAnswersData.correctAnswers || []
                    };
                    socket.emit(events_1.SOCKET_EVENTS.GAME.CORRECT_ANSWERS, correctAnswersPayload);
                    logger.info({ accessCode, userId, questionUid: correctAnswersPayload.questionUid }, '[JOIN_GAME] Emitted correct_answers to student on join (trophy active)');
                }
            }
            // Emit updated participant count to teacher dashboard
            await (0, participantCountUtils_1.emitParticipantCount)(io, accessCode);
            // MODERNIZATION: Emit unified participant list for lobby display
            await (0, lobbyHandler_1.emitParticipantList)(io, accessCode);
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
                    score: isDeferred ? (p.deferredScore ?? 0) : (p.liveScore ?? 0),
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
            const errorPayload = { message: 'Internal error joining game.' };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
        }
    };
}
