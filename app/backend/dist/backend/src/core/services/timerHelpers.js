"use strict";
/**
 * Canonical timer helpers for MathQuest backend
 *
 * Provides functions to compute time left and elapsed time for canonical timer state.
 *
 * - Use ONLY with canonical timer state: { status, timerEndDateMs, questionUid }
 * - All calculations are done in backend logic, not in timer state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTimerTimes = computeTimerTimes;
/**
 * Compute time left and elapsed time for a canonical timer.
 * @param timerEndDateMs Absolute end date (ms since epoch, UTC)
 * @param durationMs Total duration (optional, for elapsed calculation)
 * @param now Current time (ms since epoch, default: Date.now())
 * @returns { timeLeftMs, elapsedMs }
 */
function computeTimerTimes(timerEndDateMs, durationMs, now = Date.now()) {
    const timeLeftMs = Math.max(0, timerEndDateMs - now);
    const elapsedMs = durationMs !== undefined ? Math.max(0, durationMs - timeLeftMs) : undefined;
    return { timeLeftMs, elapsedMs };
}
