import { Server as SocketIOServer, Socket } from 'socket.io';
import { RevealLeaderboardPayload } from '@shared/types/socketEvents';
import { ProjectionLeaderboardUpdatePayload } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import { revealLeaderboardPayloadSchema } from '@shared/types/socketEvents.zod';
import { TEACHER_EVENTS, PROJECTOR_EVENTS } from '@shared/types/socket/events';
import { computeFullLeaderboardAndSnapshot } from '@/core/services/gameParticipant/leaderboardSnapshotService';
import createLogger from '@/utils/logger';
import { ProjectionLeaderboardUpdatePayloadSchema } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import { prisma } from '@/db/prisma';

const logger = createLogger('RevealLeaderboardHandler');

export function revealLeaderboardHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: RevealLeaderboardPayload) => {
        logger.info('Received reveal_leaderboard event', { payload });
        // Validate payload
        const parseResult = revealLeaderboardPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            logger.warn('Invalid reveal_leaderboard payload', { issues: parseResult.error.issues });
            return;
        }
        const { accessCode } = payload;
        // Look up gameId from accessCode
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: { id: true }
        });
        if (!gameInstance) {
            logger.error('Game instance not found for accessCode', { accessCode });
            return;
        }
        const gameId = gameInstance.id;
        // Compute and store the full leaderboard snapshot
        const fullSnapshot: ProjectionLeaderboardUpdatePayload | null = await computeFullLeaderboardAndSnapshot(accessCode);
        if (!fullSnapshot) {
            logger.error('Failed to compute full leaderboard snapshot', { accessCode, gameId });
            return;
        }
        // Zod validate the fullSnapshot payload
        const snapshotValidation = ProjectionLeaderboardUpdatePayloadSchema.safeParse(fullSnapshot);
        if (!snapshotValidation.success) {
            logger.error('❌ Invalid full leaderboard snapshot payload (Zod validation failed)', { issues: snapshotValidation.error.issues, payload: fullSnapshot });
            return;
        }
        // Emit to the canonical projection room (by gameId)
        logger.info('Emitting full leaderboard snapshot to projection', { gameId, accessCode, payload: fullSnapshot });
        io.to(`projection_${gameId}`).emit(PROJECTOR_EVENTS.PROJECTION_LEADERBOARD_UPDATE, fullSnapshot);
        logger.info('Emitted full leaderboard snapshot to projection', { gameId, accessCode, leaderboardCount: fullSnapshot.leaderboard.length, payload: fullSnapshot });
    };
}

export default revealLeaderboardHandler;
