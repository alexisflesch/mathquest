"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalTimerService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const timerKeyUtil_1 = require("./timerKeyUtil");
const logger = (0, logger_1.default)('CanonicalTimerService');
/**
 * CanonicalTimerService: manages timer logic for all game modes.
 *
 * - Quiz & Live Tournament: timer is attached to GameInstance (global, no userId in key)
 * - Differed Tournament: timer is attached to GameParticipant (per-user, userId in key)
 * - Practice: no timer (all timer methods are no-ops)
 */
class CanonicalTimerService {
    /**
     * Public helper: get the raw timer object from Redis for a question (or null if not found)
     */
    async getRawTimerFromRedis(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const raw = await this.redis.get(key);
        logger.info({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount, key, raw }, '[TIMER_DEBUG][getRawTimerFromRedis] Raw timer fetch');
        if (!raw)
            return null;
        try {
            const parsed = JSON.parse(raw);
            logger.info({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount, parsed }, '[TIMER_DEBUG][getRawTimerFromRedis] Parsed timer');
            return parsed;
        }
        catch (err) {
            logger.error({ accessCode, questionUid, err, raw }, '[CANONICAL_TIMER_SERVICE] Failed to parse timer from Redis');
            return null;
        }
    }
    /**
     * Stop the timer for a question, setting status to 'stop' and clearing time left.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async stopTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return null;
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
    constructor(redisClient) {
        this.redis = redisClient;
    }
    /**
     * Returns the Redis key for the timer, based on mode:
     * - Quiz & live tournament: timer:{accessCode}:{questionUid}
     * - Differed tournament: timer:{accessCode}:{questionUid}:user:{userId}:attempt:{attemptCount}
     */
    getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount) {
        // Use canonical timer key utility for all modes
        return (0, timerKeyUtil_1.getTimerKey)({
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
    /**
     * Start or resume the timer for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     * @param durationMs (optional) Canonical duration in ms to use (from handler/Redis override)
     */
    async startTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount, durationMsOverride) {
        if (playMode === 'practice')
            return null; // No timer in practice mode
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        let durationMs = 0;
        if (typeof durationMsOverride === 'number' && durationMsOverride > 0) {
            durationMs = durationMsOverride;
            logger.info({ accessCode, questionUid, durationMs }, '[TIMER_DEBUG][startTimer] Using provided durationMsOverride');
        }
        else {
            try {
                const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionUid } });
                if (question && typeof question.timeLimit === 'number' && question.timeLimit > 0) {
                    durationMs = question.timeLimit * 1000;
                }
                else {
                    durationMs = 30000; // fallback to 30s
                }
            }
            catch (err) {
                durationMs = 30000;
            }
            logger.info({ accessCode, questionUid, durationMs }, '[TIMER_DEBUG][startTimer] Used DB/default durationMs');
        }
        const raw = await this.redis.get(key);
        logger.info({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount, key, raw, durationMs }, '[TIMER_DEBUG][startTimer] Raw timer before start/resume');
        let timer;
        if (raw) {
            const prev = JSON.parse(raw);
            if (prev.status === 'pause' && typeof prev.totalPlayTimeMs === 'number') {
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
                logger.info({ accessCode, questionUid, prev, timer, now }, '[TIMER_DEBUG][startTimer] Resuming from paused state');
            }
            else {
                timer = {
                    questionUid,
                    status: 'play',
                    startedAt: now,
                    totalPlayTimeMs: 0,
                    lastStateChange: now,
                    durationMs
                };
                logger.info({ accessCode, questionUid, timer, now }, '[TIMER_DEBUG][startTimer] Not paused, starting fresh');
            }
        }
        else {
            timer = {
                questionUid,
                status: 'play',
                startedAt: now,
                totalPlayTimeMs: 0,
                lastStateChange: now,
                durationMs
            };
            logger.info({ accessCode, questionUid, timer, now }, '[TIMER_DEBUG][startTimer] No previous timer, starting fresh');
        }
        await this.redis.set(key, JSON.stringify(timer));
        logger.info({ accessCode, questionUid, timer, now }, '[TIMER_DEBUG][startTimer] Timer persisted after start/resume');
        return timer;
    }
    /**
     * Pause the timer for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async pauseTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        const raw = await this.redis.get(key);
        if (!raw) {
            logger.warn({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount }, '[TIMER][pauseTimer] No timer found to pause');
            return null;
        }
        const timer = JSON.parse(raw);
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
        }
        else {
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
    async getTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount, durationMs // <-- required, from question
    ) {
        if (playMode === 'practice')
            return null;
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
        const timer = JSON.parse(raw);
        // Canonical status mapping
        let status = 'stop';
        if (timer.status === 'pause')
            status = 'pause';
        else if (timer.status === 'stop')
            status = 'stop';
        else
            status = 'run'; // treat any other state (including 'play') as 'run'
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
        }
        else if (status === 'pause') {
            // Use persisted timeLeftMs if present (set by pauseTimer), else compute from totalPlayTimeMs
            if (typeof timer.timeLeftMs === 'number' && timer.timeLeftMs >= 0) {
                timeLeftMs = timer.timeLeftMs;
                elapsed = canonicalDurationMs - timeLeftMs;
                logger.info({ accessCode, questionUid, canonicalDurationMs, elapsed, timeLeftMs, timer, now }, '[CANONICAL_TIMER][getTimer] Pause state using persisted timeLeftMs');
            }
            else {
                elapsed = timer.totalPlayTimeMs || 0;
                timeLeftMs = Math.max(0, canonicalDurationMs - elapsed);
                logger.info({ accessCode, questionUid, canonicalDurationMs, elapsed, timeLeftMs, timer, now }, '[CANONICAL_TIMER][getTimer] Pause state computed (no persisted timeLeftMs)');
            }
            timerEndDateMs = 0; // Paused: no ticking end date
        }
        else {
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
    async getElapsedTimeMs(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return 0;
        let durationMs = 0;
        try {
            const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionUid } });
            if (question && typeof question.timeLimit === 'number' && question.timeLimit > 0) {
                durationMs = question.timeLimit * 1000;
            }
        }
        catch (err) {
            logger.error({ questionUid, err }, '[CANONICAL_TIMER_SERVICE] Failed to fetch canonical durationMs');
        }
        if (durationMs <= 0) {
            logger.error({ questionUid, durationMs }, '[CANONICAL_TIMER_SERVICE] Invalid canonical durationMs');
        }
        const timer = await this.getTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount, durationMs);
        logger.info({
            accessCode,
            questionUid,
            playMode,
            isDiffered,
            userId,
            attemptCount,
            timerState: timer,
            durationMs
        }, '[TIMER_DEBUG][getElapsedTimeMs] Called with timer state');
        if (!timer) {
            logger.warn({ accessCode, questionUid, playMode, isDiffered, userId, attemptCount }, '[TIMER_DEBUG][getElapsedTimeMs] No timer found, returning 0');
            return 0;
        }
        const canonicalDuration = typeof timer.durationMs === 'number' ? timer.durationMs : durationMs;
        const canonicalTimeLeft = typeof timer.timeLeftMs === 'number' ? timer.timeLeftMs : canonicalDuration;
        const elapsed = Math.max(0, canonicalDuration - canonicalTimeLeft);
        logger.info({
            accessCode,
            questionUid,
            playMode,
            isDiffered,
            userId,
            attemptCount,
            canonicalDuration,
            canonicalTimeLeft,
            elapsed,
            timerState: timer
        }, '[TIMER_DEBUG][getElapsedTimeMs] Final elapsed calculation');
        return elapsed;
    }
    /**
     * Reset timer for a question (e.g., on new question), handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async resetTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return;
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
    async setDuration(accessCode, questionUid, durationMs, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const raw = await this.redis.get(key);
        let timer = raw ? JSON.parse(raw) : null;
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
    async editTimer(accessCode, questionUid, playMode, isDiffered, durationMs, userId, attemptCount) {
        if (playMode === 'practice')
            return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        const raw = await this.redis.get(key);
        let timer;
        // Accepts an extra options arg for more control (currentQuestion, editType)
        // For now, check globalThis._canonicalEditTimerOptions if present (set by handler)
        const editOptions = globalThis._canonicalEditTimerOptions || {};
        const isCurrent = !!editOptions.isCurrent;
        if (raw) {
            timer = JSON.parse(raw);
            if (timer.status === 'pause') {
                // If current question, always update timeLeftMs; update durationMs only if needed
                if (isCurrent) {
                    timer.timeLeftMs = durationMs;
                    if (typeof timer.durationMs !== 'number' || durationMs > timer.durationMs) {
                        timer.durationMs = durationMs;
                        logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Updated BOTH timeLeftMs and durationMs for paused current question (durationMs increased)');
                    }
                    else {
                        logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Updated ONLY timeLeftMs for paused current question (durationMs unchanged)');
                    }
                }
                else {
                    // Not current: update only durationMs (not timeLeftMs)
                    timer.durationMs = durationMs;
                    // Remove timeLeftMs if present (prevents leaking value to other questions)
                    if ('timeLeftMs' in timer)
                        delete timer.timeLeftMs;
                    logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Updated ONLY durationMs for paused non-current question (timeLeftMs removed if present)');
                }
            }
            else if (timer.status === 'play') {
                // For running, update durationMs and adjust timerEndDateMs
                timer.durationMs = durationMs;
                const elapsed = now - timer.lastStateChange + (timer.totalPlayTimeMs || 0);
                timer.totalPlayTimeMs = elapsed;
                timer.timerEndDateMs = now + Math.max(0, durationMs - elapsed);
                logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Updated durationMs for running timer');
            }
            else if (timer.status === 'stop') {
                // For stopped, update only durationMs (not timeLeftMs)
                timer.durationMs = durationMs;
                if ('timeLeftMs' in timer)
                    delete timer.timeLeftMs;
                logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Updated ONLY durationMs for stopped timer (timeLeftMs removed if present)');
            }
        }
        else {
            // No previous timer, create a new stopped timer with duration
            timer = {
                questionUid,
                status: 'stop',
                startedAt: now,
                totalPlayTimeMs: 0,
                lastStateChange: now,
                durationMs,
                // Do not set timeLeftMs for new stopped timer (let canonicalizer handle default)
                timerEndDateMs: 0
            };
            logger.info({ accessCode, questionUid, durationMs, timer }, '[TIMER][editTimer] Created new timer');
        }
        await this.redis.set(key, JSON.stringify(timer));
        return timer;
    }
}
exports.CanonicalTimerService = CanonicalTimerService;
