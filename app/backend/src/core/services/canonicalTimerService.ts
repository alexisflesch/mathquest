import type { Redis } from 'ioredis';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import type { PlayMode } from '@shared/types/core/game';
import { getTimerKey } from './timerKeyUtil';

const logger = createLogger('CanonicalTimerService');

export interface CanonicalTimerState {
    questionUid: string;
    status: 'play' | 'pause' | 'stop';
    startedAt: number; // timestamp when timer was first started
    totalPlayTimeMs: number; // total time spent in 'play' state
    lastStateChange: number; // timestamp of last play/pause
    durationMs?: number; // canonical duration for this timer (optional for backward compatibility)
    /**
     * Remaining time in ms at pause (only set when paused, for canonical emission)
     */
    timeLeftMs?: number;
    /**
     * End date in ms (only set for run, 0 for pause/stop, for canonical emission)
     */
    timerEndDateMs?: number;
}

/**
 * CanonicalTimerService: manages timer logic for all game modes.
 *
 * - Quiz & Live Tournament: timer is attached to GameInstance (global, no userId in key)
 * - Differed Tournament: timer is attached to GameParticipant (per-user, userId in key)
 * - Practice: no timer (all timer methods are no-ops)
 */
export class CanonicalTimerService {
    /**
     * Stop the timer for a question, setting status to 'stop' and clearing time left.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async stopTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        // Overwrite timer state to canonical STOP
        const timer = {
            questionUid,
            status: 'stop',
            startedAt: now,
            totalPlayTimeMs: 0,
            lastStateChange: now,
            durationMs: 0,
            timeLeftMs: 0,
            timerEndDateMs: 0
        };
        await this.redis.set(key, JSON.stringify(timer));
        logger.info({ accessCode, questionUid, timer }, '[TIMER][stopTimer] Stopped and updated');
        return timer;
    }
    private redis: Redis;
    constructor(redisClient: Redis) {
        this.redis = redisClient;
    }

    /**
     * Returns the Redis key for the timer, based on mode:
     * - Quiz & live tournament: timer:{accessCode}:{questionUid}
     * - Differed tournament: timer:{accessCode}:{questionUid}:user:{userId}:attempt:{attemptCount}
     */
    private getKey(accessCode: string, questionUid: string, userId?: string, playMode?: PlayMode, isDiffered?: boolean, attemptCount?: number) {
        // Use canonical timer key utility for all modes
        return getTimerKey({
            accessCode,
            userId: userId || '',
            questionUid,
            attemptCount,
            isDeferred: isDiffered
        });
    }

