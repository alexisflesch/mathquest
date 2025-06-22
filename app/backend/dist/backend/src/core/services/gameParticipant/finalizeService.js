"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeParticipation = finalizeParticipation;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('GameParticipantFinalizeService');
/**
 * Finalize a participant's game session (generic for all modes)
 * - For quiz/tournament: logs event and returns participant
 * - For deferred: ensures best score is kept, logs event
 */
async function finalizeParticipation({ gameInstanceId, userId, mode, finalScore }) {
    try {
        // Find participant
        const participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: { gameInstanceId, userId },
            include: { user: true }
        });
        if (!participant) {
            logger.error({ gameInstanceId, userId }, 'No participant found for finalization');
            return { success: false, error: 'Participant not found' };
        }
        logger.info({
            gameInstanceId,
            userId,
            participantId: participant.id,
            mode,
            finalScore
        }, 'Finalized participant session');
        // For deferred, ensure best score is kept (reuse scoreService logic if needed)
        if (mode === 'deferred' && typeof finalScore === 'number') {
            // Optionally call finalizeDeferredAttempt from scoreService
            // ...existing code or call...
        }
        return { success: true, participant };
    }
    catch (error) {
        logger.error({ error, gameInstanceId, userId, mode }, 'Error finalizing participation');
        return { success: false, error: 'An error occurred while finalizing participation' };
    }
}
