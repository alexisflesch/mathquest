/**
 * Shared Types for MathQuest
 *
 * This file serves as the main entry point for all shared types across frontend and backend.
 *
 * Import this file using:
 * import { Question, Answer, ... } from '@shared/types';
 */
export * from './core';
export type { TournamentQuestion } from './tournament/question';
export * from './socket/payloads';
export * from './socket/events';
export * from './util/logger';
export * from './util/typeMapping';
export * from './util/schemaValidation';
export * from './util/schemaDefinitions';
export { TEACHER_EVENTS, GAME_EVENTS, TOURNAMENT_EVENTS, LOBBY_EVENTS, PROJECTOR_EVENTS, SOCKET_EVENTS } from './socket/events';
export type { BaseQuizState, ExtendedQuizState } from './quiz/state';
export * from '../constants';
