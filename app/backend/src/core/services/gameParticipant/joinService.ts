
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
import { ParticipationType, ParticipantStatus } from '@shared/types/core/participant';
import { hasOngoingDeferredSession } from './deferredTimerUtils';

const logger = createLogger('GameParticipantJoinService');

/**
 * Join a game using access code (UNIFIED JOIN FLOW)
 * Handles both lobby (pending) and live (active) game joining with a single participant record per user/game.
 */
export async function joinGame({ userId, accessCode, username, avatarEmoji }: {
    userId: string;
    accessCode: string;
    username?: string;
    avatarEmoji?: string;
}) {
    try {
        logger.info({ userId, accessCode, username, avatarEmoji, logPoint: 'JOIN_GAME_UNIFIED_ENTRY' }, '[LOG] Unified joinGame called');

        // Find the game instance
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: {
                id: true,
                name: true,
                status: true,
                playMode: true,
                differedAvailableFrom: true,
                differedAvailableTo: true,
                gameTemplate: { select: { name: true } }
            }
        });

        if (!gameInstance) {
            return { success: false, error: 'Game not found' };
        }

        // FIXED: A game is deferred when status is 'completed' and available for replay
        const isDeferred = gameInstance.status === 'completed';

        // Check deferred mode availability
        if (isDeferred) {
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            if (from && now < from) return { success: false, error: 'Tournament not available yet' };
            if (to && now > to) return { success: false, error: 'Tournament no longer available' };
        }

        // Determine participant status based on game state
        const participantStatus = gameInstance.status === 'pending' ? ParticipantStatus.PENDING : ParticipantStatus.ACTIVE;

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

        // --- UNIFIED PARTICIPANT LOGIC ---
        // Use transaction to prevent race conditions and ensure unique constraint
        const participant = await prisma.$transaction(async (tx) => {
            // Check for existing participant (unique constraint: gameInstanceId + userId)
            const existing = await tx.gameParticipant.findUnique({
                where: {
                    gameInstanceId_userId: {
                        gameInstanceId: gameInstance.id,
                        userId
                    }
                },
                include: { user: true }
            });

            if (existing) {
                // Update existing participant
                if (isDeferred) {
                    // For deferred mode: check if they have an ongoing session
                    const hasOngoing = await hasOngoingDeferredSession({
                        accessCode,
                        userId,
                        attemptCount: existing.nbAttempts
                    });

                    if (!hasOngoing) {
                        // New deferred attempt: increment nbAttempts, reset deferredScore
                        const updated = await tx.gameParticipant.update({
                            where: { id: existing.id },
                            data: {
                                nbAttempts: existing.nbAttempts + 1,
                                deferredScore: 0,
                                status: ParticipantStatus.ACTIVE,
                                lastActiveAt: new Date()
                            },
                            include: { user: true }
                        });
                        logger.info({ userId, accessCode, participantId: existing.id, newAttempts: updated.nbAttempts }, 'Incremented deferred attempts for new session');
                        return updated;
                    } else {
                        // Ongoing session: just update status and lastActiveAt
                        const updated = await tx.gameParticipant.update({
                            where: { id: existing.id },
                            data: {
                                status: ParticipantStatus.ACTIVE,
                                lastActiveAt: new Date()
                            },
                            include: { user: true }
                        });
                        logger.info({ userId, accessCode, participantId: existing.id }, 'Reconnected to ongoing deferred session');
                        return updated;
                    }
                } else {
                    // Live/pending mode: update status based on game state
                    const updated = await tx.gameParticipant.update({
                        where: { id: existing.id },
                        data: {
                            status: participantStatus,
                            lastActiveAt: new Date()
                        },
                        include: { user: true }
                    });
                    logger.info({ userId, accessCode, participantId: existing.id, status: participantStatus }, 'Updated existing participant status');
                    return updated;
                }
            } else {
                // Create new participant
                const newParticipant = await tx.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId,
                        status: isDeferred ? ParticipantStatus.ACTIVE : participantStatus,
                        nbAttempts: 1,
                        liveScore: 0,
                        deferredScore: 0,
                        lastActiveAt: new Date()
                    },
                    include: { user: true }
                });
                logger.info({
                    userId,
                    accessCode,
                    participantId: newParticipant.id,
                    status: newParticipant.status,
                    isDeferred
                }, 'Created new unified participant');
                return newParticipant;
            }
        });

        // --- JOIN BONUS SNAPSHOT LOGIC ---
        // Only apply join bonus for live/pending participants (not deferred reconnections)
        logger.info({
            userId,
            accessCode,
            isDeferred,
            participantStatus: participant.status,
            joinBonusCondition: !isDeferred && participant.status === ParticipantStatus.PENDING,
            gameInstanceStatus: gameInstance.status
        }, '[DEBUG] Join bonus condition check');

        if (!isDeferred && participant.status === ParticipantStatus.PENDING) {
            const joinOrderBonus = await assignJoinOrderBonus(accessCode, userId);
            if (joinOrderBonus > 0) {
                const leaderboardUser: Omit<LeaderboardEntry, 'rank'> = {
                    userId,
                    username: username || `guest-${userId.substring(0, 8)}`,
                    avatarEmoji: avatarEmoji || undefined,
                    score: joinOrderBonus,
                    attemptCount: participant.nbAttempts,
                    participationId: participant.id
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
        }

        return { success: true, gameInstance, participant };
    } catch (error) {
        logger.error({ error, userId, accessCode }, 'Error in unified joinGame');
        return { success: false, error: 'An error occurred while joining the game' };
    }
}