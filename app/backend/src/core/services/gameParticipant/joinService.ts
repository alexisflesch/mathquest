
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

        // SECURITY FIX: Only allow joining completed games if they have explicit deferred availability
        const isDeferred = gameInstance.status === 'completed' &&
            (gameInstance.differedAvailableFrom || gameInstance.differedAvailableTo);

        // Block joining completed quizzes without deferred availability
        if (gameInstance.status === 'completed' && !isDeferred) {
            return { success: false, error: 'This quiz has ended and is not available for replay' };
        }

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

        // Determine if userId is a cookieId (for guest users whose registration failed)
        const isCookieId = userId.startsWith('guest_') || userId.startsWith('temp_');

        let existingUser = null;
        if (isCookieId) {
            // Look up user by cookieId in studentProfile
            existingUser = await prisma.user.findFirst({
                where: {
                    studentProfile: {
                        cookieId: userId
                    }
                }
            });
        } else {
            // Look up user by id
            existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });
        }

        let targetUserId = existingUser?.id;

        if (!existingUser) {
            // Create new user
            const newUser = await prisma.user.create({
                data: {
                    id: isCookieId ? undefined : userId, // Let Prisma generate ID if userId is a cookieId
                    username: username || `guest-${userId.substring(0, 8)}`,
                    role: isCookieId ? 'GUEST' : 'STUDENT',
                    avatarEmoji: avatarEmoji || null,
                    studentProfile: { create: { cookieId: isCookieId ? userId : `cookie-${userId}` } }
                }
            });
            targetUserId = newUser.id;
        }

        if (!targetUserId) {
            return { success: false, error: 'Failed to determine user ID' };
        }

        // Get the final user data
        const finalUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { username: true, avatarEmoji: true }
        });

        if (!finalUser) {
            return { success: false, error: 'User not found after creation' };
        }

        // --- UNIFIED PARTICIPANT LOGIC ---
        // Use transaction to prevent race conditions and ensure unique constraint
        let participant;
        try {
            participant = await prisma.$transaction(async (tx) => {
                // Check for existing participant (unique constraint: gameInstanceId + userId)
                const existing = await tx.gameParticipant.findUnique({
                    where: {
                        gameInstanceId_userId: {
                            gameInstanceId: gameInstance.id,
                            userId: targetUserId
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
                            // New deferred attempt: increment nbAttempts to reflect new attempt
                            const newAttemptNumber = existing.nbAttempts + 1;
                            const updated = await tx.gameParticipant.update({
                                where: { id: existing.id },
                                data: {
                                    nbAttempts: newAttemptNumber,
                                    deferredScore: 0,
                                    status: ParticipantStatus.ACTIVE,
                                    lastActiveAt: new Date()
                                },
                                include: { user: true }
                            });
                            logger.info({
                                userId: targetUserId,
                                accessCode,
                                participantId: existing.id,
                                newAttemptNumber,
                                totalAttemptsAfterIncrement: updated.nbAttempts
                            }, 'Starting new deferred session - incremented nbAttempts');

                            // Return the new attempt number for session creation
                            (updated as any).currentDeferredAttemptNumber = newAttemptNumber;
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
                            logger.info({ userId: targetUserId, accessCode, participantId: existing.id }, 'Reconnected to ongoing deferred session');
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
                        logger.info({ userId: targetUserId, accessCode, participantId: existing.id, status: participantStatus }, 'Updated existing participant status');
                        return updated;
                    }
                } else {
                    // Create new participant
                    const newParticipant = await tx.gameParticipant.create({
                        data: {
                            gameInstanceId: gameInstance.id,
                            userId: targetUserId,
                            status: isDeferred ? ParticipantStatus.ACTIVE : participantStatus,
                            nbAttempts: 1,
                            liveScore: 0,
                            deferredScore: 0,
                            lastActiveAt: new Date()
                        },
                        include: { user: true }
                    });
                    logger.info({
                        userId: targetUserId,
                        accessCode,
                        participantId: newParticipant.id,
                        status: newParticipant.status,
                        isDeferred
                    }, 'Created new unified participant');
                    return newParticipant;
                }
            });
        } catch (transactionError) {
            logger.error({
                error: transactionError,
                userId: targetUserId,
                accessCode,
                gameInstanceId: gameInstance.id,
                logPoint: 'TRANSACTION_ERROR'
            }, 'Database transaction failed in joinGame');

            // Check if it's a specific Prisma error
            if (transactionError && typeof transactionError === 'object' && 'code' in transactionError) {
                const prismaError = transactionError as any;
                if (prismaError.code === 'P2002') {
                    return { success: false, error: 'You are already participating in this game' };
                }
            }

            return { success: false, error: 'Database error occurred while joining the game' };
        }

        // --- JOIN BONUS SNAPSHOT LOGIC ---
        // Only apply join bonus for live/pending participants (not deferred reconnections)
        // Also handle late joiners to active games
        const joinBonusCondition = !isDeferred && (participant.status === ParticipantStatus.PENDING || gameInstance.status === 'active');
        logger.info({
            userId,
            accessCode,
            isDeferred,
            participantStatus: participant.status,
            gameInstanceStatus: gameInstance.status,
            joinBonusCondition,
            logPoint: 'JOIN_BONUS_CONDITION_CHECK'
        }, '[DEBUG] Join bonus condition check');

        if (joinBonusCondition) {
            logger.info({
                userId,
                accessCode,
                logPoint: 'JOIN_BONUS_CONDITION_MET'
            }, '[DEBUG] Join bonus condition met, calling assignJoinOrderBonus');

            // For active games, late joiners should be added to snapshot with their join bonus
            // For pending games, new joiners get join bonus
            let joinOrderBonus: number;
            try {
                joinOrderBonus = await assignJoinOrderBonus(accessCode, targetUserId);
                logger.info({
                    userId,
                    accessCode,
                    joinOrderBonus,
                    joinOrderBonusType: typeof joinOrderBonus,
                    logPoint: 'JOIN_BONUS_ASSIGNED'
                }, '[DEBUG] assignJoinOrderBonus returned');
            } catch (error) {
                logger.error({
                    error,
                    userId,
                    accessCode,
                    logPoint: 'JOIN_BONUS_ASSIGN_ERROR'
                }, '[DEBUG] assignJoinOrderBonus threw error');
                joinOrderBonus = 0; // Default to 0 on error
            }
            if (joinOrderBonus > 0) {
                // Update participant's liveScore with the join bonus
                logger.info({
                    userId: targetUserId,
                    accessCode,
                    participantId: participant.id,
                    currentLiveScore: participant.liveScore,
                    joinOrderBonus,
                    joinOrderBonusType: typeof joinOrderBonus,
                    logPoint: 'JOIN_BONUS_BEFORE_UPDATE'
                }, '[JOIN_BONUS] Before updating participant liveScore');

                try {
                    const updateData = { liveScore: Number(joinOrderBonus) };
                    logger.info({
                        userId: targetUserId,
                        accessCode,
                        updateData,
                        logPoint: 'JOIN_BONUS_UPDATE_DATA'
                    }, '[JOIN_BONUS] Update data being sent to Prisma');

                    const updatedParticipant = await prisma.gameParticipant.update({
                        where: { id: participant.id },
                        data: updateData
                    });
                    logger.info({
                        userId: targetUserId,
                        accessCode,
                        participantId: participant.id,
                        joinOrderBonus,
                        updatedLiveScore: updatedParticipant.liveScore,
                        logPoint: 'JOIN_BONUS_DATABASE_UPDATE'
                    }, '[JOIN_BONUS] Updated participant liveScore with join bonus');
                } catch (error) {
                    logger.error({
                        error,
                        userId: targetUserId,
                        accessCode,
                        participantId: participant.id,
                        joinOrderBonus,
                        logPoint: 'JOIN_BONUS_UPDATE_ERROR'
                    }, '[JOIN_BONUS] Error updating participant liveScore');
                    throw error;
                }

                // For active games, use the current liveScore (which includes any previous bonus)
                // For pending games, use join bonus (will be updated with real scores later)
                const snapshotScore = gameInstance.status === 'active' ? participant.liveScore : joinOrderBonus;

                const leaderboardUser: Omit<LeaderboardEntry, 'rank'> = {
                    userId: targetUserId,
                    username: finalUser.username,
                    avatarEmoji: finalUser.avatarEmoji || undefined,
                    score: snapshotScore,
                    attemptCount: participant.nbAttempts,
                    participationId: participant.id
                };

                // Add to snapshot and emit to projection page via socket
                const updatedSnapshot = await addUserToSnapshot(accessCode, leaderboardUser, snapshotScore);
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