"use strict";
// Canonical timer canonicalizer for backend answer handler and event emission
// This is a strict, context-aware canonicalizer for timer objects from CanonicalTimerService
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCanonicalTimer = toCanonicalTimer;
/**
 * Converts a raw timer object (from CanonicalTimerService) to the canonical timer shape
 * expected by all backend/FE consumers: { status: 'run'|'pause'|'stop', timeLeftMs, durationMs, questionUid, ... }
 *
 * - status: 'run' if timer.status === 'play' and timeLeftMs > 0, 'pause' if timer.status === 'pause', 'stop' otherwise
 * - timeLeftMs: computed from durationMs - totalPlayTimeMs (if running), or 0 if stopped
 * - durationMs: must be provided by caller (from question or timer)
 * - questionUid: always present
 */
/**
 * Canonicalizes a timer object for emission to frontend/consumers.
 * Always includes all canonical fields: status, timerEndDateMs, questionUid, timeLeftMs, durationMs, timestamp, etc.
 */
function toCanonicalTimer(timer, _durationMs) {
    if (!timer) {
        return {
            status: 'stop',
            timerEndDateMs: 0,
            questionUid: 'unknown',
            timeLeftMs: 0,
            durationMs: 0,
            timestamp: Date.now(),
        };
    }
    return {
        status: timer.status ?? 'stop',
        timerEndDateMs: timer.timerEndDateMs ?? 0,
        questionUid: timer.questionUid ?? 'unknown',
        timeLeftMs: typeof timer.timeLeftMs === 'number' ? timer.timeLeftMs : undefined,
        durationMs: typeof timer.durationMs === 'number' ? timer.durationMs : undefined,
        startedAt: typeof timer.startedAt === 'number' ? timer.startedAt : undefined,
        totalPlayTimeMs: typeof timer.totalPlayTimeMs === 'number' ? timer.totalPlayTimeMs : undefined,
        lastStateChange: typeof timer.lastStateChange === 'number' ? timer.lastStateChange : undefined,
        timestamp: typeof timer.timestamp === 'number' ? timer.timestamp : Date.now(),
    };
}
