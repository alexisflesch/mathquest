import { BaseQuestion } from '../question';
/**
 * Shared Question Types
 *
 * These types represent the core question structure used across both frontend and backend.
 */
export type { Answer } from '../question';
/**
 * Question structure with common fields across frontend and backend
 */
export interface Question extends BaseQuestion {
    correct?: boolean | number[];
    theme?: string;
    difficulte?: number;
    niveau?: string | string[];
    discipline?: string;
    question?: string;
    hidden?: boolean;
    title?: string;
}
