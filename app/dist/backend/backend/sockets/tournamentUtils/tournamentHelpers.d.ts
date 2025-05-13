/**
 * tournamentHelpers.ts - Utility functions for tournament operations
 *
 * This module provides helper functions for tournament operations like:
 * - Managing tournament state
 * - Sending questions to participants
 * - Handling timer expiration
 * - Computing statistics
 */
import { Server } from 'socket.io';
/**
 * Gets the target to emit events to - handles live/differed mode
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param targetRoom - Optional specific room to target
 * @param isDiffered - Whether the tournament is in differed mode
 * @returns The Socket.IO broadcast target
 */
declare function getEmitTarget(io: Server, code: string, targetRoom?: string | null, isDiffered?: boolean): import("socket.io").BroadcastOperator<import("socket.io/dist/typed-events").DecorateAcknowledgementsWithMultipleResponses<import("socket.io").DefaultEventsMap>, any>;
/**
 * Centralized timer expiration logic
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param targetRoom - Optional specific room to target
 */
declare function handleTimerExpiration(io: Server, code: string, targetRoom?: string | null): Promise<void>;
/**
 * Sends a question to tournament participants with the current state
 *
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param questionIndex - Index of the question to send
 * @param questionUid - UID of the question to send
 * @param targetRoom - Optional specific room to target
 * @param isDiffered - Whether the tournament is in differed mode
 */
declare function sendQuestionWithState(io: Server, code: string, questionIndex: number, questionUid?: string | undefined, targetRoom?: string | null, isDiffered?: boolean): void;
/**
 * Named exports for destructuring import
 */
export { getEmitTarget, handleTimerExpiration, sendQuestionWithState, };
