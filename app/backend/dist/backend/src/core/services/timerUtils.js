"use strict";
/**
 * Timer utility functions
 * Shared logic for timer calculations and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTimerForLateJoiner = calculateTimerForLateJoiner;
const logger_1 = require("../../utils/logger");
/**
 * Calculate timer state for late joiners or projections
 * This function recalculates the timer based on the elapsed time since it was started/updated
 *
 * @param originalTimer - The timer state from Redis/game state
 * @returns Corrected timer state with accurate timeLeftMs and status
 */
function calculateTimerForLateJoiner(originalTimer) {
    if (!originalTimer || !originalTimer.timestamp || !originalTimer.durationMs) {
        return originalTimer || null;
    }
    // If the timer is stopped, always return stopped state with zero time left
    if (originalTimer.status === 'stop') {
        logger_1.logger.info({
            originalTimer,
            reason: 'Timer is stopped, returning canonical stopped state for late joiner'
        }, '[TIMER_UTILS] Timer is stopped, returning stopped state for late joiner');
        return {
            ...originalTimer,
            status: 'stop',
            timeLeftMs: 0,
            durationMs: 0,
            timestamp: Date.now(),
        };
    }
    const elapsed = Date.now() - originalTimer.timestamp;
    let timeLeftMs;
    let status;
    // Handle different timer states
    if (originalTimer.status === 'pause') {
        // When paused, late joiners should see the same time left as when it was paused
        timeLeftMs = originalTimer.timeLeftMs || 0;
        status = 'pause';
    }
    else {
        // When playing, calculate remaining time based on elapsed time
        timeLeftMs = Math.max(0, originalTimer.durationMs - elapsed);
        status = timeLeftMs > 0 ? 'play' : 'stop';
    }
    const actualTimer = {
        ...originalTimer,
        timeLeftMs,
        timestamp: Date.now(),
        status
    };
    logger_1.logger.info({
        originalTimer,
        elapsed,
        calculatedTimeLeft: timeLeftMs,
        actualTimer
    }, '[TIMER_UTILS] Recalculated timer for late joiner');
    return actualTimer;
}
