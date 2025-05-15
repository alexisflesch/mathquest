/**
 * emitParticipantScoreUpdate.ts - Shared logic for emitting a participant's updated score and rank.
 */

import { Socket } from 'socket.io';
import createLogger from '../../logger'; // Adjust path as necessary

const logger = createLogger('EmitParticipantScoreUpdate');

interface ParticipantScoreUpdatePayload {
    newTotalScore: number;
    currentRank: number;
}

/**
 * Emits an update of the participant's total score and current rank directly to their socket.
 *
 * @param socket - The participant's Socket.IO socket instance.
 * @param data - The payload containing the new total score and current rank.
 */
export function emitParticipantScoreUpdate(
    socket: Socket,
    data: ParticipantScoreUpdatePayload
): void {
    if (!socket) {
        logger.warn('[emitParticipantScoreUpdate] Socket is undefined. Cannot emit score update.');
        return;
    }

    logger.info(`[emitParticipantScoreUpdate] Emitting 'participant_score_update' to socket ${socket.id}. Data: ${JSON.stringify(data)}`);

    socket.emit('participant_score_update', data);
}
