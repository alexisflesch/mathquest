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
import { GameParticipant, ParticipantStatus } from '@shared/types/core/participant';
import { LobbyParticipant } from '@shared/types/lobbyParticipantListPayload';
import { z } from 'zod';

// Modern unified participant payload
interface UnifiedParticipantListPayload {
    participants: GameParticipant[];
    creator: GameParticipant;
}

// Create a handler-specific logger
const logger = createLogger('LobbyHandler');

// Redis key prefixes
const LOBBY_KEY_PREFIX = 'mathquest:lobby:';

// Store intervals for game status checking
const gameStatusCheckIntervals = new Map<string, NodeJS.Timeout>();

// Modern unified participant payload
interface UnifiedParticipantListPayload {
    participants: GameParticipant[];
    creator: GameParticipant;
}

export async function emitParticipantList(io: SocketIOServer, accessCode: string) {
    try {
        logger.info({ accessCode }, '[PARTICIPANT_LIST] Starting to emit participant list');

        // Get all participants (both PENDING and ACTIVE) from database
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: {
                id: true,
                initiatorUserId: true,
                participants: {
                    where: {
                        status: {
                            in: [ParticipantStatus.PENDING, ParticipantStatus.ACTIVE]
                        }
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarEmoji: true
                            }
                        }
                    }
                }
            }
        });

        if (!gameInstance) {
            logger.warn({ accessCode }, '[PARTICIPANT_LIST] Game instance not found when emitting participant list');
            return;
        }

        logger.info({
            accessCode,
            participantCount: gameInstance.participants.length,
            participants: gameInstance.participants.map(p => ({
                userId: p.userId,
                username: p.user.username,
                status: p.status
            }))
        }, '[PARTICIPANT_LIST] Found participants in database');

        // Map to unified GameParticipant format
        const participants: GameParticipant[] = gameInstance.participants.map(p => ({
            id: p.id,
            userId: p.userId,
            username: p.user.username,
            avatarEmoji: p.user.avatarEmoji || '🐼',
            score: p.liveScore + p.deferredScore, // Combined score
            status: p.status as ParticipantStatus, // Cast Prisma enum to shared enum
            joinedAt: p.joinedAt.getTime(),
            attemptCount: p.nbAttempts,
            online: true // Assume online if they're in PENDING or ACTIVE status
        }));

        // Find creator participant
        const creator = participants.find(p => p.userId === gameInstance.initiatorUserId);

        if (!creator) {
            logger.warn({ accessCode, creatorId: gameInstance.initiatorUserId }, '[PARTICIPANT_LIST] Creator not found in participants list');
            return;
        }

        // For now, send in the format the frontend expects (LobbyParticipantListPayload)
        // TODO: Update frontend to handle UnifiedParticipantListPayload
        const lobbyPayload = {
            participants: participants.map(p => ({
                userId: p.userId,
                username: p.username,
                avatarEmoji: p.avatarEmoji
            })),
            creator: {
                userId: creator.userId,
                username: creator.username,
                avatarEmoji: creator.avatarEmoji
            }
        };

        logger.info({
            accessCode,
            participantCount: participants.length,
            lobbyPayload
        }, '[PARTICIPANT_LIST] Emitting lobby-compatible participant list');

        // Emit to both lobby and live rooms using canonical event name
        io.to(`lobby_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANTS_LIST, lobbyPayload);
        io.to(`game_${accessCode}`).emit(LOBBY_EVENTS.PARTICIPANTS_LIST, lobbyPayload);

        logger.info({
            accessCode,
            roomNames: [`lobby_${accessCode}`, `game_${accessCode}`]
        }, '[PARTICIPANT_LIST] Emitted participant list to rooms');

    } catch (error) {
        logger.error({ error, accessCode }, '[PARTICIPANT_LIST] Error emitting participant list');
    }
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
    // MODERNIZATION NOTE: Legacy Redis-based lobby handlers have been disabled
    // in favor of the unified database approach using join_game event.
    // 
    // The modernized flow:
    // 1. Users call join_game event (handled in joinGame.ts)
    // 2. Backend creates participants with PENDING status in database
    // 3. emitParticipantList() queries database and emits unified participant data
    // 4. Frontend displays lobby using gameState.gameStatus === 'pending'
    //
    // This eliminates the duplicate participant tracking issue while maintaining
    // all lobby functionality.

    logger.info({ socketId: socket.id }, 'Legacy lobby handlers disabled - using unified join_game flow');

    // Emit error for any legacy lobby event usage
    socket.on(LOBBY_EVENTS.JOIN_LOBBY, (payload) => {
        socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
            error: 'deprecated_event',
            message: 'join_lobby is deprecated. Use join_game event instead.'
        });
    });

    socket.on(LOBBY_EVENTS.LEAVE_LOBBY, (payload) => {
        socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
            error: 'deprecated_event',
            message: 'leave_lobby is deprecated. Use leave_game event instead.'
        });
    });

    socket.on(LOBBY_EVENTS.GET_PARTICIPANTS, (payload) => {
        socket.emit(LOBBY_EVENTS.LOBBY_ERROR, {
            error: 'deprecated_event',
            message: 'get_participants is deprecated. Participants are sent automatically via participants_list event.'
        });
    });
}

/**
 * The setupGameStatusCheck function has been removed in favor of event-driven
 * game start notifications. When a tournament starts via the start_tournament event,
 * it directly emits redirect events to lobby participants instead of polling.
 */
