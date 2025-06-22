"use strict";
// DEPRECATED: All scoring logic has been unified in core/services/scoringService.ts
// This file is no longer used and will be removed in a future cleanup.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = calculateScore;
// [MODERNIZATION] This file is now deprecated. All logic has been migrated to scoringService.ts.
// Any import or usage of this file should be removed. See plan.md for details.
// Shared score calculation logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('ScoreUtils');
/**
 * Calculate score for a single answer - SERVER-SIDE ONLY
 * @param answer The answer object (should include correctness, serverTimeSpent, etc.)
 * @param question The question object (should include timeLimit, difficulty, etc.)
 * @returns The score for this answer
 */
function calculateScore(answer, question) {
    // Example scoring: 1000 points for correct, minus time penalty
    if (!answer || !question)
        return 0;
    if (!answer.isCorrect)
        return 0;
    const base = 1000;
    // Use server-calculated time spent (in milliseconds), convert to seconds for penalty calculation
    const serverTimeSpentSeconds = Math.max(0, (answer.serverTimeSpent || 0) / 1000);
    const timePenalty = Math.floor(serverTimeSpentSeconds * 10); // 10 points per second
    const finalScore = Math.max(base - timePenalty, 0);
    logger.debug({
        base,
        serverTimeSpentMs: answer.serverTimeSpent,
        serverTimeSpentSeconds,
        timePenalty,
        finalScore
    }, 'Score calculation');
    return finalScore;
}
