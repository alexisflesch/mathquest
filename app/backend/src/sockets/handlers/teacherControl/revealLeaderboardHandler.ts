import { Server as SocketIOServer, Socket } from 'socket.io';
import { RevealLeaderboardPayload } from '@shared/types/socketEvents';
import { ProjectionLeaderboardUpdatePayload } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import { revealLeaderboardPayloadSchema } from '@shared/types/socketEvents.zod';
import { TEACHER_EVENTS, PROJECTOR_EVENTS, SOCKET_EVENTS } from '@shared/types/socket/events';
import { computeFullLeaderboardAndSnapshot } from '@/core/services/gameParticipant/leaderboardSnapshotService';
import createLogger from '@/utils/logger';
import { ProjectionLeaderboardUpdatePayloadSchema } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import { prisma } from '@/db/prisma';
import { calculateLeaderboard } from '../sharedLeaderboard';
import * as gameStateService from '@/core/services/gameStateService';

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

        // 🎯 QUIZ MODE: Also emit leaderboard to students when teacher clicks trophy
        // This enables manual leaderboard reveals in quiz mode (unlike tournaments which are automatic)
        try {
            // First, sync snapshot with current live data
            const { syncSnapshotWithLiveData, emitLeaderboardFromSnapshot } = await import('@/core/services/gameParticipant/leaderboardSnapshotService');

            // Sync snapshot with live data
            await syncSnapshotWithLiveData(accessCode);

            // Emit from snapshot to students
            await emitLeaderboardFromSnapshot(
                io,
                accessCode,
                [`game_${accessCode}`],
                'teacher_trophy_click'
            );

            logger.info({
                accessCode,
                gameId,
                event: 'leaderboard_update',
                trigger: 'teacher_trophy_click',
                dataSource: 'leaderboard_snapshot'
            }, '[QUIZ-MODE] Emitted leaderboard_update to students via teacher trophy action (from snapshot)');
        } catch (leaderboardError) {
            logger.error({
                accessCode,
                gameId,
                error: leaderboardError
            }, '[QUIZ-MODE] Error emitting student leaderboard update via teacher trophy action');
        }
    };
}

export default revealLeaderboardHandler;
