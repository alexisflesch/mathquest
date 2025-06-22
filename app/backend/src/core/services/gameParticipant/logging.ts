import createLogger from '@/utils/logger';

const logger = createLogger('GameParticipantLoggingService');

/**
 * Log a participation event (join, answer, finish, etc.)
 * This should be called for all major participant actions for audit/debug.
 */
export function logParticipationEvent({
    event,
    userId,
    gameInstanceId,
    details
}: {
    event: 'join' | 'answer' | 'finish' | 'score-update' | string;
    userId: string;
    gameInstanceId: string;
    details?: Record<string, any>;
}) {
    logger.info({
        event,
        userId,
        gameInstanceId,
        ...details
    }, `GameParticipant event: ${event}`);
}
