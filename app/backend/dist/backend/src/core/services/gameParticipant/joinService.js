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
const deferredTimerUtils_1 = require("./deferredTimerUtils");
const logger = (0, logger_1.default)('GameParticipantJoinService');
/**
 * Join a game using access code (refactored from GameParticipantService)
 * Handles both LIVE and DEFERRED participation logic.
 */
async function joinGame({ userId, accessCode, username, avatarEmoji }) {
    try {
        logger.info({ userId, accessCode, username, avatarEmoji, logPoint: 'JOIN_GAME_ENTRY' }, '[LOG] joinGame called');
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
            if (from && now < from)
                return { success: false, error: 'Tournament not available yet' };
            if (to && now > to)
                return { success: false, error: 'Tournament no longer available' };
        }
        // Determine participation type
        const participationType = gameInstance.status === 'completed' ? 'DEFERRED' : 'LIVE';
        let participant;
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
        // --- JOIN BONUS SNAPSHOT LOGIC ---
        // Only apply join bonus if this is a new participant (not reconnection)
        const joinOrderBonus = await (0, joinOrderBonus_1.assignJoinOrderBonus)(accessCode, userId);
        if (joinOrderBonus > 0) {
            const leaderboardUser = {
                userId,
                username: username || `guest-${userId.substring(0, 8)}`,
                avatarEmoji: avatarEmoji || undefined,
                score: joinOrderBonus,
                participationType: participationType,
                attemptCount: 1,
                participationId: undefined
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
        if (participationType === 'LIVE') {
            // Check for existing participant
            const existingLive = await prisma_1.prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId, participationType: 'LIVE' },
                include: { user: true }
            });
            if (existingLive) {
                logger.info({ userId, accessCode, participantId: existingLive.id, participationType: 'LIVE', reused: true, logPoint: 'JOIN_GAME_LIVE_EXISTING' }, 'Reusing existing LIVE participant');
                participant = existingLive;
            }
            else {
                const newParticipant = await prisma_1.prisma.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId,
                        joinedAt: new Date(),
                        score: 0,
                        participationType: 'LIVE',
                        attemptCount: 1
                    }
                });
                participant = await prisma_1.prisma.gameParticipant.findUnique({ where: { id: newParticipant.id }, include: { user: true } });
                logger.info({ userId, accessCode, participantId: participant?.id, participationType: 'LIVE', reused: false, logPoint: 'JOIN_GAME_LIVE_NEW' }, 'Created new LIVE participant');
            }
        }
        else {
            // DEFERRED logic
            const existingDeferred = await prisma_1.prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId, participationType: 'DEFERRED' },
                include: { user: true }
            });
            if (existingDeferred) {
                // Get all question UIDs for this game via gameTemplate
                // gameTemplate is an object with at least a name, but we need the id
                // Use gameInstance.id as fallback if gameTemplateId is not available
                const hasOngoing = await (0, deferredTimerUtils_1.hasOngoingDeferredSession)({
                    accessCode,
                    userId,
                    attemptCount: existingDeferred.attemptCount
                });
                logger.info({
                    userId,
                    accessCode,
                    participantId: existingDeferred.id,
                    attemptCount: existingDeferred.attemptCount,
                    hasOngoing,
                    logPoint: 'JOIN_GAME_DEFERRED_ONGOING_CHECK',
                }, '[DEBUG] Ongoing session check for DEFERRED participant');
                logger.info({
                    userId,
                    accessCode,
                    participantId: existingDeferred.id,
                    attemptCount: existingDeferred.attemptCount,
                    hasOngoing,
                    logPoint: 'JOIN_GAME_DEFERRED_EXISTING_BEFORE_UPDATE'
                }, '[LOG] Existing DEFERRED participant before update');
                if (hasOngoing) {
                    // Do NOT increment attemptCount or reset progress
                    participant = existingDeferred;
                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant.id,
                        attemptCount: participant.attemptCount,
                        hasOngoing,
                        logPoint: 'JOIN_GAME_DEFERRED_RECONNECT_PATH',
                    }, '[DEBUG] DEFERRED join: reconnect path (should NOT increment attemptCount)');
                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant.id,
                        participationType: participant.participationType,
                        attemptCount: participant.attemptCount,
                        logPoint: 'JOIN_GAME_DEFERRED_EXISTING_RECONNECT'
                    }, '[LOG] Reconnected to ongoing DEFERRED session (no increment)');
                }
                else {
                    // No ongoing session: increment attemptCount and reset progress
                    // PATCH: Only increment attemptCount if there is no ongoing session (new playthrough)
                    logger.info({
                        userId,
                        accessCode,
                        participantId: existingDeferred.id,
                        prevAttemptCount: existingDeferred.attemptCount,
                        hasOngoing,
                        logPoint: 'JOIN_GAME_DEFERRED_NEW_ATTEMPT_PATH',
                    }, '[DEBUG] DEFERRED join: new attempt path (should increment attemptCount)');
                    const prevAttemptCount = existingDeferred.attemptCount;
                    participant = await prisma_1.prisma.gameParticipant.update({
                        where: { id: existingDeferred.id },
                        data: { joinedAt: new Date(), score: 0, attemptCount: prevAttemptCount + 1 },
                        include: { user: true }
                    });
                    logger.info({
                        userId,
                        accessCode,
                        participantId: participant.id,
                        participationType: participant.participationType,
                        prevAttemptCount,
                        newAttemptCount: participant.attemptCount,
                        resetScore: participant.score,
                        logPoint: 'JOIN_GAME_DEFERRED_EXISTING_UPDATED'
                    }, '[LOG] Updated existing DEFERRED participant for new attempt (incremented only on new playthrough)');
                }
            }
            else {
                logger.info({
                    userId,
                    accessCode,
                    logPoint: 'JOIN_GAME_DEFERRED_NEW_CREATE'
                }, '[LOG] Creating new DEFERRED participant');
                const newParticipant = await prisma_1.prisma.gameParticipant.create({
                    data: {
                        gameInstanceId: gameInstance.id,
                        userId,
                        joinedAt: new Date(),
                        score: 0,
                        participationType: 'DEFERRED',
                        attemptCount: 1
                    }
                });
                participant = await prisma_1.prisma.gameParticipant.findUnique({ where: { id: newParticipant.id }, include: { user: true } });
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
    }
    catch (error) {
        logger.error({ error, userId, accessCode }, 'Error joining game');
        return { success: false, error: 'An error occurred while joining the game' };
    }
}