    /**
     * Start or resume the timer for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async startTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return null; // No timer in practice mode
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        let durationMs = 0;
        if (typeof attemptCount === 'number' && attemptCount > 0) {
            durationMs = attemptCount;
        }
        // Check if a paused timer exists and resume from it
        const raw = await this.redis.get(key);
        let timer: CanonicalTimerState;
        if (raw) {
            const prev = JSON.parse(raw) as CanonicalTimerState;
            if (prev.status === 'pause' && typeof prev.totalPlayTimeMs === 'number') {
                // Resume from paused state, always recalculate totalPlayTimeMs from durationMs and timeLeftMs
                const prevDurationMs = (typeof prev.durationMs === 'number' && prev.durationMs > 0) ? prev.durationMs : durationMs;
                let newTotalPlayTimeMs = prev.totalPlayTimeMs;
                if (typeof prev.timeLeftMs === 'number' && prev.timeLeftMs >= 0) {
                    newTotalPlayTimeMs = Math.max(0, prevDurationMs - prev.timeLeftMs);
                }
                timer = {
                    ...prev,
                    status: 'play',
                    lastStateChange: now,
                    durationMs: prevDurationMs,
                    totalPlayTimeMs: newTotalPlayTimeMs,
                };
                delete timer.timeLeftMs;
                delete timer.timerEndDateMs;
            } else {
                // Not paused, start fresh
                timer = {
                    questionUid,
                    status: 'play',
                    startedAt: now,
                    totalPlayTimeMs: 0,
                    lastStateChange: now,
                    durationMs
                };
            }
        } else {
            // No previous timer, start fresh
            timer = {
                questionUid,
                status: 'play',
                startedAt: now,
                totalPlayTimeMs: 0,
                lastStateChange: now,
                durationMs
            };
        }
        await this.redis.set(key, JSON.stringify(timer));
        logger.info({ accessCode, questionUid, timer }, '[TIMER] Started/resumed');
        return timer;
    }

    /**
     * Pause the timer for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async pauseTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        const raw = await this.redis.get(key);
        if (!raw) {
            logger.warn({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount }, '[TIMER][pauseTimer] No timer found to pause');
            return null;
        }
        const timer: CanonicalTimerState = JSON.parse(raw);
        logger.info({ accessCode, questionUid, timer, now }, '[TIMER][pauseTimer] Before pause');
        if (timer.status === 'play') {
            timer.totalPlayTimeMs += now - timer.lastStateChange;
            timer.status = 'pause';
            timer.lastStateChange = now;
            // Ensure durationMs is always present and correct
            if (!timer.durationMs || timer.durationMs <= 0) {
                if (typeof attemptCount === 'number' && attemptCount > 0) {
                    timer.durationMs = attemptCount;
                }
            }
            // Compute and persist the correct timeLeftMs at pause
            const canonicalDurationMs = (typeof timer.durationMs === 'number' && timer.durationMs > 0)
                ? timer.durationMs
                : (typeof attemptCount === 'number' && attemptCount > 0 ? attemptCount : 0);
            const elapsed = timer.totalPlayTimeMs || 0;
            let computedTimeLeftMs = Math.max(0, canonicalDurationMs - elapsed);
            // Enforce: if timer is paused and computedTimeLeftMs is zero but canonicalDurationMs > 0 and elapsed < canonicalDurationMs, log error
            if (computedTimeLeftMs === 0 && canonicalDurationMs > 0 && elapsed < canonicalDurationMs) {
                logger.error({ accessCode, questionUid, canonicalDurationMs, elapsed, computedTimeLeftMs, timer, now }, '[TIMER][pauseTimer][BUG] Computed timeLeftMs is 0 but timer should have time left! Forcing to 1.');
                computedTimeLeftMs = 1;
            }
            timer.timeLeftMs = computedTimeLeftMs;
            // timerEndDateMs is not relevant in pause state, but set to 0 for clarity
            timer.timerEndDateMs = 0;
            await this.redis.set(key, JSON.stringify(timer));
            logger.info({ accessCode, questionUid, timer, now }, '[TIMER][pauseTimer] Paused and updated');
        } else {
            logger.info({ accessCode, questionUid, timer, now }, '[TIMER][pauseTimer] Timer already paused or stopped');
        }
        // Enforce: always emit a positive timeLeftMs on pause unless truly expired
        if (timer.status === 'pause' && (typeof timer.timeLeftMs !== 'number' || timer.timeLeftMs <= 0) && (typeof timer.durationMs === 'number' && timer.durationMs > 0)) {
            logger.error({ accessCode, questionUid, timer, now }, '[TIMER][pauseTimer][BUG] After pause, timeLeftMs is missing or not positive. Forcing to 1.');
            timer.timeLeftMs = 1;
            await this.redis.set(key, JSON.stringify(timer));
        }
        return timer;
    }

    /**
     * Get the current timer state for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    /**
     * Returns a canonical timer object matching the shared type (status: 'run', 'pause', 'stop', all required fields)
     */
    /**
     * Returns a canonical timer object matching the shared type (status: 'run', 'pause', 'stop', all required fields)
     * Requires durationMs from the question (must be passed by consumer)
     */
    async getTimer(
        accessCode: string,
        questionUid: string,
        playMode: PlayMode,
        isDiffered: boolean,
        userId: string | undefined,
        attemptCount: number | undefined,
        durationMs: number // <-- required, from question
    ): Promise<any | null> {
        if (playMode === 'practice') return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const raw = await this.redis.get(key);
        const now = Date.now();
        if (!raw) {
            // No timer started yet: return canonical default
            logger.warn({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount, durationMs, now }, '[CANONICAL_TIMER][getTimer] No timer found, returning default STOP state');
            return {
                status: 'stop',
                timeLeftMs: durationMs,
                durationMs,
                questionUid,
                timestamp: now,
                timerEndDateMs: 0,
                localTimeLeftMs: durationMs
            };
        }
        const timer = JSON.parse(raw) as CanonicalTimerState;
        // Canonical status mapping
        let status: 'run' | 'pause' | 'stop' = 'stop';
        if (timer.status === 'pause') status = 'pause';
        else if (timer.status === 'stop') status = 'stop';
        else status = 'run'; // treat any other state (including 'play') as 'run'

        // Infer canonical fields from backend payload
        // durationMs: always prefer timer.durationMs if present, else use argument
        const canonicalDurationMs = (typeof timer.durationMs === 'number' && timer.durationMs > 0)
            ? timer.durationMs
            : durationMs;

        // Compute time left and timerEndDateMs
        let timeLeftMs = canonicalDurationMs;
        let elapsed = 0;
        let timerEndDateMs = 0;
        if (status === 'run') {
            elapsed = (timer.lastStateChange && timer.startedAt)
                ? (now - timer.lastStateChange) + (timer.totalPlayTimeMs || 0)
                : 0;
            timeLeftMs = Math.max(0, canonicalDurationMs - elapsed);
            timerEndDateMs = now + timeLeftMs;
        } else if (status === 'pause') {
            // Use persisted timeLeftMs if present (set by pauseTimer), else compute from totalPlayTimeMs
            if (typeof timer.timeLeftMs === 'number' && timer.timeLeftMs >= 0) {
                timeLeftMs = timer.timeLeftMs;
                elapsed = canonicalDurationMs - timeLeftMs;
                logger.info({ accessCode, questionUid, canonicalDurationMs, elapsed, timeLeftMs, timer, now }, '[CANONICAL_TIMER][getTimer] Pause state using persisted timeLeftMs');
            } else {
                elapsed = timer.totalPlayTimeMs || 0;
                timeLeftMs = Math.max(0, canonicalDurationMs - elapsed);
                logger.info({ accessCode, questionUid, canonicalDurationMs, elapsed, timeLeftMs, timer, now }, '[CANONICAL_TIMER][getTimer] Pause state computed (no persisted timeLeftMs)');
            }
            timerEndDateMs = 0; // Paused: no ticking end date
        } else {
            timeLeftMs = canonicalDurationMs;
            timerEndDateMs = 0;
        }
        // Canonicalize: if status would be 'run' but timeLeftMs <= 0 or canonicalDurationMs <= 0, force 'stop'
        if (status === 'run' && (timeLeftMs <= 0 || canonicalDurationMs <= 0)) {
            logger.warn({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount, canonicalDurationMs, now, timer, elapsed, timeLeftMs }, '[CANONICAL_TIMER][getTimer] Forcing STOP state due to timeLeftMs <= 0 or durationMs <= 0');
            status = 'stop';
            timeLeftMs = canonicalDurationMs;
            timerEndDateMs = 0;
        }
        logger.info({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount, canonicalDurationMs, now, timer, status, elapsed, timeLeftMs, timerEndDateMs }, '[CANONICAL_TIMER][getTimer] Returning canonical timer state');
        return {
            status,
            timeLeftMs,
            durationMs: canonicalDurationMs,
            questionUid: timer.questionUid ?? questionUid,
            timestamp: now,
            timerEndDateMs,
            localTimeLeftMs: timeLeftMs
        };
    }

