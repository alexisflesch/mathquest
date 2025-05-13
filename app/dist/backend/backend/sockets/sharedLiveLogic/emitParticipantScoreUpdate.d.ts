/**
 * emitParticipantScoreUpdate.ts - Shared logic for emitting a participant's updated score and rank.
 */
import { Socket } from 'socket.io';
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
export declare function emitParticipantScoreUpdate(socket: Socket, data: ParticipantScoreUpdatePayload): void;
export {};
