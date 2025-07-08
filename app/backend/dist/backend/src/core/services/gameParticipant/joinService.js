"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGame = joinGame;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const joinOrderBonus_1 = require("@/utils/joinOrderBonus");
const leaderboardSnapshotService_1 = require("./leaderboardSnapshotService");
const sockets_1 = require("@/sockets");
const projectionLeaderboardUpdatePayload_1 = require("@shared/types/socket/projectionLeaderboardUpdatePayload");
const participant_1 = require("@shared/types/core/participant");
const deferredTimerUtils_1 = require("./deferredTimerUtils");
const logger = (0, logger_1.default)('GameParticipantJoinService');
/**
 * Join a game using access code (UNIFIED JOIN FLOW)
 * Handles both lobby (pending) and live (active) game joining with a single participant record per user/game.
 */
async function joinGame({ userId, accessCode, username, avatarEmoji }) {
    try {
        logger.info({ userId, accessCode, username, avatarEmoji, logPoint: 'JOIN_GAME_UNIFIED_ENTRY' }, '[LOG] Unified joinGame called');
        // Find the game instance
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
        // Check deferred mode availability
        if (gameInstance.isDiffered) {
            const now = new Date();
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            if (from && now < from)
                return { success: false, error: 'Tournament not available yet' };
            if (to && now > to)
                return { success: false, error: 'Tournament no longer available' };
        }
        // Determine participant status based on game state
        const participantStatus = gameInstance.status === 'pending' ? participant_1.ParticipantStatus.PENDING : participant_1.ParticipantStatus.ACTIVE;
        const isDeferred = gameInstance.status === 'completed';
        // Upsert user
        await prisma_1.prisma.user.upsert({
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
        const participant = await prisma_1.prisma.$transaction(async (tx) => {
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
                    const hasOngoing = await (0, deferredTimerUtils_1.hasOngoingDeferredSession)({
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
                                status: participant_1.ParticipantStatus.ACTIVE,
                                lastActiveAt: new Date()
                            },
                            include: { user: true }
                        });
                        logger.info({ userId, accessCode, participantId: existing.id, newAttempts: updated.nbAttempts }, 'Incremented deferred attempts for new session');
                        return updated;
                    }
                    else {
                        // Ongoing session: just update status and lastActiveAt
                        const updated = await tx.gameParticipant.update({
                            where: { id: existing.id },
                            data: {
                                status: participant_1.ParticipantStatus.ACTIVE,
                                lastActiveAt: new Date()
                            },
                            include: { user: true }
                        });
                        logger.info({ userId, accessCode, participantId: existing.id }, 'Reconnected to ongoing deferred session');
                        return updated;
                    }
                }
                else {
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
            }
            else {
                // Create new participant
                const newParticipant = await tx.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId,
                        status: isDeferred ? participant_1.ParticipantStatus.ACTIVE : participantStatus,
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
        if (!isDeferred && participant.status === participant_1.ParticipantStatus.PENDING) {
            const joinOrderBonus = await (0, joinOrderBonus_1.assignJoinOrderBonus)(accessCode, userId);
            if (joinOrderBonus > 0) {
                const leaderboardUser = {
                    userId,
                    username: username || `guest-${userId.substring(0, 8)}`,
                    avatarEmoji: avatarEmoji || undefined,
                    score: joinOrderBonus,
                    attemptCount: participant.nbAttempts,
                    participationId: participant.id
                };
                // Add to snapshot and emit to projection page via socket
                const updatedSnapshot = await (0, leaderboardSnapshotService_1.addUserToSnapshot)(accessCode, leaderboardUser, joinOrderBonus);
                // Emit to projection room if snapshot was updated
                if (updatedSnapshot) {
                    const io = (0, sockets_1.getIO)();
                    if (io) {
                        const projectionRoom = `projection_${gameInstance.id}`;
                        const payload = { leaderboard: updatedSnapshot };
                        // Validate payload with Zod before emitting
                        const parseResult = projectionLeaderboardUpdatePayload_1.ProjectionLeaderboardUpdatePayloadSchema.safeParse(payload);
                        if (parseResult.success) {
                            io.to(projectionRoom)
                                .emit('projection_leaderboard_update', payload);
                            logger.info({ accessCode, projectionRoom, leaderboardCount: updatedSnapshot.length }, '[LEADERBOARD] Emitted updated snapshot to projection room');
                        }
                        else {
                            logger.error({ accessCode, issues: parseResult.error.issues }, '[LEADERBOARD] Invalid leaderboard snapshot payload, not emitted');
                        }
                    }
                    else {
                        logger.warn({ accessCode }, '[LEADERBOARD] Socket.IO instance not available, cannot emit leaderboard snapshot');
                    }
                }
            }
        }
        return { success: true, gameInstance, participant };
    }
    catch (error) {
        logger.error({ error, userId, accessCode }, 'Error in unified joinGame');
        return { success: false, error: 'An error occurred while joining the game' };
    }
}
