"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalTimerService = void 0;
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
    async startTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return null; // No timer in practice mode
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        let timer = null;
        const raw = await this.redis.get(key);
        if (raw)
            timer = JSON.parse(raw);
        logger.info({
            accessCode,
            questionUid,
            playMode,
            isDiffered,
            userId,
            attemptCount,
            timerExists: !!timer,
            timerState: timer
        }, '[TIMER_DEBUG] startTimer called');
        if (!timer) {
            timer = {
                questionUid,
                status: 'play',
                startedAt: now,
                totalPlayTimeMs: 0,
                lastStateChange: now
            };
        }
        else if (timer.status === 'pause') {
            // Resume: accumulate paused duration
            timer.status = 'play';
            timer.lastStateChange = now;
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
    async pauseTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        const raw = await this.redis.get(key);
        if (!raw)
            return null;
        const timer = JSON.parse(raw);
        if (timer.status === 'play') {
            timer.totalPlayTimeMs += now - timer.lastStateChange;
            timer.status = 'pause';
            timer.lastStateChange = now;
            await this.redis.set(key, JSON.stringify(timer));
            logger.info({ accessCode, questionUid, timer }, '[TIMER] Paused');
        }
        return timer;
    }
    /**
     * Get the current timer state for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: no timer
     */
    async getTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount) {
        if (playMode === 'practice')
            return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const raw = await this.redis.get(key);
        if (!raw)
            return null;
        return JSON.parse(raw);
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
        const timer = await this.getTimer(accessCode, questionUid, playMode, isDiffered, userId, attemptCount);
        logger.info({
            accessCode,
            questionUid,
            playMode,
            isDiffered,
            userId,
            attemptCount,
            timerState: timer
        }, '[TIMER_DEBUG] getElapsedTimeMs called');
        if (!timer)
            return 0;
        if (timer.status === 'play') {
            return timer.totalPlayTimeMs + (Date.now() - timer.lastStateChange);
        }
        else {
            return timer.totalPlayTimeMs;
        }
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
}
exports.CanonicalTimerService = CanonicalTimerService;
