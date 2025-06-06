/**
 * Socket.IO Type Definitions
 * 
 * Centralized type definitions for Socket.IO events and data structures
 * to eliminate 'any' types and provide proper type safety.
 */

import { Socket } from 'socket.io-client';

// Only keep these if not covered by shared types:
export type AnswerValue = number | number[] | string | string[] | boolean;
export interface SocketConfig {
    query?: Record<string, string>;
    auth?: Record<string, string>;
    timeout?: number;
    [key: string]: unknown;
}

// Remove all other local types. Use shared types from @shared/types/socketEvents for all event payloads, questions, participants, timers, and game state.

export type { Socket } from 'socket.io-client';
