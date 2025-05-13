/**
 * Shared Types for MathQuest
 * 
 * This file serves as the main entry point for all shared types across frontend and backend.
 * 
 * Import this file using:
 * import { Question, Answer, ... } from '@shared/types';
 */

// Re-export all shared types
export * from './question'; // Added export from base question file
export * from './quiz/question';
export * from './quiz/state';
export * from './tournament/participant';
export * from './tournament/state';
export * from './socket/payloads';
export * from './socket/events';  // Export socket event constants
export * from './util/logger';
export * from './util/typeGuards'; // Export type guards for runtime validation
export * from './util/typeErrors'; // Export type error helpers
export * from './util/typeMapping'; // Export type mapping utilities
export * from './util/schemaValidation'; // Export schema validation utilities
export * from './util/schemaDefinitions'; // Export schema definitions
