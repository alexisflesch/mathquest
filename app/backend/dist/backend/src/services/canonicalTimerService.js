"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalTimerService = void 0;
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('CanonicalTimerService');
/**
 * CanonicalTimerService: manages a global timer per game/question for quiz mode, supporting pause/resume and late joiners.
 */
class CanonicalTimerService {
    constructor(redisClient) {
        this.redis = redisClient;
    }
    getKey(accessCode, questionUid) {
        return `timer:${accessCode}:${questionUid}`;
    }
    /**
     * Start or resume the timer for a question.
     */
    async startTimer(accessCode, questionUid) {
        const key = this.getKey(accessCode, questionUid);
        const now = Date.now();
        let timer = null;
        const raw = await this.redis.get(key);
        if (raw)
            timer = JSON.parse(raw);
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
     * Pause the timer for a question.
     */
    async pauseTimer(accessCode, questionUid) {
        const key = this.getKey(accessCode, questionUid);
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
     * Get the current timer state for a question.
     */
    async getTimer(accessCode, questionUid) {
        const key = this.getKey(accessCode, questionUid);
        const raw = await this.redis.get(key);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    /**
     * Compute elapsed play time (ms) for a question, accounting for pause/resume.
     */
    async getElapsedTimeMs(accessCode, questionUid) {
        const timer = await this.getTimer(accessCode, questionUid);
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
     * Reset timer for a question (e.g., on new question).
     */
    async resetTimer(accessCode, questionUid) {
        const key = this.getKey(accessCode, questionUid);
        await this.redis.del(key);
        logger.info({ accessCode, questionUid }, '[TIMER] Reset');
    }
}
exports.CanonicalTimerService = CanonicalTimerService;
