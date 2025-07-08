import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { joinRoom, leaveRoom, getRoomMembers, broadcastToRoom } from '@/sockets/utils/roomUtils';
import { emitParticipantCount } from '@/sockets/utils/participantCountUtils';
import { assignJoinOrderBonus } from '@/utils/joinOrderBonus';
import { broadcastLeaderboardToProjection } from '@/utils/projectionLeaderboardBroadcast';
import { LOBBY_EVENTS } from '@shared/types/socket/events';
import type {
    ErrorPayload,
    JoinLobbyPayload,
    LeaveLobbyPayload,
    GetParticipantsPayload
} from '@shared/types/socketEvents';
import {
    joinLobbyPayloadSchema,
    leaveLobbyPayloadSchema,
    getParticipantsPayloadSchema
} from '@shared/types/socketEvents.zod';
import { lobbyParticipantListPayloadSchema, LobbyParticipantListPayload } from '@shared/types/lobbyParticipantListPayload';
import { z } from 'zod';

// Create a handler-specific logger
const logger = createLogger('LobbyHandler');

// Redis key prefixes
const LOBBY_KEY_PREFIX = 'mathquest:lobby:';

// Store intervals for game status checking
const gameStatusCheckIntervals = new Map<string, NodeJS.Timeout>();

// Backend-specific lobby participant type (different from shared type)
export interface LobbyParticipant {
    id: string;           // Socket ID
    userId: string;       // Player ID from database
    username: string;     // Display name
    avatarEmoji?: string; // Emoji avatar
    joinedAt: number;     // Timestamp when joined
}

function emitParticipantList(io: SocketIOServer, accessCode: string, participants: LobbyParticipant[], creator: { avatarEmoji: string, username: string, userId: string }) {
    // Map to canonical payload
    const payload: LobbyParticipantListPayload = {
        participants: participants.map(p => ({
            avatarEmoji: p.avatarEmoji || '🐼',
            username: p.username,
            userId: p.userId
        })),
        creator
    };
    // Validate with Zod
    const parseResult = lobbyParticipantListPayloadSchema.safeParse(payload);
    if (!parseResult.success) {
        // Log error, but still emit for now
        console.error('Invalid participant_list payload', parseResult.error.format(), payload);
    }
    io.to(`lobby_${accessCode}`).emit('participant_list', payload);
}

/**
 * Setup periodic game status checking for a lobby
 * This checks if the game has become active and notifies participants
 */
function setupGameStatusCheck(io: SocketIOServer, accessCode: string): void {
    // Clear any existing interval for this access code
    const existingInterval = gameStatusCheckIntervals.get(accessCode);
    if (existingInterval) {
        clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
        try {
            // Check if game is now active
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { id: true, status: true, name: true }
            });

            if (!gameInstance) {
                // Game doesn't exist anymore, clear the interval
                clearInterval(interval);
                gameStatusCheckIntervals.delete(accessCode);
                return;
            }

            if (gameInstance.status === 'active') {
                logger.info({ accessCode, gameId: gameInstance.id }, 'Game became active, notifying lobby participants');

                // Emit redirect event to all lobby participants
                io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.REDIRECT_TO_GAME, {
                    accessCode,
                    gameId: gameInstance.id
                }); // TODO: Define shared type if missing

                // Also emit game_started event
                io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.GAME_STARTED, {
                    accessCode,
                    gameId: gameInstance.id
                }); // TODO: Define shared type if missing

                // Clear the interval since game is now active
                clearInterval(interval);
                gameStatusCheckIntervals.delete(accessCode);
            }
        } catch (error) {
            logger.error({ error, accessCode }, 'Error checking game status');
        }
    }, 2000); // Check every 2 seconds

    gameStatusCheckIntervals.set(accessCode, interval);
    logger.info({ accessCode }, 'Setup game status checking for lobby');
}

/**
 * Stop game status checking for a lobby
 */
