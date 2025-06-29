"use strict";
/**
 * Timer utility functions
 * Shared logic for timer calculations and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTimerForLateJoiner = calculateTimerForLateJoiner;
const logger_1 = require("../../utils/logger");
const timerHelpers_1 = require("./timerHelpers");
/**
 * Calculate timer state for late joiners or projections
 * This function recalculates the timer based on the elapsed time since it was started/updated
 *
 * @param originalTimer - The timer state from Redis/game state
 * @returns Corrected timer state with accurate timeLeftMs and status
 */
function calculateTimerForLateJoiner(originalTimer, durationMs) {
    if (!originalTimer || typeof originalTimer.timerEndDateMs !== 'number') {
        return null;
    }
    // Compute time left using canonical helper
    const { timeLeftMs } = (0, timerHelpers_1.computeTimerTimes)(originalTimer.timerEndDateMs, durationMs);
    let status = originalTimer.status;
    if (originalTimer.status === 'run' && timeLeftMs <= 0) {
        status = 'stop';
    }
    logger_1.logger.info({
        originalTimer,
        calculatedTimeLeft: timeLeftMs,
        status
    }, '[TIMER_UTILS] Recalculated timer for late joiner (canonical)');
    return { timeLeftMs, status };
}
