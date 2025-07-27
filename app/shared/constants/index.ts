/**
 * Shared Constants Index
 * 
 * Central export point for all shared constants used throughout MathQuest
 */

export * from './questionTypes';
export * from './gameTimings';

// Re-export commonly used constants for convenience
export {
    QUESTION_TYPES,
    TIMEOUT_CONSTANTS,
    isValidQuestionType
} from './questionTypes';

export {
    GAME_TIMING,
    getCorrectAnswersDisplayTime,
    getFeedbackDisplayTime
} from './gameTimings';

export type { QuestionType, TimeoutConstant } from './questionTypes';
export type { GameTimingConstant } from './gameTimings';
