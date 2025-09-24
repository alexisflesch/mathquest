/**
 * Shared Types for MathQuest
 * 
 * This file serves as the main entry point for all shared types across frontend and backend.
 * 
 * Import this file using:
 * import { Question, Answer, ... } from '@shared/types';
 */

// Export consolidated core types (new unified type system)
export * from './core';

// Re-export specific types to avoid naming conflicts
export type { TournamentQuestion } from './tournament/question';
// export type { Question as QuizQuestion } from './quiz/question'; // Removed - unused
export * from './socket/payloads';
export * from './socket/events';  // Export socket event constants
export * from './util/logger';
export * from './util/typeMapping'; // Export type mapping utilities
export * from './util/schemaValidation'; // Export schema validation utilities
export * from './util/schemaDefinitions'; // Export schema definitions

// Export event constants 
export {
    TEACHER_EVENTS,
    GAME_EVENTS,
    TOURNAMENT_EVENTS,
    LOBBY_EVENTS,
    PROJECTOR_EVENTS,
    SOCKET_EVENTS
} from './socket/events';

// Explicit exports to avoid naming conflicts
export type { BaseQuizState, ExtendedQuizState } from './quiz/state';
// export type { TournamentState } from './tournament/state'; // Removed - unused

// Export shared constants
export * from '../constants';
