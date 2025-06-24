import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import { ScoringService } from '../scoringService';
import { assignJoinOrderBonus } from '@/utils/joinOrderBonus';
import { addUserToSnapshot } from './leaderboardSnapshotService';
import { getIO } from '@/sockets';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { ProjectionLeaderboardUpdatePayloadSchema } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import type { ServerToClientEvents } from '@shared/types/socketEvents';
// Use relative import for types to avoid tsconfig path issues
import type { GameInstance, GameParticipantRecord } from '@shared/types/core/game';
import type { LeaderboardEntry } from '@shared/types/core/participant';
import { ParticipationType } from '@shared/types/core/participant';

const logger = createLogger('GameParticipantJoinService');

/**
 * Join a game using access code (refactored from GameParticipantService)
 * Handles both LIVE and DEFERRED participation logic.
 */
export async function joinGame({ userId, accessCode, username, avatarEmoji }: {
    userId: string;
    accessCode: string;
    username?: string;
    avatarEmoji?: string;
}) {
    try {
        // Find the game instance
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: {
                id: true,
                name: true,
                status: true,
                playMode: true,
                isDiffered: true,
                differedAvailableFrom: true,
                differedAvailableTo: true,
                gameTemplate: { select: { name: true } }
            }
        });
        if (!gameInstance) {
            return { success: false, error: 'Game not found' };
        }
        // If completed, check deferred access rules
        if (gameInstance.status === 'completed') {
            const allowDeferred = gameInstance.playMode === 'tournament';
            if (!allowDeferred) {
                logger.info({ userId, accessCode, playMode: gameInstance.playMode }, 'Attempt to join completed game - deferred mode not allowed for this playMode');
                return { success: false, error: 'Game is already completed' };
            }
            // For tournaments, check time window if set
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            if (from && now < from) return { success: false, error: 'Tournament not available yet' };
            if (to && now > to) return { success: false, error: 'Tournament no longer available' };
        }
        // Determine participation type
        const participationType = gameInstance.status === 'completed' ? 'DEFERRED' : 'LIVE';
        let participant;
        // Upsert user
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                username: username || `guest-${userId.substring(0, 8)}`,
                role: 'STUDENT',
                avatarEmoji: avatarEmoji || null,
                studentProfile: { create: { cookieId: `cookie-${userId}` } }
            }
        });
        // --- JOIN BONUS SNAPSHOT LOGIC ---
        // Only apply join bonus if this is a new participant (not reconnection)
        const joinOrderBonus = await assignJoinOrderBonus(accessCode, userId);
        if (joinOrderBonus > 0) {
            const leaderboardUser: Omit<LeaderboardEntry, 'rank'> = {
                userId,
                username: username || `guest-${userId.substring(0, 8)}`,
                avatarEmoji: avatarEmoji || undefined,
                score: joinOrderBonus,
                participationType: participationType as ParticipationType,
                attemptCount: 1,
                participationId: undefined
            };
            // Add to snapshot and emit to projection page via socket
            const updatedSnapshot = await addUserToSnapshot(accessCode, leaderboardUser, joinOrderBonus);
            // Emit to projection room if snapshot was updated
            if (updatedSnapshot) {
                const io = getIO();
                if (io) {
                    const projectionRoom = `projection_${gameInstance.id}`;
                    const payload = { leaderboard: updatedSnapshot };
                    // Validate payload with Zod before emitting
                    const parseResult = ProjectionLeaderboardUpdatePayloadSchema.safeParse(payload);
                    if (parseResult.success) {
                        io.to(projectionRoom)
                            .emit('projection_leaderboard_update', payload);
                        logger.info({ accessCode, projectionRoom, leaderboardCount: updatedSnapshot.length }, '[LEADERBOARD] Emitted updated snapshot to projection room');
                    } else {
                        logger.error({ accessCode, issues: parseResult.error.issues }, '[LEADERBOARD] Invalid leaderboard snapshot payload, not emitted');
                    }
                } else {
                    logger.warn({ accessCode }, '[LEADERBOARD] Socket.IO instance not available, cannot emit leaderboard snapshot');
                }
            }
        }
        if (participationType === 'LIVE') {
            // Check for existing participant
            const existingLive = await prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId, participationType: 'LIVE' },
                include: { user: true }
            });
            if (existingLive) {
                logger.info({ userId, accessCode, participantId: existingLive.id, participationType: 'LIVE', reused: true }, 'Reusing existing LIVE participant');
                participant = existingLive;
            } else {
                const newParticipant = await prisma.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId,
                        joinedAt: new Date(),
                        score: 0,
                        participationType: 'LIVE',
                        attemptCount: 1
                    }
                });
                participant = await prisma.gameParticipant.findUnique({ where: { id: newParticipant.id }, include: { user: true } });
                logger.info({ userId, accessCode, participantId: participant?.id, participationType: 'LIVE', reused: false }, 'Created new LIVE participant');
            }
        } else {
            // DEFERRED logic
            const existingDeferred = await prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId, participationType: 'DEFERRED' },
                include: { user: true }
            });
            if (existingDeferred) {
                participant = await prisma.gameParticipant.update({
                    where: { id: existingDeferred.id },
                    data: { joinedAt: new Date(), score: 0, attemptCount: { increment: 1 } },
                    include: { user: true }
                });
                logger.info({
                    userId,
                    accessCode,
                    participantId: participant.id,
                    participationType: participant.participationType,
                    attemptCount: participant.attemptCount,
                    resetScore: participant.score,
                    logPoint: 'DEFERRED_PARTICIPANT_EXISTING_UPDATED'
                }, 'Updated existing DEFERRED participant for new attempt');
            } else {
                const newParticipant = await prisma.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId,
                        joinedAt: new Date(),
                        score: 0,
                        participationType: 'DEFERRED',
                        attemptCount: 1
                    }
                });
                participant = await prisma.gameParticipant.findUnique({ where: { id: newParticipant.id }, include: { user: true } });
                logger.info({
                    userId,
                    accessCode,
                    participantId: participant?.id,
                    participationType: 'DEFERRED',
                    attemptCount: participant?.attemptCount,
                    logPoint: 'DEFERRED_PARTICIPANT_CREATED'
                }, 'Created new DEFERRED participant');
            }
        }
        return { success: true, gameInstance, participant };
    } catch (error) {
        logger.error({ error, userId, accessCode }, 'Error joining game');
        return { success: false, error: 'An error occurred while joining the game' };
    }
}