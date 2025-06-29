/**
 * Timer utility functions
 * Shared logic for timer calculations and state management
 */

import { GameTimerState } from '@shared/types/core/timer';
import { logger } from '../../utils/logger';
import { computeTimerTimes } from './timerHelpers';

/**
 * Calculate timer state for late joiners or projections
 * This function recalculates the timer based on the elapsed time since it was started/updated
 * 
 * @param originalTimer - The timer state from Redis/game state
 * @returns Corrected timer state with accurate timeLeftMs and status
 */
export function calculateTimerForLateJoiner(originalTimer: GameTimerState | null | undefined, durationMs?: number): { timeLeftMs: number, status: 'run' | 'pause' | 'stop' } | null {
    if (!originalTimer || typeof originalTimer.timerEndDateMs !== 'number') {
        return null;
    }
    // Compute time left using canonical helper
    const { timeLeftMs } = computeTimerTimes(originalTimer.timerEndDateMs, durationMs);
    let status: 'run' | 'pause' | 'stop' = originalTimer.status;
    if (originalTimer.status === 'run' && timeLeftMs <= 0) {
        status = 'stop';
    }
    logger.info({
        originalTimer,
        calculatedTimeLeft: timeLeftMs,
        status
    }, '[TIMER_UTILS] Recalculated timer for late joiner (canonical)');
    return { timeLeftMs, status };
}