function stopGameStatusCheck(accessCode: string): void {
    const interval = gameStatusCheckIntervals.get(accessCode);
    if (interval) {
        clearInterval(interval);
        gameStatusCheckIntervals.delete(accessCode);
        logger.info({ accessCode }, 'Stopped game status checking for lobby');
    }
}

/**
 * Register all lobby-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerLobbyHandlers(io: SocketIOServer, socket: Socket): void {
    // Join a game lobby
    socket.on(LOBBY_EVENTS.JOIN_LOBBY, async (payload: JoinLobbyPayload) => {
        // Runtime validation with Zod
        const parseResult = joinLobbyPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid joinLobby payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid joinLobby payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, errorPayload);
            return;
        }

        const { accessCode, userId: payloadUserId, username: payloadUsername, avatarEmoji: payloadAvatarEmoji } = parseResult.data;

        // Support both authenticated users (socket.data.user) and guest users (payload)
        const userId = socket.data.user?.userId || payloadUserId;
        const username = socket.data.user?.username || payloadUsername;
        const avatarEmoji = socket.data.user?.avatarEmoji || payloadAvatarEmoji;

        logger.info({
            accessCode,
            userId,
            username,
            socketId: socket.id,
            isAuthenticated: !!socket.data.user,
            source: socket.data.user ? 'socket.data.user' : 'payload',
            payloadData: { payloadUserId, payloadUsername, payloadAvatarEmoji },
            socketData: socket.data.user
        }, '🔍 [LOBBY-JOIN] Player joining lobby - username sources');

        if (!userId || !username) {
            logger.error({
                accessCode,
                socketId: socket.id,
                payloadUserId,
                payloadUsername,
                socketDataUser: socket.data.user
            }, 'User details not found in both socket data and payload for join_lobby');
            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                error: 'authentication_error',
                message: 'User details not available. Provide userId and username in payload for guest users.'
            });
            return;
        }

        try {
            // Verify the game exists and check its status
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    status: true,
                    name: true,
                    gameTemplateId: true,
                    playMode: true,
                    initiatorUserId: true
                }
            });

            if (!gameInstance) {
                logger.warn({ accessCode, socketId: socket.id }, 'Game not found during join_lobby');
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_found',
                    message: 'Game not found with the provided access code.'
                });
                return;
            }

            // Check if game is in a joinable state
            if (gameInstance.status !== 'pending' && gameInstance.status !== 'active') {
                logger.info({ accessCode, gameStatus: gameInstance.status, socketId: socket.id }, 'Game not joinable');
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_joinable',
                    message: `Cannot join game in '${gameInstance.status}' status.`
                });
                return;
            }

            // If game is already active, send redirect immediately
            if (gameInstance.status === 'active') {
                logger.info({ accessCode, socketId: socket.id }, 'Game already active, sending redirect');
                socket.emit(LOBBY_EVENTS.REDIRECT_TO_GAME, { accessCode, gameId: gameInstance.id });

                // Still join the lobby room temporarily to receive any announcements
                await joinRoom(socket, `lobby_${accessCode}`, {
                    userId,
                    username,
                    avatarEmoji,
                    redirected: true
                });

                return;
            }

            // Get current participants list BEFORE joining to check for duplicates
            const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const existingParticipants: LobbyParticipant[] = participantsHash ?
                Object.values(participantsHash).map(p => JSON.parse(p as string)) : [];

            // Check if this user is already in the lobby (by userId) and remove ALL instances
            const existingParticipantsForUser = existingParticipants.filter(p => p.userId === userId);
            let isReconnection = existingParticipantsForUser.length > 0;

            if (existingParticipantsForUser.length > 0) {
                logger.info({
                    existingSocketIds: existingParticipantsForUser.map(p => p.id),
                    newSocketId: socket.id,
                    userId,
                    accessCode,
                    count: existingParticipantsForUser.length
                }, 'Removing existing participant connections for user');

                // Remove ALL old socket connections for this user
                for (const existingParticipant of existingParticipantsForUser) {
                    await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, existingParticipant.id);
                    // Notify that each old participant left
                    // socket.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANT_LEFT, { id: existingParticipant.id }); // Modernized: handled by participant_list
                }
            }

            // Now join the lobby room
            await joinRoom(socket, `lobby_${accessCode}`, {
                userId,
                username,
                avatarEmoji,
                joinedAt: Date.now()
            });

            // Set socket data for disconnect handler
            socket.data.userId = userId;
            socket.data.accessCode = accessCode;

            // Store new participant data in Redis
            const participant: LobbyParticipant = {
                id: socket.id,
                userId, // Use userId from socket.data.user or payload
                username, // Use username from socket.data.user or payload
                avatarEmoji: avatarEmoji || '🐼', // Use avatarEmoji from socket.data.user, payload, or default to panda
                joinedAt: Date.now()
            };

            logger.debug({
                accessCode,
                socketId: socket.id,
                participant,
                originalUsername: username,
                originalUserId: userId,
                originalAvatarEmoji: avatarEmoji
            }, '🔍 [LOBBY-JOIN] Creating participant object for Redis storage');

            await redisClient.hset(
                `${LOBBY_KEY_PREFIX}${accessCode}`,
                socket.id,
                JSON.stringify(participant)
            );

            // Get updated participants list and deduplicate by userId
            const updatedParticipantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const allParticipants: LobbyParticipant[] = Object.values(updatedParticipantsHash)
                .map(p => JSON.parse(p as string));

            // Final deduplication by userId - keep the most recent joinedAt for each userId
            const uniqueParticipants = new Map<string, LobbyParticipant>();
            for (const participant of allParticipants) {
                const existing = uniqueParticipants.get(participant.userId);
                if (!existing || participant.joinedAt > existing.joinedAt) {
                    uniqueParticipants.set(participant.userId, participant);
                }
            }
            const participants = Array.from(uniqueParticipants.values());

            // Clean up any duplicate entries in Redis
            const validSocketIds = new Set(participants.map(p => p.id));
            for (const participant of allParticipants) {
                if (!validSocketIds.has(participant.id)) {
                    await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, participant.id);
                    logger.info({
                        removedSocketId: participant.id,
                        userId: participant.userId,
                        accessCode
                    }, 'Cleaned up duplicate participant entry');
                }
            }


            // Find creator by matching userId to gameInstance.initiatorUserId, fallback to first participant
            let creator = null;
            if (gameInstance.initiatorUserId) {
                // Always fetch the true creator from the DB, even if not present in participants
                const creatorUser = await prisma.user.findUnique({
                    where: { id: gameInstance.initiatorUserId },
                    select: { id: true, username: true, avatarEmoji: true }
                });
                if (creatorUser) {
                    creator = {
                        avatarEmoji: creatorUser.avatarEmoji || '🐼',
                        username: creatorUser.username,
                        userId: creatorUser.id
                    };
                } else {
                    creator = {
                        avatarEmoji: '🐼',
                        username: 'Unknown',
                        userId: gameInstance.initiatorUserId
                    };
                }
            }
            if (creator) {
                emitParticipantList(io, accessCode, participants, creator);
            }

            // Emit updated participant count to teacher dashboard
            await emitParticipantCount(io, accessCode);

            // UX ENHANCEMENT: For quiz mode, populate projection leaderboard when students join lobby
            // This allows teachers to see who's ready before starting the quiz
            if (gameInstance.playMode === 'quiz' && !isReconnection) {
                try {
                    // Assign join-order bonus for early lobby joiners
                    const joinOrderBonus = await assignJoinOrderBonus(accessCode, userId);

                    if (joinOrderBonus > 0) {
                        // Add participant to game participants with join-order bonus
                        // This creates a "pre-game" leaderboard entry for immediate display
                        const participantsKey = `mathquest:game:participants:${accessCode}`;
                        const leaderboardKey = `mathquest:game:leaderboard:${accessCode}`; const participantDataForGame = {
                            id: `lobby_${socket.id}`, // Temporary ID for lobby participants
                            userId: participant.userId,
                            username: participant.username,
                            score: joinOrderBonus, // Micro-score for join order
                            avatarEmoji: participant.avatarEmoji,
                            joinedAt: new Date().toISOString(),
                            online: true,
                            socketId: socket.id,
                            isLobbyParticipant: true // Flag to distinguish from actual game participants
                        };

                        logger.debug({
                            accessCode,
                            userId: participant.userId,
                            participantDataForGame,
                            originalParticipant: participant,
                            usernameSource: username,
                            payloadUsernameSource: payloadUsername,
                            socketDataUsername: socket.data.user?.username
                        }, '🔍 [LOBBY-LEADERBOARD] Participant data being stored in Redis');

                        // Store in game participants for leaderboard calculation
                        await redisClient.hset(participantsKey, participant.userId, JSON.stringify(participantDataForGame));

                        // Add to leaderboard sorted set
                        await redisClient.zadd(leaderboardKey, joinOrderBonus, participant.userId);

                        // Set expiration for lobby participants (clean up after 4 hours)
                        await redisClient.expire(participantsKey, 4 * 60 * 60);
                        await redisClient.expire(leaderboardKey, 4 * 60 * 60);

                        // Broadcast updated leaderboard to projection room
                        await broadcastLeaderboardToProjection(io, accessCode, gameInstance.id);

                        logger.info({
                            accessCode,
                            gameId: gameInstance.id,
                            userId: participant.userId,
                            username: participant.username,
                            joinOrderBonus,
                            playMode: gameInstance.playMode
                        }, 'Quiz lobby join: Added participant to leaderboard with join-order bonus');
                    }
                } catch (error) {
                    logger.error({
                        error,
                        accessCode,
                        userId: participant.userId,
                        playMode: gameInstance.playMode
                    }, 'Error updating leaderboard for quiz lobby join');
                }
            }

            // Setup periodic game status checking
            setupGameStatusCheck(io, accessCode);

            // Note: Game status change notifications are now handled by the event-driven
            // tournament start mechanism instead of polling

        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in join_lobby handler');
            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                error: 'internal_error',
                message: 'An internal error occurred while joining the lobby.'
            });
        }
    });

    // Leave a game lobby
    socket.on(LOBBY_EVENTS.LEAVE_LOBBY, async (payload: LeaveLobbyPayload) => {
        // Runtime validation with Zod
        const parseResult = leaveLobbyPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid leaveLobby payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid leaveLobby payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, errorPayload);
            return;
        }

        const { accessCode } = parseResult.data;
        logger.info({ accessCode, socketId: socket.id }, 'Player leaving lobby');

        try {

            // Leave the lobby room
            await leaveRoom(socket, `lobby_${accessCode}`);

            // Clear socket data
            delete socket.data.accessCode;
            if (socket.data.userId) {
                delete socket.data.userId;
            }

            // Remove from Redis
            await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, socket.id);

            // Get updated participants list and deduplicate
            const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const allParticipants: LobbyParticipant[] = Object.values(participantsHash)
                .map(p => JSON.parse(p as string));

            // Deduplicate by userId - keep the most recent joinedAt for each userId
            const uniqueParticipants = new Map<string, LobbyParticipant>();
            for (const participant of allParticipants) {
                const existing = uniqueParticipants.get(participant.userId);
                if (!existing || participant.joinedAt > existing.joinedAt) {
                    uniqueParticipants.set(participant.userId, participant);
                }
            }
            const participants = Array.from(uniqueParticipants.values());

            // Clean up any duplicate entries in Redis
            const validSocketIds = new Set(participants.map(p => p.id));
            for (const participant of allParticipants) {
                if (!validSocketIds.has(participant.id)) {
                    await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, participant.id);
                }
            }

            // Always fetch canonical creator from DB using gameInstance.initiatorUserId
            let creator = null;
            // Fetch gameInstance for this accessCode
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { initiatorUserId: true }
            });
            if (gameInstance && gameInstance.initiatorUserId) {
                const creatorUser = await prisma.user.findUnique({
                    where: { id: gameInstance.initiatorUserId },
                    select: { id: true, username: true, avatarEmoji: true }
                });
                if (creatorUser) {
                    creator = {
                        avatarEmoji: creatorUser.avatarEmoji || '🐼',
                        username: creatorUser.username,
                        userId: creatorUser.id
                    };
                } else {
                    creator = {
                        avatarEmoji: '🐼',
                        username: 'Unknown',
                        userId: gameInstance.initiatorUserId
                    };
                }
            }
            emitParticipantList(io, accessCode, participants, creator!);

            // Emit the updated participant count to all clients in the lobby
            await emitParticipantCount(io, accessCode);

            // Stop game status checking for this lobby
            stopGameStatusCheck(accessCode);

        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in leave_lobby handler');
        }
    });

    // Request current participants list
    socket.on(LOBBY_EVENTS.GET_PARTICIPANTS, async (payload: GetParticipantsPayload) => {
        // Runtime validation with Zod
        const parseResult = getParticipantsPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid getParticipants payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid getParticipants payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, errorPayload);
            return;
        }

        const { accessCode } = parseResult.data;
        logger.debug({ accessCode, socketId: socket.id }, 'Getting lobby participants');

        try {
            // Make sure socket is joined to the lobby room
            if (!socket.rooms.has(`lobby_${accessCode}`)) {
                await joinRoom(socket, `lobby_${accessCode}`, {
                    message: 'Joined during get_participants request'
                });
            }

            // Get game details (including initiatorUserId)
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: { id: true, name: true, status: true, playMode: true, initiatorUserId: true }
            });

            if (!gameInstance) {
                socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                    error: 'game_not_found',
                    message: 'Game not found'
                });
                return;
            }

            // Get participants list
            const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
            const allParticipants: LobbyParticipant[] = participantsHash ?
                Object.values(participantsHash).map(p => JSON.parse(p as string)) : [];

            // Deduplicate by userId - keep the most recent joinedAt for each userId
            const uniqueParticipants = new Map<string, LobbyParticipant>();
            for (const participant of allParticipants) {
                const existing = uniqueParticipants.get(participant.userId);
                if (!existing || participant.joinedAt > existing.joinedAt) {
                    uniqueParticipants.set(participant.userId, participant);
                }
            }
            const participants = Array.from(uniqueParticipants.values());

            // Clean up any duplicate entries in Redis in the background
            const validSocketIds = new Set(participants.map(p => p.id));
            for (const participant of allParticipants) {
                if (!validSocketIds.has(participant.id)) {
                    redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, participant.id).catch(err => {
                        logger.warn({ error: err, accessCode, socketId: participant.id },
                            'Failed to clean up duplicate participant');
                    });
                }
            }


            // Find creator (for now: first participant in list)
            // Always fetch canonical creator from DB using gameInstance.initiatorUserId
            let creator = null;
            if (gameInstance && gameInstance.initiatorUserId) {
                const creatorUser = await prisma.user.findUnique({
                    where: { id: gameInstance.initiatorUserId },
                    select: { id: true, username: true, avatarEmoji: true }
                });
                if (creatorUser) {
                    creator = {
                        avatarEmoji: creatorUser.avatarEmoji || '🐼',
                        username: creatorUser.username,
                        userId: creatorUser.id
                    };
                } else {
                    creator = {
                        avatarEmoji: '🐼',
                        username: 'Unknown',
                        userId: gameInstance.initiatorUserId
                    };
                }
            }
            socket.emit('participant_list', {
                participants: participants.map(p => ({
                    avatarEmoji: p.avatarEmoji || '🐼',
                    username: p.username,
                    userId: p.userId
                })),
                creator
            });

        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, 'Error in get_participants handler');
            socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
                error: 'internal_error',
                message: 'Error retrieving participants list'
            });
        }
    });

    // Handle disconnects
    socket.on('disconnecting', async () => {
        try {
            // Store the socket ID before disconnection
            const socketId = socket.id;

            // Check Redis connection before proceeding
            if (redisClient.status === 'end') {
                logger.warn({ socketId }, 'Redis connection closed, skipping lobby disconnect handling');
                return;
            }

            // Check if socket is in any lobby rooms
            for (const room of Array.from(socket.rooms)) {
                if (room.startsWith('lobby_')) {
                    const accessCode = room.replace('lobby_', '');
                    logger.info({ accessCode, socketId }, 'Socket disconnecting from lobby');

                    try {
                        // Get current participants to find this socket's participant data
                        const participantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
                        const participants: LobbyParticipant[] = participantsHash ?
                            Object.values(participantsHash).map(p => JSON.parse(p as string)) : [];

                        // Find the participant data for this socket
                        const disconnectingParticipant = participants.find(p => p.id === socketId);

                        // Remove from Redis
                        await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, socketId);

                        // Get updated participants list and deduplicate
                        const updatedParticipantsHash = await redisClient.hgetall(`${LOBBY_KEY_PREFIX}${accessCode}`);
                        const allUpdatedParticipants: LobbyParticipant[] = updatedParticipantsHash ?
                            Object.values(updatedParticipantsHash).map(p => JSON.parse(p as string)) : [];

                        // Deduplicate by userId - keep the most recent joinedAt for each userId
                        const uniqueParticipants = new Map<string, LobbyParticipant>();
                        for (const participant of allUpdatedParticipants) {
                            const existing = uniqueParticipants.get(participant.userId);
                            if (!existing || participant.joinedAt > existing.joinedAt) {
                                uniqueParticipants.set(participant.userId, participant);
                            }
                        }
                        const updatedParticipants = Array.from(uniqueParticipants.values());

                        // Clean up any duplicate entries in Redis
                        const validSocketIds = new Set(updatedParticipants.map(p => p.id));
                        for (const participant of allUpdatedParticipants) {
                            if (!validSocketIds.has(participant.id)) {
                                await redisClient.hdel(`${LOBBY_KEY_PREFIX}${accessCode}`, participant.id);
                            }
                        }


                        // Find creator (for now: first participant in list)
                        // Always fetch canonical creator from DB using gameInstance.initiatorUserId
                        let creator = null;
                        // Fetch gameInstance for this accessCode
                        const gameInstance = await prisma.gameInstance.findUnique({
                            where: { accessCode },
                            select: { initiatorUserId: true }
                        });
                        if (gameInstance && gameInstance.initiatorUserId) {
                            const creatorUser = await prisma.user.findUnique({
                                where: { id: gameInstance.initiatorUserId },
                                select: { id: true, username: true, avatarEmoji: true }
                            });
                            if (creatorUser) {
                                creator = {
                                    avatarEmoji: creatorUser.avatarEmoji || '🐼',
                                    username: creatorUser.username,
                                    userId: creatorUser.id
                                };
                            } else {
                                creator = {
                                    avatarEmoji: '🐼',
                                    username: 'Unknown',
                                    userId: gameInstance.initiatorUserId
                                };
                            }
                        }
                        emitParticipantList(io, accessCode, updatedParticipants, creator!);

                        // Emit the updated participant count to all clients in the lobby
                        await emitParticipantCount(io, accessCode);

                        if (disconnectingParticipant) {
                            logger.info({
                                accessCode,
                                socketId,
                                userId: disconnectingParticipant.userId,
                                username: disconnectingParticipant.username
                            }, 'Participant disconnected from lobby');
                        }
                    } catch (redisError) {
                        logger.error({ error: redisError, accessCode, socketId }, 'Redis error during lobby disconnect handling');
                        // Still emit participant_left event even if Redis fails
                        // io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANT_LEFT, { id: socketId }); // Modernized: handled by participant_list
                    }
                }
            }
        } catch (error) {
            logger.error({ error, socketId: socket.id }, 'Error handling disconnect from lobby');
        }
    });
}

/**
 * The setupGameStatusCheck function has been removed in favor of event-driven
 * game start notifications. When a tournament starts via the start_tournament event,
 * it directly emits redirect events to lobby participants instead of polling.
 */
