"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealLeaderboardHandler = revealLeaderboardHandler;
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const events_1 = require("@shared/types/socket/events");
const leaderboardSnapshotService_1 = require("@/core/services/gameParticipant/leaderboardSnapshotService");
const logger_1 = __importDefault(require("@/utils/logger"));
const projectionLeaderboardUpdatePayload_1 = require("@shared/types/socket/projectionLeaderboardUpdatePayload");
const prisma_1 = require("@/db/prisma");
const logger = (0, logger_1.default)('RevealLeaderboardHandler');
function revealLeaderboardHandler(io, socket) {
    return async (payload) => {
        logger.info('Received reveal_leaderboard event', { payload });
        // Validate payload
        const parseResult = socketEvents_zod_1.revealLeaderboardPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            logger.warn('Invalid reveal_leaderboard payload', { issues: parseResult.error.issues });
            return;
        }
        const { accessCode } = payload;
        // Look up gameId from accessCode
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            select: { id: true }
        });
        if (!gameInstance) {
            logger.error('Game instance not found for accessCode', { accessCode });
            return;
        }
        const gameId = gameInstance.id;
        // Compute and store the full leaderboard snapshot
        const fullSnapshot = await (0, leaderboardSnapshotService_1.computeFullLeaderboardAndSnapshot)(accessCode);
        if (!fullSnapshot) {
            logger.error('Failed to compute full leaderboard snapshot', { accessCode, gameId });
            return;
        }
        // Zod validate the fullSnapshot payload
        const snapshotValidation = projectionLeaderboardUpdatePayload_1.ProjectionLeaderboardUpdatePayloadSchema.safeParse(fullSnapshot);
        if (!snapshotValidation.success) {
            logger.error('❌ Invalid full leaderboard snapshot payload (Zod validation failed)', { issues: snapshotValidation.error.issues, payload: fullSnapshot });
            return;
        }
        // Emit to the canonical projection room (by gameId)
        logger.info('Emitting full leaderboard snapshot to projection', { gameId, accessCode, payload: fullSnapshot });
        io.to(`projection_${gameId}`).emit(events_1.PROJECTOR_EVENTS.PROJECTION_LEADERBOARD_UPDATE, fullSnapshot);
        logger.info('Emitted full leaderboard snapshot to projection', { gameId, accessCode, leaderboardCount: fullSnapshot.leaderboard.length, payload: fullSnapshot });
    };
}
exports.default = revealLeaderboardHandler;
