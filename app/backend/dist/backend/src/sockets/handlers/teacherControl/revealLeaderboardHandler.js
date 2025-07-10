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
        // 🎯 QUIZ MODE: Also emit leaderboard to students when teacher clicks trophy
        // This enables manual leaderboard reveals in quiz mode (unlike tournaments which are automatic)
        try {
            // First, sync snapshot with current live data
            const { syncSnapshotWithLiveData, emitLeaderboardFromSnapshot } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/leaderboardSnapshotService')));
            // Sync snapshot with live data
            await syncSnapshotWithLiveData(accessCode);
            // Emit from snapshot to students
            await emitLeaderboardFromSnapshot(io, accessCode, [`game_${accessCode}`], 'teacher_trophy_click');
            logger.info({
                accessCode,
                gameId,
                event: 'leaderboard_update',
                trigger: 'teacher_trophy_click',
                dataSource: 'leaderboard_snapshot'
            }, '[QUIZ-MODE] Emitted leaderboard_update to students via teacher trophy action (from snapshot)');
        }
        catch (leaderboardError) {
            logger.error({
                accessCode,
                gameId,
                error: leaderboardError
            }, '[QUIZ-MODE] Error emitting student leaderboard update via teacher trophy action');
        }
    };
}
exports.default = revealLeaderboardHandler;
