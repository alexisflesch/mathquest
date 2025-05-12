/**
 * Types related to score calculation.
 */
/**
 * Result of a score calculation, including base score, time penalty, and total.
 */
export interface ScoreCalculationResult {
    baseScore: number;
    timePenalty: number;
    totalScore: number;
}
