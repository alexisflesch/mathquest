import type { Redis } from 'ioredis';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import type { PlayMode } from '@shared/types/core/game';
import { getTimerKey } from './timerKeyUtil';

const logger = createLogger('CanonicalTimerService');

export interface CanonicalTimerState {
    questionUid: string;
    status: 'play' | 'pause';
    startedAt: number; // timestamp when timer was first started
    totalPlayTimeMs: number; // total time spent in 'play' state
    lastStateChange: number; // timestamp of last play/pause
}

/**
 * CanonicalTimerService: manages timer logic for all game modes.
 *
 * - Quiz & Live Tournament: timer is attached to GameInstance (global, no userId in key)
 * - Differed Tournament: timer is attached to GameParticipant (per-user, userId in key)
 * - Practice: no timer (all timer methods are no-ops)
 */
export class CanonicalTimerService {
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
        let timer: CanonicalTimerState | null = null;
        const raw = await this.redis.get(key);
        if (raw) timer = JSON.parse(raw);
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
        } else if (timer.status === 'pause') {
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
    async pauseTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number) {
        if (playMode === 'practice') return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const now = Date.now();
        const raw = await this.redis.get(key);
        if (!raw) return null;
        const timer: CanonicalTimerState = JSON.parse(raw);
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
    async getTimer(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number): Promise<CanonicalTimerState | null> {
        if (playMode === 'practice') return null;
        const key = this.getKey(accessCode, questionUid, userId, playMode, isDiffered, attemptCount);
        const raw = await this.redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
    }

    /**
     * Compute elapsed play time (ms) for a question, handling all modes.
     * - Quiz & live tournament: attaches to GameInstance
     * - Differed tournament: attaches to GameParticipant
     * - Practice: always returns 0
     */
    async getElapsedTimeMs(accessCode: string, questionUid: string, playMode: PlayMode, isDiffered: boolean, userId?: string, attemptCount?: number): Promise<number> {
        if (playMode === 'practice') return 0;
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
}