    /**
     * Compute elapsed play time (ms) for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: always returns 0
     */
    async getElapsedTimeMs(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number): Promise<number> {
        if (playMode === 'practice') return 0;
        // Always require canonical durationMs (no fallback)
        let durationMs = 0;
        try {
            const question = await prisma.question.findUnique({ where: { uid: questionUid } });
            if (question && typeof question.timeLimit === 'number' && question.timeLimit > 0) {
                durationMs = question.timeLimit * 1000;
            }
        } catch (err) {
            logger.error({ questionUid, err }, '[CANONICAL_TIMER_SERVICE] Failed to fetch canonical durationMs');
        }
        if (durationMs <= 0) {
            logger.error({ questionUid, durationMs }, '[CANONICAL_TIMER_SERVICE] Invalid canonical durationMs');
            // handle error or return
        }
        const timer = await this.getTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount, durationMs);
        logger.info({
            accessCode,
            questionUid,
            playMode,
            isDiffered,
            userId,
            attemptCount,
            timerState: timer
        }, '[TIMER_DEBUG] getElapsedTimeMs called');
        if (!timer) return 0;
        if (timer.status === 'play') {
            return timer.totalPlayTimeMs + (Date.now() - timer.lastStateChange);
        } else {
            return timer.totalPlayTimeMs;
        }
    }

    /**
     * Reset timer for a question (e.g., on new question), handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async resetTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        await this.redis.del(key);
        logger.info({ accessCode, questionUid, attemptCount }, '[TIMER] Reset');
    }

    /**
     * Set the canonical duration for a question's timer (for all modes).
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async setDuration(accessCode: string, questionUid: string, durationMs: number, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const raw = await this.redis.get(key);
        let timer: CanonicalTimerState | null = raw ? JSON.parse(raw) : null;
        const now = Date.now();
        if (!timer) {
            timer = {
                questionUid,
                status: 'pause',
                startedAt: now,
                totalPlayTimeMs: 0,
                lastStateChange: now
            };
        }
        // Optionally, you could store durationMs in the timer object if needed for canonical reference
        // timer.durationMs = durationMs;
        await this.redis.set(key, JSON.stringify(timer));
        logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER] Canonical duration set');
        return timer;
    }

    /**
     * Edit the timer duration for a question (canonical: updates durationMs, recalculates time left if running/paused)
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async editTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, durationMs: number, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        const raw = await this.redis.get(key);
        let timer: CanonicalTimerState;
        if (raw) {
            timer = JSON.parse(raw) as CanonicalTimerState;
            timer.durationMs = durationMs;
            // If running, recalculate timerEndDateMs and totalPlayTimeMs
            if (timer.status === 'play') {
                // Compute elapsed so far
                const elapsed = now - timer.lastStateChange + (timer.totalPlayTimeMs || 0);
                timer.totalPlayTimeMs = elapsed;
                // Set new end date
                timer.timerEndDateMs = now + Math.max(0, durationMs - elapsed);
            } else if (timer.status === 'pause') {
                // If paused, update timeLeftMs to min(timeLeftMs, durationMs)
                if (typeof timer.timeLeftMs === 'number') {
                    timer.timeLeftMs = Math.min(timer.timeLeftMs, durationMs);
                } else {
                    timer.timeLeftMs = durationMs;
                }
            } else if (timer.status === 'stop') {
                // If stopped, just update durationMs
                timer.timeLeftMs = durationMs;
            }
        } else {
            // No previous timer, create a new stopped timer with duration
            timer = {
                questionUid,
                status: 'stop',
                startedAt: now,
                totalPlayTimeMs: 0,
                lastStateChange: now,
                durationMs,
                timeLeftMs: durationMs,
                timerEndDateMs: 0
            };
        }
        await this.redis.set(key, JSON.stringify(timer));
        logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Canonical duration edited');
        return timer;
    }
}
