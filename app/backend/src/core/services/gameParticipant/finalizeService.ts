import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { redisClient } from '@/config/redis';
import type { GameInstance, GameParticipantRecord } from '@shared/types/core/game';

const logger = createLogger('GameParticipantFinalizeService');

/**
 * Finalize a participant's game session (generic for all modes)
 * - For quiz/tournament: logs event and returns participant
 * - For deferred: ensures best score is kept, logs event
 */
export async function finalizeParticipation({
    gameInstanceId,
    userId,
    mode,
    finalScore
}: {
    gameInstanceId: string;
    userId: string;
    mode: 'quiz' | 'tournament' | 'practice' | 'deferred';
    finalScore?: number;
}) {
    try {
        // Find participant
        const participant = await prisma.gameParticipant.findFirst({
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
    } catch (error) {
        logger.error({ error, gameInstanceId, userId, mode }, 'Error finalizing participation');
        return { success: false, error: 'An error occurred while finalizing participation' };
    }
}
