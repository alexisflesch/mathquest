// Canonical helper to compute timeLeftMs from timerEndDateMs for frontend
// Use only with canonical timer state: { status, timerEndDateMs, questionUid }

/**
 * Computes timeLeftMs for a timer given timerEndDateMs and optional now (ms since epoch)
 * @param timerEndDateMs Absolute end date (ms since epoch, UTC)
 * @param now Current time (ms since epoch, default: Date.now())
 * @returns timeLeftMs (never negative)
 */
export function computeTimeLeftMs(timerEndDateMs: number, now: number = Date.now()): number {
    return Math.max(0, timerEndDateMs - now);
}

// Optionally, add a helper to produce a canonical timer payload for the frontend
export function canonicalizeTimerPayload(timer: { status: string; timerEndDateMs: number; questionUid: string }, now: number = Date.now()) {
    return {
        status: timer.status,
        timerEndDateMs: timer.timerEndDateMs,
        questionUid: timer.questionUid,
        timeLeftMs: computeTimeLeftMs(timer.timerEndDateMs, now),
    };
}
