// Shared score calculation logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers

import createLogger from '@/utils/logger';

const logger = createLogger('ScoreUtils');

/**
 * Calculate score for a single answer
 * @param answer The answer object (should include correctness, timeSpent, etc.)
 * @param question The question object (should include timeLimit, difficulty, etc.)
 * @returns The score for this answer
 */
export function calculateScore(answer: any, question: any): number {
    // Example scoring: 1000 points for correct, minus time penalty
    if (!answer || !question) return 0;
    if (!answer.isCorrect) return 0;
    const base = 1000;
    const timePenalty = Math.floor((answer.timeSpent || 0) * 10); // 10 points per second
    return Math.max(base - timePenalty, 0);
}
