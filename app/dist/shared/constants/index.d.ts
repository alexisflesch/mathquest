/**
 * Shared Constants Index
 *
 * Central export point for all shared constants used throughout MathQuest
 */
export * from './questionTypes';
export * from './gameTimings';
export { QUESTION_TYPES } from './questionTypes';
export { GAME_TIMING, getCorrectAnswersDisplayTime, getFeedbackDisplayTime } from './gameTimings';
export type { QuestionType } from './questionTypes';
export type { GameTimingConstant } from './gameTimings';
